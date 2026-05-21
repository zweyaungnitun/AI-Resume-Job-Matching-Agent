import time
import json
from collections import defaultdict
from typing import Tuple, Optional, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.config import settings
from app.logger import get_logger
from app.models.ai_interaction import AIInteraction
from app.services.ai_proctoring_service import AIProctoringService

logger = get_logger(__name__)


class AIOpsRateLimiter:
    """Fast, in-memory token-bucket rate limiter for AI operations to mitigate DoS / prompt abuse."""
    
    def __init__(self):
        self.requests = defaultdict(list)

    def is_allowed(self, key: str, limit: int) -> bool:
        now = time.time()
        # Filter requests within the last 60 seconds
        self.requests[key] = [t for t in self.requests[key] if now - t < 60]
        if len(self.requests[key]) >= limit:
            return False
        self.requests[key].append(now)
        return True


rate_limiter = AIOpsRateLimiter()


class AIOpsService:
    """Core AIOps observability & guardrails engine."""

    @staticmethod
    def process_ai_interaction(
        db: Session,
        user_email: Optional[str],
        endpoint: str,
        prompt_text: str,
        exec_callable,
        expect_json: bool = False
    ) -> Any:
        """
        Executes an AI operations wrapper with:
        1. Rate Limiting Check
        2. Inbound Guardrails Validation
        3. PII Scrubbing / Masking
        4. Operational Timer
        5. Token/Cost Estimation
        6. Outbound Guardrails Validation
        7. Audit Log Persistence
        """
        # 1. Rate Limiting
        rate_limit_key = user_email or "anonymous"
        limit = settings.AIOPS_RATE_LIMIT_PER_MIN
        if not rate_limiter.is_allowed(rate_limit_key, limit):
            # Log as blocked due to Rate Limit
            AIOpsService._log_interaction_direct(
                db=db,
                user_email=user_email,
                endpoint=endpoint,
                prompt_chars=len(prompt_text),
                response_chars=0,
                prompt_tokens=len(prompt_text) // 4,
                completion_tokens=0,
                estimated_cost=0.0,
                duration_ms=0.0,
                status="blocked",
                reason="Rate Limit Exceeded"
            )
            logger.warning("[AIOPS_SECURITY] Rate limit exceeded for key=%s on endpoint=%s", rate_limit_key, endpoint)
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Too many requests to the AI agent."
            )

        # 2. Inbound Safety Guardrails
        is_safe, block_reason = AIProctoringService.check_input_safety(prompt_text)
        if not is_safe:
            AIOpsService._log_interaction_direct(
                db=db,
                user_email=user_email,
                endpoint=endpoint,
                prompt_chars=len(prompt_text),
                response_chars=0,
                prompt_tokens=len(prompt_text) // 4,
                completion_tokens=0,
                estimated_cost=0.0,
                duration_ms=0.0,
                status="blocked",
                reason=block_reason or "Input Guardrail Blocked"
            )
            logger.warning("[AIOPS_SECURITY] Input guardrail block: %s on endpoint=%s", block_reason, endpoint)
            raise HTTPException(
                status_code=400,
                detail=f"Safety guardrails blocked this request: {block_reason}"
            )

        # 3. PII Scrubbing / Masking for complying with privacy standards
        processed_prompt = prompt_text
        if settings.AIOPS_MASK_PII_LOGS:
            processed_prompt = AIProctoringService.mask_pii(prompt_text)

        # 4. Execute with performance timing
        start_time = time.perf_counter()
        error_occurred = False
        error_detail = None
        raw_response = None

        try:
            # Execute actual LLM callback / orchestrator function
            raw_response = exec_callable(processed_prompt)
        except Exception as e:
            error_occurred = True
            error_detail = str(e)
            logger.error("[AIOPS_SERVICE] Error executing AI function: %s", error_detail, exc_info=True)

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        # Handlers for system execution crashes
        if error_occurred:
            AIOpsService._log_interaction_direct(
                db=db,
                user_email=user_email,
                endpoint=endpoint,
                prompt_chars=len(processed_prompt),
                response_chars=0,
                prompt_tokens=len(processed_prompt) // 4,
                completion_tokens=0,
                estimated_cost=0.0,
                duration_ms=elapsed_ms,
                status="flagged",
                reason=f"LLM Error: {error_detail}"
            )
            raise HTTPException(
                status_code=500,
                detail=f"AI Service Execution Error: {error_detail}"
            )

        # Handle formatting of response to string for token and output validation
        if isinstance(raw_response, (dict, list)):
            response_text = json.dumps(raw_response)
        else:
            response_text = str(raw_response)

        # 5. Outbound Guardrails Validation
        is_resp_safe, resp_block_reason = AIProctoringService.check_output_safety(response_text, expect_json=expect_json)
        if not is_resp_safe:
            AIOpsService._log_interaction_direct(
                db=db,
                user_email=user_email,
                endpoint=endpoint,
                prompt_chars=len(processed_prompt),
                response_chars=len(response_text),
                prompt_tokens=len(processed_prompt) // 4,
                completion_tokens=len(response_text) // 4,
                estimated_cost=0.0,
                duration_ms=elapsed_ms,
                status="blocked",
                reason=resp_block_reason or "Output Guardrail Blocked"
            )
            logger.warning("[AIOPS_SECURITY] Output guardrail block: %s on endpoint=%s", resp_block_reason, endpoint)
            raise HTTPException(
                status_code=500,
                detail="AI output validation failed due to safety, privacy or structural concerns."
            )

        # 6. Calculate token and cost structures
        # Avg cost for Gemini 2.0 Flash: $0.075 / 1M input tokens, $0.30 / 1M output tokens
        prompt_tokens = len(processed_prompt) // 4
        completion_tokens = len(response_text) // 4
        cost = (prompt_tokens * 0.075 / 1_000_000) + (completion_tokens * 0.30 / 1_000_000)

        # 7. Audit Log Persistence
        AIOpsService._log_interaction_direct(
            db=db,
            user_email=user_email,
            endpoint=endpoint,
            prompt_chars=len(processed_prompt),
            response_chars=len(response_text),
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            estimated_cost=cost,
            duration_ms=elapsed_ms,
            status="passed",
            reason=None
        )

        return raw_response

    @staticmethod
    def _log_interaction_direct(
        db: Session,
        user_email: Optional[str],
        endpoint: str,
        prompt_chars: int,
        response_chars: int,
        prompt_tokens: int,
        completion_tokens: int,
        estimated_cost: float,
        duration_ms: float,
        status: str,
        reason: Optional[str]
    ):
        """Asynchronously/synchronously write telemetry records to sqlite database."""
        try:
            interaction = AIInteraction(
                user_email=user_email,
                endpoint=endpoint,
                prompt_chars=prompt_chars,
                response_chars=response_chars,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                estimated_cost=estimated_cost,
                duration_ms=duration_ms,
                guardrail_status=status,
                guardrail_reason=reason,
                user_rating=0
            )
            db.add(interaction)
            db.commit()
            db.refresh(interaction)
        except Exception as e:
            logger.error("[AIOPS_SERVICE] Failed logging telemetry metric to DB: %s", str(e))
