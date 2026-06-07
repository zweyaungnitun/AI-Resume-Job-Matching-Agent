"""Career Roadmap Agent — generates personalized 3-6 month learning plans based on skill gaps"""

import json
import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

from app.config import settings

logger = logging.getLogger(__name__)


class CareerRoadmapAgent:
    """Agent that generates a detailed career development roadmap"""

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            google_api_key=settings.GOOGLE_API_KEY,
            model=settings.GEMINI_MODEL,
            temperature=0.2,
        )

    def generate(
        self,
        resume_text: str,
        job_title: str,
        company: str,
        missing_required_skills: list[str],
        missing_preferred_skills: list[str],
        target_timeframe_months: int = 6,
    ) -> dict:
        """
        Generate a personalized career roadmap.

        Args:
            resume_text: User's current resume/CV
            job_title: Target job title
            company: Target company
            missing_required_skills: Required skills user is missing
            missing_preferred_skills: Preferred skills user is missing
            target_timeframe_months: Timeline for roadmap (3-12 months)

        Returns:
            Dictionary with roadmap structure including months, milestones, courses, checkpoints
        """
        logger.info(f"[ROADMAP] Generating roadmap for {job_title} | timeframe={target_timeframe_months} months")

        missing_required_str = ", ".join(missing_required_skills) if missing_required_skills else "None"
        missing_preferred_str = ", ".join(missing_preferred_skills) if missing_preferred_skills else "None"

        prompt = PromptTemplate(
            input_variables=[
                "resume_text",
                "job_title",
                "company",
                "missing_required",
                "missing_preferred",
                "timeframe",
            ],
            template="""You are an expert career coach and learning strategist specializing in tech careers.
Create a detailed, actionable career roadmap to help someone transition into their target role.

Current Resume:
{resume_text}

Target Role: {job_title} at {company}
Timeline: {timeframe} months

Missing Required Skills: {missing_required}
Missing Preferred Skills: {missing_preferred}

Return a JSON object with these exact keys:
- success: boolean (true)
- job_title: string (target role)
- current_level: string (e.g., "Mid-level Software Engineer")
- target_level: string (e.g., "Senior Software Engineer")
- estimated_timeline_months: integer (recommended timeframe)
- roadmap: array of objects, one per month, each with:
  - month: integer (1-{timeframe})
  - theme: string (e.g., "Foundation: System Design & Architecture")
  - milestones: array of strings (specific milestones for this month)
  - skills_targeted: array of strings (which skills this month focuses on)
  - courses: array of objects, each with:
    - title: string
    - provider: string (e.g., "Udemy", "Coursera", "Educative", "LinkedIn Learning")
    - url: string (real or realistic URL)
    - duration_hours: integer (estimated hours)
    - difficulty: string ("Beginner"/"Intermediate"/"Advanced")
    - priority: string ("High"/"Medium"/"Low")
  - practice_projects: array of strings (2-3 projects to build)
  - checkpoint: string (specific goal/validation for end of month)
- critical_path: array of strings (3-5 skills that are most important to master first)
- quick_wins: array of strings (things to learn/do in 1-2 weeks for quick progress)
- learning_resources_summary: object with:
  - total_estimated_hours: integer
  - free_resources: integer
  - paid_courses: integer
  - books: integer
  - community_resources: integer

Make recommendations realistic and specific. Prioritize the missing required skills first.
Spread learning across months with a mix of theory (courses) and practice (projects).
Vary difficulty progression — start with intermediate foundations, ramp up to advanced.

Respond with valid JSON only, no markdown.""",
        )

        try:
            chain = prompt | self.llm
            result = chain.invoke({
                "resume_text": resume_text,
                "job_title": job_title,
                "company": company,
                "missing_required": missing_required_str,
                "missing_preferred": missing_preferred_str,
                "timeframe": target_timeframe_months,
            })

            response_text = result.content
            logger.debug(f"[ROADMAP] Raw response: {response_text[:200]}...")

            roadmap_data = json.loads(response_text)
            logger.info(f"[ROADMAP] Roadmap generated successfully with {len(roadmap_data.get('roadmap', []))} months")
            return roadmap_data

        except json.JSONDecodeError as e:
            logger.error(f"[ROADMAP] JSON parsing error: {str(e)}")
            return {
                "success": False,
                "error": f"Failed to parse roadmap: {str(e)}"
            }
        except Exception as e:
            logger.error(f"[ROADMAP] Error generating roadmap: {type(e).__name__}: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": f"Failed to generate roadmap: {str(e)}"
            }
