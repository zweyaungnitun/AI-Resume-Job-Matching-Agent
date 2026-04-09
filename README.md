# AI-Resume-Job-Matching-Agent

An intelligent AI agent that matches resumes with relevant job opportunities using Retrieval-Augmented Generation (RAG) and autonomous decision-making.

## 🎯 Features

- **Resume Parsing**: Extract structured data from PDF and DOCX resumes
- **Job Matching**: Find relevant jobs using semantic search (RAG)
- **Gap Analysis**: Identify missing skills and experience for each job
- **Tailored Cover Letters**: Generate customized cover letters for positions
- **Match Scoring**: Score job-resume compatibility with detailed analysis

## 🏗️ Project Structure

```text
AI-Resume-Job-Matching-Agent/
├── backend/                          # FastAPI backend
│   ├── app/
│   │   ├── routes/
│   │   │   ├── health.py            # Health check endpoint
│   │   │   ├── resume.py            # Resume upload/parsing endpoints
│   │   │   └── agent.py             # Agent matching endpoints
│   │   ├── services/
│   │   │   ├── resume_parser.py     # Resume extraction logic
│   │   │   ├── rag_service.py       # Pinecone RAG integration
│   │   │   └── agent_service.py     # Main agent orchestration
│   │   └── config.py                # Configuration settings
│   ├── main.py                      # FastAPI app entry point
│   ├── requirements.txt             # Python dependencies
│   ├── Dockerfile                   # Backend Docker image
│   └── .env.example                 # Environment variables template
├── frontend/                         # React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx           # Main layout wrapper
│   │   │   └── Layout.css
│   │   ├── pages/
│   │   │   ├── Home.tsx             # Landing page
│   │   │   ├── UploadResume.tsx     # Resume upload form
│   │   │   └── MatchResults.tsx     # Job matches display
│   │   ├── App.tsx                  # Root component
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Global styles
│   ├── package.json                 # Node.js dependencies
│   ├── vite.config.ts               # Vite config
│   ├── tsconfig.json                # TypeScript config
│   ├── Dockerfile                   # Frontend Docker image
│   └── .env.example                 # Environment variables template
├── docker-compose.yml               # Multi-container setup
└── .env.example                     # Root environment template
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (optional)
- OpenAI API key
- Pinecone API key

### 1. Clone and Setup

```bash
git clone <repo-url>
cd AI-Resume-Job-Matching-Agent
cp .env.example .env
# Edit .env with your API keys
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit backend/.env with your credentials
python main.py
```

Backend will be available at `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend will be available at `http://localhost:3000`

### 4. Using Docker Compose

```bash
cp .env.example .env
# Edit .env with your API keys
docker-compose up
```

## 📋 API Endpoints

### Health Check
- `GET /health` - Service health status

### Resume Operations
- `POST /resume/upload` - Upload resume file (PDF/DOCX)
- `POST /resume/parse` - Parse resume data

### Agent Operations
- `POST /agent/match` - Match resume to jobs
- `POST /agent/generate-cover-letter` - Generate cover letter
- `POST /agent/analyze-gaps` - Analyze skill gaps

## 🔧 Tech Stack

**Backend:**

- FastAPI - Web framework
- LangChain - LLM orchestration
- Pinecone - Vector database for RAG
- OpenAI - LLM API
- Pydantic - Data validation

**Frontend:**

- React 18 - UI framework
- TypeScript - Type safety
- Vite - Build tool
- React Router - Navigation

## 📝 Environment Variables

Create `.env` file at root:

```bash
OPENAI_API_KEY=your_key_here
PINECONE_API_KEY=your_key_here
PINECONE_ENVIRONMENT=your_environment
```

## 🤝 Development

### Running Tests

```bash
cd backend
pytest
```

### Building for Production

```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
pip install -r requirements.txt
# Deploy main.py
```

## 📚 Next Steps

- [ ] Implement resume parser service
- [ ] Setup Pinecone vector database
- [ ] Integrate LangChain agent
- [ ] Build job matching algorithm
- [ ] Create admin dashboard for job indexing
- [ ] Add authentication (OAuth)
- [ ] Deploy to production
