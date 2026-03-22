"""
User Service
------------
Business logic for user management, dashboard aggregation,
badge system, leaderboard, and GDPR data deletion.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from bson import ObjectId

from app.database.mongodb import (
    users_collection, analyses_collection,
    transactions_collection, carbon_offsets_collection,
)
from app.utils.helpers import utcnow, serialize_doc, build_pagination_meta, paginate, format_month_key

logger = logging.getLogger(__name__)

# ── Badge Definitions ──────────────────────────────────────────────────────────
BADGE_DEFINITIONS = [
    {
        "badge_id": "first_steps",
        "name": "First Steps",
        "description": "Completed your first receipt analysis",
        "icon": "🌱",
        "category": "milestones",
        "condition": lambda stats: stats["analysis_count"] >= 1,
    },
    {
        "badge_id": "green_beginner",
        "name": "Green Beginner",
        "description": "Completed 5 receipt analyses",
        "icon": "🌿",
        "category": "milestones",
        "condition": lambda stats: stats["analysis_count"] >= 5,
    },
    {
        "badge_id": "eco_warrior",
        "name": "Eco Warrior",
        "description": "Achieved an eco score above 80",
        "icon": "♻️",
        "category": "sustainability",
        "condition": lambda stats: stats["max_eco_score"] >= 80,
    },
    {
        "badge_id": "carbon_neutral",
        "name": "Carbon Neutral",
        "description": "Your carbon offsets exceed your total footprint",
        "icon": "🌍",
        "category": "sustainability",
        "condition": lambda stats: stats["total_carbon_offset_kg"] >= stats["total_carbon_footprint_kg"] > 0,
    },
    {
        "badge_id": "dedicated_analyst",
        "name": "Dedicated Analyst",
        "description": "Completed 25 receipt analyses",
        "icon": "📊",
        "category": "milestones",
        "condition": lambda stats: stats["analysis_count"] >= 25,
    },
    {
        "badge_id": "offset_champion",
        "name": "Offset Champion",
        "description": "Purchased more than 100 kg of carbon offsets",
        "icon": "🏆",
        "category": "sustainability",
        "condition": lambda stats: stats["total_carbon_offset_kg"] >= 100,
    },
    {
        "badge_id": "top_scorer",
        "name": "Top Scorer",
        "description": "Maintained an average eco score above 75",
        "icon": "⭐",
        "category": "community",
        "condition": lambda stats: stats["eco_score_average"] >= 75 and stats["analysis_count"] >= 5,
    },
]


async def get_user_by_id(user_id: str) -> Optional[Dict]:
    """Fetch a user document by MongoDB ObjectId string."""
    try:
        user = await users_collection().find_one(
            {"_id": ObjectId(user_id), "is_deleted": {"$ne": True}}
        )
        return serialize_doc(user)
    except Exception as e:
        logger.error(f"Error fetching user {user_id}: {e}")
        return None


async def get_user_by_email(email: str) -> Optional[Dict]:
    """Fetch a user document by email address (case-insensitive)."""
    user = await users_collection().find_one(
        {"email": email.lower(), "is_deleted": {"$ne": True}}
    )
    return serialize_doc(user)


async def update_user_stats_after_analysis(user_id: str, eco_score: int, carbon_kg: float) -> None:
    """
    Update user aggregate stats after a new analysis is completed.
    Recalculates average eco score and total carbon footprint.
    """
    try:
        user = await users_collection().find_one({"_id": ObjectId(user_id)})
        if not user:
            return

        old_count = user.get("analysis_count", 0)
        old_avg = user.get("eco_score_average", 0.0)
        new_count = old_count + 1

        # Recalculate running average eco score
        new_avg = ((old_avg * old_count) + eco_score) / new_count

        # Determine user level based on total analyses and score
        new_level = _calculate_level(new_count, new_avg)

        await users_collection().update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "analysis_count": new_count,
                "eco_score_average": round(new_avg, 2),
                "level": new_level,
                "updated_at": utcnow(),
            },
            "$inc": {
                "total_carbon_footprint_kg": carbon_kg,
                "analysis_count_this_month": 1,
                "points": 10,  # 10 points per analysis
            }},
        )
    except Exception as e:
        logger.error(f"Error updating user stats: {e}")


def _calculate_level(analysis_count: int, avg_eco_score: float) -> str:
    """Calculate user level based on analyses and eco score."""
    if analysis_count >= 50 and avg_eco_score >= 75:
        return "platinum"
    elif analysis_count >= 25 and avg_eco_score >= 65:
        return "gold"
    elif analysis_count >= 10 and avg_eco_score >= 55:
        return "silver"
    return "bronze"


async def get_user_dashboard(user_id: str) -> Dict:
    """
    Build a comprehensive dashboard for the user.
    Aggregates analyses, carbon totals, trends, and badge progress.
    """
    user = await users_collection().find_one({"_id": ObjectId(user_id)})
    if not user:
        return {}

    # Monthly trend (last 12 months)
    twelve_months_ago = utcnow() - timedelta(days=365)
    monthly_pipeline = [
        {"$match": {
            "user_id": user_id,
            "is_deleted": {"$ne": True},
            "created_at": {"$gte": twelve_months_ago},
        }},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m", "date": "$created_at"}},
            "total_carbon_kg": {"$sum": "$total_carbon_kg"},
            "average_eco_score": {"$avg": "$eco_score"},
            "analysis_count": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
    ]
    monthly_docs = await analyses_collection().aggregate(monthly_pipeline).to_list(12)
    monthly_trend = [
        {
            "month": d["_id"],
            "total_carbon_kg": round(d["total_carbon_kg"], 3),
            "average_eco_score": round(d["average_eco_score"], 1),
            "analysis_count": d["analysis_count"],
        }
        for d in monthly_docs
    ]

    # Category breakdown
    category_pipeline = [
        {"$match": {"user_id": user_id, "is_deleted": {"$ne": True}}},
        {"$unwind": "$products"},
        {"$group": {
            "_id": "$products.category",
            "total_carbon_kg": {"$sum": "$products.estimated_carbon_kg"},
            "count": {"$sum": 1},
        }},
        {"$sort": {"total_carbon_kg": -1}},
        {"$limit": 10},
    ]
    category_docs = await analyses_collection().aggregate(category_pipeline).to_list(10)
    total_cat_carbon = sum(d["total_carbon_kg"] for d in category_docs) or 1
    category_breakdown = [
        {
            "category": d["_id"] or "Unknown",
            "total_carbon_kg": round(d["total_carbon_kg"], 3),
            "percentage": round(d["total_carbon_kg"] / total_cat_carbon * 100, 1),
            "analysis_count": d["count"],
        }
        for d in category_docs
    ]

    # First vs latest improvement
    first = await analyses_collection().find_one(
        {"user_id": user_id, "is_deleted": {"$ne": True}},
        sort=[("created_at", 1)]
    )
    latest = await analyses_collection().find_one(
        {"user_id": user_id, "is_deleted": {"$ne": True}},
        sort=[("created_at", -1)]
    )
    improvement_pct = None
    if first and latest and first["_id"] != latest["_id"]:
        if first["eco_score"] > 0:
            improvement_pct = round(
                ((latest["eco_score"] - first["eco_score"]) / first["eco_score"]) * 100, 1
            )

    # Calculate badges
    stats = {
        "analysis_count": user.get("analysis_count", 0),
        "eco_score_average": user.get("eco_score_average", 0),
        "total_carbon_footprint_kg": user.get("total_carbon_footprint_kg", 0),
        "total_carbon_offset_kg": user.get("total_carbon_offset_kg", 0),
        "max_eco_score": latest["eco_score"] if latest else 0,
    }
    badges = _evaluate_badges(stats)
    await _update_user_badges(user_id, badges)

    total_footprint = user.get("total_carbon_footprint_kg", 0)
    total_offset = user.get("total_carbon_offset_kg", 0)
    analyses_this_month = user.get("analysis_count_this_month", 0)

    return {
        "total_carbon_footprint_kg": round(total_footprint, 3),
        "total_carbon_offset_kg": round(total_offset, 3),
        "net_carbon_kg": round(total_footprint - total_offset, 3),
        "analysis_count": user.get("analysis_count", 0),
        "average_eco_score": round(user.get("eco_score_average", 0), 1),
        "analyses_this_month": analyses_this_month,
        "monthly_trend": monthly_trend,
        "category_breakdown": category_breakdown,
        "improvement_percent": improvement_pct,
        "badges": badges,
        "co2_vs_average_percent": None,  # Populated by analytics service
    }


def _evaluate_badges(stats: Dict) -> List[Dict]:
    """Evaluate which badges the user has earned."""
    earned = []
    for badge_def in BADGE_DEFINITIONS:
        try:
            if badge_def["condition"](stats):
                earned.append({
                    "badge_id": badge_def["badge_id"],
                    "name": badge_def["name"],
                    "description": badge_def["description"],
                    "icon": badge_def["icon"],
                    "category": badge_def["category"],
                    "earned_at": utcnow(),
                })
        except Exception:
            pass
    return earned


async def _update_user_badges(user_id: str, new_badges: List[Dict]) -> None:
    """Update user's badge list — add newly earned badges only."""
    user = await users_collection().find_one({"_id": ObjectId(user_id)})
    if not user:
        return

    existing_ids = {b["badge_id"] for b in user.get("badges", [])}
    to_add = [b for b in new_badges if b["badge_id"] not in existing_ids]

    if to_add:
        await users_collection().update_one(
            {"_id": ObjectId(user_id)},
            {"$push": {"badges": {"$each": to_add}}},
        )


async def get_leaderboard(period: str = "monthly", metric: str = "eco_score", limit: int = 50) -> List[Dict]:
    """
    Fetch a leaderboard for users who consent to showing their rank.

    Args:
        period: "weekly" | "monthly" | "all_time"
        metric: "eco_score" | "carbon_offset" | "analyses"
        limit: Number of entries to return.

    Returns:
        List of leaderboard entry dicts.
    """
    # Build date filter
    now = utcnow()
    date_filter = {}
    if period == "weekly":
        date_filter = {"created_at": {"$gte": now - timedelta(weeks=1)}}
    elif period == "monthly":
        date_filter = {"created_at": {"$gte": now - timedelta(days=30)}}

    sort_field = {
        "eco_score": "eco_score_average",
        "carbon_offset": "total_carbon_offset_kg",
        "analyses": "analysis_count",
    }.get(metric, "eco_score_average")

    cursor = users_collection().find(
        {
            "is_active": True,
            "is_deleted": {"$ne": True},
            "preferences.show_on_leaderboard": True,
            "analysis_count": {"$gte": 1},
        },
        {
            "_id": 1, "full_name": 1, "profile_picture_url": 1,
            "eco_score_average": 1, "total_carbon_offset_kg": 1, "level": 1,
        }
    ).sort(sort_field, -1).limit(limit)

    users = await cursor.to_list(limit)
    return [
        {
            "rank": i + 1,
            "user_id": str(u["_id"]),
            "display_name": u.get("full_name", "Anonymous"),
            "profile_picture_url": u.get("profile_picture_url"),
            "eco_score_average": round(u.get("eco_score_average", 0), 1),
            "total_carbon_offset_kg": round(u.get("total_carbon_offset_kg", 0), 1),
            "level": u.get("level", "bronze"),
        }
        for i, u in enumerate(users)
    ]


async def delete_user_data(user_id: str) -> bool:
    """
    GDPR-compliant full account deletion.
    - Deletes analyses and associated images
    - Anonymizes transactions (keep for accounting)
    - Soft-deletes the user record
    """
    oid = ObjectId(user_id)

    # Soft-delete analyses
    await analyses_collection().update_many(
        {"user_id": user_id},
        {"$set": {"is_deleted": True, "deleted_at": utcnow()}},
    )

    # Anonymize transactions (keep for accounting)
    await transactions_collection().update_many(
        {"user_id": user_id},
        {"$unset": {"user_id": ""}},
    )

    # Soft-delete user (anonymize PII)
    await users_collection().update_one(
        {"_id": oid},
        {"$set": {
            "is_deleted": True,
            "email": f"deleted_{user_id}@ecocart.deleted",
            "full_name": "Deleted User",
            "hashed_password": "",
            "profile_picture_url": None,
            "stripe_customer_id": None,
            "data_deletion_requested_at": utcnow(),
            "updated_at": utcnow(),
        }},
    )
    logger.info(f"User data deleted (GDPR): user_id={user_id}")
    return True
