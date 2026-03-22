"""
Product Routes
--------------
GET  /products                       — Search & list products
GET  /products/recommendations        — Personalized recommendations
GET  /products/alternatives/{id}     — Alternatives for specific analysis
GET  /products/{id}                  — Single product detail
POST /products/{id}/click            — Track click, return redirect URL
GET  /r/{code}                       — Redirect to affiliate URL
"""

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse

from app.middleware.auth_middleware import get_current_active_user, optional_auth
from app.models.schemas import (
    ProductListResponse, ProductResponse, ProductClickResponse,
    AnalysisListResponse,
)
from app.services.product_service import (
    search_products, get_product_by_id, get_alternatives_for_analysis,
    get_personalized_recommendations, track_product_click, resolve_redirect_code,
)
from app.services.analytics_service import track_event, Events

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/",
    response_model=ProductListResponse,
    summary="Search and list sustainable products",
)
async def list_products(
    q: Optional[str] = Query(default=None, description="Search query"),
    category: Optional[str] = None,
    price_min: Optional[float] = Query(default=None, ge=0),
    price_max: Optional[float] = Query(default=None, ge=0),
    carbon_rating_max: Optional[float] = Query(default=None, ge=0),
    certifications: Optional[List[str]] = Query(default=None),
    tags: Optional[List[str]] = Query(default=None),
    is_featured: Optional[bool] = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    sort_by: str = Query(default="carbon_rating", pattern="^(carbon_rating|price|name|created_at)$"),
    sort_order: str = Query(default="asc", pattern="^(asc|desc)$"),
    user: Optional[dict] = Depends(optional_auth),
):
    """
    Browse the EcoCart sustainable product catalog.
    Public endpoint — enhanced when authenticated (personalized ranking coming soon).
    """
    result = await search_products(
        query=q,
        category=category,
        price_min=price_min,
        price_max=price_max,
        carbon_rating_max=carbon_rating_max,
        certifications=certifications,
        tags=tags,
        is_featured=is_featured,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return result


@router.get(
    "/recommendations",
    response_model=List[ProductResponse],
    summary="Get personalized product recommendations",
)
async def get_recommendations(
    limit: int = Query(default=20, ge=1, le=50),
    user: dict = Depends(get_current_active_user),
):
    """
    Personalized eco-friendly product recommendations based on your analysis history.
    Returns the most sustainable alternatives for categories you commonly purchase.
    """
    products = await get_personalized_recommendations(user_id=user["id"], limit=limit)
    return products


@router.get(
    "/alternatives/{analysis_id}",
    response_model=List[dict],
    summary="Get sustainable alternatives for an analysis",
)
async def get_analysis_alternatives(
    analysis_id: str,
    user: dict = Depends(get_current_active_user),
):
    """
    For a given receipt analysis, return eco-friendly alternatives
    grouped by the original high-carbon products found.
    """
    groups = await get_alternatives_for_analysis(analysis_id=analysis_id, user_id=user["id"])
    if not groups:
        return []
    return groups


@router.get(
    "/{product_id}",
    response_model=dict,
    summary="Get product details",
)
async def get_product(
    product_id: str,
    user: Optional[dict] = Depends(optional_auth),
):
    """Retrieve full details for a single sustainable product."""
    product = await get_product_by_id(product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return product


@router.post(
    "/{product_id}/click",
    response_model=ProductClickResponse,
    summary="Track product click and get redirect URL",
)
async def click_product(
    product_id: str,
    user: Optional[dict] = Depends(optional_auth),
):
    """
    Track a product click event and return the affiliate redirect URL.
    Call this before navigating to the product URL for analytics attribution.
    """
    user_id = user["id"] if user else None
    redirect_url = await track_product_click(product_id=product_id, user_id=user_id)

    if not redirect_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    await track_event(Events.PRODUCT_CLICKED, user_id=user_id, properties={"product_id": product_id})

    return {"redirect_url": redirect_url, "product_id": product_id}


@router.get(
    "/r/{tracking_code}",
    include_in_schema=False,
    summary="Affiliate redirect (tracking)",
)
async def redirect_to_affiliate(tracking_code: str):
    """
    Resolve a short tracking code and redirect to the affiliate product URL.
    Increments the click counter in the background.
    
    Note: This route is registered at /r/{code} on the root (not /products prefix).
    """
    destination = await resolve_redirect_code(tracking_code)
    if not destination:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Redirect link not found or expired.",
        )
    return RedirectResponse(url=destination, status_code=302)
