"""
Auth Middleware & FastAPI Dependencies
---------------------------------------
JWT verification, user extraction, and subscription tier gates.
Used as FastAPI dependency injection throughout the API routes.
"""

import logging
from typing import Optional

from bson import ObjectId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings
from app.database.mongodb import users_collection
from app.utils.security import get_token_payload, ACCESS_TOKEN_TYPE
from app.utils.helpers import serialize_doc

logger = logging.getLogger(__name__)

# ── Bearer token extractor ────────────────────────────────────────────────────
security = HTTPBearer(auto_error=False)


async def _get_user_from_token(token: str) -> Optional[dict]:
    """
    Decode JWT and fetch the corresponding user from MongoDB.

    Args:
        token: Raw JWT access token string.

    Returns:
        User document dict or None.
    """
    payload = get_token_payload(token, expected_type=ACCESS_TOKEN_TYPE)
    if not payload:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    try:
        user = await users_collection().find_one(
            {"_id": ObjectId(user_id), "is_deleted": {"$ne": True}}
        )
        return serialize_doc(user)
    except Exception as e:
        logger.error(f"Error fetching user from token: {e}")
        return None


# ── Core Auth Dependencies ────────────────────────────────────────────────────

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """
    Require a valid JWT access token. Used to protect authenticated endpoints.

    Returns:
        Authenticated user document dict.

    Raises:
        HTTPException 401 if token is missing, invalid, or expired.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await _get_user_from_token(credentials.credentials)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_current_active_user(user: dict = Depends(get_current_user)) -> dict:
    """Additionally verifies the user account is active (not banned/deleted)."""
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Please contact support.",
        )
    return user


async def get_verified_user(user: dict = Depends(get_current_active_user)) -> dict:
    """Require email verification in addition to active account."""
    if not user.get("is_verified", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address before accessing this feature.",
        )
    return user





async def require_admin(user: dict = Depends(get_current_active_user)) -> dict:
    """Gate admin-only endpoints."""
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return user


async def optional_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    """
    Optional authentication — returns user dict if token is valid, None otherwise.
    Used for public endpoints that benefit from knowing the user (e.g., personalization).
    """
    if not credentials:
        return None
    return await _get_user_from_token(credentials.credentials)
