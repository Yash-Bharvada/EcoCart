"""
Security Utilities
------------------
JWT token creation/verification, password hashing, and auth helper functions.
"""

import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

# ── Password Hashing ───────────────────────────────────────────────────────────
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=settings.bcrypt_rounds,
)


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT Token Management ───────────────────────────────────────────────────────
ALGORITHM = "HS256"

ACCESS_TOKEN_TYPE = "access"
REFRESH_TOKEN_TYPE = "refresh"


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(
    user_id: str,
    email: str,
    role: str = "user",
    is_verified: bool = False,
) -> str:
    """
    Create a signed JWT access token.

    Args:
        user_id: MongoDB ObjectId as string.
        email: User's email address.
        subscription_tier: free | premium | pro
        role: user | admin
        is_verified: Whether the user's email is verified.

    Returns:
        Signed JWT string.
    """
    now = _utc_now()
    expire = now + timedelta(minutes=settings.access_token_expire_minutes)

    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "verified": is_verified,
        "type": ACCESS_TOKEN_TYPE,
        "iat": now,
        "exp": expire,
        "jti": str(uuid.uuid4()),    # JWT ID for potential revocation
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """
    Create a signed JWT refresh token (longer-lived, minimal payload).

    Args:
        user_id: MongoDB ObjectId as string.

    Returns:
        Signed JWT string.
    """
    now = _utc_now()
    expire = now + timedelta(days=settings.refresh_token_expire_days)

    payload = {
        "sub": user_id,
        "type": REFRESH_TOKEN_TYPE,
        "iat": now,
        "exp": expire,
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """
    Decode and validate a JWT token.

    Args:
        token: JWT string.

    Returns:
        Decoded payload dict.

    Raises:
        JWTError: If the token is invalid, expired, or tampered with.
    """
    return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])


def get_token_payload(token: str, expected_type: Optional[str] = None) -> Optional[dict]:
    """
    Safely decode a JWT token, returning None on failure.

    Args:
        token: JWT string.
        expected_type: "access" or "refresh" — validates the `type` claim.

    Returns:
        Payload dict or None if invalid/expired.
    """
    try:
        payload = decode_token(token)
        if expected_type and payload.get("type") != expected_type:
            return None
        return payload
    except JWTError:
        return None


# ── Verification & Reset Tokens ────────────────────────────────────────────────

def generate_verification_token() -> str:
    """Generate a secure random email verification token."""
    return secrets.token_urlsafe(32)


def generate_password_reset_token() -> str:
    """Generate a secure random password reset token."""
    return secrets.token_urlsafe(32)


def generate_api_key() -> str:
    """Generate a secure API key for PRO tier users."""
    return f"eck_{secrets.token_urlsafe(40)}"


# ── Utility Helpers ────────────────────────────────────────────────────────────

def create_token_pair(
    user_id: str,
    email: str,
    role: str = "user",
    is_verified: bool = False,
) -> dict:
    """
    Create both access and refresh tokens in one call.

    Returns:
        Dict with access_token, refresh_token, token_type, expires_in.
    """
    access_token = create_access_token(
        user_id=user_id,
        email=email,
        role=role,
        is_verified=is_verified,
    )
    refresh_token = create_refresh_token(user_id=user_id)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.access_token_expire_minutes * 60,
    }
