"""Multi-Agent Orchestrator — coordinates all agents for a full CV-job analysis pipeline"""

import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

from app.services.resume_parser import ResumeParser
from app.services.rag_service import RAGService
from app.services.cv_review_agent import CVReviewAgent
from app.services.job_analysis_agent import JobAnalysisAgent
from app.services.company_research_agent import CompanyResearchAgent
from app.services.scoring_agent import ScoringAgent
from app.services.cv_improvement_agent import CVImprovementAgent


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
        # ---- Stage 1: CV review + RAG matching (can run in parallel) ----
        with ThreadPoolExecutor(max_workers=3) as pool:
            cv_review_future = pool.submit(self.cv_reviewer.review, resume_text)
            rag_future = pool.submit(self._rag_matches, resume_text, num_rag_matches)
            resume_data_future = pool.submit(self._extract_resume_data, resume_text)

        cv_review = cv_review_future.result()
        rag_matches = rag_future.result()
        resume_data = resume_data_future.result()

        # ---- Stage 2: Job analysis ----
        job_analysis = self._analyze_job(job_source_type, job_source_value)

        if not job_analysis.get("success"):
            return {
                "success": False,
                "error": job_analysis.get("error", "Failed to analyze job."),
                "cv_review": cv_review,
                "rag_matches": rag_matches,
                "resume_data": resume_data,
            }

        # ---- Stage 3: Company research + scoring (can run in parallel) ----
        company_name = job_analysis.get("company", "")
        job_title = job_analysis.get("job_title", "")

        with ThreadPoolExecutor(max_workers=2) as pool:
            company_future = pool.submit(self.company_researcher.research, company_name, job_title)
            score_future = pool.submit(self.scorer.score, resume_text, job_analysis)

        company_research = company_future.result()
        score_result = score_future.result()

        # ---- Stage 4: CV improvement recommendations ----
        improvements = self.cv_improver.recommend(
            resume_text, job_analysis, score_result, cv_review
        )

        return {
            "success": True,
            "resume_data": resume_data,
            "cv_review": cv_review,
            "rag_matches": rag_matches,
            "job_analysis": job_analysis,
            "company_research": company_research,
            "score_result": score_result,
            "improvements": improvements,
        }

    def review_cv_only(self, resume_text: str) -> dict:
        """Run only the CV review agent"""
        resume_data = self._extract_resume_data(resume_text)
        cv_review = self.cv_reviewer.review(resume_text)
        return {"resume_data": resume_data, "cv_review": cv_review}

    def rag_match_only(self, resume_text: str, num_matches: int = 5) -> dict:
        """Run only RAG-based job matching"""
        resume_data = self._extract_resume_data(resume_text)
        rag_matches = self._rag_matches(resume_text, num_matches)
        return {"resume_data": resume_data, "rag_matches": rag_matches}

    def search_jobs(self, query: str) -> dict:
        """Search for jobs using the job analysis agent"""
        return self.job_analyzer.search_and_analyze(query)

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _extract_resume_data(self, resume_text: str) -> dict:
        skills = self.parser.extract_skills(resume_text)
        experience = self.parser.extract_experience(resume_text)
        return {"skills": skills, "experience": experience}

    def _rag_matches(self, resume_text: str, num_matches: int) -> list[dict]:
        try:
            jobs = self.rag.retrieve_jobs(resume_text, top_k=num_matches)
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
            return matches
        except Exception as e:
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
