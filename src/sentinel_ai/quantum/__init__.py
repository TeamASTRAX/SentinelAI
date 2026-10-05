"""Experimental quantum analysis that is isolated from production detection."""

from sentinel_ai.quantum.analysis import (
    FEATURE_QUBIT_MAPPING,
    QuantumAnalyzer,
    build_quantum_circuit,
    extract_quantum_features,
    normalize_quantum_features,
    quantum_kernel_similarity,
    run_vqc,
)

__all__ = [
    "FEATURE_QUBIT_MAPPING",
    "QuantumAnalyzer",
    "build_quantum_circuit",
    "extract_quantum_features",
    "normalize_quantum_features",
    "quantum_kernel_similarity",
    "run_vqc",
]
