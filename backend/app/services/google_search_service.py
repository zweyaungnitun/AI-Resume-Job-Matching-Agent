"""Google Search Service — uses Serper API with DuckDuckGo fallback for job search"""

import logging
import requests
import time
from typing import Optional
from duckduckgo_search import DDGS

from app.config import settings

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


class GoogleSearchService:
    """Searches for jobs using Google Search (via Serper API) with DuckDuckGo fallback"""

    SERPER_ENDPOINT = "https://google.serper.dev/search"

    def search_jobs(self, query: str, max_results: int = 5) -> list[dict]:
        """
        Search for jobs using Serper (Google Search) API.
        Falls back to DuckDuckGo if Serper API key not configured.

        Returns list of dicts with keys: title, url, snippet
        """
        logger.info(f"[JOB_SEARCH] Starting job search | query='{query}' | max_results={max_results}")
        start_time = time.time()

        if settings.SERPER_API_KEY:
            logger.debug(f"[JOB_SEARCH] SERPER_API_KEY is configured, using Serper API")
            results = self._search_jobs_serper(query, max_results)
        else:
            logger.warning(f"[JOB_SEARCH] SERPER_API_KEY not configured, falling back to DuckDuckGo")
            results = self._search_jobs_ddgs(query, max_results)

        elapsed = time.time() - start_time
        logger.info(f"[JOB_SEARCH] Completed | results_count={len(results)} | elapsed_time={elapsed:.2f}s")
        return results

    def _search_jobs_serper(self, query: str, max_results: int) -> list[dict]:
        """Search for jobs using Serper (Google Search) API"""
        logger.debug(f"[SERPER_SEARCH] Initiating Serper API call | query='{query}' | max_results={max_results}")
        start_time = time.time()

        try:
            # Build job-specific search query
            search_query = f"{query} job posting site:linkedin.com OR site:indeed.com OR site:glassdoor.com OR site:wellfound.com"
            logger.debug(f"[SERPER_SEARCH] Built search query: '{search_query}'")

            headers = {
                "X-API-KEY": settings.SERPER_API_KEY,
                "Content-Type": "application/json",
            }

            payload = {
                "q": search_query,
                "num": max_results,
                "type": "search",
            }

            logger.debug(f"[SERPER_SEARCH] Sending request to {self.SERPER_ENDPOINT}")

            response = requests.post(
                self.SERPER_ENDPOINT,
                headers=headers,
                json=payload,
                timeout=15,
            )

            logger.debug(f"[SERPER_SEARCH] Response status: {response.status_code}")
            response.raise_for_status()

            data = response.json()
            organic_results = data.get("organic", [])
            logger.debug(f"[SERPER_SEARCH] Parsed {len(organic_results)} organic results from Serper")

            results = []
            for idx, result in enumerate(organic_results):
                parsed_result = {
                    "title": result.get("title", ""),
                    "url": result.get("link", ""),
                    "snippet": result.get("snippet", ""),
                }
                results.append(parsed_result)
                logger.debug(f"[SERPER_SEARCH] Result #{idx+1}: {parsed_result['title'][:50]}... | url={parsed_result['url'][:60]}...")

            elapsed = time.time() - start_time
            logger.info(f"[SERPER_SEARCH] Success | query='{query}' | results={len(results)} | time={elapsed:.2f}s")
            return results

        except requests.exceptions.Timeout as e:
            elapsed = time.time() - start_time
            logger.error(f"[SERPER_SEARCH] Timeout error after {elapsed:.2f}s: {str(e)}, falling back to DuckDuckGo")
            return self._search_jobs_ddgs(query, max_results)
        except requests.exceptions.RequestException as e:
            elapsed = time.time() - start_time
            logger.error(f"[SERPER_SEARCH] Request error after {elapsed:.2f}s: {str(e)}, falling back to DuckDuckGo")
            return self._search_jobs_ddgs(query, max_results)
        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"[SERPER_SEARCH] Unexpected error after {elapsed:.2f}s: {type(e).__name__}: {str(e)}, falling back to DuckDuckGo")
            return self._search_jobs_ddgs(query, max_results)

    def _search_jobs_ddgs(self, query: str, max_results: int) -> list[dict]:
        """Fallback to DuckDuckGo for job search"""
        logger.debug(f"[DDGS_SEARCH] Initiating DuckDuckGo search | query='{query}' | max_results={max_results}")
        start_time = time.time()

        try:
            search_query = f"{query} job posting site:linkedin.com OR site:indeed.com OR site:glassdoor.com OR site:wellfound.com"
            logger.debug(f"[DDGS_SEARCH] Built search query: '{search_query}'")

            logger.debug(f"[DDGS_SEARCH] Calling DDGS().text() with max_results={max_results}")

            with DDGS() as ddgs:
                results_raw = list(ddgs.text(search_query, max_results=max_results))

            logger.debug(f"[DDGS_SEARCH] Received {len(results_raw)} raw results from DuckDuckGo")

            results = []
            for idx, r in enumerate(results_raw):
                parsed_result = {
                    "title": r.get("title", ""),
                    "url": r.get("href", ""),
                    "snippet": r.get("body", ""),
                }
                results.append(parsed_result)
                logger.debug(f"[DDGS_SEARCH] Result #{idx+1}: {parsed_result['title'][:50]}... | url={parsed_result['url'][:60]}...")

            elapsed = time.time() - start_time
            logger.info(f"[DDGS_SEARCH] Success | query='{query}' | results={len(results)} | time={elapsed:.2f}s")
            return results

        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(f"[DDGS_SEARCH] Failed after {elapsed:.2f}s | query='{query}' | error={type(e).__name__}: {str(e)}")
            return []

    def search_company(self, company_name: str) -> list[dict]:
        """Search for company background information"""
        try:
            headers = {
                "X-API-KEY": settings.SERPER_API_KEY,
                "Content-Type": "application/json",
            } if settings.SERPER_API_KEY else {}

            search_query = f"{company_name} company overview culture tech stack employees"

            if settings.SERPER_API_KEY:
                response = requests.post(
                    self.SERPER_ENDPOINT,
                    headers=headers,
                    json={"q": search_query, "num": 6},
                    timeout=15,
                )
                response.raise_for_status()
                data = response.json()
                results = [
                    {
                        "title": r.get("title", ""),
                        "url": r.get("link", ""),
                        "snippet": r.get("snippet", ""),
                    }
                    for r in data.get("organic", [])
                ]
            else:
                with DDGS() as ddgs:
                    results_raw = list(ddgs.text(search_query, max_results=6))
                results = [
                    {
                        "title": r.get("title", ""),
                        "url": r.get("href", ""),
                        "snippet": r.get("body", ""),
                    }
                    for r in results_raw
                ]

            return results

        except Exception as e:
            logger.error(f"Company search failed: {str(e)}")
            return []

    def search_company_news(self, company_name: str) -> list[dict]:
        """Search for recent company news"""
        try:
            search_query = f"{company_name} news 2024 2025"

            headers = {
                "X-API-KEY": settings.SERPER_API_KEY,
                "Content-Type": "application/json",
            } if settings.SERPER_API_KEY else {}

            if settings.SERPER_API_KEY:
                response = requests.post(
                    self.SERPER_ENDPOINT,
                    headers=headers,
                    json={"q": search_query, "num": 4},
                    timeout=15,
                )
                response.raise_for_status()
                data = response.json()
                results = [
                    {
                        "title": r.get("title", ""),
                        "url": r.get("link", ""),
                        "snippet": r.get("snippet", ""),
                    }
                    for r in data.get("organic", [])
                ]
            else:
                with DDGS() as ddgs:
                    results_raw = list(ddgs.text(search_query, max_results=4))
                results = [
                    {
                        "title": r.get("title", ""),
                        "url": r.get("href", ""),
                        "snippet": r.get("body", ""),
                    }
                    for r in results_raw
                ]

            return results

        except Exception as e:
            logger.error(f"Company news search failed: {str(e)}")
            return []
