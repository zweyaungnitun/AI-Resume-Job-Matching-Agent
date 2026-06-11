"""Admin audit log model for tracking admin actions"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_email = Column(String, index=True)
    action = Column(String)  # "login", "settings_update", "rate_limit_change", etc.
    resource = Column(String, nullable=True)  # what was modified
    old_value = Column(Text, nullable=True)  # JSON of old value
    new_value = Column(Text, nullable=True)  # JSON of new value
    ip_address = Column(String, nullable=True)
    status = Column(String, default="success")  # "success" or "failed"
    details = Column(Text, nullable=True)  # error message if failed
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)


class RateLimitConfig(Base):
    __tablename__ = "rate_limit_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)  # e.g., "default", "api_resume", "api_agent"
    limit_per_minute = Column(Integer, default=60)
    limit_per_hour = Column(Integer, default=1000)
    enabled = Column(Boolean, default=True)
    updated_by = Column(String)  # admin email
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
