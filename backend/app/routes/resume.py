import os
import logging
import traceback
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
    file_type: str
    filename: str


class ExtractedDataResponse(BaseModel):
    raw_text: str
    skills: list[str]
    experience: list[dict]
    file_type: str
    filename: str


@router.post("/upload", response_model=ParsedResumeResponse)
async def upload_resume(file: UploadFile = File(...)):
    """Upload and extract text from resume (PDF or DOCX) - no AI processing"""
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

        # Parse based on file type (text extraction only, no AI)
        if file_ext == ".pdf":
            parsed = parser.parse_pdf(file_path)
        else:  # .docx or .doc
            parsed = parser.parse_docx(file_path)

        return ParsedResumeResponse(
            raw_text=parsed["raw_text"],
            file_type=parsed["file_type"],
            filename=file.filename
        )

    except Exception as e:
        logging.error(f"Error processing resume upload: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    finally:
        # Clean up temporary file
        if os.path.exists(file_path):
            os.remove(file_path)


@router.post("/extract", response_model=ExtractedDataResponse)
async def extract_resume_data(request: ParsedResumeResponse):
    """Extract skills and experience from resume text using AI - call only when needed"""
    try:
        skills = parser.extract_skills(request.raw_text)
        experience = parser.extract_experience(request.raw_text)

        return ExtractedDataResponse(
            raw_text=request.raw_text,
            skills=skills,
            experience=experience,
            file_type=request.file_type,
            filename=request.filename
        )
    except Exception as e:
        logging.error(f"Error extracting resume data: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error extracting data: {str(e)}")


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
