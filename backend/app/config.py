"""
EcoCart Configuration
---------------------
Loads all application settings from environment variables using Pydantic BaseSettings.
Provides a singleton `settings` object used throughout the app.
"""

from functools import lru_cache
from typing import List

from pydantic import AnyHttpUrl, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ────────────────────────────────────────
    environment: str = Field(default="development")
    api_version: str = Field(default="1.0.0")
    secret_key: str = Field(default="change-me-in-production-use-32-chars-min")
    debug: bool = Field(default=False)
    log_level: str = Field(default="INFO")
    app_name: str = Field(default="EcoCart API")

    # ── MongoDB ────────────────────────────────────────────
    mongodb_url: str = Field(default="mongodb://localhost:27017")
    mongodb_db_name: str = Field(default="ecocart")

    # ── Redis ──────────────────────────────────────────────
    redis_url: str = Field(default="redis://localhost:6379")
    redis_password: str = Field(default="")

    # ── AI — Gemini ────────────────────────────────────────
    gemini_api_key: str = Field(default="")
    gemini_model_free: str = Field(default="gemini-pro-vision")
    gemini_model_premium: str = Field(default="gemini-pro-vision")



    # ── AWS S3 ─────────────────────────────────────────────
    aws_access_key_id: str = Field(default="")
    aws_secret_access_key: str = Field(default="")
    aws_s3_bucket: str = Field(default="ecocart-receipts")
    aws_region: str = Field(default="us-east-1")
    s3_receipt_prefix: str = Field(default="receipts/")
    s3_thumbnail_prefix: str = Field(default="thumbnails/")

    # ── Email (SMTP) ───────────────────────────────────────
    smtp_server: str = Field(default="smtp.gmail.com")
    smtp_port: int = Field(default=465)
    smtp_username: str = Field(default="")
    smtp_password: str = Field(default="")
    from_email: str = Field(default="noreply@ecocart.com")
    from_name: str = Field(default="EcoCart")

    # ── CORS / Frontend ────────────────────────────────────
    frontend_url: str = Field(default="http://localhost:3000")
    cors_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"]
    )

    # ── Security / Tokens ──────────────────────────────────
    google_client_id: str = Field(default="")
    access_token_expire_minutes: int = Field(default=15)
    refresh_token_expire_days: int = Field(default=7)
    email_verification_expire_hours: int = Field(default=24)
    password_reset_expire_hours: int = Field(default=1)
    bcrypt_rounds: int = Field(default=12)

    # ── Rate Limiting ──────────────────────────────────────
    rate_limit_per_minute: int = Field(default=60)
    rate_limit_analyze_free: int = Field(default=10)
    rate_limit_analyze_premium: int = Field(default=60)
    monthly_analysis_limit_free: int = Field(default=5)

    # ── Carbon Offset ──────────────────────────────────────
    carbon_offset_price_per_ton: float = Field(default=15.00)
    ecocart_service_fee_percent: float = Field(default=7.5)

    # ── Monitoring ─────────────────────────────────────────
    sentry_dsn: str = Field(default="")

    # ── Computed Properties ────────────────────────────────
    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def is_development(self) -> bool:
        return self.environment.lower() == "development"

    @property
    def mongodb_connection_string(self) -> str:
        return self.mongodb_url

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Allow CORS_ORIGINS as JSON array string or comma-separated string."""
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return [origin.strip() for origin in v.split(",")]
        return v


@lru_cache()
def get_settings() -> Settings:
    """Return cached Settings singleton."""
    return Settings()


# Global settings instance
settings = get_settings()
