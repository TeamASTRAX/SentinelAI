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
