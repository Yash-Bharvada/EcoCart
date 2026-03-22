"""
Receipt Analysis Routes
-----------------------
POST   /analyze            — Upload & analyze a receipt image
GET    /analyze/history    — Paginated analysis history
GET    /analyze/stats      — Aggregate analytics stats
GET    /analyze/{id}       — Get single analysis by ID
DELETE /analyze/{id}       — Soft-delete an analysis
"""

import logging
from datetime import datetime, timedelta
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status, BackgroundTasks

from app.config import settings
from app.database.mongodb import analyses_collection, users_collection
from app.middleware.auth_middleware import get_current_active_user
from app.models.schemas import AnalysisResponse, AnalysisListResponse, AnalysisStatsResponse, MessageResponse
from app.services import gemini_service, analytics_service
from app.services.user_service import update_user_stats_after_analysis
from app.utils.helpers import serialize_doc, build_pagination_meta, paginate, utcnow
from app.utils.validators import validate_image_content_type

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/",
    response_model=AnalysisResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Analyze a shopping receipt image",
)
async def analyze_receipt(
    file: UploadFile = File(..., description="Receipt image (JPEG, PNG, WebP, GIF)"),
    user: dict = Depends(get_current_active_user),
    bg_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Upload a receipt/bill image and receive a detailed eco-analysis.

    **Free tier**: 5 analyses per month.  
    **Premium/Pro**: Unlimited analyses.

    The image is processed by Google Gemini AI which:
    - Identifies all products
    - Estimates carbon footprint per item
    - Generates an eco score (0-100)
    - Suggests sustainable alternatives
    """
    user_id = user["id"]
    is_premium = user.get("subscription_tier") in ("premium", "pro")

    # ── Monthly quota check (free tier) ────────────────────────────────────────
    if not is_premium:
        monthly_count = user.get("analysis_count_this_month", 0)
        if monthly_count >= settings.monthly_analysis_limit_free:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"Free tier limit reached ({settings.monthly_analysis_limit_free} analyses/month). "
                    "Upgrade to Premium for unlimited analyses."
                ),
            )

    # ── File validation ────────────────────────────────────────────────────────
    is_valid_ct, err_msg = validate_image_content_type(file.content_type)
    if not is_valid_ct:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=err_msg)

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty.")

    if len(image_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File exceeds 20MB limit.")

    # ── Gemini Analysis ────────────────────────────────────────────────────────
    try:
        result = await gemini_service.analyze_receipt(
            image_bytes=image_bytes,
            user_id=user_id,
            is_premium=is_premium,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        logger.error(f"Gemini analysis failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI analysis service is temporarily unavailable. Please try again.",
        )

    # ── Save to MongoDB ────────────────────────────────────────────────────────
    analysis_doc = {
        "user_id": user_id,
        "is_valid_receipt": result.get("is_valid_receipt", True),
        "receipt_image_url": result.get("receipt_image_url"),
        "receipt_image_thumbnail": result.get("receipt_image_thumbnail"),
        "products": result.get("products", []),
        "total_carbon_kg": result.get("total_carbon_kg", 0.0),
        "eco_score": result.get("eco_score", 0),
        "score_breakdown": result.get("score_breakdown", {}),
        "suggestions": result.get("suggestions", []),
        "summary": result.get("summary", ""),
        "top_contributors": result.get("top_contributors", []),
        "comparison": result.get("comparison"),
        "processing_time_ms": result.get("processing_time_ms", 0),
        "gemini_model_version": result.get("gemini_model_version", ""),
        "error_message": result.get("error_message"),
        "is_deleted": False,
        "created_at": utcnow(),
        "metadata": {"file_name": file.filename, "content_type": file.content_type},
    }

    insert_result = await analyses_collection().insert_one(analysis_doc)
    analysis_id = str(insert_result.inserted_id)

    # ── Update user stats ──────────────────────────────────────────────────────
    if result.get("is_valid_receipt", True):
        await update_user_stats_after_analysis(
            user_id=user_id,
            eco_score=result.get("eco_score", 0),
            carbon_kg=result.get("total_carbon_kg", 0.0),
        )

    # ── Track analytics event ──────────────────────────────────────────────────
    await analytics_service.track_event(
        analytics_service.Events.ANALYSIS_COMPLETED,
        user_id=user_id,
        properties={
            "eco_score": result.get("eco_score"),
            "total_carbon_kg": result.get("total_carbon_kg"),
            "is_valid": result.get("is_valid_receipt"),
            "model": result.get("gemini_model_version"),
        },
    )

    # ── Trigger Email asynchronously ───────────────────────────────────────────
    if result.get("is_valid_receipt", True):
        from app.services.email_service import send_analysis_complete_email
        bg_tasks.add_task(
            send_analysis_complete_email,
            user_email=user["email"],
            user_name=user["full_name"],
            eco_score=result.get("eco_score", 0),
            total_carbon_kg=result.get("total_carbon_kg", 0.0),
            top_contributors=result.get("top_contributors", []),
            analysis_url=f"{settings.frontend_url}/history"
        )

    return {**analysis_doc, "id": analysis_id}


@router.get(
    "/history",
    response_model=AnalysisListResponse,
    summary="Get paginated analysis history",
)
async def get_analysis_history(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    eco_score_min: Optional[int] = Query(default=None, ge=0, le=100),
    eco_score_max: Optional[int] = Query(default=None, ge=0, le=100),
    sort_by: str = Query(default="created_at", pattern="^(created_at|eco_score|total_carbon_kg)$"),
    sort_order: str = Query(default="desc", pattern="^(asc|desc)$"),
    user: dict = Depends(get_current_active_user),
):
    """Return paginated list of the user's receipt analyses."""
    user_id = user["id"]
    query = {"user_id": user_id, "is_deleted": {"$ne": True}}

    if eco_score_min is not None:
        query.setdefault("eco_score", {})["$gte"] = eco_score_min
    if eco_score_max is not None:
        query.setdefault("eco_score", {})["$lte"] = eco_score_max

    sort_dir = -1 if sort_order == "desc" else 1
    skip, lim = paginate(page, limit)
    total = await analyses_collection().count_documents(query)
    cursor = analyses_collection().find(
        query,
        {"_id": 1, "receipt_image_thumbnail": 1, "total_carbon_kg": 1,
         "eco_score": 1, "products": 1, "top_contributors": 1,
         "created_at": 1, "is_valid_receipt": 1}
    ).sort(sort_by, sort_dir).skip(skip).limit(lim)
    docs = await cursor.to_list(lim)

    analyses = []
    for doc in docs:
        s = serialize_doc(doc)
        if s:
            s["product_count"] = len(s.get("products", []))
            s.pop("products", None)
            analyses.append(s)

    return {
        "analyses": analyses,
        "pagination": build_pagination_meta(page, limit, total),
    }


@router.get(
    "/stats",
    response_model=AnalysisStatsResponse,
    summary="Get user's analysis aggregate statistics",
)
async def get_analysis_stats(user: dict = Depends(get_current_active_user)):
    """Return aggregate analysis stats: total carbon, eco score trend, category breakdown."""
    from app.services.user_service import get_user_dashboard
    user_id = user["id"]

    dashboard = await get_user_dashboard(user_id)
    total = await analyses_collection().count_documents({"user_id": user_id, "is_deleted": {"$ne": True}})

    return {
        "total_analyses": total,
        "average_eco_score": dashboard.get("average_eco_score", 0),
        "total_carbon_kg": dashboard.get("total_carbon_footprint_kg", 0),
        "monthly_trend": dashboard.get("monthly_trend", []),
        "category_breakdown": dashboard.get("category_breakdown", []),
        "improvement_percent": dashboard.get("improvement_percent"),
    }


@router.get(
    "/{analysis_id}",
    response_model=AnalysisResponse,
    summary="Get a specific analysis by ID",
)
async def get_analysis(analysis_id: str, user: dict = Depends(get_current_active_user)):
    """Retrieve the full analysis result for a specific receipt."""
    try:
        doc = await analyses_collection().find_one(
            {"_id": ObjectId(analysis_id), "user_id": user["id"], "is_deleted": {"$ne": True}}
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid analysis ID.")

    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")

    result = serialize_doc(doc)
    return result


@router.delete(
    "/{analysis_id}",
    response_model=MessageResponse,
    summary="Delete an analysis (soft delete)",
)
async def delete_analysis(analysis_id: str, user: dict = Depends(get_current_active_user)):
    """Soft-delete an analysis (marks as deleted, does not remove from database)."""
    try:
        result = await analyses_collection().update_one(
            {"_id": ObjectId(analysis_id), "user_id": user["id"], "is_deleted": {"$ne": True}},
            {"$set": {"is_deleted": True, "deleted_at": utcnow()}},
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid analysis ID.")

    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found.")

    return {"message": "Analysis deleted successfully.", "success": True}
