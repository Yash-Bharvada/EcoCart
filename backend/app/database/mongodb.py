"""
MongoDB Async Client
--------------------
Motor-based async MongoDB connection with:
- Connection pooling (maxPoolSize=50, minPoolSize=10)
- Exponential backoff retry on startup
- Health check ping
- Collection getter helpers
- Proper lifecycle management (connect/close)
"""

import asyncio
import logging
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase, AsyncIOMotorCollection
from pymongo import ASCENDING, DESCENDING, TEXT
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

from app.config import settings

logger = logging.getLogger(__name__)

# ── Module-level client and db references ─────────────────────────────────────
_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


async def connect_db(max_retries: int = 5) -> None:
    """
    Connect to MongoDB with exponential backoff retry logic.

    Args:
        max_retries: Maximum number of connection attempts before giving up.
    """
    global _client, _db

    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Attempting MongoDB connection (attempt {attempt}/{max_retries})...")

            _client = AsyncIOMotorClient(
                settings.mongodb_url,
                maxPoolSize=50,
                minPoolSize=10,
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
                socketTimeoutMS=30000,
                retryWrites=True,
                w="majority",
            )

            # Verify connection with admin ping
            await _client.admin.command("ping")
            _db = _client[settings.mongodb_db_name]

            logger.info(
                f"✅ MongoDB connected successfully | "
                f"db={settings.mongodb_db_name} | "
                f"url={settings.mongodb_url}"
            )
            return

        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.warning(f"MongoDB connection attempt {attempt} failed: {e}")
            if attempt < max_retries:
                wait_time = 2 ** attempt  # exponential backoff: 2, 4, 8, 16, 32 seconds
                logger.info(f"Retrying in {wait_time}s...")
                await asyncio.sleep(wait_time)
            else:
                logger.error(
                    f"❌ Failed to connect to MongoDB after {max_retries} attempts. "
                    "The application will start but database operations will fail."
                )
                # Don't raise — let the app start and fail on individual requests


async def close_db() -> None:
    """Close the MongoDB connection pool gracefully."""
    global _client, _db
    if _client is not None:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed")


async def ping_db() -> bool:
    """
    Ping the database to verify connectivity.

    Returns:
        True if the ping succeeds, False otherwise.
    """
    if _client is None:
        return False
    try:
        await _client.admin.command("ping")
        return True
    except Exception as e:
        logger.error(f"MongoDB ping failed: {e}")
        return False


def get_db() -> AsyncIOMotorDatabase:
    """
    Get the active database instance.

    Returns:
        AsyncIOMotorDatabase instance.

    Raises:
        RuntimeError: If database is not connected.
    """
    if _db is None:
        raise RuntimeError(
            "Database not initialized. Ensure connect_db() was called during app startup."
        )
    return _db


def get_collection(collection_name: str) -> AsyncIOMotorCollection:
    """
    Get a MongoDB collection by name.

    Args:
        collection_name: Name of the collection.

    Returns:
        AsyncIOMotorCollection instance.
    """
    return get_db()[collection_name]


# ── Collection Name Constants ──────────────────────────────────────────────────
class Collections:
    USERS = "users"
    ANALYSES = "analyses"
    PRODUCTS = "products"
    TRANSACTIONS = "transactions"
    CARBON_OFFSETS = "carbon_offsets"
    SESSIONS = "sessions"
    ANALYTICS = "analytics"
    API_KEYS = "api_keys"
    REDIRECT_LINKS = "redirect_links"


# ── Convenience collection getters ────────────────────────────────────────────
def users_collection() -> AsyncIOMotorCollection:
    return get_collection(Collections.USERS)


def analyses_collection() -> AsyncIOMotorCollection:
    return get_collection(Collections.ANALYSES)


def products_collection() -> AsyncIOMotorCollection:
    return get_collection(Collections.PRODUCTS)


def transactions_collection() -> AsyncIOMotorCollection:
    return get_collection(Collections.TRANSACTIONS)


def carbon_offsets_collection() -> AsyncIOMotorCollection:
    return get_collection(Collections.CARBON_OFFSETS)


def sessions_collection() -> AsyncIOMotorCollection:
    return get_collection(Collections.SESSIONS)


def analytics_collection() -> AsyncIOMotorCollection:
    return get_collection(Collections.ANALYTICS)


def redirect_links_collection() -> AsyncIOMotorCollection:
    return get_collection(Collections.REDIRECT_LINKS)
