"""
Pytest Fixtures (conftest.py)
------------------------------
Shared fixtures for all test modules.
Uses mongomock and fakeredis to avoid real database calls.
"""

import asyncio
from datetime import datetime
from typing import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from bson import ObjectId
from fastapi.testclient import TestClient
from httpx import AsyncClient


# ── Async event loop ──────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ── Mock DB Setup ─────────────────────────────────────────────────────────────
@pytest.fixture(autouse=True)
def mock_mongodb(monkeypatch):
    """Mock MongoDB to use mongomock for all tests."""
    import mongomock
    mock_client = mongomock.MongoClient()
    mock_db = mock_client["ecocart_test"]

    monkeypatch.setattr("app.database.mongodb._client", mock_client)
    monkeypatch.setattr("app.database.mongodb._db", mock_db)
    return mock_db


@pytest.fixture(autouse=True)
def mock_redis(monkeypatch):
    """Mock Redis to use fakeredis."""
    import fakeredis
    fake_redis = fakeredis.FakeRedis(decode_responses=True)
    monkeypatch.setattr("app.database.redis_client._redis_client", fake_redis)
    return fake_redis


# ── App Client ────────────────────────────────────────────────────────────────
@pytest.fixture
def client():
    """Synchronous test client."""
    from app.main import app
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient, None]:
    """Async test client for async test functions."""
    from app.main import app
    async with AsyncClient(app=app, base_url="http://test") as c:
        yield c


# ── Test User Fixtures ────────────────────────────────────────────────────────
@pytest.fixture
def test_user_data():
    """Raw user data for registration tests."""
    return {
        "email": "test@ecocart.com",
        "password": "TestPass123!",
        "full_name": "Test User",
    }


@pytest.fixture
def test_user_doc():
    """Pre-built user document as it would appear in MongoDB."""
    from app.utils.security import hash_password
    return {
        "_id": ObjectId(),
        "email": "test@ecocart.com",
        "hashed_password": hash_password("TestPass123!"),
        "full_name": "Test User",
        "subscription_tier": "free",
        "stripe_customer_id": "cus_test123",
        "total_carbon_footprint_kg": 0.0,
        "total_carbon_offset_kg": 0.0,
        "eco_score_average": 0.0,
        "analysis_count": 0,
        "analysis_count_this_month": 0,
        "premium_features": {},
        "badges": [],
        "points": 0,
        "level": "bronze",
        "preferences": {"show_on_leaderboard": True},
        "is_active": True,
        "is_verified": True,
        "role": "user",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "failed_login_attempts": 0,
        "is_deleted": False,
    }


@pytest.fixture
def premium_user_doc(test_user_doc):
    """Premium tier user document."""
    doc = test_user_doc.copy()
    doc["_id"] = ObjectId()
    doc["email"] = "premium@ecocart.com"
    doc["subscription_tier"] = "premium"
    doc["analysis_count_this_month"] = 0
    doc["premium_features"] = {
        "unlimited_analyses": True,
        "priority_support": True,
        "carbon_offset_recommendations": True,
        "premium_gemini_model": True,
    }
    return doc


@pytest.fixture
def auth_headers(test_user_doc, mock_mongodb):
    """JWT auth headers for a test user."""
    mock_mongodb["users"].insert_one(test_user_doc)
    user_id = str(test_user_doc["_id"])
    from app.utils.security import create_access_token
    token = create_access_token(
        user_id=user_id,
        email=test_user_doc["email"],
        subscription_tier="free",
        role="user",
        is_verified=True,
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def premium_auth_headers(premium_user_doc, mock_mongodb):
    """JWT auth headers for a premium test user."""
    mock_mongodb["users"].insert_one(premium_user_doc)
    user_id = str(premium_user_doc["_id"])
    from app.utils.security import create_access_token
    token = create_access_token(
        user_id=user_id,
        email=premium_user_doc["email"],
        subscription_tier="premium",
        role="user",
        is_verified=True,
    )
    return {"Authorization": f"Bearer {token}"}


# ── Service Mocks ─────────────────────────────────────────────────────────────
@pytest.fixture
def mock_gemini_response():
    """A fake successful Gemini analysis response."""
    return {
        "is_valid_receipt": True,
        "products": [
            {
                "name": "Organic Milk",
                "category": "Dairy",
                "quantity": "1 liter",
                "estimated_carbon_kg": 1.9,
                "carbon_intensity": "medium",
                "notes": "Organic",
            },
            {
                "name": "Ground Beef",
                "category": "Meat",
                "quantity": "500g",
                "estimated_carbon_kg": 13.5,
                "carbon_intensity": "high",
                "notes": None,
            },
        ],
        "total_carbon_kg": 15.4,
        "eco_score": 42,
        "score_breakdown": {"food_choices": 30, "packaging": 50, "origin": 55, "product_type": 45},
        "suggestions": [
            {
                "text": "Replace ground beef (13.5 kg CO2) with Beyond Meat (1.5 kg CO2)",
                "alternative_name": "Beyond Meat Plant-Based Ground",
                "estimated_savings_kg": 12.0,
                "priority": "high",
            }
        ],
        "summary": "This receipt has a high carbon footprint, mainly from beef.",
        "top_contributors": ["Ground Beef", "Organic Milk"],
        "comparison": "Your footprint is 80% higher than average.",
        "processing_time_ms": 1234,
        "gemini_model_version": "gemini-1.5-flash-latest",
        "receipt_image_url": None,
        "receipt_image_thumbnail": None,
        "user_id": "test_user_id",
    }


@pytest.fixture
def mock_stripe_payment_intent():
    """A fake Stripe PaymentIntent response."""
    return {
        "client_secret": "pi_test_secret_abc123",
        "payment_intent_id": "pi_test_abc123",
        "amount": 9.99,
        "currency": "usd",
        "status": "requires_payment_method",
    }
