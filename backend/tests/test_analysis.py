"""
Analysis Tests
--------------
Tests for receipt upload, analysis retrieval, quota enforcement, and stats.
"""

import io
import pytest
from unittest.mock import AsyncMock, patch
from PIL import Image


def create_test_image_bytes() -> bytes:
    """Create a minimal JPEG image for upload tests."""
    img = Image.new("RGB", (200, 100), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.mark.asyncio
class TestAnalyzeReceipt:
    async def test_analyze_valid_receipt(
        self, async_client, auth_headers, mock_gemini_response
    ):
        """Valid image upload returns 201 with analysis results."""
        image_bytes = create_test_image_bytes()

        with patch("app.services.gemini_service.analyze_receipt", return_value=mock_gemini_response):
            response = await async_client.post(
                "/api/v1/analyze/",
                headers=auth_headers,
                files={"file": ("receipt.jpg", image_bytes, "image/jpeg")},
            )

        assert response.status_code == 201
        data = response.json()
        assert data["eco_score"] == 42
        assert data["total_carbon_kg"] == 15.4
        assert data["is_valid_receipt"] is True

    async def test_analyze_requires_auth(self, async_client):
        """Analysis without auth returns 401/403."""
        image_bytes = create_test_image_bytes()
        response = await async_client.post(
            "/api/v1/analyze/",
            files={"file": ("receipt.jpg", image_bytes, "image/jpeg")},
        )
        assert response.status_code in (401, 403)

    async def test_analyze_invalid_file_type(self, async_client, auth_headers):
        """Non-image file upload returns 400."""
        response = await async_client.post(
            "/api/v1/analyze/",
            headers=auth_headers,
            files={"file": ("doc.pdf", b"PDF content", "application/pdf")},
        )
        assert response.status_code == 400

    async def test_free_tier_quota_enforcement(self, async_client, test_user_doc, mock_mongodb):
        """Free tier users blocked after monthly limit reached."""
        from app.utils.security import create_access_token
        from bson import ObjectId
        # Set user to monthly limit
        test_user_doc["analysis_count_this_month"] = 5  # At limit
        mock_mongodb["users"].insert_one(test_user_doc)
        user_id = str(test_user_doc["_id"])
        token = create_access_token(user_id, test_user_doc["email"], "free")
        headers = {"Authorization": f"Bearer {token}"}
        image_bytes = create_test_image_bytes()

        response = await async_client.post(
            "/api/v1/analyze/",
            headers=headers,
            files={"file": ("receipt.jpg", image_bytes, "image/jpeg")},
        )
        assert response.status_code == 429  # Too Many Requests

    async def test_premium_bypasses_quota(
        self, async_client, premium_auth_headers, mock_gemini_response
    ):
        """Premium users are not affected by the monthly limit."""
        image_bytes = create_test_image_bytes()
        with patch("app.services.gemini_service.analyze_receipt", return_value=mock_gemini_response):
            response = await async_client.post(
                "/api/v1/analyze/",
                headers=premium_auth_headers,
                files={"file": ("receipt.jpg", image_bytes, "image/jpeg")},
            )
        assert response.status_code == 201


@pytest.mark.asyncio
class TestAnalysisHistory:
    async def test_get_history_empty(self, async_client, auth_headers):
        """Empty history returns 200 with empty list."""
        response = await async_client.get("/api/v1/analyze/history", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["analyses"] == []
        assert data["pagination"]["total"] == 0

    async def test_get_history_requires_auth(self, async_client):
        """History endpoint requires authentication."""
        response = await async_client.get("/api/v1/analyze/history")
        assert response.status_code in (401, 403)
