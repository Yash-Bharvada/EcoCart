"""
MongoDB Index Creation Migration
---------------------------------
Run this script once to create all necessary database indexes for optimal performance.
Safe to re-run — all indexes are created with background=True and will skip if they exist.

Usage:
    python migrations/init_indexes.py
"""

import asyncio
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "ecocart")


async def create_indexes() -> None:
    print(f"📦 Connecting to MongoDB: {MONGODB_URL}")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[MONGODB_DB_NAME]

    print(f"📊 Creating indexes in database: {MONGODB_DB_NAME}")

    # ── Users Collection ──────────────────────────────────────────────────────
    await db.users.create_index("email", unique=True, background=True)
    await db.users.create_index("created_at", background=True)
    await db.users.create_index("last_login", background=True)
    await db.users.create_index("subscription_tier", background=True)
    await db.users.create_index("role", background=True)
    print("✅ users: email (unique), created_at, last_login, subscription_tier, role")

    # ── Analyses Collection ───────────────────────────────────────────────────
    await db.analyses.create_index("user_id", background=True)
    await db.analyses.create_index("created_at", background=True)
    await db.analyses.create_index("eco_score", background=True)
    await db.analyses.create_index("total_carbon_kg", background=True)
    await db.analyses.create_index([("user_id", 1), ("created_at", -1)], background=True)
    await db.analyses.create_index("is_deleted", background=True)
    print("✅ analyses: user_id, created_at, eco_score, total_carbon_kg, compound(user_id+created_at)")

    # ── Products Collection ───────────────────────────────────────────────────
    await db.products.create_index("category", background=True)
    await db.products.create_index("carbon_rating", background=True)
    await db.products.create_index("is_featured", background=True)
    await db.products.create_index("is_active", background=True)
    await db.products.create_index("eco_certifications", background=True)
    await db.products.create_index("tags", background=True)
    await db.products.create_index(
        [("name", "text"), ("description", "text"), ("tags", "text")],
        name="product_text_search",
        background=True,
    )
    print("✅ products: category, carbon_rating, is_featured, is_active, text search")

    # ── Transactions Collection ───────────────────────────────────────────────
    await db.transactions.create_index("user_id", background=True)
    await db.transactions.create_index("stripe_payment_id", unique=True, background=True)
    await db.transactions.create_index("status", background=True)
    await db.transactions.create_index("created_at", background=True)
    await db.transactions.create_index("transaction_type", background=True)
    print("✅ transactions: user_id, stripe_payment_id (unique), status, created_at, type")

    # ── Carbon Offsets Collection ─────────────────────────────────────────────
    await db.carbon_offsets.create_index("user_id", background=True)
    await db.carbon_offsets.create_index("created_at", background=True)
    await db.carbon_offsets.create_index("verification_status", background=True)
    print("✅ carbon_offsets: user_id, created_at, verification_status")

    # ── Sessions Collection ───────────────────────────────────────────────────
    await db.sessions.create_index("user_id", background=True)
    await db.sessions.create_index("refresh_token", background=True)
    await db.sessions.create_index(
        "expires_at",
        expireAfterSeconds=0,  # TTL index — auto-delete expired sessions
        background=True,
    )
    print("✅ sessions: user_id, refresh_token, expires_at (TTL auto-delete)")

    # ── Analytics Collection ──────────────────────────────────────────────────
    await db.analytics.create_index("user_id", background=True)
    await db.analytics.create_index("event", background=True)
    await db.analytics.create_index("created_at", background=True)
    # TTL: auto-delete analytics events older than 2 years
    await db.analytics.create_index(
        "created_at",
        expireAfterSeconds=63072000,  # 2 years in seconds
        name="analytics_ttl",
        background=True,
    )
    print("✅ analytics: user_id, event, created_at (TTL 2yr)")

    # ── Redirect Links Collection ─────────────────────────────────────────────
    await db.redirect_links.create_index("code", unique=True, background=True)
    await db.redirect_links.create_index("product_id", background=True)
    print("✅ redirect_links: code (unique), product_id")

    client.close()
    print("\n🎉 All indexes created successfully!")


if __name__ == "__main__":
    asyncio.run(create_indexes())
