"""Resume parsing and extraction service"""

import json
from pypdf import PdfReader
from docx import Document
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate

from app.config import settings


class ResumeParser:
    """Extract structured data from resume documents"""

    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            google_api_key=settings.GOOGLE_API_KEY,
            model=settings.GEMINI_MODEL,
            temperature=0.1
        )

    def parse_pdf(self, file_path: str) -> dict:
        """Parse PDF resume and extract text"""
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"

        return {
            "raw_text": text.strip(),
            "pages": len(reader.pages),
            "file_type": "pdf"
        }

    def parse_docx(self, file_path: str) -> dict:
        """Parse DOCX resume and extract text"""
        doc = Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"

        return {
            "raw_text": text.strip(),
            "pages": len(doc.paragraphs),
            "file_type": "docx"
        }

    def extract_skills(self, text: str) -> list[str]:
        """Extract skills from resume text using LLM"""
        prompt = PromptTemplate(
            input_variables=["resume_text"],
            template="""Extract all technical and professional skills from the following resume.
Return ONLY a JSON array of skill strings, nothing else.

Resume:
{resume_text}

Response (JSON array only):"""
        )

        chain = prompt | self.llm
        response = chain.invoke({"resume_text": text})

        try:
            # Extract JSON from the response
            content = response.content.strip()
            if content.startswith("```json"):
                content = content[7:-3]
            elif content.startswith("```"):
                content = content[3:-3]

            skills = json.loads(content)
            return skills if isinstance(skills, list) else []
        except (json.JSONDecodeError, AttributeError):
            return []

    def extract_experience(self, text: str) -> list[dict]:
        """Extract work experience from resume text using LLM"""
        prompt = PromptTemplate(
            input_variables=["resume_text"],
            template="""Extract all work experience from the following resume.
For each position, extract: title, company, years (as number), and responsibilities (as list of strings).
Return ONLY a JSON array of objects with keys: title, company, years, responsibilities.

Resume:
{resume_text}

Response (JSON array only):"""
        )

        chain = prompt | self.llm
        response = chain.invoke({"resume_text": text})

        try:
            content = response.content.strip()
            if content.startswith("```json"):
                content = content[7:-3]
            elif content.startswith("```"):
                content = content[3:-3]

            experience = json.loads(content)
            return experience if isinstance(experience, list) else []
        except (json.JSONDecodeError, AttributeError):
            return []
