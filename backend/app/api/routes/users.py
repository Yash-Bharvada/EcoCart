"""
User Profile Routes
-------------------
GET    /users/me           — Get current user profile
PATCH  /users/me           — Update profile fields
GET    /users/dashboard    — Comprehensive dashboard
GET    /users/badges       — User badges & progress
GET    /users/leaderboard  — Community leaderboard
POST   /users/preferences  — Update notification preferences
DELETE /users/me           — GDPR account deletion
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.middleware.auth_middleware import get_current_active_user, optional_auth
from app.models.schemas import (
    UserUpdateRequest, UserPreferencesUpdate, UserResponse,
    UserDashboard, LeaderboardResponse, MessageResponse,
)
from pydantic import BaseModel
from app.services.user_service import (
    get_user_by_id, update_user_stats_after_analysis,
    get_user_dashboard, get_leaderboard, delete_user_data,
)
from app.database.mongodb import users_collection
from app.utils.helpers import utcnow, serialize_doc
from bson import ObjectId

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/me", response_model=dict, summary="Get current user profile")
async def get_my_profile(user: dict = Depends(get_current_active_user)):
    """Return the fully enriched profile of the authenticated user."""
    return user


@router.patch("/me", response_model=dict, summary="Update user profile")
async def update_profile(
    body: UserUpdateRequest,
    user: dict = Depends(get_current_active_user),
):
    """
    Update your profile fields. Only provided fields are updated (partial update).
    Updatable: `full_name`, `profile_picture_url`, `preferences`.
    """
    updates: dict = {"updated_at": utcnow()}

    if body.full_name is not None:
        updates["full_name"] = body.full_name.strip()
    if body.profile_picture_url is not None:
        updates["profile_picture_url"] = body.profile_picture_url
    if body.preferences:
        # Deep merge preferences
        pref_updates = body.preferences.model_dump(exclude_none=True)
        for key, value in pref_updates.items():
            updates[f"preferences.{key}"] = value

    await users_collection().update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": updates},
    )
    updated_user = await users_collection().find_one({"_id": ObjectId(user["id"])})
    return serialize_doc(updated_user)


class OffsetRequest(BaseModel):
    carbon_kg: float

@router.post("/me/offset", response_model=dict, summary="Log a manual carbon offset")
async def log_manual_offset(
    body: OffsetRequest,
    user: dict = Depends(get_current_active_user),
):
    """Manually log a carbon offset contribution to increase the user's total offset."""
    if body.carbon_kg <= 0:
        raise HTTPException(status_code=400, detail="Offset amount must be positive.")
        
    await users_collection().update_one(
        {"_id": ObjectId(user["id"])},
        {"$inc": {"total_carbon_offset_kg": body.carbon_kg}, "$set": {"updated_at": utcnow()}}
    )
    
    updated_user = await users_collection().find_one({"_id": ObjectId(user["id"])})
    return {"message": f"Successfully logged {body.carbon_kg} kg offset", "total_offset": updated_user.get("total_carbon_offset_kg")}


@router.get("/dashboard", response_model=dict, summary="Get comprehensive user dashboard")
async def get_dashboard(user: dict = Depends(get_current_active_user)):
    """
    Returns aggregated statistics for the dashboard:
    - Total carbon footprint and offsets
    - Analysis trends (last 12 months)
    - Category breakdown for pie charts
    - Badge achievements
    - Improvement percentage vs first analysis
    
    Results are computed fresh each call (add Redis caching for production).
    """
    dashboard = await get_user_dashboard(user["id"])
    return dashboard


@router.get("/badges", response_model=list, summary="Get user badges and achievements")
async def get_user_badges(user: dict = Depends(get_current_active_user)):
    """Return the user's earned badges and all available badges with unlock progress."""
    # Get fresh user data to include latest badges
    fresh_user = await users_collection().find_one({"_id": ObjectId(user["id"])})
    badges = fresh_user.get("badges", []) if fresh_user else []

    # Include all possible badge definitions for progress display
    from app.services.user_service import BADGE_DEFINITIONS
    all_badges = [
        {
            "badge_id": b["badge_id"],
            "name": b["name"],
            "description": b["description"],
            "icon": b["icon"],
            "category": b["category"],
            "earned": any(ub["badge_id"] == b["badge_id"] for ub in badges),
            "earned_at": next(
                (ub["earned_at"] for ub in badges if ub["badge_id"] == b["badge_id"]), None
            ),
        }
        for b in BADGE_DEFINITIONS
    ]
    return all_badges


@router.get("/leaderboard", response_model=dict, summary="Get community leaderboard")
async def get_leaderboard_route(
    period: str = Query(default="monthly", pattern="^(weekly|monthly|all_time)$"),
    metric: str = Query(default="eco_score", pattern="^(eco_score|carbon_offset|analyses)$"),
    limit: int = Query(default=50, ge=1, le=100),
    user: Optional[dict] = Depends(optional_auth),
):
    """
    Return the leaderboard for users who opt-in to public ranking.
    
    **Periods**: weekly, monthly, all_time  
    **Metrics**: eco_score, carbon_offset, analyses
    """
    entries = await get_leaderboard(period=period, metric=metric, limit=limit)

    # Mark current user's entry if authenticated
    current_user_rank = None
    if user:
        for entry in entries:
            if entry["user_id"] == user["id"]:
                entry["is_current_user"] = True
                current_user_rank = entry["rank"]

    return {
        "period": period,
        "metric": metric,
        "entries": entries,
        "current_user_rank": current_user_rank,
    }


@router.post("/preferences", response_model=dict, summary="Update notification preferences")
async def update_preferences(
    body: UserPreferencesUpdate,
    user: dict = Depends(get_current_active_user),
):
    """
    Update notification and display preferences.
    All fields are optional — only provided fields are updated.
    """
    pref_updates = body.model_dump(exclude_none=True)
    if not pref_updates:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No preferences provided.")

    set_ops = {f"preferences.{k}": v for k, v in pref_updates.items()}
    set_ops["updated_at"] = utcnow()

    await users_collection().update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": set_ops},
    )
    updated_user = await users_collection().find_one({"_id": ObjectId(user["id"])})
    return {"preferences": updated_user.get("preferences", {}), "message": "Preferences updated successfully."}


@router.delete("/me", response_model=MessageResponse, summary="Delete account (GDPR)")
async def delete_account(user: dict = Depends(get_current_active_user)):
    """
    ⚠️ **Permanent account deletion** in compliance with GDPR Right to Erasure.
    
    This will:
    - Soft-delete your account (PII anonymized)
    - Delete all your analyses
    - Anonymize your transactions (kept for accounting compliance)
    - Cancel any active subscriptions via Stripe
    - This action **cannot be undone**
    """
    # Cancel Stripe subscription first
    sub_id = user.get("stripe_subscription_id")
    if sub_id:
        try:
            import stripe
            stripe.Subscription.delete(sub_id)
        except Exception as e:
            logger.warning(f"Subscription cancel failed during deletion: {e}")

    success = await delete_user_data(user["id"])
    if not success:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            detail="Account deletion failed. Please contact support.")

    return {"message": "Your account has been successfully deleted. We're sorry to see you go.", "success": True}
