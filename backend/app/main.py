"""
EcoCart FastAPI Application Entry Point
---------------------------------------
Configures the FastAPI application with:
- Lifespan context (DB connect/disconnect)
- CORS middleware
- Rate limiting
- Global exception handlers
- All API routers
- Sentry integration
"""

import logging
import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import sentry_sdk
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

from app.config import settings
from app.database.mongodb import connect_db, close_db, ping_db
from app.database.redis_client import connect_redis, close_redis

# ── Logging Setup ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("ecocart")

# ── Sentry (optional monitoring) ───────────────────────────────────────────────
if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        traces_sample_rate=0.2,
        profiles_sample_rate=0.1,
    )
    logger.info("Sentry monitoring enabled")


# ── Rate Limiter ───────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.rate_limit_per_minute}/minute"])


# ── Lifespan (startup / shutdown) ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Handle application startup and shutdown events."""
    logger.info("🚀 EcoCart API starting up...")

    # Connect to databases
    await connect_db()
    await connect_redis()

    # Verify connectivity
    db_ok = await ping_db()
    if db_ok:
        logger.info("✅ MongoDB connected successfully")
    else:
        logger.warning("⚠️  MongoDB connection could not be verified — proceeding anyway")

    logger.info(f"🌿 EcoCart API ready | env={settings.environment} | version={settings.api_version}")

    yield  # Application runs here

    # Shutdown
    logger.info("🛑 EcoCart API shutting down...")
    await close_db()
    await close_redis()
    logger.info("✅ Connections closed gracefully")


# ── FastAPI App ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="EcoCart API",
    description=(
        "🌿 **EcoCart** — AI-powered sustainable shopping platform. \n\n"
        "Analyze receipts, track your carbon footprint, find eco-friendly alternatives, "
        "and offset your environmental impact.\n\n"
        "**Authentication**: Use `Bearer <access_token>` in the Authorization header.\n"
        "Obtain tokens via `/api/v1/auth/login` or `/api/v1/auth/register`."
    ),
    version=settings.api_version,
    openapi_url="/api/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    contact={
        "name": "EcoCart Support",
        "email": "support@ecocart.com",
        "url": "https://ecocart.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
)

# ── Middleware ─────────────────────────────────────────────────────────────────

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID", "X-Process-Time"],
)

# Added security headers for Google OAuth on localhost
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    # Required for Google Identity Services / One Tap / FedCM on localhost
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    response.headers["Cross-Origin-Embedder-Policy"] = "unsafe-none"
    return response

# Rate limiting
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add X-Process-Time header to all responses."""
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """Log all incoming requests."""
    logger.info(
        f"→ {request.method} {request.url.path} "
        f"[client={request.client.host if request.client else 'unknown'}]"
    )
    response = await call_next(request)
    logger.info(
        f"← {request.method} {request.url.path} "
        f"[status={response.status_code}]"
    )
    return response


# ── Exception Handlers ─────────────────────────────────────────────────────────

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "error": "rate_limit_exceeded",
            "message": "Too many requests. Please slow down.",
            "detail": str(exc.detail),
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "validation_error",
            "message": "Request validation failed",
            "detail": exc.errors(),
        },
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "http_error",
            "message": exc.detail,
            "status_code": exc.status_code,
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception for {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "internal_server_error",
            "message": "An unexpected error occurred. Our team has been notified.",
        },
    )


# ── API Routers ────────────────────────────────────────────────────────────────
from app.api.routes import (  # noqa: E402 — must be after app creation
    health,
    auth,
    analyze,
    products,
    users,
    history,
)

API_PREFIX = f"/api/v{settings.api_version.split('.')[0]}"

app.include_router(health.router, prefix=API_PREFIX, tags=["Health"])
app.include_router(auth.router, prefix=f"{API_PREFIX}/auth", tags=["Authentication"])
app.include_router(analyze.router, prefix=f"{API_PREFIX}/analyze", tags=["Receipt Analysis"])
app.include_router(products.router, prefix=f"{API_PREFIX}/products", tags=["Products"])
app.include_router(users.router, prefix=f"{API_PREFIX}/users", tags=["Users"])
app.include_router(history.router, prefix=f"{API_PREFIX}/history", tags=["History"])


# ── Root Endpoint ──────────────────────────────────────────────────────────────
@app.get("/", include_in_schema=False)
async def root():
    return {
        "name": "EcoCart API",
        "version": settings.api_version,
        "environment": settings.environment,
        "docs": "/docs",
        "health": f"{API_PREFIX}/health",
    }
