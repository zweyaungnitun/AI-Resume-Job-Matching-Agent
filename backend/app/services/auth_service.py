"""Authentication service for Google OAuth, password auth, and JWT token management"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import httpx
import jwt
import bcrypt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.config import settings

logger = logging.getLogger(__name__)


class AuthService:
    """Handles OAuth 2.0, password auth, and JWT token management"""

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt(rounds=12)
        return bcrypt.hashpw(password.encode(), salt).decode()

    @staticmethod
    def verify_password(password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode(), password_hash.encode())

    @staticmethod
    async def exchange_code_for_token(code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for Google tokens.
        Part of OAuth 2.0 authorization code flow (secure server-side exchange).
        """
        token_url = "https://oauth2.googleapis.com/token"

        async with httpx.AsyncClient() as client:
            response = await client.post(
                token_url,
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_OAUTH_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
            )

        if response.status_code != 200:
            logger.error(f"[AUTH] Failed to exchange code: {response.text}")
            raise ValueError("Failed to exchange authorization code")

        return response.json()

    @staticmethod
    def verify_id_token(id_token_str: str) -> Dict[str, Any]:
        """Verify Google ID token and extract user info"""
        try:
            info = id_token.verify_oauth2_token(
                id_token_str, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )

            # Verify token is from Google and for this app
            if info.get("aud") != settings.GOOGLE_CLIENT_ID:
                raise ValueError("Invalid audience")

            return {
                "email": info["email"],
                "name": info.get("name"),
                "picture": info.get("picture"),
                "email_verified": info.get("email_verified", False),
            }
        except Exception as e:
            logger.error(f"[AUTH] Token verification failed: {e}")
            raise ValueError("Invalid ID token")

    @staticmethod
    def create_access_token(email: str, name: Optional[str] = None, auth_method: str = "password", is_admin: bool = False) -> str:
        """Create JWT access token"""
        payload = {
            "email": email,
            "name": name,
            "auth_method": auth_method,
            "is_admin": is_admin,
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
            "type": "access",
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    def create_refresh_token(email: str) -> str:
        """Create JWT refresh token (longer expiry)"""
        payload = {
            "email": email,
            "iat": datetime.utcnow(),
            "exp": datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            "type": "refresh",
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    @staticmethod
    def verify_access_token(token: str) -> Dict[str, Any]:
        """Verify and decode JWT access token"""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            if payload.get("type") != "access":
                raise ValueError("Invalid token type")
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("[AUTH] Access token expired")
            raise ValueError("Token expired")
        except jwt.InvalidTokenError as e:
            logger.error(f"[AUTH] Invalid token: {e}")
            raise ValueError("Invalid token")

    @staticmethod
    def verify_refresh_token(token: str) -> str:
        """Verify refresh token and return new access token"""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            if payload.get("type") != "refresh":
                raise ValueError("Invalid token type")

            email = payload.get("email")
            if not email:
                raise ValueError("Missing email in token")

            return AuthService.create_access_token(
                email=email,
                name=payload.get("name"),
                auth_method=payload.get("auth_method", "password"),
                is_admin=payload.get("is_admin", False)
            )
        except jwt.ExpiredSignatureError:
            logger.warning("[AUTH] Refresh token expired")
            raise ValueError("Refresh token expired")
        except jwt.InvalidTokenError as e:
            logger.error(f"[AUTH] Invalid refresh token: {e}")
            raise ValueError("Invalid refresh token")
