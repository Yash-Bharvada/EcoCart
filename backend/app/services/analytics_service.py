"""
Analytics Service
-----------------
Track arbitrary events and provide user/platform-level metrics.
"""

import logging
from datetime import timedelta
from typing import Dict, Optional

from app.database.mongodb import analytics_collection, users_collection, analyses_collection, transactions_collection
from app.utils.helpers import utcnow, serialize_doc

logger = logging.getLogger(__name__)

# Standard event names
class Events:
    ANALYSIS_COMPLETED = "analysis_completed"
    PRODUCT_CLICKED = "product_clicked"
    PRODUCT_PURCHASED = "product_purchased"
    SUBSCRIPTION_STARTED = "subscription_started"
    SUBSCRIPTION_CANCELED = "subscription_canceled"
    CARBON_OFFSET_PURCHASED = "carbon_offset_purchased"
    USER_REGISTERED = "user_registered"
    USER_LOGGED_IN = "user_logged_in"
    FEATURE_USED = "feature_used"
    PAGE_VIEWED = "page_viewed"


async def track_event(
    event_name: str,
    user_id: Optional[str] = None,
    properties: Optional[Dict] = None,
) -> None:
    """
    Store an analytics event in MongoDB.

    Args:
        event_name: Type of event (use Events constants).
        user_id: Optional user ObjectId string.
        properties: Additional event properties dict.
    """
    try:
        event_doc = {
            "event": event_name,
            "user_id": user_id,
            "properties": properties or {},
            "created_at": utcnow(),
        }
        await analytics_collection().insert_one(event_doc)
    except Exception as e:
        # Analytics failures should NEVER break user-facing requests
        logger.warning(f"Failed to track event '{event_name}': {e}")


async def get_user_analytics(user_id: str, days: int = 30) -> Dict:
    """
    Return user-specific analytics for the last N days.
    Includes event counts, carbon trend, and engagement metrics.
    """
    since = utcnow() - timedelta(days=days)

    pipeline = [
        {"$match": {
            "user_id": user_id,
            "created_at": {"$gte": since},
        }},
        {"$group": {
            "_id": "$event",
            "count": {"$sum": 1},
        }},
    ]
    event_docs = await analytics_collection().aggregate(pipeline).to_list(50)
    event_counts = {d["_id"]: d["count"] for d in event_docs}

    return {
        "period_days": days,
        "event_counts": event_counts,
        "total_events": sum(event_counts.values()),
    }


async def get_platform_analytics(admin_user_id: str) -> Dict:
    """
    Platform-wide metrics for admin users.

    Args:
        admin_user_id: Must be a user with role="admin".

    Returns:
        Platform statistics dict.
    """
    # Verify admin role
    from bson import ObjectId
    admin = await users_collection().find_one({"_id": ObjectId(admin_user_id), "role": "admin"})
    if not admin:
        raise PermissionError("Admin access required")

    now = utcnow()
    day_ago = now - timedelta(days=1)
    month_ago = now - timedelta(days=30)

    total_users = await users_collection().count_documents({"is_deleted": {"$ne": True}})
    active_today = await users_collection().count_documents({"last_login": {"$gte": day_ago}})
    active_month = await users_collection().count_documents({"last_login": {"$gte": month_ago}})
    total_analyses = await analyses_collection().count_documents({"is_deleted": {"$ne": True}})

    # Revenue (completed transactions this month)
    revenue_pipeline = [
        {"$match": {"status": "completed", "created_at": {"$gte": month_ago}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
    ]
    revenue_docs = await transactions_collection().aggregate(revenue_pipeline).to_list(1)
    mrr = revenue_docs[0]["total"] if revenue_docs else 0
    transaction_count = revenue_docs[0]["count"] if revenue_docs else 0

    return {
        "total_users": total_users,
        "dau": active_today,
        "mau": active_month,
        "total_analyses": total_analyses,
        "mrr_usd": round(mrr, 2),
        "transactions_this_month": transaction_count,
        "generated_at": now.isoformat(),
    }
