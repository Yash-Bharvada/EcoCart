"""
Analysis Model
--------------
Pydantic models for the MongoDB `analyses` collection.
Stores receipt analysis results from Gemini AI.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from bson import ObjectId
from pydantic import BaseModel, Field


class ProductItem(BaseModel):
    """A single product/item identified on a receipt."""
    name: str
    category: str
    quantity: Optional[str] = None           # e.g., "2 kg", "1 pack", "3"
    estimated_carbon_kg: float = 0.0
    carbon_intensity: str = "medium"          # low | medium | high
    notes: Optional[str] = None              # origin, packaging, certifications


class SustainableAlternative(BaseModel):
    """A suggested sustainable swap for a high-carbon product."""
    text: str                                  # Full suggestion with reasoning
    alternative_name: str                      # Specific product name
    estimated_savings_kg: float = 0.0
    priority: str = "medium"                   # high | medium | low
    redirect_link: Optional[str] = None        # Affiliate/redirect URL
    product_id: Optional[str] = None          # ObjectId ref to products collection


class ScoreBreakdown(BaseModel):
    """Eco score breakdown by category (each 0-100)."""
    food_choices: int = 50
    packaging: int = 50
    origin: int = 50
    product_type: int = 50


class AnalysisDocument(BaseModel):
    """
    MongoDB document structure for the `analyses` collection.
    Stores the full output of a Gemini receipt analysis.
    """
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}

    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str                                        # Reference to users._id
    is_valid_receipt: bool = True

    # Image Storage
    receipt_image_url: Optional[str] = None             # S3/Cloudinary URL
    receipt_image_thumbnail: Optional[str] = None       # Compressed version URL

    # Analysis Results
    products: List[ProductItem] = Field(default_factory=list)
    total_carbon_kg: float = 0.0
    eco_score: int = 50                                  # 0-100
    score_breakdown: ScoreBreakdown = Field(default_factory=ScoreBreakdown)
    suggestions: List[SustainableAlternative] = Field(default_factory=list)
    summary: str = ""
    top_contributors: List[str] = Field(default_factory=list)
    comparison: Optional[str] = None                    # "X% higher than average"

    # Processing Metadata
    processing_time_ms: int = 0
    gemini_model_version: str = ""
    error_message: Optional[str] = None

    # Storage
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None

    # Context metadata
    metadata: Dict[str, Any] = Field(default_factory=dict)
    # e.g., device_info, app_version, api_version, analysis_version
