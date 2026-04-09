from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.agent_service import MatchingAgent

router = APIRouter(prefix="/agent", tags=["agent"])

# Initialize agent
agent = MatchingAgent()


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


@router.post("/match", response_model=MatchResponse)
async def match_jobs(request: MatchRequest):
    """
    Find matching jobs for a given resume.
    Uses RAG to search job descriptions and scores matches.
    """
    if not request.resume_text or len(request.resume_text.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Resume text must be at least 10 characters long"
        )

    try:
        result = agent.match_resume_to_jobs(
            request.resume_text,
            num_matches=request.num_matches
        )

        # Convert to response format
        matches = [
            JobMatch(
                job_title=m["job_title"],
                company=m["company"],
                match_score=m["match_score"],
                gap_analysis=m["gap_analysis"],
                improvements=m["improvements"],
                missing_skills=m["missing_skills"],
                experience_gaps=m["experience_gaps"]
            )
            for m in result["matches"]
        ]

        return MatchResponse(
            matches=matches,
            resume_skills=result["resume_skills"],
            resume_experience=result["resume_experience"],
            total_matches=result["total_matches"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error matching jobs: {str(e)}"
        )


@router.post("/generate-cover-letter", response_model=CoverLetterResponse)
async def generate_cover_letter(request: CoverLetterRequest):
    """Generate a tailored cover letter for a specific job"""
    if not request.resume_text or len(request.resume_text.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Resume text must be at least 10 characters long"
        )

    if not request.job_description or len(request.job_description.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Job description must be at least 10 characters long"
        )

    try:
        cover_letter = agent.generate_cover_letter(
            request.resume_text,
            request.job_description
        )
        return CoverLetterResponse(cover_letter=cover_letter)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating cover letter: {str(e)}"
        )


@router.post("/analyze-gaps", response_model=GapAnalysisResponse)
async def analyze_gaps(request: GapAnalysisRequest):
    """Analyze skill and experience gaps between resume and job"""
    if not request.resume_text or len(request.resume_text.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Resume text must be at least 10 characters long"
        )

    if not request.job_description or len(request.job_description.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Job description must be at least 10 characters long"
        )

    try:
        result = agent.analyze_skill_gaps(
            request.resume_text,
            request.job_description
        )
        return GapAnalysisResponse(
            missing_skills=result["missing_skills"],
            experience_gaps=result["experience_gaps"],
            recommendations=result["recommendations"],
            gap_summary=result["gap_summary"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing gaps: {str(e)}"
        )
