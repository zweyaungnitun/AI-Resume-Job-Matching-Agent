from pydantic_settings import BaseSettings
from typing import List, Optional
from datetime import timedelta
import json
import os

class Settings(BaseSettings):
    # Application
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"

    # Security
    SECRET_KEY: str  # Generate with: python -c "import secrets; print(secrets.token_urlsafe(32))"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    SECURITY_STRICT_MODE: bool = False
    ENABLE_AGENT_PROCTORING: bool = True
    MAX_AGENT_INPUT_CHARS: int = 30000
    AGENT_MONITORING_ENABLED: bool = True

    # API
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Google OAuth (optional if using client_secret.json)
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_OAUTH_REDIRECT_URI: str = "http://localhost:3000/auth/google/callback"

    # Google Gemini
    GOOGLE_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # Pinecone
    PINECONE_API_KEY: str
    PINECONE_ENVIRONMENT: str
    PINECONE_INDEX: str = "job-listings"

    # Optional web search API keys
    SERPER_API_KEY: Optional[str] = None
    TAVILY_API_KEY: Optional[str] = None
    GOOGLE_SEARCH_API_KEY: Optional[str] = None
    GOOGLE_SEARCH_ENGINE_ID: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True

# Load credentials from JSON file if it exists, otherwise use env vars
def load_google_oauth_credentials():
    credentials_files = [
        "client_secret.json",
        "credentials.json",
    ]

    for filename in credentials_files:
        if os.path.exists(filename):
            try:
                with open(filename) as f:
                    creds = json.load(f)
                    # Handle different JSON formats
                    if "installed" in creds:
                        creds = creds["installed"]
                    elif "web" in creds:
                        creds = creds["web"]

                    print(f"✓ Loaded Google OAuth credentials from {filename}")
                    return {
                        "client_id": creds.get("client_id"),
                        "client_secret": creds.get("client_secret"),
                    }
            except Exception as e:
                print(f"⚠ Warning: Could not read {filename}: {e}")

    return None

# Try to load from JSON first
oauth_creds = load_google_oauth_credentials()

# Create settings instance
settings = Settings()

# Override with JSON credentials if found
if oauth_creds:
    settings.GOOGLE_CLIENT_ID = oauth_creds["client_id"]
    settings.GOOGLE_CLIENT_SECRET = oauth_creds["client_secret"]
elif not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
    print(
        "⚠ Google OAuth credentials not configured. "
        "Google login will be unavailable — password auth still works.\n"
        "To enable Google login, set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env "
        "or place 'client_secret.json' in the backend directory."
    )
