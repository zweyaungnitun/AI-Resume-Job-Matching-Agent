from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Literal

from app.services.agent_service import MatchingAgent
from app.services.orchestrator import MultiAgentOrchestrator

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


# ── Legacy endpoints (unchanged) ──────────────────────────────────────────────

@router.post("/match", response_model=MatchResponse)
async def match_jobs(request: MatchRequest):
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
async def generate_cover_letter(request: CoverLetterRequest):
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
async def analyze_gaps(request: GapAnalysisRequest):
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
async def review_cv(request: CVReviewRequest):
    """
    Agent 1: Full CV quality review.
    Returns ATS score, structure score, content score, strengths, weaknesses, and immediate fixes.
    """
    if len(request.resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text too short to review.")
    try:
        return orchestrator.review_cv_only(request.resume_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CV review failed: {str(e)}")


@router.post("/rag-match")
async def rag_match(request: RAGMatchRequest):
    """
    Agent 2: RAG-based job matching from the vector database.
    Returns semantically matched jobs with gap analysis.
    """
    if len(request.resume_text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Resume text too short.")
    try:
        return orchestrator.rag_match_only(request.resume_text, request.num_matches)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG matching failed: {str(e)}")


@router.post("/search-jobs")
async def search_jobs(request: JobSearchRequest):
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
async def full_analysis(request: FullAnalysisRequest):
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
