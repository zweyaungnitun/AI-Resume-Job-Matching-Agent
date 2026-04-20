"""CV Review Agent — analyzes CV quality, structure, ATS compatibility, and content"""

import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

from app.config import settings


class CVReviewAgent:
    """Agent that reviews a CV and produces a structured quality report"""

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            google_api_key=settings.GOOGLE_API_KEY,
            model=settings.GEMINI_MODEL,
            temperature=0.1,
        )

    def review(self, resume_text: str) -> dict:
        """
        Perform a full CV review.
        Returns scores, strengths, weaknesses, and actionable feedback.
        """
        prompt = PromptTemplate(
            input_variables=["resume_text"],
            template="""You are an expert CV/resume reviewer and career coach with 15+ years of experience.
Analyze the following resume thoroughly and provide a comprehensive review.

Resume:
{resume_text}

Return a JSON object with these exact keys:
- overall_score: integer 0-100
- ats_score: integer 0-100 (how well it passes Applicant Tracking Systems)
- structure_score: integer 0-100 (formatting, sections, readability)
- content_score: integer 0-100 (quality and impact of content)
- contact_info: object with keys present (bool), complete (bool), issues (list of strings)
- sections_found: list of section names found (e.g. ["Summary", "Experience", "Education", "Skills"])
- sections_missing: list of important sections that are missing
- strengths: list of 3-5 specific strengths of this CV
- weaknesses: list of 3-5 specific weaknesses or issues
- ats_keywords_present: list of strong ATS-friendly keywords found
- ats_issues: list of ATS compatibility problems
- writing_quality: object with keys: action_verbs_used (bool), quantified_achievements (bool), passive_voice_issues (list), vague_statements (list)
- overall_assessment: 2-3 sentence professional summary of the CV quality
- immediate_fixes: list of 3-5 quick wins to improve the CV right now

Respond with valid JSON only, no markdown.
""",
        )

        chain = prompt | self.llm
        response = chain.invoke({"resume_text": resume_text[:6000]})

        try:
            content = response.content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            return json.loads(content)
        except (json.JSONDecodeError, AttributeError):
            return self._fallback_review()

    def _fallback_review(self) -> dict:
        return {
            "overall_score": 0,
            "ats_score": 0,
            "structure_score": 0,
            "content_score": 0,
            "contact_info": {"present": False, "complete": False, "issues": []},
            "sections_found": [],
            "sections_missing": [],
            "strengths": [],
            "weaknesses": ["Unable to analyze CV at this time."],
            "ats_keywords_present": [],
            "ats_issues": [],
            "writing_quality": {
                "action_verbs_used": False,
                "quantified_achievements": False,
                "passive_voice_issues": [],
                "vague_statements": [],
            },
            "overall_assessment": "Analysis failed. Please try again.",
            "immediate_fixes": [],
        }
