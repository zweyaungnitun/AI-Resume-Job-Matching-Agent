import logging
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator, ConfigDict
from typing import Optional, Literal
from sqlalchemy.orm import Session

from app.services.agent_service import MatchingAgent
from app.services.orchestrator import MultiAgentOrchestrator
from app.dependencies.auth import get_current_user
from app.database import get_db
from app.services.aiops_service import AIOpsService
from app.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/agent", tags=["agent"])

agent = MatchingAgent()
orchestrator = MultiAgentOrchestrator()


# ── Request / Response models ──────────────────────────────────────────────────

class MatchRequest(BaseModel):
    resume_text: str
    num_matches: int = 5


class JobMatch(BaseModel):
    job_title: str
    company: str
    match_score: float
    gap_analysis: str
    improvements: list[str]
    missing_skills: list[str] = []
    experience_gaps: list[str] = []


class MatchResponse(BaseModel):
    matches: list[JobMatch]
    resume_skills: list[str]
    resume_experience: list[dict]
    total_matches: int


class CoverLetterRequest(BaseModel):
    resume_text: str
    job_description: str


class CoverLetterResponse(BaseModel):
    cover_letter: str


class GapAnalysisRequest(BaseModel):
    resume_text: str
    job_description: str


class GapAnalysisResponse(BaseModel):
    missing_skills: list[str]
    experience_gaps: list[str]
    recommendations: list[str]
    gap_summary: str


class CVReviewRequest(BaseModel):
    resume_text: str


class CVReviewResponse(BaseModel):
    model_config = ConfigDict(extra='allow')  # Allow extra fields from API responses

    overall_score: int
    ats_score: int
    structure_score: int
    content_score: int
    contact_info: dict
    sections_found: list[str]
    sections_missing: list[str]
    strengths: list[str]
    weaknesses: list[str]
    ats_keywords_present: list[str]
    ats_issues: list[str]
    writing_quality: dict
    overall_assessment: str
    immediate_fixes: list[str]


class FullAnalysisRequest(BaseModel):
    resume_text: str
    job_source_type: Literal["url", "text", "search"]
    job_source_value: str
    num_rag_matches: int = 5


class JobSearchRequest(BaseModel):
    query: str


class RAGMatchRequest(BaseModel):
    resume_text: str
    num_matches: int = 5
    job_query: Optional[str] = None
    include_web_search: bool = False


class ComprehensiveJobMatchRequest(BaseModel):
    resume_text: str
    job_query: str = None
    num_rag_matches: int = 5
    num_web_matches: int = 5
    include_web_search: bool = True


class SkillBasedJobMatchRequest(BaseModel):
    resume_text: str
    target_skills: list[str]
    num_rag_matches: int = 5
    num_web_matches: int = 5


class RoleBasedJobMatchRequest(BaseModel):
    resume_text: str
    target_role: str
    num_rag_matches: int = 5
    num_web_matches: int = 5


class FeedbackRequest(BaseModel):
    interaction_id: str
    rating: int  # 1 for thumbs up, -1 for thumbs down


# ── Feedback Endpoint ──────────────────────────────────────────────────

@router.post("/feedback")
async def save_interaction_feedback(
    request: FeedbackRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save user thumbs up / down feedback for an AI recommendation interaction."""
    from app.models.ai_interaction import AIInteraction
    interaction = db.query(AIInteraction).filter(AIInteraction.id == request.interaction_id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Interaction log entry not found")
    interaction.user_rating = request.rating
    db.commit()
    return {"status": "success", "message": "Feedback saved successfully"}


# ── Legacy endpoints (wrapped with AIOps) ──────────────────────────────────────

@router.post("/match", response_model=MatchResponse)
async def match_jobs(
    request: MatchRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Find matching jobs for a given resume using RAG."""
    if len(request.resume_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Resume text must be at least 10 characters long")
    
    def run_match(prompt):
        return agent.match_resume_to_jobs(prompt, num_matches=request.num_matches)

    try:
        result = AIOpsService.process_ai_interaction(
            db=db,
            user_email=user["email"],
            endpoint="/agent/match",
            prompt_text=request.resume_text,
            exec_callable=run_match
        )
        matches = [
            JobMatch(
                job_title=m["job_title"],
                company=m["company"],
                match_score=m["match_score"],
                gap_analysis=m["gap_analysis"],
                improvements=m["improvements"],
                missing_skills=m["missing_skills"],
                experience_gaps=m["experience_gaps"],
            )
            for m in result["matches"]
        ]
        return MatchResponse(
            matches=matches,
            resume_skills=result["resume_skills"],
            resume_experience=result["resume_experience"],
            total_matches=result["total_matches"],
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error matching jobs: {str(e)}")


@router.post("/generate-cover-letter", response_model=CoverLetterResponse)
async def generate_cover_letter(
    request: CoverLetterRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a tailored cover letter for a specific job."""
    if len(request.resume_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Resume text must be at least 10 characters long")
    if len(request.job_description.strip()) < 10:
        raise HTTPException(status_code=400, detail="Job description must be at least 10 characters long")
    
    prompt = f"Resume: {request.resume_text}\nJob Description: {request.job_description}"
    
    def run_generate(prompt_input):
        return agent.generate_cover_letter(request.resume_text, request.job_description)

    try:
        cover_letter = AIOpsService.process_ai_interaction(
            db=db,
            user_email=user["email"],
            endpoint="/agent/generate-cover-letter",
            prompt_text=prompt,
            exec_callable=run_generate
        )
        return CoverLetterResponse(cover_letter=cover_letter)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating cover letter: {str(e)}")


@router.post("/analyze-gaps", response_model=GapAnalysisResponse)
async def analyze_gaps(
    request: GapAnalysisRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze skill and experience gaps between resume and job."""
    if len(request.resume_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Resume text must be at least 10 characters long")
    if len(request.job_description.strip()) < 10:
        raise HTTPException(status_code=400, detail="Job description must be at least 10 characters long")
    
    prompt = f"Resume: {request.resume_text}\nJob Description: {request.job_description}"

    def run_analyze(prompt_input):
        return agent.analyze_skill_gaps(request.resume_text, request.job_description)

    try:
        result = AIOpsService.process_ai_interaction(
            db=db,
            user_email=user["email"],
            endpoint="/agent/analyze-gaps",
            prompt_text=prompt,
            exec_callable=run_analyze
        )
        return GapAnalysisResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing gaps: {str(e)}")


# ── New multi-agent endpoints (wrapped with AIOps) ─────────────────────────────

@router.post("/review-cv")
async def review_cv(
    request: CVReviewRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Agent 1: Full CV quality review.
    Returns ATS score, structure score, content score, strengths, weaknesses, and immediate fixes.
    """
    if len(request.resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text too short to review.")
    
    def run_review(prompt):
        result = orchestrator.review_cv_only(prompt)
        # Flatten if result is nested under 'cv_review'
        if isinstance(result, dict) and 'cv_review' in result:
            result = result['cv_review']
        return result

    try:
        logger.info(f"[ROUTE_CV_REVIEW] CV review endpoint called | resume_len={len(request.resume_text)} chars")
        result = AIOpsService.process_ai_interaction(
            db=db,
            user_email=user["email"],
            endpoint="/agent/review-cv",
            prompt_text=request.resume_text,
            exec_callable=run_review
        )
        
        response = CVReviewResponse(**result)
        logger.info(f"[ROUTE_CV_REVIEW] CV review completed | overall_score={response.overall_score}")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ROUTE_CV_REVIEW] CV review failed: {type(e).__name__}: {str(e)}", exc_info=True)
        if 'User location is not supported' in str(e):
            return JSONResponse(status_code=400, content={
                "error": "Your region is not supported for this AI service. Please try again from a supported location."
            })
        raise HTTPException(status_code=500, detail=f"CV review failed: {str(e)}")


@router.post("/rag-match")
async def rag_match(
    request: RAGMatchRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Agent 2: RAG-based job matching from the vector database.
    Returns semantically matched jobs with gap analysis.
    """
    if len(request.resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text too short.")
    
    prompt = f"Resume: {request.resume_text}\nQuery: {request.job_query or ''}"

    def run_rag(prompt_input):
        return orchestrator.match_jobs_comprehensive(
            resume_text=request.resume_text,
            job_query=request.job_query,
            num_rag_matches=request.num_matches,
            num_web_matches=request.num_matches,
            include_web_search=request.include_web_search,
        )

    try:
        logger.info("RAG matching requested")
        result = AIOpsService.process_ai_interaction(
            db=db,
            user_email=user["email"],
            endpoint="/agent/rag-match",
            prompt_text=prompt,
            exec_callable=run_rag
        )
        if not result.get("success"):
            raise HTTPException(status_code=422, detail=result.get("error", "RAG matching failed."))
        logger.info("RAG matching completed successfully")
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"RAG matching failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"RAG matching failed: {str(e)}")


@router.post("/search-jobs")
async def search_jobs(
    request: JobSearchRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search the web for jobs matching a query and analyze the top results."""
    if len(request.query.strip()) < 3:
        raise HTTPException(status_code=400, detail="Search query too short.")

    def run_search(prompt):
        return orchestrator.search_jobs(prompt)

    try:
        return AIOpsService.process_ai_interaction(
            db=db,
            user_email=user["email"],
            endpoint="/agent/search-jobs",
            prompt_text=request.query,
            exec_callable=run_search
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Job search failed: {str(e)}")


@router.post("/full-analysis")
async def full_analysis(
    request: FullAnalysisRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Full multi-agent analysis pipeline."""
    if len(request.resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text too short.")
    if len(request.job_source_value.strip()) < 3:
        raise HTTPException(status_code=400, detail="Job source value too short.")
    
    prompt = f"Resume: {request.resume_text}\nJob Source Type: {request.job_source_type}\nJob Source Value: {request.job_source_value}"

    def run_full(prompt_input):
        return orchestrator.full_analysis(
            resume_text=request.resume_text,
            job_source_type=request.job_source_type,
            job_source_value=request.job_source_value,
            num_rag_matches=request.num_rag_matches,
        )

    try:
        result = AIOpsService.process_ai_interaction(
            db=db,
            user_email=user["email"],
            endpoint="/agent/full-analysis",
            prompt_text=prompt,
            exec_callable=run_full
        )
        if not result.get("success"):
            return {
                **result,
                "partial": True,
            }
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Full analysis failed: {str(e)}")


@router.post("/match-jobs-comprehensive")
async def match_jobs_comprehensive(
    request: ComprehensiveJobMatchRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Comprehensive job matching using RAG + Web Search + LLM Scoring."""
    if len(request.resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text too short.")
    
    prompt = f"Resume: {request.resume_text}\nJob Query: {request.job_query or ''}"

    def run_comprehensive(prompt_input):
        return orchestrator.match_jobs_comprehensive(
            resume_text=request.resume_text,
            job_query=request.job_query,
            num_rag_matches=request.num_rag_matches,
            num_web_matches=request.num_web_matches,
            include_web_search=request.include_web_search,
        )

    try:
        logger.info("Comprehensive job matching endpoint called")
        result = AIOpsService.process_ai_interaction(
            db=db,
            user_email=user["email"],
            endpoint="/agent/match-jobs-comprehensive",
            prompt_text=prompt,
            exec_callable=run_comprehensive
        )
        if not result.get("success"):
            raise HTTPException(status_code=422, detail=result.get("error", "Job matching failed."))
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Comprehensive job matching failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Job matching failed: {str(e)}")


@router.post("/match-jobs-by-skills")
async def match_jobs_by_skills(
    request: SkillBasedJobMatchRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Match jobs based on specific target skills."""
    if len(request.resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text too short.")
    if not request.target_skills or len(request.target_skills) == 0:
        raise HTTPException(status_code=400, detail="At least one skill must be provided.")
    
    prompt = f"Resume: {request.resume_text}\nTarget Skills: {', '.join(request.target_skills)}"

    def run_by_skills(prompt_input):
        return orchestrator.match_jobs_by_skills(
            resume_text=request.resume_text,
            target_skills=request.target_skills,
            num_rag_matches=request.num_rag_matches,
            num_web_matches=request.num_web_matches,
        )

    try:
        logger.info(f"Skill-based job matching for skills: {request.target_skills}")
        result = AIOpsService.process_ai_interaction(
            db=db,
            user_email=user["email"],
            endpoint="/agent/match-jobs-by-skills",
            prompt_text=prompt,
            exec_callable=run_by_skills
        )
        if not result.get("success"):
            raise HTTPException(status_code=422, detail=result.get("error", "Job matching failed."))
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Skill-based job matching failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Job matching failed: {str(e)}")


@router.post("/match-jobs-by-role")
async def match_jobs_by_role(
    request: RoleBasedJobMatchRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Match jobs based on a specific target role."""
    if len(request.resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text too short.")
    if len(request.target_role.strip()) < 2:
        raise HTTPException(status_code=400, detail="Target role must be at least 2 characters.")
    
    prompt = f"Resume: {request.resume_text}\nTarget Role: {request.target_role}"

    def run_by_role(prompt_input):
        return orchestrator.match_jobs_by_role(
            resume_text=request.resume_text,
            target_role=request.target_role,
            num_rag_matches=request.num_rag_matches,
            num_web_matches=request.num_web_matches,
        )

    try:
        logger.info(f"Role-based job matching for role: {request.target_role}")
        result = AIOpsService.process_ai_interaction(
            db=db,
            user_email=user["email"],
            endpoint="/agent/match-jobs-by-role",
            prompt_text=prompt,
            exec_callable=run_by_role
        )
        if not result.get("success"):
            raise HTTPException(status_code=422, detail=result.get("error", "Job matching failed."))
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Role-based job matching failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Job matching failed: {str(e)}")
