import pytest
from fastapi.testclient import TestClient
from sentinel_ai.api.app import create_app
from sentinel_ai.services import SentinelService

@pytest.fixture
def client():
    app = create_app(bootstrap_demo_data=True)
    with TestClient(app) as client:
        yield client

def test_qaoa_status(client):
    response = client.get("/api/quantum/optimization/status")
    assert response.status_code == 200
    data = response.json()
    assert data["experimental"] is True
    assert data["affectsProductionRisk"] is False
    assert data["executesContainment"] is False
    assert "maxAlerts" in data
    assert "depth" in data

def test_qaoa_prioritize_and_latest(client):
    # Call the POST endpoint
    response = client.post("/api/quantum/optimization/prioritize")
    assert response.status_code == 200
    data = response.json()
    assert data["experimental"] is True
    assert "qaoaRanking" in data
    
    # Verify latest result caching
    latest_response = client.get("/api/quantum/optimization/latest")
    assert latest_response.status_code == 200
    assert latest_response.json() == data

def test_qaoa_does_not_modify_state(client):
    app = client.app
    service = app.state.service
    
    # Capture initial state
    initial_alerts = list(service.alert_rows())
    initial_detections = list(service.detection_rows())
    initial_events = list(service.database.list_event_rows())
    
    # Run optimization
    response = client.post("/api/quantum/optimization/prioritize")
    assert response.status_code == 200
    
    # Verify no state was changed
    assert list(service.alert_rows()) == initial_alerts
    assert list(service.detection_rows()) == initial_detections
    assert list(service.database.list_event_rows()) == initial_events
