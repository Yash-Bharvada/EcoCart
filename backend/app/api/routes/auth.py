"""
Authentication Routes
---------------------
POST /auth/register       — Create account, return JWT tokens
POST /auth/login          — Login, return JWT tokens
POST /auth/refresh        — Refresh access token
POST /auth/logout         — Invalidate refresh token
POST /auth/verify-email   — Verify email address
POST /auth/forgot-password — Send reset email
POST /auth/reset-password  — Reset password with token
GET  /auth/me             — Return current user
"""

import logging
from datetime import datetime, timedelta, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.config import settings
from app.database.mongodb import users_collection, sessions_collection
from app.middleware.auth_middleware import get_current_active_user
from app.models.schemas import (
    RegisterRequest, LoginRequest, TokenResponse, RefreshTokenRequest,
    PasswordResetRequest, PasswordResetConfirm, EmailVerificationRequest,
    MessageResponse, UserResponse,
)
from pydantic import BaseModel
from app.services import email_service, user_service
from app.utils.helpers import serialize_doc, utcnow
from app.utils.security import (
    hash_password, verify_password, create_token_pair,
    create_access_token, get_token_payload,
    generate_verification_token, generate_password_reset_token,
    REFRESH_TOKEN_TYPE,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
)
async def register(body: RegisterRequest):
    """
    Create a new user account.

    - Validates email uniqueness
    - Hashes password with bcrypt
    - Creates Stripe customer
    - Sends verification email
    - Returns JWT access + refresh token pair
    """
    email = body.email.lower()

    # Check for existing user
    existing = await users_collection().find_one({"email": email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    verification_token = generate_verification_token()
    verification_expires = utcnow() + timedelta(hours=settings.email_verification_expire_hours)

    user_doc = {
        "email": email,
        "hashed_password": hash_password(body.password),
        "full_name": body.full_name.strip(),
        "total_carbon_footprint_kg": 0.0,
        "total_carbon_offset_kg": 0.0,
        "eco_score_average": 0.0,
        "analysis_count": 0,
        "analysis_count_this_month": 0,
        "premium_features": {},
        "badges": [],
        "points": 0,
        "level": "bronze",
        "preferences": {},
        "is_active": True,
        "is_verified": False,
        "verification_token": verification_token,
        "verification_token_expires": verification_expires,
        "role": "user",
        "created_at": utcnow(),
        "updated_at": utcnow(),
        "failed_login_attempts": 0,
        "is_deleted": False,
    }

    result = await users_collection().insert_one(user_doc)
    user_id = str(result.inserted_id)



    # Send verification email (non-blocking failure)
    verify_link = f"{settings.frontend_url}/verify-email?token={verification_token}"
    await email_service.send_verification_email(email, verify_link)
    await email_service.send_welcome_email(email, body.full_name)

    tokens = create_token_pair(
        user_id=user_id,
        email=email,
        role="user",
        is_verified=False,
    )

    # Store refresh token in sessions
    await sessions_collection().insert_one({
        "user_id": user_id,
        "refresh_token": tokens["refresh_token"],
        "created_at": utcnow(),
        "expires_at": utcnow() + timedelta(days=settings.refresh_token_expire_days),
        "is_active": True,
    })

    logger.info(f"New user registered: {email} (id={user_id})")
    return tokens


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login with email and password",
)
async def login(body: LoginRequest):
    """Authenticate and return JWT token pair."""
    email = body.email.lower()
    user = await users_collection().find_one({"email": email, "is_deleted": {"$ne": True}})

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    # Account lockout check
    if user.get("locked_until") and user["locked_until"] > utcnow():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account temporarily locked due to too many failed attempts. Try again later.",
        )

    if not verify_password(body.password, user.get("hashed_password", "")):
        await users_collection().update_one(
            {"_id": user["_id"]},
            {
                "$inc": {"failed_login_attempts": 1},
                "$set": {"updated_at": utcnow()},
            },
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    if not user.get("is_active", True):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is suspended.")

    user_id = str(user["_id"])
    tokens = create_token_pair(
        user_id=user_id,
        email=email,
        role=user.get("role", "user"),
        is_verified=user.get("is_verified", False),
    )

    await users_collection().update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": utcnow(), "failed_login_attempts": 0, "updated_at": utcnow()}},
    )
    await sessions_collection().insert_one({
        "user_id": user_id,
        "refresh_token": tokens["refresh_token"],
        "created_at": utcnow(),
        "expires_at": utcnow() + timedelta(days=settings.refresh_token_expire_days),
        "is_active": True,
    })
    return tokens


class GoogleAuthRequest(BaseModel):
    token: str

@router.post("/google", response_model=TokenResponse, summary="Login with Google")
async def google_login(body: GoogleAuthRequest):
    """Verify Google token and login/register user."""
    from google.oauth2 import id_token
    from google.auth.transport import requests as google_requests
    
    try:
        # Use simple library check
        # Added clock_skew=10 to handle cases where the server clock is slightly behind Google's
        id_info = id_token.verify_oauth2_token(
            body.token, google_requests.Request(), settings.google_client_id or None,
            clock_skew_in_seconds=10
        )
    except Exception as e:
        logger.error(f"Google token verification failed. Detailed Error: {str(e)}")
        logger.error(f"Provided Client ID: {settings.google_client_id}")
        # Note: Avoid logging the full token for security, but maybe first/last few chars for debugging
        logger.error(f"Token Prefix: {body.token[:10]}...") 
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Invalid Google token: {str(e)}"
        )
        
    email = id_info.get("email").lower()
    name = id_info.get("name", "")
    picture = id_info.get("picture", "")
    
    user = await users_collection().find_one({"email": email})
    
    if not user:
        # Register them
        user_doc = {
            "email": email,
            "hashed_password": "",
            "full_name": name,
            "profile_picture_url": picture,
            "total_carbon_footprint_kg": 0.0,
            "total_carbon_offset_kg": 0.0,
            "eco_score_average": 0.0,
            "analysis_count": 0,
            "analysis_count_this_month": 0,
            "premium_features": {},
            "badges": [],
            "points": 0,
            "level": "bronze",
            "preferences": {},
            "is_active": True,
            "is_verified": True,
            "role": "user",
            "created_at": utcnow(),
            "updated_at": utcnow(),
            "failed_login_attempts": 0,
            "is_deleted": False,
            "auth_provider": "google",
        }
        result = await users_collection().insert_one(user_doc)
        user_id = str(result.inserted_id)
    else:
        user_id = str(user["_id"])
        if user.get("is_deleted"):
            raise HTTPException(status_code=403, detail="Account deleted")
            
    tokens = create_token_pair(
        user_id=user_id,
        email=email,
        role=user.get("role", "user") if user else "user",
        is_verified=True,
    )
    
    await sessions_collection().insert_one({
        "user_id": user_id,
        "refresh_token": tokens["refresh_token"],
        "created_at": utcnow(),
        "expires_at": utcnow() + timedelta(days=settings.refresh_token_expire_days),
        "is_active": True,
    })
    
    return tokens


@router.post("/refresh", response_model=TokenResponse, summary="Refresh access token")
async def refresh_token(body: RefreshTokenRequest):
    """Exchange a valid refresh token for a new access token."""
    payload = get_token_payload(body.refresh_token, expected_type=REFRESH_TOKEN_TYPE)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token.")

    session = await sessions_collection().find_one({
        "refresh_token": body.refresh_token, "is_active": True
    })
    if not session:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session not found or revoked.")

    user_id = payload["sub"]
    user = await users_collection().find_one({"_id": ObjectId(user_id)})
    if not user or not user.get("is_active"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive.")

    new_access = create_access_token(
        user_id=user_id,
        email=user["email"],
        role=user.get("role", "user"),
        is_verified=user.get("is_verified", False),
    )
    return {
        "access_token": new_access,
        "refresh_token": body.refresh_token,  # Return same refresh token
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60,
    }


@router.post("/logout", response_model=MessageResponse, summary="Logout (revoke session)")
async def logout(body: RefreshTokenRequest):
    """Invalidate a refresh token / session."""
    await sessions_collection().update_one(
        {"refresh_token": body.refresh_token},
        {"$set": {"is_active": False, "revoked_at": utcnow()}},
    )
    return {"message": "Logged out successfully.", "success": True}


@router.post("/verify-email", response_model=MessageResponse, summary="Verify email address")
async def verify_email(body: EmailVerificationRequest):
    """Verify a user's email using the token sent to their inbox."""
    user = await users_collection().find_one({"verification_token": body.token})
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token.")

    if user.get("verification_token_expires") and user["verification_token_expires"] < utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification link has expired. Please request a new one.")

    await users_collection().update_one(
        {"_id": user["_id"]},
        {"$set": {
            "is_verified": True,
            "verification_token": None,
            "verification_token_expires": None,
            "updated_at": utcnow(),
        }},
    )
    return {"message": "Email verified successfully! You can now use all EcoCart features.", "success": True}


@router.post("/forgot-password", response_model=MessageResponse, summary="Request password reset email")
async def forgot_password(body: PasswordResetRequest):
    """Send a password reset email. Always returns success to prevent email enumeration."""
    user = await users_collection().find_one({"email": body.email.lower()})
    if user:
        reset_token = generate_password_reset_token()
        expires = utcnow() + timedelta(hours=settings.password_reset_expire_hours)
        await users_collection().update_one(
            {"_id": user["_id"]},
            {"$set": {"password_reset_token": reset_token, "password_reset_token_expires": expires}},
        )
        reset_link = f"{settings.frontend_url}/reset-password?token={reset_token}"
        await email_service.send_password_reset_email(user["email"], reset_link)

    return {"message": "If an account with that email exists, we've sent a reset link.", "success": True}


@router.post("/reset-password", response_model=MessageResponse, summary="Reset password with token")
async def reset_password(body: PasswordResetConfirm):
    """Complete password reset using the token from the reset email."""
    user = await users_collection().find_one({"password_reset_token": body.token})
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token.")

    if user.get("password_reset_token_expires") and user["password_reset_token_expires"] < utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reset link has expired.")

    new_hash = hash_password(body.new_password)
    await users_collection().update_one(
        {"_id": user["_id"]},
        {"$set": {
            "hashed_password": new_hash,
            "password_reset_token": None,
            "password_reset_token_expires": None,
            "updated_at": utcnow(),
        }},
    )
    # Invalidate all sessions (force re-login)
    await sessions_collection().update_many(
        {"user_id": str(user["_id"])},
        {"$set": {"is_active": False, "revoked_at": utcnow()}},
    )
    return {"message": "Password reset successfully. Please log in with your new password.", "success": True}


@router.get("/me", response_model=UserResponse, summary="Get current user profile")
async def get_me(user: dict = Depends(get_current_active_user)):
    """Return the authenticated user's profile."""
    return {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "profile_picture_url": user.get("profile_picture_url"),
        "total_carbon_footprint_kg": user.get("total_carbon_footprint_kg", 0),
        "total_carbon_offset_kg": user.get("total_carbon_offset_kg", 0),
        "eco_score_average": user.get("eco_score_average", 0),
        "analysis_count": user.get("analysis_count", 0),
        "badges": user.get("badges", []),
        "points": user.get("points", 0),
        "level": user.get("level", "bronze"),
        "is_verified": user.get("is_verified", False),
        "role": user.get("role", "user"),
        "created_at": user.get("created_at"),
        "last_login": user.get("last_login"),
    }
