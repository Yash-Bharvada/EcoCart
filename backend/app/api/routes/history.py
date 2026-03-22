"""
Analysis History Routes
-----------------------
Dedicated history endpoints with advanced filtering and export capabilities.
These mirror/extend the analyze routes for the history dashboard.
"""

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, HTTPException, status

from app.middleware.auth_middleware import get_current_active_user
from app.database.mongodb import analyses_collection
from app.utils.helpers import serialize_doc, build_pagination_meta, paginate, utcnow

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/",
    response_model=dict,
    summary="Get detailed analysis history with advanced filters",
)
async def get_history(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=50),
    eco_score_min: Optional[int] = Query(default=None, ge=0, le=100),
    eco_score_max: Optional[int] = Query(default=None, ge=0, le=100),
    carbon_min: Optional[float] = Query(default=None, ge=0),
    carbon_max: Optional[float] = Query(default=None, ge=0),
    date_from: Optional[datetime] = Query(default=None),
    date_to: Optional[datetime] = Query(default=None),
    sort_by: str = Query(default="created_at", pattern="^(created_at|eco_score|total_carbon_kg)$"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    user: dict = Depends(get_current_active_user),
):
    """
    Advanced history view with date range and carbon filters.
    Useful for building charts or exporting data.
    """
    query = {"user_id": user["id"], "is_deleted": {"$ne": True}}

    if eco_score_min is not None:
        query.setdefault("eco_score", {})["$gte"] = eco_score_min
    if eco_score_max is not None:
        query.setdefault("eco_score", {})["$lte"] = eco_score_max
    if carbon_min is not None:
        query.setdefault("total_carbon_kg", {})["$gte"] = carbon_min
    if carbon_max is not None:
        query.setdefault("total_carbon_kg", {})["$lte"] = carbon_max

    created_at_filter = {}
    if date_from:
        created_at_filter["$gte"] = date_from
    if date_to:
        created_at_filter["$lte"] = date_to
    if created_at_filter:
        query["created_at"] = created_at_filter

    sort_dir = -1 if sort_order == "desc" else 1
    skip, lim = paginate(page, limit)
    total = await analyses_collection().count_documents(query)

    cursor = analyses_collection().find(query).sort(sort_by, sort_dir).skip(skip).limit(lim)
    docs = await cursor.to_list(lim)

    return {
        "analyses": [serialize_doc(d) for d in docs if d],
        "pagination": build_pagination_meta(page, limit, total),
    }


@router.get(
    "/export",
    response_model=dict,
    summary="Export analysis history as JSON (GDPR data export)",
)
async def export_history(user: dict = Depends(get_current_active_user)):
    """
    Export all of the user's analyses as JSON (GDPR data portability).
    Returns up to 1000 most recent analyses.
    """
    cursor = analyses_collection().find(
        {"user_id": user["id"], "is_deleted": {"$ne": True}}
    ).sort("created_at", -1).limit(1000)
    docs = await cursor.to_list(1000)
    serialized = [serialize_doc(d) for d in docs if d]

    return {
        "exported_at": utcnow().isoformat(),
        "user_id": user["id"],
        "total_analyses": len(serialized),
        "analyses": serialized,
    }
