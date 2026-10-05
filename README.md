# 🛡️ SentinelAI

<p align="center">
  <strong>Explainable AI-Powered Behavioral Threat Detection</strong>
</p>

<p align="center">
  Detect abnormal behavior. Understand why it is suspicious. Respond with confidence.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Streamlit-SOC%20Dashboard-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white" />
  <img src="https://img.shields.io/badge/ML-Isolation%20Forest-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" />
  <img src="https://img.shields.io/badge/Database-SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
</p>

<p align="center">
  <a href="#-overview">Overview</a> •
  <a href="#-key-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-detection-engine">Detection Engine</a>
</p>

---

## 🚨 Overview

**SentinelAI** is an explainable AI-powered behavioral threat detection platform designed to identify suspicious activity by learning what "normal" behavior looks like and detecting meaningful deviations.

Instead of relying solely on static rules or black-box machine learning, SentinelAI combines:

- 🧠 Behavioral baselines
- 🤖 Machine learning anomaly detection
- 🔍 Explainable rule-based detection
- 🔗 Context and sequence correlation
- 🎯 Hybrid risk scoring
- 🖥️ SOC-style investigation dashboard
- 🛑 Simulated automated containment

The goal is simple:

> **Detect → Explain → Investigate → Respond**

---

## 🎯 Problem Statement

Traditional security systems often depend heavily on predefined signatures and static thresholds.

However, attackers can operate using legitimate credentials and normal system tools, making their activity difficult to distinguish from legitimate behavior.

Examples include:

- Logging in from unusual locations
- Accessing sensitive files outside normal patterns
- Performing privileged operations unexpectedly
- Accessing systems at unusual times
- Moving laterally between resources
- Combining multiple low-risk actions into a suspicious sequence

SentinelAI focuses on **behavioral deviation** rather than relying only on known attack signatures.

---

## 🧠 How SentinelAI Works

SentinelAI builds behavioral profiles from historical activity and compares new events against those profiles.

It considers:

- 👤 Individual user behavior
- 👥 Peer / role behavior
- 🌍 Global behavioral patterns
- 💻 Device activity
- 📁 File access
- 🔐 Privilege usage
- 🌐 Location and network context
- 🔄 Event sequences

These signals are then combined to generate an explainable **0–100 risk score**.

---

## ✨ Key Features

### 🔍 Behavioral Anomaly Detection

SentinelAI establishes behavioral baselines using historical activity.

The system can compare an event against:

```text
Personal Baseline
       +
Peer / Role Baseline
       +
Global Baseline
```

## Quantum AI Architecture

SentinelAI includes a separate experimental quantum-analysis plane for hackathon research. It is read-only with respect to the production detection pipeline: quantum output does not change risk scores, alerts, alert severity, MITRE mappings, graph findings, or simulated containment.

### Four-qubit behavioural encoding

| Qubit | Behavioural feature | Existing SentinelAI source | Normalization |
| --- | --- | --- | --- |
| q0 | Login-time deviation | `login_hour_deviation` | `clamp(hours / 12, 0, 1)` |
| q1 | Failed-login behaviour | `failed_login_count` | `clamp(count / 10, 0, 1)` |
| q2 | Download-volume anomaly | positive maximum of `download_count_deviation` and `download_size_deviation` | `clamp(deviation / 5, 0, 1)` |
| q3 | Device/location anomaly | `unknown_device` and `location_anomaly` | mean of the two binary signals |

Each normalized value `x` is encoded with `RY(πx)` followed by `RZ(πx/2)`. A CX ring (`q0→q1→q2→q3→q0`) adds entanglement. The same reusable circuit is used by the event visualizer, fidelity kernel, threat-profile comparison, and notebook.

### Quantum models and comparison

- **Quantum fidelity kernel:** exact local statevector fidelity, `|⟨φ(x)|φ(y)⟩|²`. Event anomaly is reported as `1 − similarity`; neither value is an attack probability.
- **VQC:** a lightweight four-qubit variational circuit with two RY parameter layers, eight trainable angles, and linear CX entanglement. It trains once per process with deterministic initialization on 12 representative demo rows and is reused for subsequent requests. Its model score is not calibrated confidence.
- **Classical comparison:** displays the persisted Isolation Forest result alongside the two quantum outputs for the same event without changing the classical model or risk calculation.
- **Threat similarity:** computes real fidelity-kernel similarities to encoded Normal Behaviour, Credential Compromise, Suspicious Data Collection, and Account Manipulation reference profiles.

Circuits are constructed with **Qiskit** and request-time analysis uses a local, noiseless, exact Qiskit-compatible 16-amplitude statevector executor. This avoids native simulator thread instability in FastAPI workers while preserving the same four-qubit gate mathematics. It does not use real quantum hardware and does not model hardware noise. The representative dataset is intentionally small, the classical and quantum feature spaces differ, and no production accuracy, quantum advantage, quantum supremacy, or superiority over classical ML is claimed.

### Quantum API

```text
GET /api/quantum/status
GET /api/quantum/models
GET /api/quantum/events/{event_id}/analysis
GET /api/quantum/events/{event_id}/circuit
GET /api/quantum/events/{event_id}/comparison
GET /api/quantum/events/{event_id}/similarity
```

All frontend payloads use camelCase, return structured 404 errors for unknown events, and include `affectsProductionRisk: false` on experimental output.

### Run the hackathon notebook

From the repository root:

```bash
source .venv/bin/activate
pip install -e '.[notebook]'
jupyter notebook notebooks/sentinelai_quantum_demo.ipynb
```

The notebook generates representative SentinelAI data, encodes and visualizes the circuit, runs kernel similarity and VQC inference, compares Isolation Forest output, and explains limitations. If Jupyter is not already available, use any notebook environment with the project dependencies from `pyproject.toml` installed.

## Getting Started

```bash
source .venv/bin/activate
uvicorn sentinel_ai.api.app:create_app --factory --reload
```

In another terminal, start the frontend in live API mode:

```bash
cd frontend
SENTINEL_DATA_SOURCE=http SENTINEL_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```
