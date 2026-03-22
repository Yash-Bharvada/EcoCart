"""
Custom Validators
-----------------
Reusable validation helper functions for the EcoCart API.
"""

import re
from typing import Optional


# ── Password ───────────────────────────────────────────────────────────────────

def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Check password meets security requirements.

    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one digit
    - At least one special character

    Returns:
        (is_valid, error_message) tuple.
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if len(password) > 128:
        return False, "Password must be at most 128 characters long"
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"
    if not any(c in "!@#$%^&*()_+-=[]{}|;':\",./<>?" for c in password):
        return False, "Password must contain at least one special character"
    return True, ""


# ── Email ──────────────────────────────────────────────────────────────────────

_EMAIL_RE = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")


def validate_email_format(email: str) -> bool:
    """Basic regex check for email format (Pydantic handles formal validation)."""
    return bool(_EMAIL_RE.match(email.strip()))


# ── Carbon ─────────────────────────────────────────────────────────────────────

def validate_carbon_kg(value: float) -> tuple[bool, str]:
    """Sanity check for carbon values."""
    if value < 0:
        return False, "Carbon value cannot be negative"
    if value > 100_000:
        return False, "Carbon value exceeds reasonable limit (100,000 kg)"
    return True, ""


def validate_eco_score(score: int) -> tuple[bool, str]:
    """Validate eco score is in range 0-100."""
    if not 0 <= score <= 100:
        return False, f"Eco score must be between 0 and 100, got {score}"
    return True, ""


# ── Object ID ──────────────────────────────────────────────────────────────────

def is_valid_object_id(value: str) -> bool:
    """Check if a string is a valid 24-character hex MongoDB ObjectId."""
    return bool(re.match(r"^[0-9a-fA-F]{24}$", value))


# ── Pagination ────────────────────────────────────────────────────────────────

def validate_pagination(page: int, limit: int, max_limit: int = 100) -> tuple[bool, str]:
    """Validate pagination parameters."""
    if page < 1:
        return False, "Page must be >= 1"
    if limit < 1:
        return False, "Limit must be >= 1"
    if limit > max_limit:
        return False, f"Limit must be <= {max_limit}"
    return True, ""


# ── Stripe ────────────────────────────────────────────────────────────────────

def validate_stripe_price_id(price_id: str) -> bool:
    """Loosely validate a Stripe price ID format."""
    return price_id.startswith("price_") and len(price_id) > 10


def validate_stripe_payment_intent_id(pi_id: str) -> bool:
    """Loosely validate a Stripe PaymentIntent ID format."""
    return pi_id.startswith("pi_") and len(pi_id) > 10


# ── File Upload ───────────────────────────────────────────────────────────────

ALLOWED_IMAGE_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
}


def validate_image_content_type(content_type: Optional[str]) -> tuple[bool, str]:
    """Check that uploaded file MIME type is an allowed image format."""
    if not content_type:
        return False, "Content-Type header is required for file uploads"
    if content_type.lower() not in ALLOWED_IMAGE_CONTENT_TYPES:
        return (
            False,
            f"Unsupported file type: {content_type}. "
            f"Allowed: {', '.join(sorted(ALLOWED_IMAGE_CONTENT_TYPES))}",
        )
    return True, ""
