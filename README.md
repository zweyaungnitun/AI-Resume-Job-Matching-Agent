# AI-Resume-Job-Matching-Agent

> An intelligent multi-agent system that analyzes your CV, matches you with relevant job postings, and recommends how to improve your resume for specific roles using AI and vector search.

**Built with:** Python · FastAPI · React · TypeScript · LangChain · Gemini AI · Pinecone · PostgreSQL

## 🎯 Features

### Core Features

- **📄 CV Review & Analysis** - AI-powered resume parsing and skill extraction
- **🎯 Job Matching** - Match your CV against specific job postings with compatibility scoring (0-100)
- **💡 CV Recommendations** - Get AI-generated suggestions on how to improve your resume for each role
- **🔍 Multi-Source Job Search** - Find jobs from vector DB (RAG) + real-time Google Search
- **⚡ Intelligent Scoring** - 4-factor matching algorithm (skill alignment 40%, role relevance 30%, experience 20%, growth potential 10%)
- **📊 Admin Dashboard** - Monitor API usage, set rate limits, view audit logs (admin-only)
- **🔐 Role-Based Access Control** - Admin vs user authentication with JWT tokens
- **📝 Complete Audit Trail** - All admin actions logged with IP tracking

## 🏗️ Project Structure

```
AI-Resume-Job-Matching-Agent/
├── backend/                              # FastAPI backend
│   ├── app/
│   │   ├── routes/
│   │   │   ├── health.py                # Health check endpoint
│   │   │   ├── auth.py                  # Google OAuth + password auth
│   │   │   ├── resume.py                # Resume parsing endpoints
│   │   │   ├── agent.py                 # Job matching agent endpoints
│   │   │   └── admin.py                 # Admin dashboard (protected)
│   │   ├── services/
│   │   │   ├── auth_service.py          # JWT + OAuth management
│   │   │   ├── resume_parser.py         # Resume extraction
│   │   │   ├── rag_service.py           # Pinecone vector search
│   │   │   ├── job_matcher_agent.py     # Multi-source job matching
│   │   │   └── google_search_service.py # Serper API + DuckDuckGo
│   │   ├── models/
│   │   │   ├── user.py                  # User model (with is_admin)
│   │   │   ├── admin_audit.py           # Audit log & rate limit models
│   │   │   └── ai_interaction.py        # API usage tracking
│   │   ├── dependencies/
│   │   │   └── auth.py                  # JWT verification
│   │   ├── middleware/
│   │   │   └── security.py              # Security headers + monitoring
│   │   ├── database.py                  # SQLAlchemy setup
│   │   └── config.py                    # Configuration
│   ├── setup_admin.py                   # Admin user initialization script
│   ├── main.py                          # FastAPI app entry
│   ├── requirements.txt                 # Python dependencies
│   ├── Dockerfile                       # Backend Docker image
│   └── .env.example                     # Environment template
├── frontend/                             # React + TypeScript frontend
│   ├── src/
│   │   ├── components/                  # Reusable UI components
│   │   ├── pages/
│   │   │   ├── HomePage.tsx             # Landing page
│   │   │   ├── CVReviewPage.tsx         # CV upload & review
│   │   │   ├── JobMatcherPage.tsx       # Job matching form
│   │   │   ├── MatchResultsPage.tsx     # Match results & recommendations
│   │   │   └── AdminDashboard.tsx       # Admin metrics (protected)
│   │   ├── services/
│   │   │   └── api.ts                   # API client
│   │   ├── App.tsx                      # Root component
│   │   └── main.tsx                     # Entry point
│   ├── package.json                     # Node.js dependencies
│   ├── vite.config.ts                   # Vite bundler config
│   ├── tsconfig.json                    # TypeScript config
│   ├── Dockerfile                       # Frontend Docker image
│   └── .env.example                     # Environment template
├── docker-compose.yml                   # Multi-container orchestration
├── render.yaml                          # Render deployment config
├── ADMIN_ARCHITECTURE.md                # Admin system documentation
└── .env.example                         # Root environment template
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Google API key (for Gemini + embeddings)
- Pinecone API key (for RAG vector search)
- Serper API key (optional, for Google Search)
- PostgreSQL (free tier via Render or Supabase)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/AI-Resume-Job-Matching-Agent.git
cd AI-Resume-Job-Matching-Agent
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your API keys:
# - GOOGLE_API_KEY (Gemini + embeddings)
# - PINECONE_API_KEY, PINECONE_ENVIRONMENT
# - DATABASE_URL (optional, defaults to SQLite)
# - SERPER_API_KEY (optional, for Google Search)

# Initialize database and create admin user
python setup_admin.py

# Run backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend: [http://localhost:8000](http://localhost:8000)  
API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with backend URL: VITE_API_URL=http://localhost:8000

# Run development server
npm run dev
```

Frontend: [http://localhost:5173](http://localhost:5173)

### 4. Access the Application

- **User Dashboard**: [http://localhost:5173](http://localhost:5173)
  - Upload CV → Match with jobs → Get recommendations

- **Admin Dashboard**: [http://localhost:5173/admin](http://localhost:5173/admin)
  - View metrics, manage rate limits, audit logs
  - Login with admin account created in Step 2

- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
  - Interactive Swagger UI for testing endpoints

## 📋 API Endpoints

### Authentication

- `POST /auth/signup` - Register new user
- `POST /auth/login-password` - Login with email/password
- `POST /auth/google` - Login with Google OAuth
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user info
- `POST /auth/logout` - Logout

### Resume Operations

- `POST /resume/upload` - Upload resume (PDF/DOCX)
- `POST /resume/parse` - Parse resume and extract data

### Job Matching (Multi-Agent)

- `POST /agent/match-jobs-comprehensive` - Match resume to jobs (RAG + Google Search)
- `POST /agent/match-jobs-by-skills` - Find jobs for specific skills
- `POST /agent/match-jobs-by-role` - Find jobs for specific role

### Admin Operations (Protected - Admin Only)

- `GET /admin/summary` - Dashboard metrics
- `GET /admin/logs` - Activity audit trail
- `GET /admin/blocks` - Security blocks history
- `GET /admin/time-series` - 7-day trend data
- `POST /admin/settings` - Update guardrail settings
- `GET /admin/audit-logs` - View admin action history
- `POST /admin/rate-limits` - Update rate limit config
- `GET /admin/rate-limits` - View rate limits

### Health & Monitoring

- `GET /health` - Service health status
- `GET /metrics` - Prometheus metrics

## 🔧 Tech Stack

### Backend

- **FastAPI** - Modern web framework
- **LangChain** - LLM agent orchestration
- **Google Gemini 2.0 Flash** - Fast LLM for analysis
- **Pinecone** - Vector database for semantic search (RAG)
- **Serper API** - Google Search integration
- **SQLAlchemy** - ORM for database
- **JWT** - Token-based authentication
- **Pydantic** - Data validation

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client

### Infrastructure

- **PostgreSQL** - Production database (SQLite for dev)
- **Docker** - Containerization
- **Render** - Deployment platform

## 📝 Environment Variables

Create `.env` file in backend directory:

```bash
# Google API (Gemini + Embeddings)
GOOGLE_API_KEY=your_gemini_api_key

# Pinecone Vector Database
PINECONE_API_KEY=your_pinecone_key
PINECONE_ENVIRONMENT=your_environment
PINECONE_INDEX=job-listings

# Database (optional, defaults to SQLite)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Optional: Google Search via Serper API
SERPER_API_KEY=your_serper_key

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8000/auth/callback

# Security
SECRET_KEY=your_secret_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

## 🚀 Deployment

### Deploy to Render (Free Tier)

1. **Push code to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

3. **Configure**
   - Runtime: Python
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Add PostgreSQL**
   - Click "New" → "PostgreSQL"
   - Attach to web service
   - Copy connection string to `DATABASE_URL` env var

5. **Add Environment Variables**
   - Set all required env vars in Render dashboard
   - Redeploy

**Frontend** (separate Render service or Vercel):
- Build command: `npm run build`
- Publish directory: `dist`

### Alternative Deployments

- **Vercel** (Frontend only) - [vercel.com](https://vercel.com)
- **Railway** - [railway.app](https://railway.app)
- **Supabase** (Backend + DB) - [supabase.com](https://supabase.com)

## 🧪 Testing

### Backend Tests

```bash
cd backend
pip install pytest
pytest
```

### Manual API Testing

```bash
# Health check
curl http://localhost:8000/health

# Create user
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secure123", "name": "John Doe"}'

# Login
curl -X POST http://localhost:8000/auth/login-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secure123"}'

# Get token, use in next requests:
# Authorization: Bearer <token>
```

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to your fork (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow PEP 8 for Python code
- Use TypeScript for frontend code
- Write tests for new features
- Update documentation
- Keep commits atomic and descriptive

## 📚 Documentation

- [Admin Architecture](./ADMIN_ARCHITECTURE.md) - Admin system & audit logging
- [API Documentation](http://localhost:8000/docs) - Interactive Swagger UI
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Production setup

## 🐛 Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Use different port
uvicorn main:app --port 8001
```

**Database connection error:**
```bash
# Check DATABASE_URL format
# SQLite: sqlite:///./app.db
# PostgreSQL: postgresql://user:password@host:5432/db
```

**Missing API key errors:**
```bash
# Verify all required keys are in .env
# Restart backend after updating .env
```

### Frontend Issues

**CORS errors:**
- Ensure backend is running
- Check VITE_API_URL in .env matches backend URL

**Build errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Authentication Issues

**"Admin access required" error:**
- Verify user has `is_admin=true` in database
- Check JWT token hasn't expired
- Use `/auth/refresh` to get new token

## 📄 License

MIT License - see [LICENSE](./LICENSE) file

## 🙏 Acknowledgments

- [LangChain](https://python.langchain.com/) for agent orchestration
- [Pinecone](https://www.pinecone.io/) for vector database
- [Google Gemini](https://deepmind.google/technologies/gemini/) for LLM
- [Render](https://render.com) for hosting

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/AI-Resume-Job-Matching-Agent/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/AI-Resume-Job-Matching-Agent/discussions)
- **Email**: support@example.com

---

**Built with ❤️ for job seekers everywhere**
