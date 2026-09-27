🛡️ SentinelAI
Explainable AI-Powered Behavioral Threat Detection
🚨 The Problem
Traditional security systems often rely heavily on predefined signatures and static thresholds.
But sophisticated threats don't always look obviously malicious.
An attacker using a legitimate employee account may:
Log in from an unusual location
Access files outside their normal working pattern
Escalate privileges
Perform sensitive actions at unusual times
Move laterally across systems
Combine several individually harmless actions into a suspicious sequence
The real question isn't simply:
"Did something unusual happen?"
It's:
"How unusual is it, why is it unusual, and how risky is the overall behavior?"
🧠 What is SentinelAI?
SentinelAI is an explainable behavioral threat-detection prototype designed to identify suspicious activity across:
👤 Identity behavior
💻 Device activity
🔐 Privilege usage
📁 File access
🌐 Network/location context
🔄 Behavioral sequences
Instead of depending on a single ML prediction, SentinelAI combines:
Behavioral Baselines + Machine Learning + Deterministic Rules + Contextual Correlation
to produce a 0–100 risk score with human-readable explanations.
The project currently runs as a local modular monolith using Python, Streamlit, SQLite, and scikit-learn, with deterministic synthetic data for reproducible demonstrations.
✨ Key Features
🔍 Behavioral Anomaly Detection
SentinelAI builds behavioral profiles from historical normal activity and detects deviations from those patterns.
Profiles can represent:
Personal behavior
Department/role peer behavior
Global behavior
Current events are deliberately excluded from their own baseline to prevent the detection system from normalizing the anomaly it is supposed to detect.
🤖 AI-Based Detection
The system uses an Isolation Forest model to rank anomalous behavior.
The model uses:
Fixed feature ordering
Reproducible preprocessing
Fixed random seed
Empirical normal-history percentile ranking
Important: The anomaly percentile represents relative abnormality, not attack probability.
🧩 Explainable Rule Engine
Machine learning alone doesn't tell an analyst why an event is suspicious.
SentinelAI therefore combines ML with deterministic rules that expose:
Observed Value
      ↓
Expected Value
      ↓
Deviation
      ↓
Rule Contribution
      ↓
Human-readable Reason

This makes alerts easier to investigate and understand.
🎯 Hybrid Risk Scoring
Instead of trusting a single detector, SentinelAI fuses multiple signals:
                 ┌─────────────────┐
                 │ Behavioral Data │
                 └────────┬────────┘
                          │
              ┌───────────┴───────────┐
              ↓                       ↓
       ┌─────────────┐         ┌─────────────┐
       │ ML Anomaly  │         │ Rule Engine │
       │   Score     │         │   Signals   │
       └──────┬──────┘         └──────┬──────┘
              │                       │
              └───────────┬───────────┘
                          ↓
                ┌───────────────────┐
                │ Context / Sequence│
                │    Correlation    │
                └─────────┬─────────┘
                          ↓
                 ┌────────────────┐
                 │ Hybrid Risk    │
                 │   Score 0–100  │
                 └───────┬────────┘
                         ↓
                 ┌────────────────┐
                 │ Explainable    │
                 │     Alert      │
                 └────────────────┘

The final score is a capped combination of rule, AI, and contextual-correlation contributions.
🧪 Attack Lab & Scenario Simulation
SentinelAI includes deterministic scenarios that allow suspicious behavioral patterns to be reproduced and investigated.
This makes the project useful for:
Security demonstrations
Model evaluation
Testing detection logic
Reproducing attack stories
Understanding alert generation
Because the demo dataset is deterministic, the same scenario can be reproduced consistently.
🖥️ SOC Dashboard
SentinelAI includes a Streamlit-based Security Operations Center interface for exploring:
Alerts
Risk scores
Behavioral activity
Detection reasons
Attack scenarios
Event sequences
Investigation data
The UI is backed by application services rather than directly manipulating detection logic or generating alerts itself.
🛑 Simulated Automated Containment
SentinelAI supports simulated response actions when configured risk thresholds are reached.
Example:
AUTO_CONTAINMENT_ENABLED=true
AUTO_CONTAINMENT_RISK_THRESHOLD=100

The current implementation uses a SimulationContainmentAdapter.
It does not:
Disable real enterprise accounts
Revoke real identity-provider tokens
Isolate real endpoints
Call external security services
Instead, it records the simulated response in SentinelAI's persisted demonstration state and audit history.
🏗️ Architecture
                         ┌──────────────────────┐
                         │     Event Sources    │
                         │ Identity / Device /  │
                         │ File / Privilege     │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      Ingestion       │
                         │ Validation &          │
                         │ Normalization         │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │    Feature Engine    │
                         │ Prior-only windows   │
                         │ Behavioral features  │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
             ┌────────────┐ ┌────────────┐ ┌────────────┐
             │ Personal   │ │ Peer/Role  │ │  Global    │
             │ Baseline   │ │ Baseline   │ │  Baseline  │
             └─────┬──────┘ └─────┬──────┘ └─────┬──────┘
                   │              │              │
                   └──────────────┼──────────────┘
                                  ▼
                    ┌────────────────────────┐
                    │   Detection Engine     │
                    │                        │
                    │ • Isolation Forest     │
                    │ • Rules                │
                    │ • Sequences            │
                    │ • Context Correlation  │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Hybrid Risk Score    │
                    │        0 — 100         │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ Explainable Alert      │
                    │ + Evidence             │
                    │ + Reason Codes         │
                    └────────────┬───────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
             ┌──────────────┐        ┌────────────────┐
             │ SOC Dashboard │        │ Response /     │
             │   Streamlit   │        │ Containment    │
             └──────────────┘        │   Simulation   │
                                     └────────────────┘

🔬 Detection Pipeline
SentinelAI follows a layered detection strategy:
1. Event Ingestion
Incoming events are validated and normalized into a consistent internal representation.
2. Feature Engineering
Historical activity is transformed into behavioral features using prior-only windows.
3. Behavioral Profiling
The system establishes expected behavior using:
Personal history
Peer/department behavior
Global behavior
4. ML Anomaly Detection
Isolation Forest identifies observations that deviate from learned n
