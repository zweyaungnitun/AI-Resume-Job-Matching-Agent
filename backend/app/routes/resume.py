import os
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from app.services.resume_parser import ResumeParser

router = APIRouter(prefix="/resume", tags=["resume"])

# Initialize parser
parser = ResumeParser()

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)


class ResumeData(BaseModel):
    name: str
    email: str
    skills: list[str]
    experience: str


class ParsedResumeResponse(BaseModel):
    raw_text: str
    skills: list[str]
    experience: list[dict]
    file_type: str
    filename: str


@router.post("/upload", response_model=ParsedResumeResponse)
async def upload_resume(file: UploadFile = File(...)):
    """Upload and parse a resume (PDF or DOCX)"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    # Validate file type
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in [".pdf", ".docx", ".doc"]:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are supported"
        )

    # Save file temporarily
    file_path = f"uploads/{file.filename}"
    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # Parse based on file type
        if file_ext == ".pdf":
            parsed = parser.parse_pdf(file_path)
        else:  # .docx or .doc
            parsed = parser.parse_docx(file_path)

        raw_text = parsed["raw_text"]

        # Extract skills and experience
        skills = parser.extract_skills(raw_text)
        experience = parser.extract_experience(raw_text)

        return ParsedResumeResponse(
            raw_text=raw_text,
            skills=skills,
            experience=experience,
            file_type=parsed["file_type"],
            filename=file.filename
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    finally:
        # Clean up temporary file
        if os.path.exists(file_path):
            os.remove(file_path)


@router.post("/parse")
async def parse_resume(resume: ResumeData):
    """Parse resume data and extract structured information"""
    # Combine all resume text
    combined_text = f"""
Name: {resume.name}
Email: {resume.email}
Experience: {resume.experience}
Current Skills: {', '.join(resume.skills)}
"""

    # Extract skills using LLM
    extracted_skills = parser.extract_skills(combined_text)
    extracted_experience = parser.extract_experience(combined_text)

    return {
        "status": "parsed",
        "name": resume.name,
        "email": resume.email,
        "extracted_skills": extracted_skills,
        "extracted_experience": extracted_experience,
    }
