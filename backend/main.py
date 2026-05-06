from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager

from app.config import settings
from app.routes import resume, agent, health, auth
from app.logger import get_logger
from app.middleware.security import SecurityHeadersMiddleware
from app.database import init_db

logger = get_logger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting application in {settings.ENVIRONMENT} mode...")
    if settings.ENVIRONMENT == "production" and settings.DEBUG:
        logger.warning("WARNING: DEBUG mode enabled in production!")

    # Initialize database
    init_db()

    yield
    # Shutdown
    logger.info("Shutting down application...")

app = FastAPI(
    title="Resume-Job Matching Agent",
    description="AI-powered resume to job matching with RAG",
    version="0.1.0",
    lifespan=lifespan,
    docs_url=None if settings.ENVIRONMENT == "production" else "/docs",
    redoc_url=None if settings.ENVIRONMENT == "production" else "/redoc",
)

# Security middleware (add first to wrap all responses)
app.add_middleware(SecurityHeadersMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"[VALIDATION] {request.method} {request.url.path} - Errors: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

# Routes
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(resume.router)
app.include_router(agent.router)

@app.get("/")
async def root():
    return {"message": "Resume-Job Matching Agent API", "version": "0.1.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
