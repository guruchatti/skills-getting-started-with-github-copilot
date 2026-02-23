import copy
import pytest
from fastapi.testclient import TestClient

from src.app import app, activities

# create a client for the FastAPI app
client = TestClient(app)

# keep an untouched copy of the default state so each test can start fresh
_original_activities = copy.deepcopy(activities)


@pytest.fixture(autouse=True)
def reset_activities():
    """Restore the in-memory data before each test (AAA: Arrange)."""
    activities.clear()
    activities.update(copy.deepcopy(_original_activities))
    yield


def test_root_redirect():
    # Act – don't follow redirects so we can inspect the response directly
    response = client.get("/", follow_redirects=False)
    # Assert
    assert response.status_code in (301, 302, 307, 308)
    assert response.headers.get("location") == "/static/index.html"


def test_get_activities_returns_all():
    # Act
    response = client.get("/activities")
    # Assert
    assert response.status_code == 200
    assert response.json() == _original_activities


def test_signup_successful():
    email = "student@mergington.edu"
    # Act
    response = client.post(
        "/activities/Chess Club/signup", params={"email": email}
    )
    # Assert
    assert response.status_code == 200
    assert email in activities["Chess Club"]["participants"]


def test_signup_duplicate_fails():
    existing = _original_activities["Chess Club"]["participants"][0]
    response = client.post(
        "/activities/Chess Club/signup", params={"email": existing}
    )
    assert response.status_code == 400
    assert "already" in response.json()["detail"].lower()


def test_signup_nonexistent_activity():
    response = client.post(
        "/activities/NotHere/signup", params={"email": "a@b.com"}
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_unregister_successful():
    existing = _original_activities["Chess Club"]["participants"][0]
    response = client.delete(
        "/activities/Chess Club/signup", params={"email": existing}
    )
    assert response.status_code == 200
    assert existing not in activities["Chess Club"]["participants"]


def test_unregister_not_signed_up_fails():
    response = client.delete(
        "/activities/Chess Club/signup", params={"email": "nobody@nowhere"}
    )
    assert response.status_code == 400
    assert "not signed up" in response.json()["detail"].lower()


def test_unregister_nonexistent_activity():
    response = client.delete(
        "/activities/Nope/signup", params={"email": "a@b.com"}
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
