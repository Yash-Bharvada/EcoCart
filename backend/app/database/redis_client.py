"""
Redis Async Client
------------------
Async Redis connection using redis.asyncio with:
- Connection pool
- Retry logic
- Helper context manager
"""

import logging
from typing import Optional

import redis.asyncio as aioredis
from redis.asyncio import Redis
from redis.exceptions import ConnectionError as RedisConnectionError

from app.config import settings

logger = logging.getLogger(__name__)

_redis_client: Optional[Redis] = None


async def connect_redis() -> None:
    """Initialize the async Redis connection pool."""
    global _redis_client
    try:
        kwargs = {
            "decode_responses": True,
            "socket_connect_timeout": 5,
            "socket_timeout": 5,
            "retry_on_timeout": True,
            "health_check_interval": 30,
        }
        if settings.redis_password:
            kwargs["password"] = settings.redis_password

        _redis_client = aioredis.from_url(settings.redis_url, **kwargs)
        # Verify connection
        await _redis_client.ping()
        logger.info(f"✅ Redis connected | url={settings.redis_url}")
    except (RedisConnectionError, Exception) as e:
        logger.warning(f"⚠️  Redis connection failed: {e}. Caching will be disabled.")
        _redis_client = None


async def close_redis() -> None:
    """Close the Redis connection pool."""
    global _redis_client
    if _redis_client is not None:
        await _redis_client.aclose()
        _redis_client = None
        logger.info("Redis connection closed")


def get_redis() -> Optional[Redis]:
    """
    Return the Redis client, or None if not connected.
    Callers should handle None gracefully (cache miss scenario).
    """
    return _redis_client


async def ping_redis() -> bool:
    """Check if Redis is reachable."""
    if _redis_client is None:
        return False
    try:
        await _redis_client.ping()
        return True
    except Exception:
        return False


async def cache_set(key: str, value: str, ttl_seconds: int = 300) -> bool:
    """
    Set a value in Redis cache with TTL.

    Args:
        key: Cache key
        value: JSON-serializable string value
        ttl_seconds: Time to live in seconds (default 5 minutes)

    Returns:
        True if set successfully, False if Redis unavailable.
    """
    redis = get_redis()
    if redis is None:
        return False
    try:
        await redis.setex(key, ttl_seconds, value)
        return True
    except Exception as e:
        logger.warning(f"Cache set failed for key={key}: {e}")
        return False


async def cache_get(key: str) -> Optional[str]:
    """
    Get a value from Redis cache.

    Args:
        key: Cache key

    Returns:
        Cached string value or None (on miss or Redis unavailable).
    """
    redis = get_redis()
    if redis is None:
        return None
    try:
        return await redis.get(key)
    except Exception as e:
        logger.warning(f"Cache get failed for key={key}: {e}")
        return None


async def cache_delete(key: str) -> bool:
    """Delete a key from cache."""
    redis = get_redis()
    if redis is None:
        return False
    try:
        await redis.delete(key)
        return True
    except Exception as e:
        logger.warning(f"Cache delete failed for key={key}: {e}")
        return False


async def cache_delete_pattern(pattern: str) -> int:
    """
    Delete all keys matching a pattern (use carefully in production).

    Args:
        pattern: Glob pattern, e.g. "dashboard:user:*"

    Returns:
        Number of keys deleted.
    """
    redis = get_redis()
    if redis is None:
        return 0
    try:
        keys = [key async for key in redis.scan_iter(match=pattern)]
        if keys:
            return await redis.delete(*keys)
        return 0
    except Exception as e:
        logger.warning(f"Cache delete pattern failed for pattern={pattern}: {e}")
        return 0
