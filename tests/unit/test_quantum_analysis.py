"""Quantum encoding and model-contract tests."""

from math import pi

from sentinel_ai.domain import FeatureVector
from sentinel_ai.quantum import (
    build_quantum_circuit,
    extract_quantum_features,
    normalize_quantum_features,
    quantum_kernel_similarity,
    run_vqc,
)


def _features() -> FeatureVector:
    return FeatureVector(
        login_hour_deviation=6.0, outside_working_hours=1.0,
        unknown_device=1.0, location_anomaly=0.0, failed_login_count=5.0,
        download_count_deviation=2.5, download_size_deviation=1.5,
        sensitive_file=1.0, privilege_escalation=0.0,
        travel_speed_kmh=0.0, impossible_travel=0.0,
    )


def test_feature_extraction_and_normalization_are_bounded() -> None:
    raw = extract_quantum_features(_features())
    normalized = normalize_quantum_features(raw)

    assert raw == {
        "loginTimeDeviation": 6.0,
        "failedLoginBehaviour": 5.0,
        "downloadVolumeAnomaly": 2.5,
        "deviceLocationAnomaly": 0.5,
    }
    assert normalized == {key: 0.5 for key in raw}
    assert all(0.0 <= value <= 1.0 for value in normalized.values())


def test_circuit_has_four_qubits_rotations_and_ring_entanglement() -> None:
    values = {key: 0.5 for key in normalize_quantum_features(extract_quantum_features(_features()))}
    circuit = build_quantum_circuit(values)
    operations = circuit.count_ops()

    assert circuit.num_qubits == 4
    assert operations["ry"] == 4
    assert operations["rz"] == 4
    assert operations["cx"] == 4
    assert float(circuit.data[0].operation.params[0]) == pi / 2


def test_fidelity_kernel_is_symmetric_bounded_and_reflexive() -> None:
    left = {"loginTimeDeviation": 0.1, "failedLoginBehaviour": 0.2, "downloadVolumeAnomaly": 0.3, "deviceLocationAnomaly": 0.4}
    right = {"loginTimeDeviation": 0.7, "failedLoginBehaviour": 0.8, "downloadVolumeAnomaly": 0.2, "deviceLocationAnomaly": 1.0}

    assert quantum_kernel_similarity(left, left) == 1.0
    assert 0.0 <= quantum_kernel_similarity(left, right) <= 1.0
    assert quantum_kernel_similarity(left, right) == quantum_kernel_similarity(right, left)


def test_vqc_contract_is_explicitly_experimental() -> None:
    result = run_vqc({"loginTimeDeviation": 0.8, "failedLoginBehaviour": 0.9, "downloadVolumeAnomaly": 0.7, "deviceLocationAnomaly": 1.0})

    assert result["prediction"] in {"NORMAL", "SUSPICIOUS"}
    assert 0.0 <= result["modelScore"] <= 1.0
    assert result["modelType"] == "VQC"
    assert result["qubits"] == 4
    assert result["experimental"] is True
    assert result["affectsProductionRisk"] is False
    assert "not a calibrated confidence" in result["scoreMeaning"]
