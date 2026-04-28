import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient


@pytest.fixture
def mock_db():
    return MagicMock()


@pytest.fixture
def client(mock_db):
    from app.main import app
    from app.db import get_session

    app.dependency_overrides[get_session] = lambda: mock_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
