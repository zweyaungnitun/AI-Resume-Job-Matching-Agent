"""Job Matcher Agent — combines RAG, Google Search, and Gemini-powered scoring"""

import logging
import asyncio
import time
from typing import Optional
from concurrent.futures import ThreadPoolExecutor

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

from app.services.rag_service import RAGService
from app.services.google_search_service import GoogleSearchService
from app.services.resume_parser import ResumeParser
from app.config import settings

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class JobMatcherAgent:
    """
    Integrates RAG + Google Search + Gemini for comprehensive job matching.

    Flow:
    1. Extract resume skills/experience via ResumeParser
    2. Retrieve jobs from RAG (Pinecone vector DB) using semantic search
    3. Search web for additional jobs using Google Search (Serper API / DuckDuckGo fallback)
    4. Use Gemini LLM to score all jobs based on resume
    5. Rank and return unified results
    """

    def __init__(self):
        self.rag = RAGService()
        self.google_search = GoogleSearchService()
        self.parser = ResumeParser()
        self.llm = ChatGoogleGenerativeAI(
            google_api_key=settings.GOOGLE_API_KEY,
            model=settings.GEMINI_MODEL,
            temperature=0.3,
        )

    def match_jobs_comprehensive(
        self,
        resume_text: str,
        job_query: str = None,
        num_rag_matches: int = 5,
        num_web_matches: int = 5,
        include_web_search: bool = True,
    ) -> dict:
        """
        Comprehensive job matching combining RAG and web search.

        Args:
            resume_text: The full resume text
            job_query: Optional job title/skills query (defaults to extracted skills)
            num_rag_matches: Number of RAG results to retrieve
            num_web_matches: Number of web search results to retrieve
            include_web_search: Whether to include web search results

        Returns:
            Dict with matched_jobs (ranked), rag_matches, web_matches, and summary
        """
        session_id = f"jm-{int(time.time()*1000)}"
        logger.info(f"[{session_id}] Starting comprehensive job matching | resume_len={len(resume_text)} | include_web_search={include_web_search}")
        start_time = time.time()

        try:
            # Extract resume data
            logger.debug(f"[{session_id}] Extracting resume skills and experience")
            extract_start = time.time()
            resume_skills = self.parser.extract_skills(resume_text)
            resume_experience = self.parser.extract_experience(resume_text)
            logger.debug(f"[{session_id}] Extracted skills={len(resume_skills)} | experience_items={len(resume_experience)} | time={time.time()-extract_start:.2f}s")

            if not job_query:
                # Use extracted skills as the search query
                job_query = " ".join(resume_skills[:10]) if resume_skills else resume_text[:500]
                logger.debug(f"[{session_id}] Auto-generated job query from skills: '{job_query[:80]}'...")

            logger.info(f"[{session_id}] Resume analysis complete | skills={len(resume_skills)} | job_query='{job_query[:60]}'...")

            # Parallel execution: RAG retrieval + Web search
            logger.debug(f"[{session_id}] Starting parallel job search (RAG + Web)")
            search_start = time.time()

            with ThreadPoolExecutor(max_workers=2) as pool:
                logger.debug(f"[{session_id}] Submitting RAG search task")
                rag_future = pool.submit(self._get_rag_matches, resume_text, job_query, num_rag_matches)

                if include_web_search:
                    logger.debug(f"[{session_id}] Submitting web search task")
                    web_future = pool.submit(self._get_web_matches, job_query, num_web_matches)
                else:
                    logger.debug(f"[{session_id}] Skipping web search (include_web_search=False)")
                    web_future = None

            logger.debug(f"[{session_id}] Waiting for RAG results...")
            rag_matches = rag_future.result()
            logger.debug(f"[{session_id}] RAG search completed | results={len(rag_matches)}")

            if web_future:
                logger.debug(f"[{session_id}] Waiting for web search results...")
                web_matches = web_future.result()
                logger.debug(f"[{session_id}] Web search completed | results={len(web_matches)}")
            else:
                web_matches = []

            search_elapsed = time.time() - search_start
            logger.info(f"[{session_id}] Job search complete | RAG={len(rag_matches)} | Web={len(web_matches)} | time={search_elapsed:.2f}s")

            # Combine all jobs
            all_jobs = rag_matches + web_matches
            logger.debug(f"[{session_id}] Combined all jobs for scoring | total_jobs={len(all_jobs)}")

            # Score all jobs using LLM
            logger.debug(f"[{session_id}] Starting LLM-based job scoring")
            score_start = time.time()
            scored_jobs = self._score_all_jobs(resume_text, all_jobs, resume_skills)
            logger.debug(f"[{session_id}] Scoring complete | scored_jobs={len(scored_jobs)} | time={time.time()-score_start:.2f}s")

            # Sort by score (descending)
            scored_jobs.sort(key=lambda x: x["match_score"], reverse=True)
            logger.debug(f"[{session_id}] Sorted results by match_score (descending)")

            # Log top 3 results
            for idx, job in enumerate(scored_jobs[:3]):
                logger.info(f"[{session_id}] Top #{idx+1} job | title='{job['job_title']}' | company='{job['company']}' | score={job['match_score']} | source={job['source']}")

            total_elapsed = time.time() - start_time
            logger.info(f"[{session_id}] Job matching complete | total_matches={len(scored_jobs)} | total_time={total_elapsed:.2f}s")

            return {
                "success": True,
                "matched_jobs": scored_jobs,
                "rag_matches_count": len(rag_matches),
                "web_matches_count": len(web_matches),
                "resume_skills": resume_skills,
                "resume_experience": resume_experience,
                "job_query_used": job_query,
                "total_matches": len(scored_jobs),
                "processing_time_seconds": total_elapsed,
            }

        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"[{session_id}] Job matching failed after {elapsed:.2f}s | error={type(e).__name__}: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "matched_jobs": [],
                "total_matches": 0,
                "processing_time_seconds": elapsed,
            }

    def _get_rag_matches(self, resume_text: str, query: str, top_k: int) -> list[dict]:
        """Retrieve jobs from RAG (Pinecone)"""
        logger.debug(f"[RAG] Starting retrieval | query='{query}' | top_k={top_k}")
        start_time = time.time()

        try:
            logger.debug(f"[RAG] Calling rag.retrieve_jobs() with query embedding")
            jobs = self.rag.retrieve_jobs(query, top_k=top_k)
            logger.debug(f"[RAG] Retrieved {len(jobs)} raw results from Pinecone")

            matches = []
            for idx, job in enumerate(jobs):
                match = {
                    "job_title": job.get("job_title", "Unknown"),
                    "company": job.get("company", "Unknown"),
                    "description": job.get("description", "")[:2000],
                    "source": "rag",
                    "rag_score": job.get("score", 0),
                    "url": job.get("url", ""),
                    "id": job.get("id", ""),
                }
                matches.append(match)
                logger.debug(f"[RAG] Result #{idx+1}: '{match['job_title']}' @ '{match['company']}' | score={match['rag_score']:.3f}")

            elapsed = time.time() - start_time
            logger.info(f"[RAG] Retrieval complete | results={len(matches)} | time={elapsed:.2f}s")
            return matches

        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"[RAG] Retrieval failed after {elapsed:.2f}s | error={type(e).__name__}: {str(e)}", exc_info=True)
            return []

    def _get_web_matches(self, query: str, max_results: int) -> list[dict]:
        """Search web for job postings and fetch details using Google Search"""
        logger.debug(f"[WEB_SEARCH] Starting web search | query='{query}' | max_results={max_results}")
        start_time = time.time()

        try:
            logger.debug(f"[WEB_SEARCH] Calling google_search.search_jobs()")
            search_results = self.google_search.search_jobs(query, max_results=max_results)
            logger.debug(f"[WEB_SEARCH] Received {len(search_results)} raw results")

            matches = []
            for idx, result in enumerate(search_results):
                url = result.get("url", "")
                description = result.get("snippet", "")
                company = self._extract_company_from_url(url)

                match = {
                    "job_title": result.get("title", "Job Posting"),
                    "company": company,
                    "description": description[:2000],
                    "source": "web_search",
                    "url": url,
                    "snippet": result.get("snippet", "")[:500],
                }
                matches.append(match)
                logger.debug(f"[WEB_SEARCH] Result #{idx+1}: '{match['job_title']}' @ '{company}' | url={url[:60]}...")

            elapsed = time.time() - start_time
            logger.info(f"[WEB_SEARCH] Search complete | results={len(matches)} | time={elapsed:.2f}s")
            return matches

        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"[WEB_SEARCH] Search failed after {elapsed:.2f}s | error={type(e).__name__}: {str(e)}", exc_info=True)
            return []

    def _extract_company_from_url(self, url: str) -> str:
        """Extract company name from job posting URL"""
        if not url:
            return "Unknown"

        # Simple heuristics for common job sites
        url_lower = url.lower()
        if "linkedin.com" in url_lower:
            return "LinkedIn"
        elif "indeed.com" in url_lower:
            return "Indeed"
        elif "glassdoor.com" in url_lower:
            return "Glassdoor"
        elif "wellfound.com" in url_lower:
            return "Wellfound"

        # Extract domain name as fallback
        import re
        match = re.search(r"https?://(?:www\.)?([^/]+)", url)
        return match.group(1) if match else "Unknown"

    def _score_all_jobs(self, resume_text: str, jobs: list[dict], skills: list[str]) -> list[dict]:
        """Use LLM to score all jobs against resume"""
        logger.info(f"[SCORING] Starting LLM scoring | total_jobs={len(jobs)} | resume_skills={len(skills)}")
        start_time = time.time()

        scored_jobs = []
        success_count = 0
        error_count = 0

        for idx, job in enumerate(jobs):
            try:
                logger.debug(f"[SCORING] Scoring job #{idx+1}/{len(jobs)} | title='{job.get('job_title')}' | source={job.get('source')}")
                score = self._score_single_job(resume_text, job, skills)
                scored_job = job.copy()
                scored_job["match_score"] = score
                scored_jobs.append(scored_job)
                success_count += 1
                logger.debug(f"[SCORING] Score #{idx+1}: {score}/100 | title='{job.get('job_title')}'")
            except Exception as e:
                error_count += 1
                logger.error(f"[SCORING] Failed to score job #{idx+1} | title='{job.get('job_title')}' | error={type(e).__name__}: {str(e)}")
                # Still include job with default score
                scored_job = job.copy()
                scored_job["match_score"] = 50  # Default neutral score
                scored_jobs.append(scored_job)
                logger.warning(f"[SCORING] Using default score (50) for job #{idx+1}")

        elapsed = time.time() - start_time
        logger.info(f"[SCORING] Scoring complete | total={len(scored_jobs)} | success={success_count} | errors={error_count} | time={elapsed:.2f}s")
        return scored_jobs

    def _score_single_job(self, resume_text: str, job: dict, skills: list[str]) -> float:
        """Use LLM to score a single job"""
        logger.debug(f"[LLM_SCORE] Starting score for job | title='{job.get('job_title')}'")
        start_time = time.time()

        job_title = job.get("job_title", "Unknown")
        job_desc = job.get("description", "")[:2000]
        skills_str = ", ".join(skills[:20])

        logger.debug(f"[LLM_SCORE] Job title: '{job_title}'")
        logger.debug(f"[LLM_SCORE] Description length: {len(job_desc)} chars")
        logger.debug(f"[LLM_SCORE] Skills ({len(skills[:20])}): {skills_str[:80]}...")

        prompt = ChatPromptTemplate.from_template("""
        Analyze the match between a resume and a job posting.

        Resume Skills: {skills}

        Job Title: {job_title}
        Job Description: {job_desc}

        Score this job match from 0-100 based on:
        - Skill alignment (40%)
        - Role relevance (30%)
        - Experience level match (20%)
        - Growth opportunity (10%)

        Return ONLY a number between 0-100, no other text.
        """)

        chain = prompt | self.llm

        try:
            logger.debug(f"[LLM_SCORE] Invoking Gemini LLM for scoring")
            response = chain.invoke({
                "skills": skills_str,
                "job_title": job_title,
                "job_desc": job_desc,
            })

            # Extract score from response
            logger.debug(f"[LLM_SCORE] Received response: '{response.content.strip()}'")
            score_text = response.content.strip()
            score = float("".join(filter(str.isdigit, score_text.split()[0])))
            score = min(100, max(0, score))

            elapsed = time.time() - start_time
            logger.debug(f"[LLM_SCORE] Score extracted: {score}/100 | time={elapsed:.2f}s")
            return score

        except (ValueError, IndexError) as e:
            elapsed = time.time() - start_time
            logger.warning(f"[LLM_SCORE] Failed to parse score after {elapsed:.2f}s | error={type(e).__name__}: {str(e)} | using default 50")
            return 50  # Default neutral score on parsing error
        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"[LLM_SCORE] LLM error after {elapsed:.2f}s | error={type(e).__name__}: {str(e)[:100]}")
            raise

    def match_with_skills(
        self,
        resume_text: str,
        target_skills: list[str],
        num_rag_matches: int = 5,
        num_web_matches: int = 5,
    ) -> dict:
        """
        Match jobs based on specific target skills.
        Useful for skill-based job discovery.
        """
        logger.info(f"Matching jobs for skills: {target_skills}")

        # Convert skills to search query
        query = " ".join(target_skills)

        return self.match_jobs_comprehensive(
            resume_text=resume_text,
            job_query=query,
            num_rag_matches=num_rag_matches,
            num_web_matches=num_web_matches,
        )

    def match_with_role(
        self,
        resume_text: str,
        target_role: str,
        num_rag_matches: int = 5,
        num_web_matches: int = 5,
    ) -> dict:
        """
        Match jobs based on a specific target role.
        Example: "Senior Software Engineer", "Data Scientist", etc.
        """
        logger.info(f"Matching jobs for role: {target_role}")

        return self.match_jobs_comprehensive(
            resume_text=resume_text,
            job_query=target_role,
            num_rag_matches=num_rag_matches,
            num_web_matches=num_web_matches,
        )
