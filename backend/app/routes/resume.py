import os
import logging
import traceback
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.dependencies.auth import get_current_user

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
    try:
        logging.info(f"[RESUME] Upload request received - file: {file.filename}, content_type: {file.content_type}, size: {file.size}")

        if not file.filename:
            logging.error("[RESUME] No filename provided")
            raise HTTPException(status_code=400, detail="No filename provided")

        # Validate file type
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in [".pdf", ".docx", ".doc"]:
            logging.error(f"[RESUME] Invalid file type: {file_ext}")
            raise HTTPException(
                status_code=400,
                detail="Only PDF and DOCX files are supported"
            )

        # Save file temporarily
        file_path = f"uploads/{file.filename}"
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        logging.info(f"[RESUME] File saved to {file_path}")

        # Parse based on file type (text extraction only, no AI)
        if file_ext == ".pdf":
            parsed = parser.parse_pdf(file_path)
        else:  # .docx or .doc
            parsed = parser.parse_docx(file_path)

        logging.info(f"[RESUME] File parsed successfully, text length: {len(parsed['raw_text'])}")

        return ParsedResumeResponse(
            raw_text=parsed["raw_text"],
            file_type=parsed["file_type"],
            filename=file.filename
        )

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"[RESUME] Error processing resume upload: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    finally:
        # Clean up temporary file
        file_path = f"uploads/{file.filename}"
        if os.path.exists(file_path):
            os.remove(file_path)
            logging.info(f"[RESUME] Cleaned up temporary file")


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


class ExportResumeRequest(BaseModel):
    resume_text: str
    filename: str = "resume"


@router.post("/export-docx")
async def export_resume_as_docx(
    request: ExportResumeRequest,
    user=Depends(get_current_user)
):
    """Export resume text as DOCX file"""
    try:
        logging.info(f"[RESUME] Exporting resume as DOCX for user {user['email']}")

        if not request.resume_text or len(request.resume_text.strip()) < 10:
            raise HTTPException(status_code=400, detail="Resume text is too short to export")

        # Create filename
        filename = request.filename.replace(" ", "_") if request.filename else "resume"
        if not filename.endswith(".docx"):
            filename += ".docx"

        output_path = f"uploads/{filename}"

        # Export to DOCX
        parser.export_to_docx(request.resume_text, output_path)

        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Failed to generate DOCX file")

        logging.info(f"[RESUME] DOCX exported successfully to {output_path}")

        # Return file as download
        return FileResponse(
            output_path,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=filename
        )

    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"[RESUME] Error exporting resume as DOCX: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error exporting resume: {str(e)}")
    finally:
        # Clean up uploaded file after sending
        output_path = f"uploads/{filename}" if 'filename' in locals() else None
        if output_path and os.path.exists(output_path):
            try:
                os.remove(output_path)
                logging.info(f"[RESUME] Cleaned up exported file")
            except Exception as e:
                logging.warning(f"[RESUME] Could not clean up file: {str(e)}")
