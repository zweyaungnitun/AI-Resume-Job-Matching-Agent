"""Multi-Agent Orchestrator — coordinates all agents for a full CV-job analysis pipeline"""

import logging
import asyncio
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

from app.services.resume_parser import ResumeParser
from app.services.rag_service import RAGService
from app.services.cv_review_agent import CVReviewAgent
from app.services.job_analysis_agent import JobAnalysisAgent
from app.services.company_research_agent import CompanyResearchAgent
from app.services.scoring_agent import ScoringAgent
from app.services.cv_improvement_agent import CVImprovementAgent
from app.services.job_matcher_agent import JobMatcherAgent

logger = logging.getLogger(__name__)


class MultiAgentOrchestrator:
    """
    Orchestrates the full multi-agent pipeline:
    1. CV Review Agent  — quality check of the CV
    2. RAG Service      — semantic job matching from vector DB
    3. Job Analysis Agent — parse job from URL / pasted text / web search
    4. Company Research Agent — web research on the company
    5. Scoring Agent    — detailed match scoring with breakdown
    6. CV Improvement Agent — targeted improvement recommendations
    """

    def __init__(self):
        self.parser = ResumeParser()
        self.rag = RAGService()
        self.cv_reviewer = CVReviewAgent()
        self.job_analyzer = JobAnalysisAgent()
        self.company_researcher = CompanyResearchAgent()
        self.scorer = ScoringAgent()
        self.cv_improver = CVImprovementAgent()
        self.job_matcher = JobMatcherAgent()

    # ------------------------------------------------------------------
    # Public methods
    # ------------------------------------------------------------------

    def full_analysis(
        self,
        resume_text: str,
        job_source_type: str,       # "url" | "text" | "search"
        job_source_value: str,      # URL / pasted text / search query
        num_rag_matches: int = 5,
    ) -> dict:
        """
        Run the complete multi-agent pipeline and return a unified report.
        job_source_type: "url" | "text" | "search"
        """
        logger.info(f"Starting full analysis: source_type={job_source_type}")

        # ---- Stage 1: CV review + RAG matching (can run in parallel) ----
        logger.info("Stage 1: CV review + RAG matching")
        with ThreadPoolExecutor(max_workers=2) as pool:
            cv_review_future = pool.submit(self.cv_reviewer.review, resume_text)
            rag_future = pool.submit(self._rag_matches, resume_text, num_rag_matches)

        cv_review = cv_review_future.result()
        rag_matches = rag_future.result()
        logger.info(f"Stage 1 complete: CV review done, {len(rag_matches)} job matches")

        # ---- Stage 2: Job analysis ----
        logger.info("Stage 2: Job analysis")

        # If search is requested, use top RAG match instead of web search
        if job_source_type == "search" and rag_matches:
            logger.info("Using top RAG match for job analysis (Pinecone-only mode)")
            job_analysis = {
                "success": True,
                "job_title": rag_matches[0].get("job_title", "Unknown Role"),
                "company": rag_matches[0].get("company", "Unknown Company"),
                "description": rag_matches[0].get("description_snippet", ""),
                "source_url": "",
                "source_title": rag_matches[0].get("job_title", ""),
            }
        else:
            job_analysis = self._analyze_job(job_source_type, job_source_value)

        if not job_analysis.get("success"):
            logger.warning(f"Job analysis failed: {job_analysis.get('error')}")
            return {
                "success": False,
                "error": job_analysis.get("error", "Failed to analyze job."),
                "cv_review": cv_review,
                "rag_matches": rag_matches,
            }

        logger.info(f"Stage 2 complete: {job_analysis.get('job_title')} at {job_analysis.get('company')}")

        # ---- Stage 3: Company research + scoring (can run in parallel) ----
        logger.info("Stage 3: Company research + scoring")
        company_name = job_analysis.get("company", "")
        job_title = job_analysis.get("job_title", "")

        with ThreadPoolExecutor(max_workers=2) as pool:
            company_future = pool.submit(self.company_researcher.research, company_name, job_title)
            score_future = pool.submit(self.scorer.score, resume_text, job_analysis)

        company_research = company_future.result()
        score_result = score_future.result()
        logger.info(f"Stage 3 complete: match score {score_result.get('match_score', 'N/A')}")

        # ---- Stage 4: CV improvement recommendations ----
        logger.info("Stage 4: CV improvement recommendations")
        improvements = self.cv_improver.recommend(
            resume_text, job_analysis, score_result, cv_review
        )
        logger.info("Full analysis complete")

        return {
            "success": True,
            "cv_review": cv_review,
            "rag_matches": rag_matches,
            "job_analysis": job_analysis,
            "company_research": company_research,
            "score_result": score_result,
            "improvements": improvements,
        }

    def review_cv_only(self, resume_text: str) -> dict:
        """Run only the CV review agent - efficient, no redundant skill extraction"""
        logger.info(f"[ORCHESTRATOR_CV_REVIEW] Starting CV review for {len(resume_text)} chars")
        start_time = time.time()

        try:
            logger.debug(f"[ORCHESTRATOR_CV_REVIEW] Calling cv_reviewer.review()")
            cv_review = self.cv_reviewer.review(resume_text)
            logger.debug(f"[ORCHESTRATOR_CV_REVIEW] CV review returned | type={type(cv_review)} | keys={list(cv_review.keys()) if isinstance(cv_review, dict) else 'N/A'}")

            result = {"cv_review": cv_review}
            elapsed = time.time() - start_time

            logger.info(f"[ORCHESTRATOR_CV_REVIEW] CV review completed successfully | overall_score={cv_review.get('overall_score')} | time={elapsed:.2f}s")
            logger.debug(f"[ORCHESTRATOR_CV_REVIEW] Returning result with keys: {list(result.keys())}")

            return result

        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"[ORCHESTRATOR_CV_REVIEW] CV review failed after {elapsed:.2f}s | error={type(e).__name__}: {str(e)}", exc_info=True)
            raise

    def rag_match_only(self, resume_text: str, num_matches: int = 5) -> dict:
        """Run only RAG-based job matching - no AI skill extraction"""
        logger.info(f"Starting RAG matching for {len(resume_text)} chars")
        try:
            rag_matches = self._rag_matches(resume_text, num_matches)
            logger.info(f"RAG matching completed: {len(rag_matches)} matches found")
            return {"rag_matches": rag_matches}
        except Exception as e:
            logger.error(f"RAG matching failed: {str(e)}", exc_info=True)
            raise

    def search_jobs(self, query: str) -> dict:
        """Search for jobs using the job analysis agent"""
        return self.job_analyzer.search_and_analyze(query)

    def match_jobs_comprehensive(
        self,
        resume_text: str,
        job_query: str = None,
        num_rag_matches: int = 5,
        num_web_matches: int = 5,
        include_web_search: bool = True,
    ) -> dict:
        """
        Comprehensive job matching combining RAG (Pinecone) and web search.
        Includes LLM-powered scoring and ranking.
        """
        logger.info("Starting comprehensive job matching via orchestrator")
        return self.job_matcher.match_jobs_comprehensive(
            resume_text=resume_text,
            job_query=job_query,
            num_rag_matches=num_rag_matches,
            num_web_matches=num_web_matches,
            include_web_search=include_web_search,
        )

    def match_jobs_by_skills(
        self,
        resume_text: str,
        target_skills: list[str],
        num_rag_matches: int = 5,
        num_web_matches: int = 5,
    ) -> dict:
        """Match jobs based on specific target skills"""
        logger.info(f"Matching jobs by skills: {target_skills}")
        return self.job_matcher.match_with_skills(
            resume_text=resume_text,
            target_skills=target_skills,
            num_rag_matches=num_rag_matches,
            num_web_matches=num_web_matches,
        )

    def match_jobs_by_role(
        self,
        resume_text: str,
        target_role: str,
        num_rag_matches: int = 5,
        num_web_matches: int = 5,
    ) -> dict:
        """Match jobs based on a specific target role"""
        logger.info(f"Matching jobs by role: {target_role}")
        return self.job_matcher.match_with_role(
            resume_text=resume_text,
            target_role=target_role,
            num_rag_matches=num_rag_matches,
            num_web_matches=num_web_matches,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _extract_resume_data(self, resume_text: str) -> dict:
        skills = self.parser.extract_skills(resume_text)
        experience = self.parser.extract_experience(resume_text)
        return {"skills": skills, "experience": experience}

    def _rag_matches(self, resume_text: str, num_matches: int) -> list[dict]:
        logger.info(f"Retrieving {num_matches} RAG matches")
        try:
            jobs = self.rag.retrieve_jobs(resume_text, top_k=num_matches)
            logger.info(f"Retrieved {len(jobs)} jobs from vector DB")
            matches = []
            for job in jobs:
                score = self.rag.score_match(resume_text, job)
                gaps = self._quick_gap(resume_text, job.get("description", ""))
                matches.append({
                    "job_title": job.get("job_title", ""),
                    "company": job.get("company", ""),
                    "match_score": round(score * 100),
                    "description_snippet": job.get("description", "")[:300],
                    "gap_summary": gaps.get("gap_summary", ""),
                    "missing_skills": gaps.get("missing_skills", []),
                    "improvements": gaps.get("recommendations", []),
                })
            matches.sort(key=lambda x: x["match_score"], reverse=True)
            logger.info(f"Processed {len(matches)} RAG matches")
            return matches
        except Exception as e:
            logger.error(f"RAG matching error: {str(e)}", exc_info=True)
            return []

    def _analyze_job(self, source_type: str, source_value: str) -> dict:
        if source_type == "url":
            return self.job_analyzer.analyze_from_url(source_value)
        elif source_type == "text":
            return self.job_analyzer.analyze_from_text(source_value)
        elif source_type == "search":
            result = self.job_analyzer.search_and_analyze(source_value)
            # Return the first successfully analyzed result
            for r in result.get("results", []):
                if r.get("analysis") and r["analysis"].get("success"):
                    return r["analysis"]
            return {"success": False, "error": "No analyzable jobs found for your search."}
        return {"success": False, "error": f"Unknown source type: {source_type}"}

    def _quick_gap(self, resume_text: str, job_description: str) -> dict:
        from app.services.agent_service import MatchingAgent
        agent = MatchingAgent()
        return agent.analyze_skill_gaps(resume_text, job_description)
