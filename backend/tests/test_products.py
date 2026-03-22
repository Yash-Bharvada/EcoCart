"""
Product Tests
-------------
Tests for product search, filtering, recommendations, and affiliate links.
"""

import pytest
from unittest.mock import AsyncMock, patch
from bson import ObjectId
from datetime import datetime


@pytest.fixture
def sample_product_docs():
    """Sample product documents for testing."""
    return [
        {
            "_id": ObjectId(),
            "name": "Organic Oat Milk",
            "description": "Creamy oat milk from sustainable farms",
            "category": "Dairy Alternative",
            "carbon_rating": 0.9,
            "eco_certifications": ["Organic", "B Corp"],
            "tags": ["vegan", "plastic-free"],
            "price": 4.99,
            "currency": "USD",
            "price_range": "mid",
            "stock_status": "in_stock",
            "is_featured": True,
            "is_active": True,
            "affiliate_link": "https://example.com/oat-milk",
            "affiliate_network": "direct",
            "view_count": 10,
            "click_count": 5,
            "purchase_count": 2,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
        {
            "_id": ObjectId(),
            "name": "Bamboo Toothbrush",
            "description": "Eco-friendly bamboo toothbrush",
            "category": "Personal Care",
            "carbon_rating": 0.3,
            "eco_certifications": ["FSC"],
            "tags": ["plastic-free", "biodegradable"],
            "price": 3.99,
            "currency": "USD",
            "price_range": "budget",
            "stock_status": "in_stock",
            "is_featured": False,
            "is_active": True,
            "affiliate_link": "https://example.com/toothbrush",
            "affiliate_network": "amazon",
            "view_count": 20,
            "click_count": 8,
            "purchase_count": 5,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        },
    ]


@pytest.mark.asyncio
class TestProductSearch:
    async def test_list_products_empty_catalog(self, async_client):
        """Empty product catalog returns 200 with empty list."""
        response = await async_client.get("/api/v1/products/")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert "pagination" in data

    async def test_list_products_with_data(self, async_client, mock_mongodb, sample_product_docs):
        """Products in DB are returned in list."""
        mock_mongodb["products"].insert_many(sample_product_docs)
        response = await async_client.get("/api/v1/products/")
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) == 2

    async def test_filter_by_category(self, async_client, mock_mongodb, sample_product_docs):
        """Category filter returns only matching products."""
        mock_mongodb["products"].insert_many(sample_product_docs)
        response = await async_client.get("/api/v1/products/?category=Personal+Care")
        assert response.status_code == 200
        data = response.json()
        assert all(
            "Personal Care" in p["category"] for p in data["products"]
        )

    async def test_filter_by_carbon_rating(self, async_client, mock_mongodb, sample_product_docs):
        """carbon_rating_max filter excludes products above threshold."""
        mock_mongodb["products"].insert_many(sample_product_docs)
        response = await async_client.get("/api/v1/products/?carbon_rating_max=0.5")
        assert response.status_code == 200
        data = response.json()
        for product in data["products"]:
            assert product["carbon_rating"] <= 0.5

    async def test_pagination(self, async_client, mock_mongodb, sample_product_docs):
        """Pagination meta is correct."""
        mock_mongodb["products"].insert_many(sample_product_docs)
        response = await async_client.get("/api/v1/products/?page=1&limit=1")
        assert response.status_code == 200
        data = response.json()
        assert data["pagination"]["limit"] == 1
        assert data["pagination"]["total"] == 2
        assert data["pagination"]["total_pages"] == 2
        assert data["pagination"]["has_next"] is True
        assert data["pagination"]["has_prev"] is False


@pytest.mark.asyncio
class TestProductDetail:
    async def test_product_not_found(self, async_client):
        """Non-existent product returns 404."""
        fake_id = str(ObjectId())
        response = await async_client.get(f"/api/v1/products/{fake_id}")
        assert response.status_code == 404

    async def test_get_existing_product(self, async_client, mock_mongodb, sample_product_docs):
        """Fetch a product that exists returns 200."""
        mock_mongodb["products"].insert_many(sample_product_docs)
        product_id = str(sample_product_docs[0]["_id"])
        response = await async_client.get(f"/api/v1/products/{product_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == sample_product_docs[0]["name"]


@pytest.mark.asyncio
class TestRecommendations:
    async def test_recommendations_requires_auth(self, async_client):
        """Recommendations endpoint requires authentication."""
        response = await async_client.get("/api/v1/products/recommendations")
        assert response.status_code in (401, 403)

    async def test_recommendations_empty_history(
        self, async_client, auth_headers, mock_mongodb, sample_product_docs
    ):
        """No analysis history returns featured products."""
        mock_mongodb["products"].insert_many(sample_product_docs)
        response = await async_client.get("/api/v1/products/recommendations", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
