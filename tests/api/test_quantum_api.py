"""Event-level experimental quantum API contracts and safety boundaries."""

from fastapi.testclient import TestClient

from sentinel_ai.api import create_app


def test_quantum_endpoints_return_camel_case_contracts(tmp_path) -> None:
    with TestClient(create_app(tmp_path / "quantum-api.db", bootstrap_demo_data=True)) as client:
        event_id = client.get("/api/activity?page_size=1").json()["items"][0]["eventId"]
        status = client.get("/api/quantum/status")
        models = client.get("/api/quantum/models")
        analysis = client.get(f"/api/quantum/events/{event_id}/analysis")
        circuit = client.get(f"/api/quantum/events/{event_id}/circuit")
        comparison = client.get(f"/api/quantum/events/{event_id}/comparison")
        similarity = client.get(f"/api/quantum/events/{event_id}/similarity")

    assert status.status_code == models.status_code == analysis.status_code == 200
    assert status.json()["qubits"] == 4
    assert all(item["affectsProductionRisk"] is False for item in models.json()["items"])
    document = analysis.json()
    assert document["affectsProductionRisk"] is False
    assert "eventId" in document and "event_id" not in document
    assert document["circuit"]["qubits"] == 4
    assert [item["qubit"] for item in document["circuit"]["featureQubitMapping"]] == [0, 1, 2, 3]
    assert circuit.json()["affectsProductionRisk"] is False
    assert comparison.json()["affectsProductionRisk"] is False
    assert comparison.json()["classicalModel"]["model"] == "Isolation Forest"
    assert similarity.json()["eventId"] == event_id
    assert len(similarity.json()["items"]) == 4
    assert all(0.0 <= item["similarity"] <= 1.0 for item in similarity.json()["items"])


def test_quantum_event_not_found_uses_api_error_contract(tmp_path) -> None:
    with TestClient(create_app(tmp_path / "quantum-404.db", bootstrap_demo_data=True)) as client:
        for suffix in ("analysis", "circuit", "comparison", "similarity"):
            response = client.get(f"/api/quantum/events/DOES-NOT-EXIST/{suffix}")
            assert response.status_code == 404
            assert response.json()["error"]["code"] == "event_not_found"


def test_quantum_analysis_does_not_mutate_security_state(tmp_path) -> None:
    app = create_app(tmp_path / "quantum-safety.db", bootstrap_demo_data=True)
    with TestClient(app) as client:
        event = client.get("/api/activity?page_size=1").json()["items"][0]
        event_id = event["eventId"]
        employee_id = event["employeeId"]
        before_event = client.get(f"/api/mitre/events/{event_id}").json()
        before_graph = client.get(f"/api/graph/events/{event_id}").json()
        before_response = client.get(f"/api/response/users/{employee_id}").json()
        before_activity = client.get(f"/api/activity?q={event_id}&page_size=1").json()["items"][0]

        assert client.get(f"/api/quantum/events/{event_id}/analysis").status_code == 200

        after_event = client.get(f"/api/mitre/events/{event_id}").json()
        after_graph = client.get(f"/api/graph/events/{event_id}").json()
        after_response = client.get(f"/api/response/users/{employee_id}").json()
        after_activity = client.get(f"/api/activity?q={event_id}&page_size=1").json()["items"][0]

    assert after_activity["riskScore"] == before_activity["riskScore"]
    assert after_activity["riskLevel"] == before_activity["riskLevel"]
    assert after_activity["alertStatus"] == before_activity["alertStatus"]
    assert after_event["mappings"] == before_event["mappings"]
    assert after_graph["findings"] == before_graph["findings"]
    assert after_response == before_response
