"""
General Helper Functions
------------------------
Shared utilities for MongoDB serialization, pagination, date handling, and more.
"""

import json
import math
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from bson import ObjectId


# ── MongoDB Helpers ────────────────────────────────────────────────────────────

def serialize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Convert a MongoDB document dict to a JSON-serializable Python dict.
    - Converts ObjectId → str
    - Converts datetime → ISO 8601 string
    - Handles nested dicts and lists recursively.

    Args:
        doc: MongoDB document dict or None.

    Returns:
        Serialized dict or None.
    """
    if doc is None:
        return None
    return _serialize_value(doc)


def _serialize_value(value: Any) -> Any:
    if isinstance(value, dict):
        return {k if k != "_id" else "id": _serialize_value(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [_serialize_value(v) for v in value]
    elif isinstance(value, ObjectId):
        return str(value)
    elif isinstance(value, datetime):
        # Ensure UTC timezone and ISO format
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.isoformat()
    return value


def object_id_to_str(oid: Any) -> Optional[str]:
    """Convert an ObjectId (or str) to string."""
    if oid is None:
        return None
    if isinstance(oid, ObjectId):
        return str(oid)
    if isinstance(oid, str) and ObjectId.is_valid(oid):
        return oid
    return None


def str_to_object_id(value: str) -> Optional[ObjectId]:
    """Convert a string to ObjectId, returning None if invalid."""
    try:
        return ObjectId(value)
    except Exception:
        return None


# ── Pagination ────────────────────────────────────────────────────────────────

def paginate(page: int, limit: int) -> Tuple[int, int]:
    """
    Convert page/limit into skip/limit for MongoDB queries.

    Args:
        page: 1-indexed page number.
        limit: Items per page.

    Returns:
        (skip, limit) tuple.
    """
    skip = (page - 1) * limit
    return skip, limit


def build_pagination_meta(
    page: int, limit: int, total: int
) -> Dict[str, Any]:
    """
    Build the pagination metadata dict for list responses.

    Args:
        page: Current page number.
        limit: Items per page.
        total: Total number of items.

    Returns:
        Dict conforming to PaginationMeta schema.
    """
    total_pages = math.ceil(total / limit) if limit > 0 else 0
    return {
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_prev": page > 1,
    }


# ── Date Helpers ──────────────────────────────────────────────────────────────

def utcnow() -> datetime:
    """Return current UTC time (timezone-aware)."""
    return datetime.now(timezone.utc)


def start_of_month(dt: Optional[datetime] = None) -> datetime:
    """Return the start of the month for a given datetime (default: now)."""
    dt = dt or utcnow()
    return dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def format_month_key(dt: datetime) -> str:
    """Format a datetime as 'YYYY-MM' for grouping."""
    return dt.strftime("%Y-%m")


# ── JSON Helpers ──────────────────────────────────────────────────────────────

class MongoJSONEncoder(json.JSONEncoder):
    """JSON encoder that handles ObjectId and datetime objects."""
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            if obj.tzinfo is None:
                obj = obj.replace(tzinfo=timezone.utc)
            return obj.isoformat()
        return super().default(obj)


# ── Carbon & Eco Score Helpers ────────────────────────────────────────────────

def carbon_level_label(total_kg: float) -> str:
    """
    Classify a total carbon footprint in human-readable terms.

    Args:
        total_kg: Total CO2 in kg.

    Returns:
        Label string: "Very Low" | "Low" | "Moderate" | "High" | "Very High"
    """
    if total_kg < 2:
        return "Very Low"
    elif total_kg < 10:
        return "Low"
    elif total_kg < 30:
        return "Moderate"
    elif total_kg < 80:
        return "High"
    return "Very High"


def eco_score_label(score: int) -> str:
    """Map an eco score (0-100) to a descriptive label."""
    if score >= 90:
        return "Exceptional"
    elif score >= 80:
        return "Excellent"
    elif score >= 70:
        return "Very Good"
    elif score >= 60:
        return "Good"
    elif score >= 50:
        return "Fair"
    elif score >= 40:
        return "Below Average"
    elif score >= 30:
        return "Poor"
    return "Critical"


# ── Miscellaneous ─────────────────────────────────────────────────────────────

def truncate_string(s: str, max_length: int = 200, suffix: str = "...") -> str:
    """Truncate a string to max_length, appending suffix if truncated."""
    if len(s) <= max_length:
        return s
    return s[: max_length - len(suffix)] + suffix


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """Safely divide two numbers, returning default if denominator is zero."""
    if denominator == 0:
        return default
    return numerator / denominator


def flatten_list(nested: List[List[Any]]) -> List[Any]:
    """Flatten one level of nesting in a list."""
    return [item for sublist in nested for item in sublist]
