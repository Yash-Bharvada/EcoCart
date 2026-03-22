"""
Transaction Model
-----------------
Pydantic model for the MongoDB `transactions` collection.
Records all Stripe payment events with idempotency tracking.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class WebhookEvent(BaseModel):
    """Records a received Stripe webhook event for idempotency."""
    event_id: str
    event_type: str
    processed_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "processed"          # processed | failed | duplicate


class TransactionMetadata(BaseModel):
    """Type-specific metadata attached to a transaction."""
    product_ids: List[str] = Field(default_factory=list)
    subscription_tier: Optional[str] = None
    carbon_offset_kg: Optional[float] = None
    offset_project_type: Optional[str] = None
    analysis_id: Optional[str] = None


class TransactionDocument(BaseModel):
    """
    MongoDB document structure for the `transactions` collection.
    Records every payment processed via Stripe.
    """
    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}

    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str                                     # Reference to users._id
    stripe_customer_id: str

    # Payment Details
    transaction_type: str                             # subscription | product_purchase | carbon_offset | one_time_feature
    stripe_payment_id: str                           # PaymentIntent ID or Subscription ID (unique, indexed)
    stripe_invoice_id: Optional[str] = None
    amount: float                                     # In currency units (e.g., USD dollars)
    currency: str = "USD"                            # ISO 4217
    status: str = "pending"                          # pending | completed | failed | refunded | disputed

    # Payment method
    payment_method: Optional[str] = None             # card | paypal | etc.
    payment_method_last4: Optional[str] = None
    payment_method_brand: Optional[str] = None

    # Details
    description: str = ""
    metadata: TransactionMetadata = Field(default_factory=TransactionMetadata)
    receipt_url: Optional[str] = None               # Stripe receipt URL

    # Refunds
    refund_amount: Optional[float] = None
    refund_reason: Optional[str] = None
    refunded_at: Optional[datetime] = None

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Webhook idempotency tracking
    webhook_events: List[WebhookEvent] = Field(default_factory=list)

    # Service fee (EcoCart's cut)
    service_fee_amount: float = 0.0
