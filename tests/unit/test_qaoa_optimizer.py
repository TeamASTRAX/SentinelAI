import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'src'))
"""Unit tests for the QAOA response prioritization optimizer.
These tests verify that the optimizer can be invoked with minimal data
and returns the expected advisory‑only contract.
"""

import builtins
from sentinel_ai.quantum.qaoa_optimizer import run_optimization_comparison

def test_qaoa_optimizer_basic_flow():
    # Minimal mock data: two alerts with simple detection rows and employee rows.
    alert_rows = [
        {"alert_id": "A1", "employee_id": "E1", "risk_score": 50.0},
        {"alert_id": "A2", "employee_id": "E2", "risk_score": 20.0},
    ]
    detection_rows = {
        "A1": {"alert_id": "A1", "risk_score": 50.0},
        "A2": {"alert_id": "A2", "risk_score": 20.0},
    }
    employee_rows = {
        "E1": builtins.object(),  # placeholder, optimizer only needs the key
        "E2": builtins.object(),
    }

    result = run_optimization_comparison(alert_rows, detection_rows, employee_rows)

    # Verify the advisory contract
    assert isinstance(result, dict)
    assert result.get("experimental") is True
    assert result.get("affectsProductionRisk") is False
    assert result.get("executesContainment") is False
    # Rankings should be present and contain both alerts
    rankings = result.get("rankings")
    assert rankings is not None
    assert set(rankings.keys()) == {"classical", "qaoa"}
    for ranking in rankings.values():
        assert isinstance(ranking, list)
        assert len(ranking) == 2
        # Each entry should be a dict with at least an alert_id
        for entry in ranking:
            assert "alert_id" in entry

    # Explanations should be a string explaining the optimisation
    assert isinstance(result.get("explanations"), str)
