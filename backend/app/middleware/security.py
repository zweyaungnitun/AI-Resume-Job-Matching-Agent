"""Security and monitoring middleware."""

import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.config import settings
from app.logger import get_logger

logger = get_logger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Legacy browser protection header
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # Prevent referrer leakage
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Lock down browser APIs
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

        # Restrict where the page can navigate from
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"

        # Strict transport security (only HTTPS)
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        # Content security policy
        csp = (
            "default-src 'self'; "
            "base-uri 'self'; "
            "frame-ancestors 'none'; "
            "object-src 'none'; "
            "form-action 'self'"
        )
        if settings.SECURITY_STRICT_MODE:
            csp += "; upgrade-insecure-requests"
        response.headers["Content-Security-Policy"] = csp

        return response


class RequestMonitoringMiddleware(BaseHTTPMiddleware):
    """Attach request IDs and log API performance for monitoring."""

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        start = time.perf_counter()

        response = await call_next(request)

        elapsed_ms = (time.perf_counter() - start) * 1000
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time-Ms"] = f"{elapsed_ms:.2f}"

        if settings.AGENT_MONITORING_ENABLED and request.url.path.startswith("/agent"):
            logger.info(
                "[AGENT_MONITOR] request_id=%s method=%s path=%s status=%s duration_ms=%.2f",
                request_id,
                request.method,
                request.url.path,
                response.status_code,
                elapsed_ms,
            )

        return response
