"""Unit tests for the QAOA response prioritization optimizer.
These tests verify that the optimizer can be invoked with minimal data
and returns the expected advisory‑only contract.
"""

from sentinel_ai.quantum.qaoa_optimizer import run_optimization_comparison

def test_qaoa_optimizer_basic_flow():
    # Minimal mock data: two alerts with simple detection rows and employee rows.
    alert_rows = [
        {"alert_id": "A1", "detection_id": "D1", "employee_id": "E1", "risk_score": 50.0},
        {"alert_id": "A2", "detection_id": "D2", "employee_id": "E2", "risk_score": 20.0},
    ]
    detection_rows = {
        "D1": {"detection_id": "D1", "risk_score": 50.0},
        "D2": {"detection_id": "D2", "risk_score": 20.0},
    }
    employee_rows = {
        "E1": {"employee_id": "E1"},
        "E2": {"employee_id": "E2"},
    }

    result = run_optimization_comparison(alert_rows, detection_rows, employee_rows)

    # Core structure checks
    assert "experimental" in result
    assert result["experimental"] is True
    assert "affectsProductionRisk" in result
    assert result["affectsProductionRisk"] is False
    assert "executesContainment" in result
    assert result["executesContainment"] is False

    assert "metadata" in result
    assert result["metadata"]["alertsConsidered"] == 2

    assert "qaoaRanking" in result
    assert len(result["qaoaRanking"]) == 2
    
    # Check explanations exist
    for rank in result["qaoaRanking"]:
        assert "reasoning" in rank
        assert isinstance(rank["reasoning"], list)
        
def test_qaoa_optimizer_empty_flow():
    result = run_optimization_comparison([], {}, {})
    assert result["metadata"]["alertsConsidered"] == 0
    assert len(result["qaoaRanking"]) == 0
