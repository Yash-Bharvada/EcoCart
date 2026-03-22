"""
User Model
----------
Pydantic models for the MongoDB `users` collection.
Defines document structure, creation schemas, and response types.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class PyObjectId(str):
    """Custom Pydantic type that accepts MongoDB ObjectId."""

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str):
            if ObjectId.is_valid(v):
                return v
            raise ValueError(f"Invalid ObjectId: {v}")
        raise TypeError(f"ObjectId or str expected, got {type(v)}")

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId, serialization=core_schema.to_string_ser_schema()),
            core_schema.str_schema(),
        ])


class PremiumFeatures(BaseModel):
    """Feature flags based on subscription tier."""
    unlimited_analyses: bool = False
    priority_support: bool = False
    carbon_offset_recommendations: bool = False
    api_access: bool = False
    bulk_analysis: bool = False
    carbon_reports: bool = False
    white_label: bool = False
    premium_gemini_model: bool = False


class UserPreferences(BaseModel):
    """User notification and display preferences."""
    email_notifications: bool = True
    marketing_emails: bool = False
    weekly_report: bool = True
    analysis_complete_email: bool = True
    units: str = "metric"  # metric | imperial
    currency: str = "USD"
    show_on_leaderboard: bool = True
    language: str = "en"
    timezone: str = "UTC"


class UserBadge(BaseModel):
    """Single achieved badge."""
    badge_id: str
    name: str
    description: str
    icon: str
    earned_at: datetime
    category: str  # analysis | sustainability | community | milestones


class UserDocument(BaseModel):
    """
    MongoDB document structure for the `users` collection.
    This represents the full document as stored in the database.
    """
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}

    id: Optional[str] = Field(default=None, alias="_id")
    email: EmailStr
    hashed_password: str
    full_name: str
    profile_picture_url: Optional[str] = None

    # Carbon & Eco Statistics
    total_carbon_footprint_kg: float = 0.0
    total_carbon_offset_kg: float = 0.0
    eco_score_average: float = 0.0
    analysis_count: int = 0
    analysis_count_this_month: int = 0
    analysis_month_reset_at: Optional[datetime] = None

    # Features & Gamification
    premium_features: PremiumFeatures = Field(default_factory=PremiumFeatures)
    badges: List[UserBadge] = Field(default_factory=list)
    points: int = 0
    level: str = "bronze"    # bronze | silver | gold | platinum

    # Preferences
    preferences: UserPreferences = Field(default_factory=UserPreferences)

    # Account State
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    is_active: bool = True
    is_verified: bool = False
    verification_token: Optional[str] = None
    verification_token_expires: Optional[datetime] = None
    password_reset_token: Optional[str] = None
    password_reset_token_expires: Optional[datetime] = None
    failed_login_attempts: int = 0
    locked_until: Optional[datetime] = None

    # GDPR
    gdpr_consent_at: Optional[datetime] = None
    data_deletion_requested_at: Optional[datetime] = None
    is_deleted: bool = False

    # Role
    role: str = "user"  # user | admin



