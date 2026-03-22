"""
Carbon Offset Model
-------------------
Pydantic model for the MongoDB `carbon_offsets` collection.
Tracks carbon credit purchases linked to verified offset projects.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class OffsetProject(BaseModel):
    """Details of the carbon offset project."""
    name: str
    description: str
    project_type: str            # reforestation | renewable_energy | ocean_cleanup | methane_capture | direct_air_capture
    location: str
    certification: str           # Gold Standard | VCS | Plan Vivo | etc.
    project_url: Optional[str] = None
    developer: Optional[str] = None
    vintage_year: Optional[int] = None


class CarbonOffsetDocument(BaseModel):
    """
    MongoDB document structure for the `carbon_offsets` collection.
    Records a user's carbon credit purchase.
    """
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}

    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str                               # Reference to users._id
    transaction_id: str                        # Reference to transactions._id

    # Offset Details
    carbon_offset_kg: float                    # Amount of CO2e offset in kg
    cost_per_kg: float                         # Price per kg of CO2e
    total_cost: float                          # carbon_offset_kg * cost_per_kg
    currency: str = "USD"

    # Project Info
    offset_project: OffsetProject

    # Certificate
    certificate_url: Optional[str] = None      # URL to downloadable PDF certificate
    certificate_serial: Optional[str] = None   # Unique serial number

    # Verification
    verification_status: str = "pending"       # pending | verified | issued
    verified_at: Optional[datetime] = None

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None      # Some credits expire after N years
