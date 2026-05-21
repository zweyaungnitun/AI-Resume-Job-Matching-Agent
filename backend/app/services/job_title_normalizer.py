"""Job Title Normalizer — intelligently normalizes and classifies job titles for better matching"""

import logging
import json
from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

from app.config import settings

logger = logging.getLogger(__name__)


class JobTitleNormalizer:
    """Normalizes and classifies job titles for semantic matching"""

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            google_api_key=settings.GOOGLE_API_KEY,
            model=settings.GEMINI_MODEL,
            temperature=0.1,
        )

        # Job title synonyms and equivalences
        self.title_mappings = {
            "ai engineer": ["artificial intelligence engineer", "ai specialist", "ai developer"],
            "machine learning engineer": ["ml engineer", "mlops engineer", "machine learning specialist"],
            "data scientist": ["data science specialist", "analytics scientist"],
            "backend engineer": ["backend developer", "backend software engineer"],
            "frontend engineer": ["frontend developer", "ui engineer"],
            "full stack engineer": ["full stack developer", "full-stack engineer"],
            "devops engineer": ["devops specialist", "infrastructure engineer", "sre"],
            "qa engineer": ["quality assurance engineer", "test engineer", "qa specialist"],
            "product manager": ["pm", "product lead"],
            "data analyst": ["analytics analyst", "business analyst"],
        }

        # Level classifications
        self.level_keywords = {
            "junior": ["junior", "entry", "grad", "associate", "trainee"],
            "mid": ["mid", "intermediate", "experienced"],
            "senior": ["senior", "staff", "principal", "lead"],
            "manager": ["manager", "lead", "director", "head", "chief"],
        }

    def normalize(self, job_title: str) -> dict:
        """
        Normalize and classify a job title.

        Returns:
        {
            "original": "AI Engineer - Senior",
            "canonical": "AI Engineer",
            "core_role": "Engineer",
            "specialization": "AI",
            "level": "Senior",
            "normalized_title": "Senior AI Engineer",
            "matching_keywords": ["artificial intelligence", "ai", "machine learning"],
            "similar_titles": [...],
            "confidence": 0.95
        }
        """
        if not job_title or not isinstance(job_title, str):
            return {
                "original": job_title,
                "canonical": "Unknown Role",
                "core_role": "Unknown",
                "specialization": None,
                "level": None,
                "normalized_title": "Unknown Role",
                "matching_keywords": [],
                "similar_titles": [],
                "confidence": 0.0,
            }

        logger.info(f"Normalizing job title: {job_title}")

        # Extract level and clean title
        level = self._extract_level(job_title)
        clean_title = self._clean_title(job_title)

        # Find canonical form
        canonical = self._find_canonical(clean_title)

        # Extract specialization and core role
        specialization = self._extract_specialization(canonical)
        core_role = self._extract_core_role(canonical)

        # Build normalized title with proper ordering
        normalized = self._build_normalized_title(level, specialization, core_role)

        # Get matching keywords
        keywords = self._get_matching_keywords(canonical)

        # Find similar titles
        similar = self._find_similar_titles(canonical)

        result = {
            "original": job_title,
            "canonical": canonical,
            "core_role": core_role,
            "specialization": specialization,
            "level": level,
            "normalized_title": normalized,
            "matching_keywords": keywords,
            "similar_titles": similar,
            "confidence": 0.9,  # Would be higher with fuzzy matching
        }

        logger.info(f"Normalized to: {result['normalized_title']} (level: {level})")
        return result

    def classify_job_level(self, job_title: str) -> Optional[str]:
        """Extract job level from title"""
        return self._extract_level(job_title)

    def extract_core_skills(self, job_title: str, job_description: str = "") -> dict:
        """
        Use LLM to extract core skills implied by the job title and description.
        This provides AI-powered skill inference.
        """
        prompt = PromptTemplate(
            input_variables=["job_title", "job_description"],
            template="""Analyze this job title and description to extract core technical skills.

Job Title: {job_title}

Job Description (first 1000 chars):
{job_description}

Return JSON with:
- technical_skills: list of core technical skills (e.g., Python, React, AWS)
- specialization_skills: list of role-specific expertise areas
- soft_skills: list of required soft skills
- tech_stack: list of specific technologies/frameworks
- domain: the main domain/industry (e.g., "Machine Learning", "Web Development")

Respond with valid JSON only.""",
        )

        try:
            chain = prompt | self.llm
            response = chain.invoke({
                "job_title": job_title,
                "job_description": job_description[:1000] if job_description else ""
            })

            content = response.content.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]

            result = json.loads(content)
            logger.info(f"Extracted skills for {job_title}: {result}")
            return result
        except Exception as e:
            logger.error(f"Failed to extract skills: {str(e)}")
            return {
                "technical_skills": [],
                "specialization_skills": [],
                "soft_skills": [],
                "tech_stack": [],
                "domain": "General Technology",
            }

    def find_closest_match(self, job_title: str, target_roles: list[str]) -> Optional[str]:
        """
        Find the closest matching role from a list of target roles.
        Useful for matching against standardized job families.
        """
        normalized = self.normalize(job_title)

        # Try exact matches first
        canonical = normalized["canonical"].lower()
        for target in target_roles:
            if target.lower() == canonical or target.lower() in normalized.get("similar_titles", []):
                return target

        # Try partial matches on specialization
        specialization = normalized.get("specialization", "").lower()
        core_role = normalized.get("core_role", "").lower()

        for target in target_roles:
            target_lower = target.lower()
            if specialization and specialization in target_lower:
                return target
            if core_role and core_role in target_lower:
                return target

        return None

    # ---- Private methods ----

    def _extract_level(self, title: str) -> Optional[str]:
        """Extract job level from title"""
        title_lower = title.lower()
        parts = title_lower.split()

        # Map lead -> senior for normalization
        if "lead" in parts and "senior" not in parts:
            return "Senior"

        # Check level keywords (but avoid matching "manager" in "Product Manager" type titles)
        for level, keywords in self.level_keywords.items():
            for keyword in keywords:
                # For "manager" level, only match if it's in position 0 (prefix)
                if keyword == "manager" and parts and parts[0] != "manager":
                    continue
                if keyword in title_lower:
                    return level.capitalize()

        return None

    def _clean_title(self, title: str) -> str:
        """Remove level info and extra characters"""
        cleaned = title

        # Remove level prefixes/suffixes
        for level, keywords in self.level_keywords.items():
            for keyword in keywords:
                cleaned = cleaned.replace(keyword, "", 1).strip()
                cleaned = cleaned.replace(keyword.title(), "", 1).strip()

        # Clean up spacing and punctuation
        cleaned = " ".join(cleaned.split())
        return cleaned.strip()

    def _find_canonical(self, title: str) -> str:
        """Find canonical form of job title"""
        title_lower = title.lower()

        # Check exact matches
        for canonical, variations in self.title_mappings.items():
            if title_lower == canonical.lower():
                return canonical
            for variation in variations:
                if title_lower == variation.lower():
                    return canonical

        # Check partial matches
        for canonical, variations in self.title_mappings.items():
            canonical_words = set(canonical.lower().split())
            title_words = set(title_lower.split())
            if canonical_words.issubset(title_words) or canonical_words & title_words:
                return canonical

        # Default: title case the input
        return title.title()

    def _extract_specialization(self, title: str) -> Optional[str]:
        """Extract specialization (e.g., 'AI' from 'AI Engineer')"""
        parts = title.split()

        # Common specializations
        specializations = ["ai", "ml", "data", "backend", "frontend", "full stack", "devops", "qa", "product"]

        for i, part in enumerate(parts):
            if part.lower() in specializations:
                return part

        # Try compound terms
        if len(parts) > 1:
            first_two = " ".join(parts[:2]).lower()
            if first_two in ["machine learning", "artificial intelligence", "full stack"]:
                return first_two

        return None

    def _extract_core_role(self, title: str) -> str:
        """Extract core role (e.g., 'Engineer' from 'AI Engineer')"""
        parts = title.split()

        core_roles = ["engineer", "developer", "scientist", "analyst", "manager", "architect", "specialist"]

        # For compound roles like "Product Manager", prefer the last word
        for part in reversed(parts):
            if part.lower() in core_roles:
                return part

        # Default to the last word
        return parts[-1] if parts else "Professional"

    def _build_normalized_title(self, level: Optional[str], specialization: Optional[str], core_role: str) -> str:
        """Build properly formatted normalized title"""
        parts = []

        # Don't duplicate "manager" if it's already in specialization
        if level and not (level.lower() == "manager" and specialization and "manager" in specialization.lower()):
            parts.append(level)

        if specialization:
            # Capitalize specialization properly
            if specialization.lower() in ["ai", "ml", "qa"]:
                spec = specialization.upper()
            else:
                spec = specialization.title()
            parts.append(spec)

        # Don't duplicate the core role if it's already in level
        if core_role.lower() not in (level.lower() if level else ""):
            parts.append(core_role.title())

        return " ".join(p for p in parts if p)

    def _get_matching_keywords(self, title: str) -> list[str]:
        """Get keywords for matching and ATS"""
        keywords = set()
        title_lower = title.lower()

        # Add the title itself
        keywords.add(title_lower)
        keywords.update(title_lower.split())

        # Add related keywords
        if "ai" in title_lower or "artificial intelligence" in title_lower:
            keywords.update(["machine learning", "deep learning", "neural networks", "nlp"])

        if "data" in title_lower:
            keywords.update(["analytics", "analysis", "big data", "statistics"])

        if "backend" in title_lower:
            keywords.update(["server", "api", "database", "infrastructure"])

        if "frontend" in title_lower:
            keywords.update(["ui", "ux", "javascript", "react", "vue"])

        return list(keywords)

    def _find_similar_titles(self, title: str) -> list[str]:
        """Find similar job titles"""
        title_lower = title.lower()
        similar = []

        for canonical, variations in self.title_mappings.items():
            canonical_words = set(canonical.lower().split())
            title_words = set(title_lower.split())

            if canonical_words & title_words:  # If there's any overlap
                similar.extend(variations)

        return list(set(similar))[:5]  # Return unique, max 5


def normalize_job_title(job_title: str) -> dict:
    """Convenience function"""
    normalizer = JobTitleNormalizer()
    return normalizer.normalize(job_title)
