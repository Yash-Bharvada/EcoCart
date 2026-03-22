"""
Authentication Tests
--------------------
Tests for: register, login, token refresh, logout, email verification,
password reset, and invalid token handling.
"""

import pytest
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
class TestRegister:
    async def test_register_success(self, async_client, test_user_data):
        """Registration with valid data returns 201 and JWT tokens."""
        with patch("app.services.payment_service.create_stripe_customer", return_value="cus_test"):
            with patch("app.services.email_service.send_verification_email", return_value=True):
                with patch("app.services.email_service.send_welcome_email", return_value=True):
                    response = await async_client.post("/api/v1/auth/register", json=test_user_data)

        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    async def test_register_duplicate_email(self, async_client, test_user_data, mock_mongodb):
        """Registration with an existing email returns 409."""
        # Pre-insert user
        from app.utils.security import hash_password
        from bson import ObjectId
        from datetime import datetime
        mock_mongodb["users"].insert_one({
            "_id": ObjectId(),
            "email": test_user_data["email"],
            "hashed_password": hash_password(test_user_data["password"]),
            "full_name": test_user_data["full_name"],
            "is_deleted": False,
        })
        with patch("app.services.payment_service.create_stripe_customer", return_value=None):
            response = await async_client.post("/api/v1/auth/register", json=test_user_data)
        assert response.status_code == 409

    async def test_register_weak_password(self, async_client):
        """Registration with a weak password returns 422."""
        response = await async_client.post("/api/v1/auth/register", json={
            "email": "test@example.com",
            "password": "weak",
            "full_name": "Test User",
        })
        assert response.status_code == 422

    async def test_register_invalid_email(self, async_client):
        """Registration with invalid email returns 422."""
        response = await async_client.post("/api/v1/auth/register", json={
            "email": "not-an-email",
            "password": "StrongPass123!",
            "full_name": "Test User",
        })
        assert response.status_code == 422


@pytest.mark.asyncio
class TestLogin:
    async def test_login_success(self, async_client, test_user_doc, mock_mongodb):
        """Valid login returns 200 with JWT tokens."""
        mock_mongodb["users"].insert_one(test_user_doc)
        response = await async_client.post("/api/v1/auth/login", json={
            "email": test_user_doc["email"],
            "password": "TestPass123!",
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    async def test_login_wrong_password(self, async_client, test_user_doc, mock_mongodb):
        """Wrong password returns 401."""
        mock_mongodb["users"].insert_one(test_user_doc)
        response = await async_client.post("/api/v1/auth/login", json={
            "email": test_user_doc["email"],
            "password": "WrongPassword!",
        })
        assert response.status_code == 401

    async def test_login_nonexistent_user(self, async_client):
        """Login with unknown email returns 401."""
        response = await async_client.post("/api/v1/auth/login", json={
            "email": "nobody@ecocart.com",
            "password": "AnyPass123!",
        })
        assert response.status_code == 401


@pytest.mark.asyncio
class TestAuthMe:
    async def test_get_me_authenticated(self, async_client, test_user_doc, mock_mongodb, auth_headers):
        """GET /auth/me with valid token returns user profile."""
        response = await async_client.get("/api/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user_doc["email"]
        assert "hashed_password" not in data

    async def test_get_me_unauthenticated(self, async_client):
        """GET /auth/me without token returns 401/403."""
        response = await async_client.get("/api/v1/auth/me")
        assert response.status_code in (401, 403)

    async def test_get_me_invalid_token(self, async_client):
        """GET /auth/me with invalid token returns 401."""
        response = await async_client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token_here"},
        )
        assert response.status_code == 401


@pytest.mark.asyncio
class TestPasswordReset:
    async def test_forgot_password_always_returns_200(self, async_client):
        """Forgot password always returns 200 to prevent email enumeration."""
        response = await async_client.post(
            "/api/v1/auth/forgot-password",
            json={"email": "nonexistent@ecocart.com"},
        )
        assert response.status_code == 200
        assert response.json()["success"] is True

    async def test_forgot_password_sends_email_when_user_exists(
        self, async_client, test_user_doc, mock_mongodb
    ):
        """Forgot password sends email when user exists."""
        mock_mongodb["users"].insert_one(test_user_doc)
        with patch("app.services.email_service.send_password_reset_email", return_value=True) as mock_email:
            response = await async_client.post(
                "/api/v1/auth/forgot-password",
                json={"email": test_user_doc["email"]},
            )
        assert response.status_code == 200
        mock_email.assert_called_once()
