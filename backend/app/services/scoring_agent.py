"""Scoring Agent — produces a detailed match score with breakdown and explanation"""

import json
import logging
import time
import numpy as np
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import PromptTemplate

from app.config import settings

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class ScoringAgent:
    """Agent that scores CV-job compatibility with granular breakdown"""

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            google_api_key=settings.GOOGLE_API_KEY,
            model=settings.GEMINI_MODEL,
            temperature=0.1,
        )
        self.embeddings = GoogleGenerativeAIEmbeddings(
            google_api_key=settings.GOOGLE_API_KEY,
            model="models/embedding-001",
        )

    def score(self, resume_text: str, job_analysis: dict, company_info: dict = None) -> dict:
        """
        Score how well a CV matches a job.
        Returns overall score, dimensional breakdown, explanation, and skill gaps.
        """
        logger.info(f"[SCORING] Starting job scoring | job_title='{job_analysis.get('job_title')}' | resume_len={len(resume_text)}")
        start_time = time.time()

        try:
            logger.debug(f"[SCORING] Converting job analysis to text")
            job_text = self._job_to_text(job_analysis)

            logger.debug(f"[SCORING] Computing semantic similarity between resume and job")
            semantic_score = self._compute_semantic_similarity(resume_text, job_text)
            logger.debug(f"[SCORING] Semantic similarity score: {semantic_score:.3f} ({round(semantic_score * 100)}%)")

            prompt = PromptTemplate(
                input_variables=["resume_text", "job_text", "job_title", "required_skills",
                                 "preferred_skills", "experience_years", "tech_stack"],
                template="""You are an expert technical recruiter and hiring manager.
Score the following CV against the job requirements. Be specific, honest, and thorough.

CV:
{resume_text}

Job Title: {job_title}
Required Skills: {required_skills}
Preferred Skills: {preferred_skills}
Minimum Experience: {experience_years} years
Tech Stack: {tech_stack}

Full Job Description:
{job_text}

Return a JSON object with these exact keys:
- skills_match_score: integer 0-100 (how many required skills the candidate has)
- experience_match_score: integer 0-100 (years and relevance of experience)
- education_match_score: integer 0-100 (education fit, 80 if not specified in job)
- culture_fit_score: integer 0-100 (based on tone and soft skills in CV vs job)
- keyword_match_score: integer 0-100 (important keywords from JD found in CV)
- overall_score: integer 0-100 (weighted composite score)
- match_level: string (one of: "Excellent Match", "Strong Match", "Good Match", "Partial Match", "Weak Match")
- matched_skills: list of strings (required skills the candidate clearly has)
- missing_required_skills: list of strings (required skills completely absent from CV)
- missing_preferred_skills: list of strings (preferred/nice-to-have skills absent)
- experience_analysis: string (2-3 sentences analyzing experience fit)
- strengths_for_this_role: list of strings (specific things that make this candidate stand out for THIS job)
- concerns_for_this_role: list of strings (specific concerns about this candidate for THIS job)
- explanation: string (3-4 sentence overall explanation of the match score)
- hiring_likelihood: string (one of: "Very Likely", "Likely", "Possible", "Unlikely", "Very Unlikely")
- suggested_improvements_for_this_job: list of strings (specific CV changes to improve match for this exact job)

Respond with valid JSON only, no markdown.
""",
            )

            logger.debug(f"[SCORING] Invoking Gemini LLM for detailed scoring")
            chain = prompt | self.llm
            response = chain.invoke({
                "resume_text": resume_text[:4000],
                "job_text": job_text[:3000],
                "job_title": job_analysis.get("job_title", ""),
                "required_skills": ", ".join(job_analysis.get("required_skills", [])),
                "preferred_skills": ", ".join(job_analysis.get("preferred_skills", [])),
                "experience_years": job_analysis.get("required_experience_years", 0),
                "tech_stack": ", ".join(job_analysis.get("tech_stack", [])),
            })

            logger.debug(f"[SCORING] Received response from Gemini | response_len={len(response.content)} chars")

            content = response.content.strip()
            if content.startswith("```"):
                logger.debug(f"[SCORING] Extracting JSON from markdown code blocks")
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]

            result = json.loads(content)
            result["semantic_similarity_score"] = round(semantic_score * 100)

            # Blend LLM score with semantic similarity for robustness
            llm_score = result.get("overall_score", 50)
            result["overall_score"] = round(llm_score * 0.8 + semantic_score * 100 * 0.2)

            elapsed = time.time() - start_time
            logger.info(f"[SCORING] Scoring complete | overall_score={result['overall_score']} | match_level={result.get('match_level')} | time={elapsed:.2f}s")
            logger.debug(f"[SCORING] Dimensional scores - skills={result.get('skills_match_score')}, experience={result.get('experience_match_score')}, culture={result.get('culture_fit_score')}")
            logger.debug(f"[SCORING] Matched required skills: {len(result.get('matched_skills', []))} | Missing: {len(result.get('missing_required_skills', []))}")

            return result

        except json.JSONDecodeError as e:
            elapsed = time.time() - start_time
            logger.error(f"[SCORING] JSON decode error after {elapsed:.2f}s | error={str(e)[:80]}, using fallback")
            return self._fallback_score(semantic_score)
        except AttributeError as e:
            elapsed = time.time() - start_time
            logger.error(f"[SCORING] Attribute error after {elapsed:.2f}s | error={str(e)[:80]}, using fallback")
            return self._fallback_score(semantic_score)
        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"[SCORING] Unexpected error after {elapsed:.2f}s | error={type(e).__name__}: {str(e)}", exc_info=True)
            return self._fallback_score(semantic_score)

    def _compute_semantic_similarity(self, resume_text: str, job_text: str) -> float:
        logger.debug(f"[SCORING] Computing semantic similarity | resume_len={len(resume_text)} | job_text_len={len(job_text)}")
        start_time = time.time()

        try:
            logger.debug(f"[SCORING] Embedding resume text")
            resume_vec = np.array(self.embeddings.embed_query(resume_text[:3000]))
            logger.debug(f"[SCORING] Embedding job description")
            job_vec = np.array(self.embeddings.embed_query(job_text[:3000]))

            dot = np.dot(resume_vec, job_vec)
            norm = np.linalg.norm(resume_vec) * np.linalg.norm(job_vec)

            if norm == 0:
                logger.warning(f"[SCORING] Norm is 0, returning 0.0 similarity")
                return 0.0

            similarity = float(max(0.0, min(1.0, (dot / norm + 1) / 2)))
            elapsed = time.time() - start_time
            logger.debug(f"[SCORING] Semantic similarity computed: {similarity:.3f} | time={elapsed:.2f}s")

            return similarity

        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"[SCORING] Semantic similarity error after {elapsed:.2f}s | error={type(e).__name__}: {str(e)}, returning default 0.5")
            return 0.5

    def _job_to_text(self, job_analysis: dict) -> str:
        parts = [
            job_analysis.get("job_title", ""),
            job_analysis.get("summary", ""),
            "Required: " + ", ".join(job_analysis.get("required_skills", [])),
            "Preferred: " + ", ".join(job_analysis.get("preferred_skills", [])),
            "Tech: " + ", ".join(job_analysis.get("tech_stack", [])),
            "\n".join(job_analysis.get("key_responsibilities", [])),
        ]
        return "\n".join(p for p in parts if p.strip())

    def _fallback_score(self, semantic_score: float) -> dict:
        score = round(semantic_score * 100)
        logger.warning(f"[SCORING] Using fallback score | semantic_score={semantic_score:.3f} | score={score}")
        return {
            "skills_match_score": score,
            "experience_match_score": score,
            "education_match_score": 80,
            "culture_fit_score": score,
            "keyword_match_score": score,
            "overall_score": score,
            "semantic_similarity_score": score,
            "match_level": "Partial Match",
            "matched_skills": [],
            "missing_required_skills": [],
            "missing_preferred_skills": [],
            "experience_analysis": "Analysis unavailable.",
            "strengths_for_this_role": [],
            "concerns_for_this_role": [],
            "explanation": "Detailed analysis failed. Score based on semantic similarity.",
            "hiring_likelihood": "Possible",
            "suggested_improvements_for_this_job": [],
        }
