"""CV Review Agent — analyzes CV quality, structure, ATS compatibility, and content"""

import json
import logging
import time
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

from app.config import settings

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


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
        logger.info(f"[CV_REVIEW] Starting CV review | resume_len={len(resume_text)} chars")
        start_time = time.time()

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

        try:
            logger.debug(f"[CV_REVIEW] Invoking Gemini LLM for CV analysis")
            chain = prompt | self.llm
            response = chain.invoke({"resume_text": resume_text[:6000]})
            logger.debug(f"[CV_REVIEW] Received response from Gemini | response_len={len(response.content)} chars")

            content = response.content.strip()
            logger.debug(f"[CV_REVIEW] Parsing JSON response")

            # Handle markdown code blocks
            if content.startswith("```"):
                logger.debug(f"[CV_REVIEW] Response wrapped in markdown code blocks, extracting")
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]

            result = json.loads(content)
            elapsed = time.time() - start_time

            # Log scores
            logger.info(f"[CV_REVIEW] Analysis complete | scores: overall={result.get('overall_score')}/100, ats={result.get('ats_score')}/100, structure={result.get('structure_score')}/100, content={result.get('content_score')}/100 | time={elapsed:.2f}s")
            logger.debug(f"[CV_REVIEW] Found sections: {', '.join(result.get('sections_found', []))}")
            logger.debug(f"[CV_REVIEW] Missing sections: {', '.join(result.get('sections_missing', []))}")
            logger.debug(f"[CV_REVIEW] Strengths: {', '.join(result.get('strengths', [])[:2])}...")
            logger.debug(f"[CV_REVIEW] ATS issues: {len(result.get('ats_issues', []))} issues found")

            return result

        except json.JSONDecodeError as e:
            elapsed = time.time() - start_time
            logger.error(f"[CV_REVIEW] JSON decode error after {elapsed:.2f}s | error={str(e)[:100]}, using fallback")
            return self._fallback_review()
        except AttributeError as e:
            elapsed = time.time() - start_time
            logger.error(f"[CV_REVIEW] Attribute error after {elapsed:.2f}s | error={str(e)}, using fallback")
            return self._fallback_review()
        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"[CV_REVIEW] Unexpected error after {elapsed:.2f}s | error={type(e).__name__}: {str(e)}", exc_info=True)
            return self._fallback_review()

    def _fallback_review(self) -> dict:
        logger.warning(f"[CV_REVIEW] Using fallback review response")
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
