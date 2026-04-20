"""Main agent service for orchestrating resume-to-job matching"""

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

from app.services.resume_parser import ResumeParser
from app.services.rag_service import RAGService
from app.config import settings


class MatchingAgent:
    """Orchestrates the matching process between resumes and jobs"""

    def __init__(self):
        self.parser = ResumeParser()
        self.rag = RAGService()
        self.llm = ChatGoogleGenerativeAI(
            google_api_key=settings.GOOGLE_API_KEY,
            model=settings.GEMINI_MODEL,
            temperature=0.1
        )

    def match_resume_to_jobs(self, resume_text: str, num_matches: int = 5) -> dict:
        """
        Main agent logic:
        1. Parse resume
        2. Retrieve matching jobs
        3. Score and rank
        4. Analyze gaps
        5. Generate suggestions
        """
        # Step 1: Extract resume data
        skills = self.parser.extract_skills(resume_text)
        experience = self.parser.extract_experience(resume_text)

        # Step 2: Retrieve matching jobs
        jobs = self.rag.retrieve_jobs(resume_text, top_k=num_matches)

        # Step 3: Score and rank matches
        matches = []
        for job in jobs:
            match_score = self.rag.score_match(resume_text, job)

            # Step 4: Analyze gaps
            gaps = self.analyze_skill_gaps(resume_text, job.get("description", ""))

            # Step 5: Generate improvements
            improvements = gaps.get("recommendations", [])

            matches.append({
                "job_title": job.get("job_title", ""),
                "company": job.get("company", ""),
                "match_score": match_score,
                "gap_analysis": gaps.get("gap_summary", ""),
                "improvements": improvements,
                "missing_skills": gaps.get("missing_skills", []),
                "experience_gaps": gaps.get("experience_gaps", [])
            })

        # Sort by score
        matches.sort(key=lambda x: x["match_score"], reverse=True)

        return {
            "matches": matches,
            "resume_skills": skills,
            "resume_experience": experience,
            "total_matches": len(matches)
        }

    def generate_cover_letter(self, resume_text: str, job_description: str) -> str:
        """Generate a tailored cover letter"""
        prompt = PromptTemplate(
            input_variables=["resume_text", "job_description"],
            template="""Based on the following resume and job description, write a professional cover letter.
The cover letter should be tailored to the specific position and company, highlighting relevant skills and experience.

Resume:
{resume_text}

Job Description:
{job_description}

Cover Letter:"""
        )

        chain = prompt | self.llm
        response = chain.invoke({
            "resume_text": resume_text,
            "job_description": job_description
        })

        return response.content.strip()

    def analyze_skill_gaps(self, resume_text: str, job_description: str) -> dict:
        """Identify skill and experience gaps"""
        prompt = PromptTemplate(
            input_variables=["resume_text", "job_description"],
            template="""Analyze the gap between the candidate's resume and the job requirements.
Identify: missing skills, experience gaps, and recommendations to bridge those gaps.

Resume:
{resume_text}

Job Description:
{job_description}

Return a JSON response with keys:
- missing_skills: list of technical/soft skills the candidate lacks
- experience_gaps: list of experience areas where candidate lacks depth
- recommendations: list of actionable suggestions to improve fit
- gap_summary: 1-2 sentence summary of overall fit

Response (JSON only):"""
        )

        chain = prompt | self.llm
        response = chain.invoke({
            "resume_text": resume_text,
            "job_description": job_description
        })

        import json
        try:
            content = response.content.strip()
            if content.startswith("```json"):
                content = content[7:-3]
            elif content.startswith("```"):
                content = content[3:-3]

            result = json.loads(content)
            return {
                "missing_skills": result.get("missing_skills", []),
                "experience_gaps": result.get("experience_gaps", []),
                "recommendations": result.get("recommendations", []),
                "gap_summary": result.get("gap_summary", "")
            }
        except (json.JSONDecodeError, AttributeError):
            return {
                "missing_skills": [],
                "experience_gaps": [],
                "recommendations": ["Review the job description for required skills."],
                "gap_summary": "Unable to analyze gaps at this time."
            }
