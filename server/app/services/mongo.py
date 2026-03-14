# ─────────────────────────────────────────────────────────────────────────────
# MongoDB connection — graceful: routes return HTTP 503 when DB is unavailable.
# ─────────────────────────────────────────────────────────────────────────────

import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect() -> None:
    """Called at FastAPI startup. Fails silently if MONGODB_URI is not set."""
    global _client, _db
    uri = os.getenv("MONGODB_URI")
    if not uri:
        logger.warning("MONGODB_URI not set — database unavailable. Routes will return HTTP 503.")
        return
    try:
        _client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=5_000)
        # Verify connection is reachable
        await _client.admin.command("ping")
        _db = _client["carbonlens"]
        logger.info("MongoDB connected: %s", _db.name)
    except Exception as exc:
        _client = None
        _db = None
        logger.error("MongoDB connection failed: %s — routes will return HTTP 503.", exc)


async def disconnect() -> None:
    """Called at FastAPI shutdown."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None


def get_db() -> AsyncIOMotorDatabase:
    """
    Returns the connected database instance.
    Raises RuntimeError if the database is unavailable —
    routes must catch this and return HTTP 503.
    """
    if _db is None:
        raise RuntimeError("Database unavailable")
    return _db


def is_connected() -> bool:
    return _db is not None
