"""User model for database"""

from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    email = Column(String, primary_key=True, index=True, unique=True)
    name = Column(String, nullable=True)
    picture = Column(String, nullable=True)

    # Password auth
    password_hash = Column(String, nullable=True)  # NULL if using OAuth only

    # Account status
    is_active = Column(Boolean, default=True)
    auth_method = Column(String, default="password")  # "password", "google", or "both"

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
