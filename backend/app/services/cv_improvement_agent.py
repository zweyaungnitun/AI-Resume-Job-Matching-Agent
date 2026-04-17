"""CV Improvement Agent — generates targeted improvement recommendations"""

import json
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate

from app.config import settings


class CVImprovementAgent:
    """Agent that recommends specific, actionable CV improvements for a target job"""

    def __init__(self):
        self.llm = ChatOpenAI(
            api_key=settings.OPENAI_API_KEY,
            model=settings.OPENAI_MODEL,
            temperature=0.2,
        )

    def recommend(self, resume_text: str, job_analysis: dict, score_result: dict, cv_review: dict) -> dict:
        """
        Generate targeted CV improvement recommendations based on:
        - The current CV content
        - The target job requirements
        - The scoring gap analysis
        - The CV review findings
        """
        missing_skills = score_result.get("missing_required_skills", [])
        missing_preferred = score_result.get("missing_preferred_skills", [])
        ats_keywords = job_analysis.get("keywords_for_ats", [])
        cv_weaknesses = cv_review.get("weaknesses", [])
        immediate_fixes = cv_review.get("immediate_fixes", [])

        prompt = PromptTemplate(
            input_variables=["resume_text", "job_title", "company", "missing_required",
                             "missing_preferred", "ats_keywords", "cv_weaknesses",
                             "score", "match_level", "responsibilities"],
            template="""You are an expert CV/resume writer and career coach specializing in ATS optimization.
Create highly specific, actionable recommendations to transform this CV for the target job.

Current CV:
{resume_text}

Target Job: {job_title} at {company}
Current Match Score: {score}/100 ({match_level})
Missing Required Skills: {missing_required}
Missing Preferred Skills: {missing_preferred}
Key ATS Keywords to Add: {ats_keywords}
Current CV Weaknesses: {cv_weaknesses}
Key Responsibilities: {responsibilities}

Return a JSON object with these exact keys:
- priority_actions: list of objects, each with: action (string), section (string), example (string), impact (string: "High"/"Medium"/"Low")
- skills_to_add: list of objects, each with: skill (string), how_to_acquire (string), timeframe (string), importance (string: "Required"/"Preferred")
- keywords_to_add: list of strings (exact ATS keywords missing from CV, should add naturally)
- bullet_rewrites: list of objects, each with: original (string — quote a weak bullet from CV), improved (string — rewritten version), why (string)
- new_sections_to_add: list of objects, each with: section_name (string), reason (string), example_content (string)
- summary_rewrite: string (rewritten professional summary optimized for this specific job)
- formatting_improvements: list of strings (specific formatting changes to make)
- quantification_opportunities: list of strings (specific bullets where numbers/metrics should be added)
- overall_strategy: string (3-4 sentence strategic advice for landing this role)
- estimated_score_after_improvements: integer 0-100 (predicted new score if all changes made)

Respond with valid JSON only, no markdown.
""",
        )

        chain = prompt | self.llm
        response = chain.invoke({
            "resume_text": resume_text[:4000],
            "job_title": job_analysis.get("job_title", ""),
            "company": job_analysis.get("company", "the company"),
            "missing_required": ", ".join(missing_skills[:10]),
            "missing_preferred": ", ".join(missing_preferred[:8]),
            "ats_keywords": ", ".join(ats_keywords[:15]),
            "cv_weaknesses": ", ".join(cv_weaknesses[:5]),
            "score": score_result.get("overall_score", 0),
            "match_level": score_result.get("match_level", ""),
            "responsibilities": "\n".join(job_analysis.get("key_responsibilities", [])[:6]),
        })

        try:
            content = response.content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
            result = json.loads(content)
            result["immediate_fixes_from_review"] = immediate_fixes
            return result
        except (json.JSONDecodeError, AttributeError):
            return self._fallback_recommendations(missing_skills, ats_keywords)

    def _fallback_recommendations(self, missing_skills: list, ats_keywords: list) -> dict:
        return {
            "priority_actions": [],
            "skills_to_add": [
                {"skill": s, "how_to_acquire": "Online courses or projects", "timeframe": "1-3 months", "importance": "Required"}
                for s in missing_skills[:5]
            ],
            "keywords_to_add": ats_keywords[:10],
            "bullet_rewrites": [],
            "new_sections_to_add": [],
            "summary_rewrite": "",
            "formatting_improvements": [],
            "quantification_opportunities": [],
            "overall_strategy": "Focus on acquiring the missing required skills and tailoring your CV to include the job's keywords.",
            "estimated_score_after_improvements": 0,
            "immediate_fixes_from_review": [],
        }
