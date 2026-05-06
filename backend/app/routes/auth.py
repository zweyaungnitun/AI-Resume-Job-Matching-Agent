"""Authentication routes for Google OAuth 2.0, password auth, and JWT"""

import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.config import settings
from app.services.auth_service import AuthService
from app.dependencies.auth import get_current_user
from app.database import get_db
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])


class AuthUser(BaseModel):
    email: str
    name: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None


class GoogleTokenRequest(BaseModel):
    id_token: str


@router.get("/login")
async def login():
    """
    Redirect to Google OAuth consent screen.
    Frontend should redirect here to start login flow.
    """
    google_auth_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.GOOGLE_CLIENT_ID}"
        f"&redirect_uri={settings.GOOGLE_OAUTH_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=openid%20email%20profile"
        f"&access_type=offline"
    )
    logger.info("[AUTH] Redirecting to Google OAuth")
    return RedirectResponse(url=google_auth_url)


@router.get("/callback")
async def oauth_callback(
    code: str = Query(...), state: Optional[str] = None, db: Session = Depends(get_db)
):
    """
    Google OAuth callback endpoint.
    Exchanges authorization code for tokens and stores/updates user.
    """
    try:
        logger.info("[AUTH] Processing OAuth callback")

        # Exchange code for Google tokens
        google_tokens = await AuthService.exchange_code_for_token(code)
        id_token_str = google_tokens.get("id_token")

        if not id_token_str:
            logger.error("[AUTH] No ID token in response")
            raise ValueError("No ID token received")

        # Verify and extract user info
        user_info = AuthService.verify_id_token(id_token_str)

        # Find or create user in database
        user = db.query(User).filter(User.email == user_info["email"]).first()
        if not user:
            user = User(
                email=user_info["email"],
                name=user_info.get("name"),
                picture=user_info.get("picture"),
                auth_method="google",
                is_active=True,
            )
            db.add(user)
            logger.info(f"[AUTH] New user created via Google OAuth: {user.email}")
        else:
            # Update user info if changed
            if user_info.get("name"):
                user.name = user_info.get("name")
            if user_info.get("picture"):
                user.picture = user_info.get("picture")
            if user.auth_method == "password":
                user.auth_method = "both"
            logger.info(f"[AUTH] User logged in via Google OAuth: {user.email}")

        db.commit()
        db.refresh(user)

        # Create JWT tokens
        access_token = AuthService.create_access_token(
            email=user.email, name=user.name
        )
        refresh_token = AuthService.create_refresh_token(user.email)

        # Redirect to frontend with tokens
        frontend_url = settings.ALLOWED_ORIGINS[0]
        redirect_url = (
            f"{frontend_url}?access_token={access_token}&refresh_token={refresh_token}"
        )
        return RedirectResponse(url=redirect_url)

    except Exception as e:
        logger.error(f"[AUTH] OAuth callback failed: {e}")
        return JSONResponse(
            status_code=400,
            content={"error": "Authentication failed", "detail": str(e)},
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(request: RefreshTokenRequest):
    """Refresh expired access token using refresh token"""
    try:
        new_access_token = AuthService.verify_refresh_token(request.refresh_token)
        logger.info("[AUTH] Access token refreshed")
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=request.refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
    except ValueError as e:
        logger.warning(f"[AUTH] Token refresh failed: {e}")
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/logout")
async def logout(user=Depends(get_current_user)):
    """
    Logout endpoint (invalidates tokens on frontend).
    Frontend should delete stored tokens after calling this.
    """
    logger.info(f"[AUTH] User logged out: {user['email']}")
    return {"message": "Logged out successfully"}


@router.post("/signup", response_model=TokenResponse)
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """
    Sign up with email and password.
    Creates a new user account.
    """
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == request.email).first()
        if existing_user:
            logger.warning(f"[AUTH] Signup failed: user already exists: {request.email}")
            raise HTTPException(status_code=400, detail="User already exists")

        # Hash password
        password_hash = AuthService.hash_password(request.password)

        # Create user
        user = User(
            email=request.email,
            name=request.name,
            password_hash=password_hash,
            auth_method="password",
            is_active=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Create JWT tokens
        access_token = AuthService.create_access_token(
            email=user.email, name=user.name
        )
        refresh_token = AuthService.create_refresh_token(user.email)

        logger.info(f"[AUTH] New user signed up: {user.email}")

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AUTH] Signup error: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Signup failed")


@router.post("/login-password", response_model=TokenResponse)
async def login_password(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with email and password.
    Returns JWT tokens for authenticated requests.
    """
    try:
        # Find user
        user = db.query(User).filter(User.email == request.email).first()
        if not user or not user.password_hash:
            logger.warning(f"[AUTH] Login failed: user not found: {request.email}")
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Verify password
        if not AuthService.verify_password(request.password, user.password_hash):
            logger.warning(f"[AUTH] Login failed: invalid password: {request.email}")
            raise HTTPException(status_code=401, detail="Invalid email or password")

        # Check if account is active
        if not user.is_active:
            logger.warning(f"[AUTH] Login failed: account inactive: {request.email}")
            raise HTTPException(status_code=403, detail="Account is inactive")

        # Create JWT tokens
        access_token = AuthService.create_access_token(
            email=user.email, name=user.name
        )
        refresh_token = AuthService.create_refresh_token(user.email)

        logger.info(f"[AUTH] User logged in with password: {user.email}")

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AUTH] Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")


@router.post("/google", response_model=TokenResponse)
async def google_login(request: GoogleTokenRequest, db: Session = Depends(get_db)):
    """
    Exchange Google ID token for backend JWT tokens.
    Used by frontend Google Sign-In button.
    """
    try:
        logger.info("[AUTH] Processing Google ID token exchange")

        # Verify and extract user info from ID token
        user_info = AuthService.verify_id_token(request.id_token)

        # Find or create user in database
        user = db.query(User).filter(User.email == user_info["email"]).first()
        if not user:
            user = User(
                email=user_info["email"],
                name=user_info.get("name"),
                picture=user_info.get("picture"),
                auth_method="google",
                is_active=True,
            )
            db.add(user)
            logger.info(f"[AUTH] New user created via Google: {user.email}")
        else:
            # Update user info if changed
            if user_info.get("name"):
                user.name = user_info.get("name")
            if user_info.get("picture"):
                user.picture = user_info.get("picture")
            if user.auth_method == "password":
                user.auth_method = "both"
            logger.info(f"[AUTH] User logged in via Google: {user.email}")

        db.commit()
        db.refresh(user)

        # Create JWT tokens
        access_token = AuthService.create_access_token(
            email=user.email, name=user.name
        )
        refresh_token = AuthService.create_refresh_token(user.email)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    except Exception as e:
        logger.error(f"[AUTH] Google token exchange failed: {e}")
        raise HTTPException(status_code=401, detail="Google authentication failed")


@router.get("/me", response_model=AuthUser)
async def get_current_user_info(user=Depends(get_current_user)):
    """Get current authenticated user info"""
    logger.debug(f"[AUTH] Retrieved user info for {user['email']}")
    return AuthUser(email=user["email"], name=user.get("name"))
