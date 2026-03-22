"""
API Dependencies
----------------
Shared FastAPI dependencies re-exported from middleware.
"""

from app.middleware.auth_middleware import (
    get_current_user,
    get_current_active_user,
    get_verified_user,
    require_premium,
    require_pro,
    require_admin,
    optional_auth,
)
from app.database.mongodb import get_db

__all__ = [
    "get_current_user",
    "get_current_active_user",
    "get_verified_user",
    "require_premium",
    "require_pro",
    "require_admin",
    "optional_auth",
    "get_db",
]
