"""Job Analysis Agent — extracts and structures job requirements from any source"""

import json
from typing import Optional
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

from app.config import settings
from app.services.web_search_service import WebSearchService


class JobAnalysisAgent:
    """Agent that analyzes job postings from URLs, pasted text, or web search"""

    def __init__(self):
        self.llm = ChatOpenAI(
            api_key=settings.OPENAI_API_KEY,
            model=settings.OPENAI_MODEL,
            temperature=0.1,
        )
        self.web = WebSearchService()

    def analyze_from_url(self, url: str) -> dict:
        """Fetch a job posting from a URL and analyze it"""
        result = self.web.fetch_job_from_url(url)
        if not result["success"]:
            return {"success": False, "error": result["error"]}
        return self._analyze_text(result["text"], source_url=url, source_title=result["title"])

    def analyze_from_text(self, job_text: str) -> dict:
        """Analyze a pasted job description"""
        return self._analyze_text(job_text, source_url=None, source_title=None)

    def search_and_analyze(self, query: str) -> dict:
        """Search for jobs matching a query and return results with analysis"""
        search_results = self.web.search_jobs(query, max_results=5)
        if not search_results:
            return {"success": False, "error": "No jobs found for your query.", "results": []}

        analyzed = []
        for r in search_results[:3]:
            entry = {
                "title": r["title"],
                "url": r["url"],
                "snippet": r["snippet"],
                "analysis": None,
            }
            if r["url"]:
                fetched = self.web.fetch_job_from_url(r["url"])
                if fetched["success"] and len(fetched["text"]) > 300:
                    entry["analysis"] = self._analyze_text(
                        fetched["text"], source_url=r["url"], source_title=r["title"]
                    )
            analyzed.append(entry)

        return {"success": True, "results": analyzed}

    def _analyze_text(self, job_text: str, source_url: Optional[str], source_title: Optional[str]) -> dict:
        prompt = PromptTemplate(
            input_variables=["job_text"],
            template="""You are an expert job analyst. Analyze the following job description and extract all key information.

Job Description:
{job_text}

Return a JSON object with these exact keys:
- job_title: string (the exact job title)
- company: string (company name, empty string if not found)
- location: string (location or "Remote" or "Not specified")
- job_type: string (Full-time/Part-time/Contract/etc)
- seniority: string (Junior/Mid/Senior/Lead/Manager/Director/etc)
- salary_range: string (if mentioned, else empty string)
- summary: string (2-3 sentence summary of the role)
- required_skills: list of strings (must-have technical skills)
- preferred_skills: list of strings (nice-to-have skills)
- required_experience_years: number (minimum years required, 0 if not specified)
- required_education: string (degree requirement or empty string)
- key_responsibilities: list of strings (top 5-8 main duties)
- tech_stack: list of strings (specific technologies, tools, frameworks mentioned)
- soft_skills: list of strings (soft skills required)
- benefits: list of strings (perks and benefits mentioned)
- keywords_for_ats: list of strings (important ATS keywords to include in resume)
- red_flags: list of strings (any concerning aspects of the job posting)
- is_valid_job: boolean (true if this is a valid job description, false if page content is irrelevant)

Respond with valid JSON only, no markdown.
""",
        )

        chain = prompt | self.llm
        response = chain.invoke({"job_text": job_text[:6000]})

        try:
            content = response.content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            result = json.loads(content)
            result["success"] = True
            result["source_url"] = source_url or ""
            result["source_title"] = source_title or result.get("job_title", "")
            result["raw_text"] = job_text[:3000]
            return result
        except (json.JSONDecodeError, AttributeError):
            return {
                "success": False,
                "error": "Failed to analyze job description.",
                "job_title": source_title or "Unknown",
                "company": "",
                "source_url": source_url or "",
            }
