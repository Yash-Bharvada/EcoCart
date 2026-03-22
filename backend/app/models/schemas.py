"""
Pydantic Schemas
----------------
All request/response schemas for the EcoCart API.
Organized by feature domain: Auth, Analysis, Products, Payments, Users, Carbon Offsets.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, EmailStr, Field, field_validator


# ══════════════════════════════════════════════════════
# SHARED / BASE SCHEMAS
# ══════════════════════════════════════════════════════

class MessageResponse(BaseModel):
    """Generic success message response."""
    message: str
    success: bool = True


class PaginationMeta(BaseModel):
    """Pagination metadata for list responses."""
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_prev: bool


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    message: str
    detail: Optional[Any] = None


# ══════════════════════════════════════════════════════
# AUTHENTICATION SCHEMAS
# ══════════════════════════════════════════════════════

class RegisterRequest(BaseModel):
    """User registration request."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=100)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        if not any(c in "!@#$%^&*()_+-=[]{}|;':\",./<>?" for c in v):
            raise ValueError("Password must contain at least one special character")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Full name cannot be blank")
        return v.strip()


class LoginRequest(BaseModel):
    """User login request."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token pair returned after login/register."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int = Field(description="Access token lifetime in seconds")


class RefreshTokenRequest(BaseModel):
    """Request to refresh an access token."""
    refresh_token: str


class PasswordResetRequest(BaseModel):
    """Initiate password reset flow."""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Complete password reset with token from email."""
    token: str
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class EmailVerificationRequest(BaseModel):
    """Email verification with token from email link."""
    token: str


# ══════════════════════════════════════════════════════
# USER SCHEMAS
# ══════════════════════════════════════════════════════

class UserPreferencesUpdate(BaseModel):
    """Update user notification and display preferences."""
    email_notifications: Optional[bool] = None
    marketing_emails: Optional[bool] = None
    weekly_report: Optional[bool] = None
    analysis_complete_email: Optional[bool] = None
    units: Optional[str] = Field(None, pattern="^(metric|imperial)$")
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    show_on_leaderboard: Optional[bool] = None
    language: Optional[str] = None
    timezone: Optional[str] = None


class UserUpdateRequest(BaseModel):
    """Partial user profile update."""
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    profile_picture_url: Optional[str] = None
    preferences: Optional[UserPreferencesUpdate] = None


class UserBadgeResponse(BaseModel):
    """Badge data for API responses."""
    badge_id: str
    name: str
    description: str
    icon: str
    earned_at: datetime
    category: str


class UserResponse(BaseModel):
    """Full user object returned to authenticated user."""
    id: str
    email: str
    full_name: str
    profile_picture_url: Optional[str] = None
    total_carbon_footprint_kg: float
    total_carbon_offset_kg: float
    eco_score_average: float
    analysis_count: int
    badges: List[UserBadgeResponse] = Field(default_factory=list)
    points: int
    level: str
    is_verified: bool
    role: str
    created_at: datetime
    last_login: Optional[datetime] = None


class UserProfile(BaseModel):
    """Public user profile (limited fields)."""
    id: str
    full_name: str
    profile_picture_url: Optional[str] = None
    eco_score_average: float
    analysis_count: int
    badges: List[UserBadgeResponse] = Field(default_factory=list)
    level: str
    total_carbon_offset_kg: float


class MonthlyTrend(BaseModel):
    """Carbon footprint data point for a single month."""
    month: str               # "YYYY-MM"
    total_carbon_kg: float
    average_eco_score: float
    analysis_count: int


class CategoryBreakdown(BaseModel):
    """Carbon footprint breakdown by product category."""
    category: str
    total_carbon_kg: float
    percentage: float
    analysis_count: int


class UserDashboard(BaseModel):
    """Aggregated statistics for the user dashboard."""
    # Totals
    total_carbon_footprint_kg: float
    total_carbon_offset_kg: float
    net_carbon_kg: float         # footprint - offset
    analysis_count: int
    average_eco_score: float
    analyses_this_month: int

    # Trends
    monthly_trend: List[MonthlyTrend] = Field(default_factory=list)
    category_breakdown: List[CategoryBreakdown] = Field(default_factory=list)

    # Achievements
    improvement_percent: Optional[float] = None   # vs first analysis
    co2_vs_average_percent: Optional[float] = None  # higher (pos) or lower (neg) than avg user
    badges: List[UserBadgeResponse] = Field(default_factory=list)
    rank_percentile: Optional[float] = None       # e.g., 85 = top 15%

    # Eco Tips
    top_tip: Optional[str] = None


class LeaderboardEntry(BaseModel):
    """Single entry in the leaderboard."""
    rank: int
    user_id: str
    display_name: str
    profile_picture_url: Optional[str] = None
    eco_score_average: float
    total_carbon_offset_kg: float
    level: str
    is_current_user: bool = False


class LeaderboardResponse(BaseModel):
    """Leaderboard response with top users and current user rank."""
    period: str                                 # weekly | monthly | all_time
    metric: str                                 # eco_score | carbon_offset | analyses
    entries: List[LeaderboardEntry]
    current_user_rank: Optional[int] = None


# ══════════════════════════════════════════════════════
# ANALYSIS SCHEMAS
# ══════════════════════════════════════════════════════

class ProductItemResponse(BaseModel):
    """A product item in an analysis response."""
    name: str
    category: str
    quantity: Optional[str] = None
    estimated_carbon_kg: float
    carbon_intensity: str
    notes: Optional[str] = None


class SustainableAlternativeResponse(BaseModel):
    """A sustainable alternative suggestion."""
    text: str
    alternative_name: str
    estimated_savings_kg: float
    priority: str
    redirect_link: Optional[str] = None
    product_id: Optional[str] = None


class ScoreBreakdownResponse(BaseModel):
    """Eco score component breakdown."""
    food_choices: int
    packaging: int
    origin: int
    product_type: int


class AnalysisResponse(BaseModel):
    """Full analysis result returned to the client."""
    id: str
    user_id: str
    is_valid_receipt: bool
    receipt_image_url: Optional[str] = None
    receipt_image_thumbnail: Optional[str] = None
    products: List[ProductItemResponse] = Field(default_factory=list)
    total_carbon_kg: float
    eco_score: int
    score_breakdown: ScoreBreakdownResponse
    suggestions: List[SustainableAlternativeResponse] = Field(default_factory=list)
    summary: str
    top_contributors: List[str] = Field(default_factory=list)
    comparison: Optional[str] = None
    processing_time_ms: int
    created_at: datetime
    error_message: Optional[str] = None


class AnalysisSummary(BaseModel):
    """Condensed analysis for history lists and dashboard."""
    id: str
    receipt_image_thumbnail: Optional[str] = None
    total_carbon_kg: float
    eco_score: int
    product_count: int
    top_contributors: List[str] = Field(default_factory=list)
    created_at: datetime
    is_valid_receipt: bool


class AnalysisListResponse(BaseModel):
    """Paginated list of analyses."""
    analyses: List[AnalysisSummary]
    pagination: PaginationMeta


class AnalysisStatsResponse(BaseModel):
    """Aggregate stats for a user's analyses."""
    total_analyses: int
    average_eco_score: float
    total_carbon_kg: float
    monthly_trend: List[MonthlyTrend]
    category_breakdown: List[CategoryBreakdown]
    improvement_percent: Optional[float] = None


# ══════════════════════════════════════════════════════
# PRODUCT SCHEMAS
# ══════════════════════════════════════════════════════

class ProductResponse(BaseModel):
    """Single product response."""
    id: str
    name: str
    description: str
    short_description: Optional[str] = None
    category: str
    carbon_rating: float
    eco_certifications: List[str]
    tags: List[str]
    price: float
    currency: str
    price_range: str
    image_url: Optional[str] = None
    stock_status: str
    is_featured: bool
    redirect_link: Optional[str] = None    # /r/{code} URL for tracking
    affiliate_network: Optional[str] = None
    carbon_comparison: Optional[Dict[str, Any]] = None
    seller_info: Optional[Dict[str, Any]] = None


class ProductListResponse(BaseModel):
    """Paginated product list."""
    products: List[ProductResponse]
    pagination: PaginationMeta
    available_categories: List[str] = Field(default_factory=list)
    available_certifications: List[str] = Field(default_factory=list)


class ProductSearchRequest(BaseModel):
    """Product search and filter parameters."""
    q: Optional[str] = Field(None, description="Search query")
    category: Optional[str] = None
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    carbon_rating_max: Optional[float] = None
    certifications: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    is_featured: Optional[bool] = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)
    sort_by: str = Field(default="carbon_rating", pattern="^(carbon_rating|price|name|created_at)$")
    sort_order: str = Field(default="asc", pattern="^(asc|desc)$")


class ProductClickResponse(BaseModel):
    """Response after tracking a product click — returns redirect URL."""
    redirect_url: str
    product_id: str


class AlternativeGroup(BaseModel):
    """Sustainable alternatives grouped per original product."""
    original_product_name: str
    original_carbon_kg: float
    alternatives: List[ProductResponse]
    max_savings_kg: float





# ══════════════════════════════════════════════════════
# CARBON OFFSET SCHEMAS
# ══════════════════════════════════════════════════════

class OffsetProjectResponse(BaseModel):
    """Carbon offset project details."""
    project_id: str
    name: str
    description: str
    project_type: str
    location: str
    certification: str
    project_url: Optional[str] = None
    price_per_kg: float
    is_featured: bool = False


class CarbonOffsetResponse(BaseModel):
    """User's carbon offset purchase record."""
    id: str
    carbon_offset_kg: float
    cost_per_kg: float
    total_cost: float
    currency: str
    project_name: str
    project_type: str
    verification_status: str
    certificate_url: Optional[str] = None
    created_at: datetime


class CarbonOffsetListResponse(BaseModel):
    """Paginated list of carbon offset purchases."""
    offsets: List[CarbonOffsetResponse]
    pagination: PaginationMeta
    total_offset_kg: float
    total_spent: float


# ══════════════════════════════════════════════════════
# HEALTH CHECK SCHEMAS
# ══════════════════════════════════════════════════════

class ServiceStatus(BaseModel):
    """Status of a single dependency."""
    status: str          # ok | degraded | down
    latency_ms: Optional[float] = None
    message: Optional[str] = None


class HealthResponse(BaseModel):
    """Overall API health status."""
    status: str          # ok | degraded | down
    version: str
    environment: str
    services: Dict[str, ServiceStatus]
    uptime_seconds: Optional[float] = None
