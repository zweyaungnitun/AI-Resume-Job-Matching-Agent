"""Web search and URL scraping service for job and company research"""

import re
import requests
from bs4 import BeautifulSoup
from typing import Optional
from duckduckgo_search import DDGS


class WebSearchService:
    """Fetches job descriptions from URLs and searches the web"""

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    }

    def fetch_job_from_url(self, url: str) -> dict:
        """Scrape and extract job description text from a URL"""
        try:
            response = requests.get(url, headers=self.HEADERS, timeout=15)
            response.raise_for_status()
        except requests.RequestException as e:
            return {"success": False, "error": str(e), "text": "", "title": ""}

        soup = BeautifulSoup(response.text, "lxml")

        # Remove noise elements
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()

        title = soup.title.get_text(strip=True) if soup.title else ""

        # Try common job-content containers first
        job_content = ""
        for selector in [
            '[class*="job-description"]',
            '[class*="jobDescription"]',
            '[class*="description"]',
            '[id*="job-description"]',
            "article",
            "main",
        ]:
            container = soup.select_one(selector)
            if container:
                job_content = container.get_text(separator="\n", strip=True)
                if len(job_content) > 200:
                    break

        if not job_content:
            job_content = soup.get_text(separator="\n", strip=True)

        # Clean up excessive whitespace
        job_content = re.sub(r"\n{3,}", "\n\n", job_content).strip()

        return {
            "success": True,
            "text": job_content[:8000],
            "title": title,
            "url": url,
        }

    def search_jobs(self, query: str, max_results: int = 5) -> list[dict]:
        """Search DuckDuckGo for job postings"""
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(f"{query} job posting site:linkedin.com OR site:indeed.com OR site:glassdoor.com", max_results=max_results))
            return [
                {
                    "title": r.get("title", ""),
                    "url": r.get("href", ""),
                    "snippet": r.get("body", ""),
                }
                for r in results
            ]
        except Exception:
            return []

    def search_company(self, company_name: str) -> list[dict]:
        """Search for company background information"""
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(
                    f"{company_name} company overview culture tech stack employees",
                    max_results=6,
                ))
            return [
                {
                    "title": r.get("title", ""),
                    "url": r.get("href", ""),
                    "snippet": r.get("body", ""),
                }
                for r in results
            ]
        except Exception:
            return []

    def search_company_news(self, company_name: str) -> list[dict]:
        """Search for recent company news"""
        try:
            with DDGS() as ddgs:
                results = list(ddgs.text(
                    f"{company_name} news 2024 2025",
                    max_results=4,
                ))
            return [
                {
                    "title": r.get("title", ""),
                    "url": r.get("href", ""),
                    "snippet": r.get("body", ""),
                }
                for r in results
            ]
        except Exception:
            return []
