"""
Health Check Routes
-------------------
GET /api/v1/health — checks MongoDB, Redis, and overall API status.
"""

import time
from typing import Dict

from fastapi import APIRouter

from app.config import settings
from app.database.mongodb import ping_db
from app.database.redis_client import ping_redis

router = APIRouter()

# Track startup time for uptime calculation
_start_time = time.time()


@router.get(
    "/health",
    summary="API Health Check",
    description="Returns the health status of the API and all dependent services.",
)
async def health_check() -> Dict:
    """
    Check the health of the API and its dependencies.

    Returns status for:
    - MongoDB connection
    - Redis connection
    - Overall API status
    """
    mongo_ok = await ping_db()
    redis_ok = await ping_redis()
    uptime = time.time() - _start_time

    overall = "ok" if (mongo_ok and redis_ok) else "degraded"
    if not mongo_ok:
        overall = "down"  # MongoDB is critical

    return {
        "status": overall,
        "version": settings.api_version,
        "environment": settings.environment,
        "uptime_seconds": round(uptime, 2),
        "services": {
            "mongodb": {
                "status": "ok" if mongo_ok else "down",
                "message": "Connected" if mongo_ok else "Connection failed",
            },
            "redis": {
                "status": "ok" if redis_ok else "degraded",
                "message": "Connected" if redis_ok else "Not available (caching disabled)",
            },
            "gemini": {
                "status": "ok" if settings.gemini_api_key else "not_configured",
                "message": "API key configured" if settings.gemini_api_key else "GEMINI_API_KEY not set",
            },
            "stripe": {
                "status": "ok" if settings.stripe_secret_key else "not_configured",
                "message": "Configured" if settings.stripe_secret_key else "STRIPE_SECRET_KEY not set",
            },
        },
    }
