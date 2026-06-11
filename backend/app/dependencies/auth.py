"""Authentication dependencies for FastAPI routes"""

import logging
from fastapi import HTTPException, Header
from app.services.auth_service import AuthService

logger = logging.getLogger(__name__)


async def get_current_user(authorization: str = Header(...)):
    """
    Dependency to verify JWT access token and extract user info.
    Expects: Authorization: Bearer <jwt_token>
    """
    if not authorization.startswith("Bearer "):
        logger.warning("[AUTH] Invalid authorization header format")
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.split(" ", 1)[1]

    try:
        payload = AuthService.verify_access_token(token)
        user = {
            "email": payload.get("email"),
            "name": payload.get("name"),
            "is_admin": payload.get("is_admin", False),
        }
        logger.debug(f"[AUTH] User authenticated: {user['email']} (admin={user['is_admin']})")
        return user

    except ValueError as e:
        logger.warning(f"[AUTH] Token verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        logger.error(f"[AUTH] Unexpected error: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")
