import logging
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator, ConfigDict
from typing import Optional, Literal

from app.services.agent_service import MatchingAgent
from app.services.orchestrator import MultiAgentOrchestrator
from app.dependencies.auth import get_current_user
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


# ── Legacy endpoints (unchanged) ──────────────────────────────────────────────

@router.post("/match", response_model=MatchResponse)
async def match_jobs(request: MatchRequest, user=Depends(get_current_user)):
    """Find matching jobs for a given resume using RAG."""
    if len(request.resume_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Resume text must be at least 10 characters long")
    try:
        result = agent.match_resume_to_jobs(request.resume_text, num_matches=request.num_matches)
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error matching jobs: {str(e)}")


@router.post("/generate-cover-letter", response_model=CoverLetterResponse)
async def generate_cover_letter(request: CoverLetterRequest, user=Depends(get_current_user)):
    """Generate a tailored cover letter for a specific job."""
    if len(request.resume_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Resume text must be at least 10 characters long")
    if len(request.job_description.strip()) < 10:
        raise HTTPException(status_code=400, detail="Job description must be at least 10 characters long")
    try:
        cover_letter = agent.generate_cover_letter(request.resume_text, request.job_description)
        return CoverLetterResponse(cover_letter=cover_letter)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating cover letter: {str(e)}")


@router.post("/analyze-gaps", response_model=GapAnalysisResponse)
async def analyze_gaps(request: GapAnalysisRequest, user=Depends(get_current_user)):
    """Analyze skill and experience gaps between resume and job."""
    if len(request.resume_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Resume text must be at least 10 characters long")
    if len(request.job_description.strip()) < 10:
        raise HTTPException(status_code=400, detail="Job description must be at least 10 characters long")
    try:
        result = agent.analyze_skill_gaps(request.resume_text, request.job_description)
        return GapAnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing gaps: {str(e)}")


# ── New multi-agent endpoints ──────────────────────────────────────────────────

@router.post("/review-cv")
async def review_cv(request: CVReviewRequest, user=Depends(get_current_user)):
    """
    Agent 1: Full CV quality review.
    Returns ATS score, structure score, content score, strengths, weaknesses, and immediate fixes.
    """
    if len(request.resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text too short to review.")
    try:
        logger.info(f"[ROUTE_CV_REVIEW] CV review endpoint called | resume_len={len(request.resume_text)} chars")

        result = orchestrator.review_cv_only(request.resume_text)
        logger.info(f"[ROUTE_CV_REVIEW] Orchestrator returned result | keys={list(result.keys())}")
        logger.debug(f"[ROUTE_CV_REVIEW] Result structure: {result}")

        # Flatten if result is nested under 'cv_review'
        if isinstance(result, dict) and 'cv_review' in result:
            logger.debug(f"[ROUTE_CV_REVIEW] Flattening nested 'cv_review' structure")
            result = result['cv_review']
            logger.debug(f"[ROUTE_CV_REVIEW] Flattened result keys: {list(result.keys())}")

        logger.debug(f"[ROUTE_CV_REVIEW] Creating CVReviewResponse with keys: {list(result.keys())}")
        response = CVReviewResponse(**result)
        logger.debug(f"[ROUTE_CV_REVIEW] Response object created successfully")
        logger.info(f"[ROUTE_CV_REVIEW] CV review completed | overall_score={response.overall_score}")

        return response

    except Exception as e:
        logger.error(f"[ROUTE_CV_REVIEW] CV review failed: {type(e).__name__}: {str(e)}", exc_info=True)
        if 'User location is not supported' in str(e):
            return JSONResponse(status_code=400, content={
                "error": "Your region is not supported for this AI service. Please try again from a supported location."
            })
        raise HTTPException(status_code=500, detail=f"CV review failed: {str(e)}")


@router.post("/rag-match")
async def rag_match(request: RAGMatchRequest, user=Depends(get_current_user)):
    """
    Agent 2: RAG-based job matching from the vector database.
    Returns semantically matched jobs with gap analysis.
    """
    if len(request.resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text too short.")
    try:
        logger.info(f"RAG matching requested: {len(request.resume_text)} chars, {request.num_matches} matches")
        result = orchestrator.rag_match_only(request.resume_text, request.num_matches)
        logger.info("RAG matching completed successfully")
        return result
    except Exception as e:
        logger.error(f"RAG matching failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"RAG matching failed: {str(e)}")


@router.post("/search-jobs")
async def search_jobs(request: JobSearchRequest, user=Depends(get_current_user)):
    """
    Search the web for jobs matching a query and analyze the top results.
    """
    if len(request.query.strip()) < 3:
        raise HTTPException(status_code=400, detail="Search query too short.")
    try:
        return orchestrator.search_jobs(request.query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Job search failed: {str(e)}")


@router.post("/full-analysis")
async def full_analysis(request: FullAnalysisRequest, user=Depends(get_current_user)):
    """
    Full multi-agent pipeline:
    1. CV Review
    2. RAG Job Matching
    3. Job Analysis (URL / pasted text / web search)
    4. Company Research
    5. Match Scoring with detailed breakdown
    6. CV Improvement Recommendations

    job_source_type: "url" | "text" | "search"
    job_source_value: the URL, pasted description, or search query
    """
    if len(request.resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text too short.")
    if len(request.job_source_value.strip()) < 3:
        raise HTTPException(status_code=400, detail="Job source value too short.")
    try:
        result = orchestrator.full_analysis(
            resume_text=request.resume_text,
            job_source_type=request.job_source_type,
            job_source_value=request.job_source_value,
            num_rag_matches=request.num_rag_matches,
        )
        if not result.get("success"):
            raise HTTPException(status_code=422, detail=result.get("error", "Analysis failed."))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Full analysis failed: {str(e)}")


@router.post("/match-jobs-comprehensive")
async def match_jobs_comprehensive(request: ComprehensiveJobMatchRequest, user=Depends(get_current_user)):
    """
    Comprehensive job matching using RAG + Web Search + LLM Scoring.

    Combines:
    - RAG (Pinecone vector DB) for semantic job matching
    - Web Search (Google/DuckDuckGo) for broader job discovery
    - LLM-powered scoring for intelligent ranking

    Returns jobs ranked by match score (0-100).
    """
    if len(request.resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text too short.")
    try:
        logger.info("Comprehensive job matching endpoint called")
        result = orchestrator.match_jobs_comprehensive(
            resume_text=request.resume_text,
            job_query=request.job_query,
            num_rag_matches=request.num_rag_matches,
            num_web_matches=request.num_web_matches,
            include_web_search=request.include_web_search,
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
async def match_jobs_by_skills(request: SkillBasedJobMatchRequest, user=Depends(get_current_user)):
    """
    Match jobs based on specific target skills.

    Use this to discover jobs that require certain skills.
    Useful for career pivots or skill-based job exploration.
    """
    if len(request.resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text too short.")
    if not request.target_skills or len(request.target_skills) == 0:
        raise HTTPException(status_code=400, detail="At least one skill must be provided.")
    try:
        logger.info(f"Skill-based job matching for skills: {request.target_skills}")
        result = orchestrator.match_jobs_by_skills(
            resume_text=request.resume_text,
            target_skills=request.target_skills,
            num_rag_matches=request.num_rag_matches,
            num_web_matches=request.num_web_matches,
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
async def match_jobs_by_role(request: RoleBasedJobMatchRequest, user=Depends(get_current_user)):
    """
    Match jobs based on a specific target role.

    Examples:
    - "Senior Software Engineer"
    - "Data Scientist"
    - "Product Manager"

    Searches for jobs matching this role across RAG + Web Search.
    """
    if len(request.resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text too short.")
    if len(request.target_role.strip()) < 2:
        raise HTTPException(status_code=400, detail="Target role must be at least 2 characters.")
    try:
        logger.info(f"Role-based job matching for role: {request.target_role}")
        result = orchestrator.match_jobs_by_role(
            resume_text=request.resume_text,
            target_role=request.target_role,
            num_rag_matches=request.num_rag_matches,
            num_web_matches=request.num_web_matches,
        )
        if not result.get("success"):
            raise HTTPException(status_code=422, detail=result.get("error", "Job matching failed."))
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Role-based job matching failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Job matching failed: {str(e)}")
