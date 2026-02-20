"""
Smoke tests for GRAPH Educational Platform backend.
Run with: pytest tests/ -v
"""
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root():
    """Root endpoint returns API info."""
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert "GRAPH" in data["message"]
    assert data["version"] == "1.0.0"


def test_health():
    """Health endpoint returns ok."""
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_docs_accessible():
    """Swagger UI is reachable."""
    resp = client.get("/docs")
    assert resp.status_code == 200


def test_openapi_json():
    """OpenAPI schema is reachable."""
    resp = client.get("/api/v1/openapi.json")
    assert resp.status_code == 200
    data = resp.json()
    assert "openapi" in data


def test_tracks_list():
    """GET /api/v1/tracks/ returns a list."""
    resp = client.get("/api/v1/tracks/")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_auth_register_validation():
    """Register endpoint rejects invalid payload."""
    resp = client.post("/api/v1/auth/register", json={})
    assert resp.status_code == 422


def test_auth_login_bad_credentials():
    """Login with wrong credentials fails."""
    resp = client.post(
        "/api/v1/auth/login",
        data={"username": "nonexistent", "password": "wrong"},
    )
    assert resp.status_code in (400, 401, 404)
