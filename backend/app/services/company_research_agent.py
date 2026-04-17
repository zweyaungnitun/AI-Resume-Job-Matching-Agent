"""Company Research Agent — researches company background, culture, and tech stack"""

import json
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

from app.config import settings
from app.services.web_search_service import WebSearchService


class CompanyResearchAgent:
    """Agent that researches a company using web search and synthesizes a report"""

    def __init__(self):
        self.llm = ChatOpenAI(
            api_key=settings.OPENAI_API_KEY,
            model=settings.OPENAI_MODEL,
            temperature=0.2,
        )
        self.web = WebSearchService()

    def research(self, company_name: str, job_title: str = "") -> dict:
        """Research a company and return structured intelligence"""
        if not company_name or company_name.strip() == "":
            return self._empty_research()

        background_results = self.web.search_company(company_name)
        news_results = self.web.search_company_news(company_name)

        background_snippets = "\n".join(
            f"- {r['title']}: {r['snippet']}" for r in background_results
        )
        news_snippets = "\n".join(
            f"- {r['title']}: {r['snippet']}" for r in news_results
        )

        prompt = PromptTemplate(
            input_variables=["company_name", "job_title", "background", "news"],
            template="""You are a company research analyst. Based on the following web search results about {company_name},
provide a comprehensive company intelligence report for a candidate applying for a {job_title} role.

Background Search Results:
{background}

Recent News:
{news}

Return a JSON object with these exact keys:
- company_name: string
- founded: string (year or approximate, "Unknown" if not found)
- size: string (employee count range or description, "Unknown" if not found)
- industry: string
- headquarters: string ("Unknown" if not found)
- overview: string (3-4 sentence company description)
- mission_values: list of strings (company values or mission points)
- tech_stack: list of strings (technologies the company uses)
- culture_highlights: list of strings (what working there is like)
- recent_news: list of objects with keys: headline (string), summary (string)
- pros_for_candidate: list of strings (reasons this company could be good to work for)
- cons_for_candidate: list of strings (potential concerns or drawbacks)
- interview_tips: list of strings (specific tips for interviewing at this company based on culture)
- glassdoor_rating: string ("Not found" if unavailable)
- data_confidence: string (high/medium/low — based on quality of search results)

Respond with valid JSON only, no markdown.
""",
        )

        chain = prompt | self.llm
        response = chain.invoke({
            "company_name": company_name,
            "job_title": job_title,
            "background": background_snippets[:3000] or "No results found.",
            "news": news_snippets[:2000] or "No recent news found.",
        })

        try:
            content = response.content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            result = json.loads(content)
            result["search_sources"] = [r["url"] for r in background_results if r.get("url")]
            return result
        except (json.JSONDecodeError, AttributeError):
            return self._empty_research(company_name)

    def _empty_research(self, company_name: str = "") -> dict:
        return {
            "company_name": company_name,
            "founded": "Unknown",
            "size": "Unknown",
            "industry": "Unknown",
            "headquarters": "Unknown",
            "overview": "Company information could not be retrieved.",
            "mission_values": [],
            "tech_stack": [],
            "culture_highlights": [],
            "recent_news": [],
            "pros_for_candidate": [],
            "cons_for_candidate": [],
            "interview_tips": [],
            "glassdoor_rating": "Not found",
            "data_confidence": "low",
            "search_sources": [],
        }
