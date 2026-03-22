"""
Product Model
-------------
Pydantic model for the MongoDB `products` collection.
Stores sustainable product catalog with affiliate link tracking.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, HttpUrl


class SellerInfo(BaseModel):
    """Seller/merchant information."""
    name: str
    website: Optional[str] = None
    country: Optional[str] = None
    is_certified: bool = False
    certifications: List[str] = Field(default_factory=list)


class CarbonComparison(BaseModel):
    """Carbon footprint comparison vs. a conventional alternative."""
    conventional_product_name: str
    conventional_carbon_kg: float
    savings_kg: float
    savings_percent: float


class ProductDocument(BaseModel):
    """
    MongoDB document structure for the `products` collection.
    Represents a sustainable product in the EcoCart catalog.
    """
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}

    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    description: str
    short_description: Optional[str] = None
    category: str                                       # Indexed
    sub_category: Optional[str] = None

    # Sustainability
    carbon_rating: float = 0.0                          # kg CO2e per unit (lower = better)
    eco_certifications: List[str] = Field(default_factory=list)
    # e.g., "Organic", "Fair Trade", "B Corp", "Rainforest Alliance", "FSC"
    tags: List[str] = Field(default_factory=list)
    # e.g., "vegan", "plastic-free", "local", "recyclable", "zero-waste"
    carbon_comparison: Optional[CarbonComparison] = None

    # Pricing
    price: float = 0.0
    currency: str = "USD"
    price_range: str = "mid"                           # budget | mid | premium

    # Media
    image_url: Optional[str] = None
    image_urls: List[str] = Field(default_factory=list)  # Gallery images

    # Affiliate / Tracking
    affiliate_link: str = ""                           # Original affiliate URL
    redirect_code: Optional[str] = None               # Short code for /r/{code}
    affiliate_network: Optional[str] = None           # amazon | impact | shareasale | direct
    commission_rate: float = 0.0                      # Percentage (e.g., 5.0 for 5%)

    # Analytics
    view_count: int = 0
    click_count: int = 0
    purchase_count: int = 0

    # Stock & Availability
    stock_status: str = "in_stock"                    # in_stock | out_of_stock | limited
    available_countries: List[str] = Field(default_factory=list)  # Empty = worldwide

    # Seller / Merchant
    seller_info: Optional[SellerInfo] = None

    # Admin / Curation
    is_featured: bool = False
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Full-text search support (populated from name + description + tags)
    search_text: Optional[str] = None
