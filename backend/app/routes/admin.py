import logging
import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.dependencies.auth import get_current_user
from app.database import get_db
from app.models.ai_interaction import AIInteraction
from app.models.admin_audit import AdminAuditLog, RateLimitConfig
from app.config import settings
from app.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])


class UpdateSettingsRequest(BaseModel):
    enable_proctoring: bool
    strict_mode: bool
    mask_pii: bool
    rate_limit: int


class UpdateRateLimitRequest(BaseModel):
    endpoint: str
    limit_per_minute: int
    limit_per_hour: int


class MakeAdminRequest(BaseModel):
    email: str
    make_admin: bool


def require_admin(user=Depends(get_current_user), x_forwarded_for: str = Header(None)):
    """Verify user is admin. Raise 403 if not."""
    if not user.get("is_admin", False):
        logger.warning(f"[ADMIN] Non-admin user {user.get('email')} attempted admin access")
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def get_client_ip(x_forwarded_for: str = Header(None)) -> str:
    """Extract client IP from X-Forwarded-For or assume localhost"""
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return "127.0.0.1"


def log_admin_action(
    db: Session, admin_email: str, action: str, resource: str = None,
    old_value: str = None, new_value: str = None, ip_address: str = "127.0.0.1",
    status: str = "success", details: str = None
):
    """Log admin action to audit trail"""
    audit = AdminAuditLog(
        admin_email=admin_email,
        action=action,
        resource=resource,
        old_value=old_value,
        new_value=new_value,
        ip_address=ip_address,
        status=status,
        details=details
    )
    db.add(audit)
    db.commit()
    logger.info(f"[AUDIT] Admin {admin_email} performed {action} on {resource} from {ip_address}")


@router.get("/summary")
async def get_summary_metrics(
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Retrieve high-level AIOps telemetry aggregates for dashboard hero cards."""
    try:
        total_calls = db.query(AIInteraction).count()
        
        # Calculate latency averages
        avg_latency = db.query(func.avg(AIInteraction.duration_ms)).scalar() or 0.0
        
        # Calculate tokens
        total_prompt_tokens = db.query(func.sum(AIInteraction.prompt_tokens)).scalar() or 0
        total_completion_tokens = db.query(func.sum(AIInteraction.completion_tokens)).scalar() or 0
        total_tokens = total_prompt_tokens + total_completion_tokens
        
        # Calculate costs
        total_cost = db.query(func.sum(AIInteraction.estimated_cost)).scalar() or 0.0
        
        # Calculate blocks
        blocked_calls = db.query(AIInteraction).filter(AIInteraction.guardrail_status == "blocked").count()
        block_rate = (blocked_calls / total_calls * 100) if total_calls > 0 else 0.0
        
        # Calculate satisfaction (likes and dislikes)
        likes = db.query(AIInteraction).filter(AIInteraction.user_rating == 1).count()
        dislikes = db.query(AIInteraction).filter(AIInteraction.user_rating == -1).count()
        total_ratings = likes + dislikes
        satisfaction_rate = (likes / total_ratings * 100) if total_ratings > 0 else 100.0

        return {
            "total_calls": total_calls,
            "avg_latency_ms": round(avg_latency, 2),
            "total_tokens": total_tokens,
            "total_cost_usd": round(total_cost, 6),
            "blocked_calls": blocked_calls,
            "block_rate_pct": round(block_rate, 2),
            "likes": likes,
            "dislikes": dislikes,
            "satisfaction_rate_pct": round(satisfaction_rate, 1),
            "guardrail_status_active": settings.ENABLE_AGENT_PROCTORING,
            "strict_mode_active": settings.AIOPS_GUARDRAIL_STRICT_MODE,
            "pii_masking_active": settings.AIOPS_MASK_PII_LOGS,
            "rate_limit_per_min": settings.AIOPS_RATE_LIMIT_PER_MIN
        }
    except Exception as e:
        logger.error("[ADMIN_METRICS] Failed to calculate summary statistics: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Failed to load dashboard metrics: {str(e)}")


@router.get("/logs")
async def get_activity_logs(
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Retrieve recent AI interactions and audit trail records."""
    try:
        logs = db.query(AIInteraction).order_by(AIInteraction.created_at.desc()).limit(50).all()
        
        result = []
        for log in logs:
            result.append({
                "id": log.id,
                "user_email": log.user_email or "anonymous",
                "endpoint": log.endpoint,
                "prompt_chars": log.prompt_chars,
                "response_chars": log.response_chars,
                "prompt_tokens": log.prompt_tokens,
                "completion_tokens": log.completion_tokens,
                "estimated_cost": round(log.estimated_cost, 6),
                "duration_ms": round(log.duration_ms, 2),
                "guardrail_status": log.guardrail_status,
                "guardrail_reason": log.guardrail_reason,
                "user_rating": log.user_rating,
                "created_at": log.created_at.isoformat() if log.created_at else None
            })
        return result
    except Exception as e:
        logger.error("[ADMIN_METRICS] Failed to load telemetry logs: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to load transaction audit trail")


@router.get("/blocks")
async def get_blocked_events(
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Retrieve list of blocked operations caused by safety guardrails."""
    try:
        blocks = db.query(AIInteraction).filter(AIInteraction.guardrail_status == "blocked").order_by(AIInteraction.created_at.desc()).limit(50).all()
        
        result = []
        for block in blocks:
            result.append({
                "id": block.id,
                "user_email": block.user_email or "anonymous",
                "endpoint": block.endpoint,
                "duration_ms": round(block.duration_ms, 2),
                "guardrail_reason": block.guardrail_reason,
                "created_at": block.created_at.isoformat() if block.created_at else None
            })
        return result
    except Exception as e:
        logger.error("[ADMIN_METRICS] Failed to retrieve security block lists: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to load safety blocks lists")


@router.get("/time-series")
async def get_time_series_metrics(
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Retrieve daily time-series aggregates for the past 7 days to display trend charts."""
    try:
        series = []
        today = datetime.utcnow().date()
        
        # Aggregate daily data for the past 7 days
        for i in range(6, -1, -1):
            target_date = today - timedelta(days=i)
            start_dt = datetime.combine(target_date, datetime.min.time())
            end_dt = datetime.combine(target_date, datetime.max.time())
            
            day_calls = db.query(AIInteraction).filter(
                AIInteraction.created_at >= start_dt,
                AIInteraction.created_at <= end_dt
            ).count()
            
            day_cost = db.query(func.sum(AIInteraction.estimated_cost)).filter(
                AIInteraction.created_at >= start_dt,
                AIInteraction.created_at <= end_dt
            ).scalar() or 0.0
            
            day_blocks = db.query(AIInteraction).filter(
                AIInteraction.created_at >= start_dt,
                AIInteraction.created_at <= end_dt,
                AIInteraction.guardrail_status == "blocked"
            ).count()
            
            day_latency = db.query(func.avg(AIInteraction.duration_ms)).filter(
                AIInteraction.created_at >= start_dt,
                AIInteraction.created_at <= end_dt
            ).scalar() or 0.0

            series.append({
                "date": target_date.strftime("%b %d"),
                "requests": day_calls,
                "cost_usd": round(day_cost, 6),
                "blocks": day_blocks,
                "avg_latency_ms": round(day_latency, 2)
            })
            
        return series
    except Exception as e:
        logger.error("[ADMIN_METRICS] Failed to generate time-series telemetry data: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to assemble time-series charts data")


@router.post("/settings")
async def update_guardrail_settings(
    request: UpdateSettingsRequest,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
    x_forwarded_for: str = Header(None)
):
    """Dynamically modify AI operations and security configurations at runtime."""
    try:
        ip_address = get_client_ip(x_forwarded_for)
        old_settings = {
            "enable_proctoring": settings.ENABLE_AGENT_PROCTORING,
            "strict_mode": settings.AIOPS_GUARDRAIL_STRICT_MODE,
            "mask_pii": settings.AIOPS_MASK_PII_LOGS,
            "rate_limit": settings.AIOPS_RATE_LIMIT_PER_MIN
        }

        settings.ENABLE_AGENT_PROCTORING = request.enable_proctoring
        settings.AIOPS_GUARDRAIL_STRICT_MODE = request.strict_mode
        settings.AIOPS_MASK_PII_LOGS = request.mask_pii
        settings.AIOPS_RATE_LIMIT_PER_MIN = request.rate_limit

        new_settings = {
            "enable_proctoring": settings.ENABLE_AGENT_PROCTORING,
            "strict_mode": settings.AIOPS_GUARDRAIL_STRICT_MODE,
            "mask_pii": settings.AIOPS_MASK_PII_LOGS,
            "rate_limit": settings.AIOPS_RATE_LIMIT_PER_MIN
        }

        log_admin_action(
            db, admin["email"], "settings_update", "guardrail_settings",
            json.dumps(old_settings), json.dumps(new_settings), ip_address
        )

        logger.info(
            "[ADMIN_SETTINGS] Updated config: proctoring=%s, strict=%s, mask=%s, rate_limit=%s",
            settings.ENABLE_AGENT_PROCTORING,
            settings.AIOPS_GUARDRAIL_STRICT_MODE,
            settings.AIOPS_MASK_PII_LOGS,
            settings.AIOPS_RATE_LIMIT_PER_MIN
        )
        return {
            "status": "success",
            "message": "AI operations configurations updated successfully",
            "settings": new_settings
        }
    except Exception as e:
        logger.error("[ADMIN_SETTINGS] Failed to modify configurations: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Failed to save settings: {str(e)}")


@router.get("/audit-logs")
async def get_audit_logs(
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
    limit: int = 100
):
    """Retrieve admin audit trail."""
    try:
        logs = db.query(AdminAuditLog).order_by(
            AdminAuditLog.created_at.desc()
        ).limit(limit).all()

        result = []
        for log in logs:
            result.append({
                "id": log.id,
                "admin_email": log.admin_email,
                "action": log.action,
                "resource": log.resource,
                "old_value": log.old_value,
                "new_value": log.new_value,
                "ip_address": log.ip_address,
                "status": log.status,
                "details": log.details,
                "created_at": log.created_at.isoformat() if log.created_at else None
            })
        return result
    except Exception as e:
        logger.error("[ADMIN] Failed to retrieve audit logs: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to load audit logs")


@router.post("/rate-limits")
async def update_rate_limit(
    request: UpdateRateLimitRequest,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
    x_forwarded_for: str = Header(None)
):
    """Update rate limit configuration for an endpoint."""
    try:
        ip_address = get_client_ip(x_forwarded_for)

        existing = db.query(RateLimitConfig).filter(
            RateLimitConfig.name == request.endpoint
        ).first()

        if existing:
            old_value = {
                "limit_per_minute": existing.limit_per_minute,
                "limit_per_hour": existing.limit_per_hour
            }
            existing.limit_per_minute = request.limit_per_minute
            existing.limit_per_hour = request.limit_per_hour
            existing.updated_by = admin["email"]
        else:
            old_value = None
            existing = RateLimitConfig(
                name=request.endpoint,
                limit_per_minute=request.limit_per_minute,
                limit_per_hour=request.limit_per_hour,
                updated_by=admin["email"]
            )
            db.add(existing)

        db.commit()

        new_value = {
            "limit_per_minute": existing.limit_per_minute,
            "limit_per_hour": existing.limit_per_hour
        }

        log_admin_action(
            db, admin["email"], "rate_limit_update", request.endpoint,
            json.dumps(old_value) if old_value else None,
            json.dumps(new_value), ip_address
        )

        return {
            "status": "success",
            "message": f"Rate limit updated for {request.endpoint}",
            "endpoint": request.endpoint,
            "limit_per_minute": existing.limit_per_minute,
            "limit_per_hour": existing.limit_per_hour
        }
    except Exception as e:
        logger.error("[ADMIN] Failed to update rate limit: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to update rate limit")


@router.get("/rate-limits")
async def get_rate_limits(
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Retrieve all rate limit configurations."""
    try:
        configs = db.query(RateLimitConfig).all()
        result = []
        for config in configs:
            result.append({
                "name": config.name,
                "limit_per_minute": config.limit_per_minute,
                "limit_per_hour": config.limit_per_hour,
                "enabled": config.enabled,
                "updated_by": config.updated_by,
                "updated_at": config.updated_at.isoformat() if config.updated_at else None
            })
        return result
    except Exception as e:
        logger.error("[ADMIN] Failed to retrieve rate limits: %s", str(e))
        raise HTTPException(status_code=500, detail="Failed to load rate limits")
