"""Job Analysis Agent — extracts and structures job requirements from any source"""

import json
import logging
import time
from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

from app.config import settings
from app.services.web_search_service import WebSearchService

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class JobAnalysisAgent:
    """Agent that analyzes job postings from URLs, pasted text, or web search"""

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            google_api_key=settings.GOOGLE_API_KEY,
            model=settings.GEMINI_MODEL,
            temperature=0.1,
        )
        self.web = WebSearchService()

    def analyze_from_url(self, url: str) -> dict:
        """Fetch a job posting from a URL and analyze it"""
        logger.info(f"[JOB_ANALYSIS] Analyzing job from URL | url={url[:80]}...")
        start_time = time.time()

        try:
            logger.debug(f"[JOB_ANALYSIS] Fetching content from URL")
            result = self.web.fetch_job_from_url(url)

            if not result["success"]:
                elapsed = time.time() - start_time
                logger.error(f"[JOB_ANALYSIS] Failed to fetch URL after {elapsed:.2f}s | error={result.get('error')}")
                return {"success": False, "error": result["error"]}

            logger.debug(f"[JOB_ANALYSIS] Successfully fetched URL | text_len={len(result['text'])} chars")
            analysis = self._analyze_text(result["text"], source_url=url, source_title=result["title"])

            elapsed = time.time() - start_time
            logger.info(f"[JOB_ANALYSIS] URL analysis complete | success={analysis.get('success')} | time={elapsed:.2f}s")
            return analysis

        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"[JOB_ANALYSIS] URL analysis failed after {elapsed:.2f}s | error={type(e).__name__}: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def analyze_from_text(self, job_text: str) -> dict:
        """Analyze a pasted job description"""
        logger.info(f"[JOB_ANALYSIS] Analyzing job from pasted text | text_len={len(job_text)} chars")
        start_time = time.time()

        try:
            analysis = self._analyze_text(job_text, source_url=None, source_title=None)
            elapsed = time.time() - start_time
            logger.info(f"[JOB_ANALYSIS] Text analysis complete | success={analysis.get('success')} | time={elapsed:.2f}s")
            return analysis
        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"[JOB_ANALYSIS] Text analysis failed after {elapsed:.2f}s | error={type(e).__name__}: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def search_and_analyze(self, query: str) -> dict:
        """Search for jobs matching a query and return results with analysis"""
        logger.info(f"[JOB_ANALYSIS] Starting search and analyze | query='{query}'")
        start_time = time.time()

        try:
            logger.debug(f"[JOB_ANALYSIS] Searching for jobs with query: '{query}'")
            search_results = self.web.search_jobs(query, max_results=5)

            if not search_results:
                elapsed = time.time() - start_time
                logger.warning(f"[JOB_ANALYSIS] No search results found after {elapsed:.2f}s | query='{query}'")
                return {"success": False, "error": "No jobs found for your query.", "results": []}

            logger.info(f"[JOB_ANALYSIS] Found {len(search_results)} search results, analyzing top 3")

            analyzed = []
            for idx, r in enumerate(search_results[:3], 1):
                logger.debug(f"[JOB_ANALYSIS] Processing result #{idx}: {r['title'][:50]}...")

                entry = {
                    "title": r["title"],
                    "url": r["url"],
                    "snippet": r["snippet"],
                    "analysis": None,
                }

                if r["url"]:
                    logger.debug(f"[JOB_ANALYSIS] Fetching full content from URL #{idx}")
                    fetched = self.web.fetch_job_from_url(r["url"])

                    if fetched["success"] and len(fetched["text"]) > 300:
                        logger.debug(f"[JOB_ANALYSIS] Analyzing fetched content for result #{idx} | text_len={len(fetched['text'])}")
                        entry["analysis"] = self._analyze_text(
                            fetched["text"], source_url=r["url"], source_title=r["title"]
                        )
                        logger.debug(f"[JOB_ANALYSIS] Analysis complete for result #{idx} | success={entry['analysis'].get('success')}")
                    else:
                        logger.debug(f"[JOB_ANALYSIS] Skipped fetching for result #{idx} | success={fetched.get('success')} | text_len={len(fetched.get('text', ''))}")

                analyzed.append(entry)

            elapsed = time.time() - start_time
            logger.info(f"[JOB_ANALYSIS] Search and analyze complete | results={len(analyzed)} | analyzed_jobs={sum(1 for r in analyzed if r['analysis'])} | time={elapsed:.2f}s")
            return {"success": True, "results": analyzed}

        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"[JOB_ANALYSIS] Search and analyze failed after {elapsed:.2f}s | error={type(e).__name__}: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e), "results": []}

    def _analyze_text(self, job_text: str, source_url: Optional[str], source_title: Optional[str]) -> dict:
        logger.debug(f"[JOB_ANALYSIS] _analyze_text called | text_len={len(job_text)} | source_url={source_url[:50] if source_url else 'None'}...")
        start_time = time.time()

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

        try:
            logger.debug(f"[JOB_ANALYSIS] Invoking Gemini LLM for job text analysis")
            chain = prompt | self.llm
            response = chain.invoke({"job_text": job_text[:6000]})

            logger.debug(f"[JOB_ANALYSIS] Received response from Gemini | response_len={len(response.content)} chars")

            content = response.content.strip()
            if content.startswith("```"):
                logger.debug(f"[JOB_ANALYSIS] Extracting JSON from markdown code blocks")
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]

            result = json.loads(content)
            result["success"] = True
            result["source_url"] = source_url or ""
            result["source_title"] = source_title or result.get("job_title", "")
            result["raw_text"] = job_text[:3000]

            elapsed = time.time() - start_time
            logger.info(f"[JOB_ANALYSIS] Text analysis complete | job_title='{result.get('job_title')}' | company='{result.get('company')}' | time={elapsed:.2f}s")
            logger.debug(f"[JOB_ANALYSIS] Extracted skills: {len(result.get('required_skills', []))} required, {len(result.get('preferred_skills', []))} preferred")
            logger.debug(f"[JOB_ANALYSIS] Red flags: {len(result.get('red_flags', []))}")

            return result

        except json.JSONDecodeError as e:
            elapsed = time.time() - start_time
            logger.error(f"[JOB_ANALYSIS] JSON decode error after {elapsed:.2f}s | error={str(e)[:80]}")
            return {
                "success": False,
                "error": "Failed to analyze job description.",
                "job_title": source_title or "Unknown",
                "company": "",
                "source_url": source_url or "",
            }
        except AttributeError as e:
            elapsed = time.time() - start_time
            logger.error(f"[JOB_ANALYSIS] Attribute error after {elapsed:.2f}s | error={str(e)[:80]}")
            return {
                "success": False,
                "error": "Failed to analyze job description.",
                "job_title": source_title or "Unknown",
                "company": "",
                "source_url": source_url or "",
            }
        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"[JOB_ANALYSIS] Unexpected error after {elapsed:.2f}s | error={type(e).__name__}: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": "Failed to analyze job description.",
                "job_title": source_title or "Unknown",
                "company": "",
                "source_url": source_url or "",
            }
