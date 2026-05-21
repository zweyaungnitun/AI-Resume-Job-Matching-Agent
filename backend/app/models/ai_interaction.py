import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime
from sqlalchemy.sql import func
from app.database import Base


class AIInteraction(Base):
    __tablename__ = "ai_interactions"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_email = Column(String, nullable=True, index=True)
    endpoint = Column(String, nullable=False, index=True)
    
    # Prompt and Response payload length
    prompt_chars = Column(Integer, default=0)
    response_chars = Column(Integer, default=0)
    
    # Token usage (Gemini and other LLM providers)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    
    # Estimated Cost and Performance Telemetry
    estimated_cost = Column(Float, default=0.0)
    duration_ms = Column(Float, default=0.0)
    
    # Guardrail and AIOps status
    guardrail_status = Column(String, default="passed")  # "passed", "blocked", "flagged"
    guardrail_reason = Column(String, nullable=True)
    
    # User feedback and alignment tracking
    user_rating = Column(Integer, default=0)  # 0: unrated, 1: positive, -1: negative
    
    # Audit timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
