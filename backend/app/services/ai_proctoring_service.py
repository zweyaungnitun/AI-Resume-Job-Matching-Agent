"""Advanced AI input and output proctoring and guardrails."""

import re
import json
from typing import Iterable, Tuple, Optional
from fastapi import HTTPException

from app.config import settings
from app.logger import get_logger

logger = get_logger(__name__)


class AIProctoringService:
    """Applies advanced input/output safety guardrails, PII masking, and abuse checks."""

    # Inbound prompt injection, system leakage, and command injection patterns
    _blocked_patterns = [
        re.compile(r"ignore\s+all\s+previous\s+instructions", re.IGNORECASE),
        re.compile(r"system\s*prompt", re.IGNORECASE),
        re.compile(r"developer\s*message", re.IGNORECASE),
        re.compile(r"reveal\s+(your\s+)?(secrets|keys|tokens?)", re.IGNORECASE),
        re.compile(r"(api[_\-\s]?key|private[_\-\s]?key|secret[_\-\s]?key)\s*[:=]", re.IGNORECASE),
        re.compile(r"```(?:bash|sh|shell).*?(curl|wget)\s+http", re.IGNORECASE | re.DOTALL),
        # AIOps command/SQL injection additions
        re.compile(r"(?:drop\s+table|union\s+select|select\s+.*\s+from\s+sqlite_master)", re.IGNORECASE),
        re.compile(r"(?:/etc/passwd|/etc/shadow|c:\\windows\\win.ini)", re.IGNORECASE),
    ]

    # Outbound leakage detection (stack traces, environment variables, credentials)
    _leakage_patterns = [
        re.compile(r"Traceback\s+\(most\s+recent\s+call\s+last\)", re.IGNORECASE),
        re.compile(r"(?:sqlalchemy\.exc|OperationalError|ProgrammingError|sqlite3\.)", re.IGNORECASE),
        re.compile(r"AIzaSy[A-Za-z0-9_\-]{35}", re.IGNORECASE),  # Google API Keys
        re.compile(r"(?:ACCESS_KEY|SECRET_KEY|DATABASE_URL|JWT_SECRET)", re.IGNORECASE),
    ]

    # PII patterns for scrubbing/masking
    _email_regex = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
    _phone_regex = re.compile(r"\+?\b[0-9]{1,3}[-.\s]?[0-9]{3}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}\b")

    @classmethod
    def mask_pii(cls, text: str) -> str:
        """Scrub emails and phone numbers from user prompt text for GDPR/PII compliance."""
        if not text:
            return ""
        # Mask emails
        text = cls._email_regex.sub("[REDACTED_EMAIL]", text)
        # Mask phone numbers
        text = cls._phone_regex.sub("[REDACTED_PHONE]", text)
        return text

    @classmethod
    def check_input_safety(cls, text: str) -> Tuple[bool, Optional[str]]:
        """
        Check if the input prompt violates safety guardrails.
        Returns (is_safe, block_reason).
        """
        if not settings.ENABLE_AGENT_PROCTORING:
            return True, None

        normalized = (text or "").strip()
        if not normalized:
            return False, "Input text is empty"

        if len(normalized) > settings.MAX_AGENT_INPUT_CHARS:
            return False, f"Input length exceeds maximum allowed limit ({settings.MAX_AGENT_INPUT_CHARS} characters)"

        for pattern in cls._blocked_patterns:
            if pattern.search(normalized):
                return False, "Suspicious pattern or prompt injection attempt detected"

        return True, None

    @classmethod
    def check_output_safety(cls, text: str, expect_json: bool = False) -> Tuple[bool, Optional[str]]:
        """
        Check if the AI agent response contains leaked credentials, stack traces,
        or violates JSON structural requirements.
        Returns (is_safe, block_reason).
        """
        if not settings.ENABLE_AGENT_PROCTORING:
            return True, None

        if not text:
            return False, "Response text is empty"

        # Check for error leaks & credentials
        for pattern in cls._leakage_patterns:
            if pattern.search(text):
                return False, "System error stack trace or credential leak detected"

        # Structural validation if JSON is expected
        if expect_json:
            try:
                # Find first '{' and last '}' to handle markdown blocks
                start = text.find("{")
                end = text.rfind("}")
                if start != -1 and end != -1:
                    json_str = text[start:end + 1]
                    json.loads(json_str)
                else:
                    json.loads(text)
            except json.JSONDecodeError:
                return False, "Response did not return a valid JSON structure as required"

        return True, None

    # Keep compatibility with existing legacy code signature if any
    @classmethod
    def validate_text(cls, text: str, field_name: str = "input") -> None:
        """Legacy compatibility wrapper."""
        is_safe, reason = cls.check_input_safety(text)
        if not is_safe:
            logger.warning("[AI_PROCTOR] Blocked suspicious pattern in %s: %s", field_name, reason)
            raise HTTPException(
                status_code=400,
                detail=f"{field_name} contains unsafe instructions and was blocked by proctoring: {reason}",
            )

    @classmethod
    def validate_many(cls, values: Iterable[Tuple[str, str]]) -> None:
        """Legacy compatibility wrapper."""
        for field_name, value in values:
            cls.validate_text(value, field_name=field_name)
