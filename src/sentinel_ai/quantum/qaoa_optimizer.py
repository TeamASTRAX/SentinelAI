"""Quantum QAOA response prioritization module.

This module implements an experimental, advisory‑only optimizer that ranks
active alerts based on a weighted objective function and a QUBO formulation.
It never modifies production state and is isolated from the containment and
risk pipelines.
"""

from __future__ import annotations

import itertools
import math
from dataclasses import dataclass
from typing import List, Mapping, Sequence

import numpy as np
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
from scipy.optimize import minimize

# ---------------------------------------------------------------------------
# Configuration (mirrors config.py defaults but kept local for simplicity)
# ---------------------------------------------------------------------------
QAOA_MAX_ALERTS = 8  # Maximum alerts to include in a single optimization run
QAOA_DEPTH = 1  # QAOA depth (p)
QAOA_SHOTS = 1024
QAOA_OPTIMIZER_MAXITER = 50

# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class AlertFactor:
    """Derived weighted factors for a single alert.

    All values are normalised to the range [0, 1] where applicable.
    """
    alert_id: str
    risk_score: float  # normalised (0‑1)
    severity: float  # normalised weight based on risk_level
    business_impact: float  # derived from employee privilege level
    urgency: float  # derived from risk_level urgency mapping
    evidence_strength: float  # contribution from rule evidence (0‑1)
    response_cost: float  # normalised cost of recommended response (0‑1)
    affected_entities: float  # normalised count of related events (0‑1)
    account_criticality: float  # normalised from employee role (0‑1)

    def priority_value(self) -> float:
        """Weighted objective for this alert.

        Default weights are chosen to reflect the relative importance of each factor
        while keeping the overall magnitude ≈ 1.0.
        """
        w = {
            "risk": 0.25,
            "severity": 0.20,
            "impact": 0.15,
            "urgency": 0.15,
            "evidence": 0.10,
            "cost": -0.05,  # negative weight penalises high cost
            "entities": 0.05,
            "criticality": 0.05,
        }
        return (
            w["risk"] * self.risk_score
            + w["severity"] * self.severity
            + w["impact"] * self.business_impact
            + w["urgency"] * self.urgency
            + w["evidence"] * self.evidence_strength
            + w["cost"] * self.response_cost
            + w["entities"] * self.affected_entities
            + w["criticality"] * self.account_criticality
        )

# ---------------------------------------------------------------------------
# Helper functions to build the optimisation input from raw DB rows
# ---------------------------------------------------------------------------
def _normalise(value: float, min_val: float, max_val: float) -> float:
    if max_val == min_val:
        return 0.0
    return (value - min_val) / (max_val - min_val)

def build_factors(
    alert_rows: Sequence[Mapping[str, object]],
    detection_rows: Mapping[str, Mapping[str, object]],
    employee_rows: Mapping[str, Mapping[str, object]],
) -> List[AlertFactor]:
    """Construct a list of :class:`AlertFactor` from database rows.

    Parameters
    ----------
    alert_rows: List of alert dictionaries (as returned by ``service.alert_rows()``).
    detection_rows: Mapping of ``alert_id`` → detection row.
    employee_rows: Mapping of ``employee_id`` → employee row.
    """
    # Determine global ranges for normalisation of numeric fields
    risk_scores = [a["risk_score"] for a in alert_rows]
    max_risk, min_risk = max(risk_scores, default=100), min(risk_scores, default=0)

    # Helper maps for severity and urgency based on risk_level string
    severity_map = {"Critical": 1.0, "High": 0.75, "Medium": 0.5, "Low": 0.25}
    urgency_map = {"Critical": 1.0, "High": 0.8, "Medium": 0.5, "Low": 0.2}

    # Business impact and account criticality derived from employee privilege
    privilege_weight = {"Executive": 1.0, "Admin": 0.85, "Manager": 0.70, "Employee": 0.40, "Contractor": 0.30}

    factors: List[AlertFactor] = []
    for alert in alert_rows:
        aid = alert["alert_id"]
        did = alert.get("detection_id")
        detection = detection_rows.get(did, {})
        employee = employee_rows.get(alert.get("employee_id"), {})
        # Normalised risk score (0‑1)
        risk_norm = _normalise(float(alert["risk_score"]), min_risk, max_risk)
        # Severity based on stored risk_level
        severity_norm = severity_map.get(alert.get("risk_level", "Low"), 0.25)
        urgency_norm = urgency_map.get(alert.get("risk_level", "Low"), 0.2)
        # Business impact approximated from employee normal_privilege
        business_norm = privilege_weight.get(employee.get("normal_privilege", "Employee"), 0.4)
        # Evidence strength from detection rule contribution (0‑100) → normalised
        evidence_raw = float(detection.get("rule_contribution", 0))
        evidence_norm = _normalise(evidence_raw, 0, 100)
        # Response cost – a simple heuristic based on recommended_response
        resp = detection.get("recommended_response", "NONE")
        cost_map = {"BLOCK_USER": 1.0, "REVOKE_SESSIONS": 0.8, "BLOCK_AND_REVOKE": 1.0, "UNBLOCK_USER": 0.2, "RESTORE_SESSIONS": 0.2, "NONE": 0.0}
        cost_norm = cost_map.get(resp, 0.0)
        # Affected entities – count of events for this employee (approx)
        related_events = detection.get("related_event_count", 1)
        affected_norm = min(related_events, 20) / 20.0
        # Account criticality derived from privilege
        crit_norm = privilege_weight.get(employee.get("normal_privilege", "Employee"), 0.4)

        factors.append(
            AlertFactor(
                alert_id=aid,
                risk_score=risk_norm,
                severity=severity_norm,
                business_impact=business_norm,
                urgency=urgency_norm,
                evidence_strength=evidence_norm,
                response_cost=cost_norm,
                affected_entities=affected_norm,
                account_criticality=crit_norm,
            )
        )
    return factors

# ---------------------------------------------------------------------------
# QUBO construction
# ---------------------------------------------------------------------------
def build_qubo(factors: List[AlertFactor]):
    """Create QUBO matrix (as a NumPy array) from a list of factors.

    We use one binary variable per alert (x_i = 1 if the alert is selected as
    high‑priority). The objective is to maximise the summed priority values while
    selecting exactly *k* alerts where ``k = ceil(n/2)``.
    """
    n = len(factors)
    if n == 0:
        return np.array([]), {}
    # Objective coefficients (to be maximised)
    obj = np.array([f.priority_value() for f in factors])
    # Desired number of selected alerts
    k = math.ceil(n / 2)
    # Penalty λ large enough to enforce the equality constraint
    lam = max(obj) * 2 if obj.size else 1.0
    # QUBO matrix Q where cost = xᵀ Q x (minimisation)
    Q = np.zeros((n, n))
    # Linear terms (negated because we convert maximise → minimise)
    for i in range(n):
        Q[i, i] = -obj[i] + lam  # -c_i + λ
    # Quadratic penalty for the equality constraint (Σx_i - k)^2 = Σx_i² + Σ_{i≠j} x_i x_j - 2k Σx_i + k²
    # Since x_i² == x_i for binary variables, we add λ * (Σ_{i≠j} x_i x_j - 2k Σ x_i) to Q.
    for i, j in itertools.combinations(range(n), 2):
        Q[i, j] = 2 * lam  # coefficient for x_i x_j
        Q[j, i] = 2 * lam
    # Adjust linear terms for the -2k Σx_i part
    for i in range(n):
        Q[i, i] -= 2 * lam * k
    # Constant term k² * λ can be ignored for optimisation ranking
    return Q, {"k": k, "lambda": lam}

# ---------------------------------------------------------------------------
# QAOA circuit builder (depth p=1)
# ---------------------------------------------------------------------------
def _mixer_circuit(qc: QuantumCircuit, n_qubits: int, beta: float):
    for q in range(n_qubits):
        qc.rx(2 * beta, q)

def _cost_circuit(qc: QuantumCircuit, Q: np.ndarray, gamma: float):
    # Apply ZZ rotations for each quadratic term
    n = Q.shape[0]
    for i in range(n):
        for j in range(i + 1, n):
            coeff = Q[i, j]
            if coeff != 0:
                theta = gamma * coeff
                qc.rzz(theta, i, j)
    # Apply Z rotations for linear terms (diagonal)
    for i in range(n):
        coeff = Q[i, i]
        if coeff != 0:
            theta = gamma * coeff
            qc.rz(theta, i)

def build_qaoa_circuit(Q: np.ndarray, p: int = QAOA_DEPTH) -> QuantumCircuit:
    n = Q.shape[0]
    qc = QuantumCircuit(n, n)
    # Initialise in |+> state
    for q in range(n):
        qc.h(q)
    # Parameter placeholders (will be bound later)
    for layer in range(p):
        # Cost unitary with placeholder gamma (use a variable name)
        gamma_sym = qc.parameters[p + layer] if p else 0.0
        _cost_circuit(qc, Q, gamma_sym)
        # Mixer unitary with placeholder beta
        beta_sym = qc.parameters[layer] if p else 0.0
        _mixer_circuit(qc, n, beta_sym)
    # Measure
    qc.measure(range(n), range(n))
    return qc

# ---------------------------------------------------------------------------
# Classical baseline ranking (deterministic)
# ---------------------------------------------------------------------------
def classical_ranking(factors: List[AlertFactor]):
    sorted_factors = sorted(factors, key=lambda f: f.priority_value(), reverse=True)
    return [f.alert_id for f in sorted_factors]

# ---------------------------------------------------------------------------
# QAOA optimisation routine
# ---------------------------------------------------------------------------
def _objective(params: Sequence[float], Q: np.ndarray):
    # params = [beta_0, ..., beta_{p-1}, gamma_0, ..., gamma_{p-1}]
    p = QAOA_DEPTH
    betas = params[:p]
    gammas = params[p:]
    n = Q.shape[0]
    qc = QuantumCircuit(n)
    for q in range(n):
        qc.h(q)
    for layer in range(p):
        _cost_circuit(qc, Q, gammas[layer])
        _mixer_circuit(qc, n, betas[layer])
    qc.measure_all()
    sim = AerSimulator(method="statevector")
    result = sim.run(qc, shots=QAOA_SHOTS).result()
    counts = result.get_counts()
    exp_val = 0.0
    for bitstring, cnt in counts.items():
        clean_bits = bitstring.replace(" ", "")
        x = np.array([int(b) for b in reversed(clean_bits)])
        val = x @ Q @ x
        exp_val += val * (cnt / QAOA_SHOTS)
    return exp_val

def run_qaoa(factors: List[AlertFactor]):
    """Execute QAOA for the given factors and return ranking information.

    Returns a dictionary containing:
    - ``ranked_alerts`` – list of alert ids ordered by descending selection probability
    - ``probabilities`` – mapping alert_id → probability of being selected (x_i = 1)
    - ``metadata`` – execution time, depth, shots, etc.
    """
    if not factors:
        return {"rankedAlerts": [], "probabilities": {}, "metadata": {"alertsConsidered": 0}}
    Q, meta = build_qubo(factors)
    init_params = np.zeros(2 * QAOA_DEPTH)
    res = minimize(
        _objective,
        init_params,
        args=(Q,),
        method="COBYLA",
        options={"maxiter": QAOA_OPTIMIZER_MAXITER},
    )
    opt_params = res.x
    n = Q.shape[0]
    qc = QuantumCircuit(n)
    for q in range(n):
        qc.h(q)
    for layer in range(QAOA_DEPTH):
        _cost_circuit(qc, Q, opt_params[QAOA_DEPTH + layer])
        _mixer_circuit(qc, n, opt_params[layer])
    qc.measure_all()
    sim = AerSimulator(method="statevector")
    result = sim.run(qc, shots=QAOA_SHOTS).result()
    counts = result.get_counts()
    probs = {f.alert_id: 0.0 for f in factors}
    for bitstring, cnt in counts.items():
        clean_bits = bitstring.replace(" ", "")
        bits = list(reversed(clean_bits))
        for idx, b in enumerate(bits):
            if b == "1":
                probs[factors[idx].alert_id] += cnt / QAOA_SHOTS
    ranked = sorted(probs.items(), key=lambda kv: kv[1], reverse=True)
    ranked_alerts = [aid for aid, _ in ranked]
    return {
        "rankedAlerts": ranked_alerts,
        "probabilities": probs,
        "metadata": {
            "alertsConsidered": len(factors),
            "qaoaDepth": QAOA_DEPTH,
            "shots": QAOA_SHOTS,
            "optimizerSuccess": bool(res.success),
            "objectiveValue": float(res.fun),
        },
    }

# ---------------------------------------------------------------------------
# Public API – single entry point used by the service layer
# ---------------------------------------------------------------------------
def run_optimization_comparison(
    alert_rows: Sequence[Mapping[str, object]],
    detection_rows: Mapping[str, Mapping[str, object]],
    employee_rows: Mapping[str, Mapping[str, object]],
):
    """Run both classical and QAOA optimisation and return a combined response.

    The function is deliberately read‑only: it never writes to the database or
    invokes any response/policy services.
    """
    factors = build_factors(alert_rows, detection_rows, employee_rows)
    if len(factors) > QAOA_MAX_ALERTS:
        factors.sort(key=lambda f: f.risk_score, reverse=True)
        factors = factors[:QAOA_MAX_ALERTS]
    classical = classical_ranking(factors)
    qaoa = run_qaoa(factors)
    def _explain(alert_id: str) -> List[str]:
        f = next((x for x in factors if x.alert_id == alert_id), None)
        if not f:
            return []
        return [
            f"Risk score contribution: {f.risk_score:.2f} (weight 0.25)",
            f"Severity contribution: {f.severity:.2f} (weight 0.20)",
            f"Business impact: {f.business_impact:.2f} (weight 0.15)",
            f"Urgency: {f.urgency:.2f} (weight 0.15)",
            f"Evidence strength: {f.evidence_strength:.2f} (weight 0.10)",
            f"Response cost penalty: {f.response_cost:.2f} (weight -0.05)",
            f"Affected entities: {f.affected_entities:.2f} (weight 0.05)",
            f"Account criticality: {f.account_criticality:.2f} (weight 0.05)",
        ]
    classical_expl = [
        {
            "alertId": aid,
            "priorityScore": next(f.priority_value() for f in factors if f.alert_id == aid),
            "reasoning": _explain(aid),
        }
        for aid in classical
    ]
    qaoa_expl = [
        {
            "alertId": aid,
            "priorityScore": next(f.priority_value() for f in factors if f.alert_id == aid),
            "probability": qaoa["probabilities"][aid],
            "reasoning": _explain(aid),
        }
        for aid in qaoa["rankedAlerts"]
    ]
    return {
        "experimental": True,
        "affectsProductionRisk": False,
        "executesContainment": False,
        "classicalRanking": classical_expl,
        "qaoaRanking": qaoa_expl,
        "metadata": qaoa["metadata"],
    }

"""End of qaoa_optimizer module.
"""
