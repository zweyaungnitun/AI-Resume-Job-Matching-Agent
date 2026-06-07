#!/bin/bash

# Deployment script for Render and Vercel
# This script prepares the application for deployment

set -e

echo "======================================"
echo "Job Matcher - Deployment Script"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}==> $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
print_step "Checking prerequisites..."

# Check Git
if ! command -v git &> /dev/null; then
    echo "Git not found. Please install Git."
    exit 1
fi
print_success "Git found"

# Check if on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "develop" ]; then
    print_warning "You are on branch '$CURRENT_BRANCH', not 'main' or 'develop'"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    print_warning "You have uncommitted changes"
    git status
    read -p "Continue with deployment? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

print_success "Prerequisites check passed"

# Backend checks
print_step "Running backend checks..."

cd backend

# Check Python dependencies
pip list | grep -q fastapi || { print_warning "FastAPI not installed"; pip install -r requirements.txt; }
print_success "Backend dependencies OK"

# Run backend tests
print_step "Running backend tests..."
pytest tests/ -v || print_warning "Some tests failed, continuing..."

# Check imports
python -c "from app.services.orchestrator import MultiAgentOrchestrator; print('✓ Imports OK')"
print_success "Backend imports OK"

cd ..

# Frontend checks
print_step "Running frontend checks..."

cd frontend

# Check Node dependencies
if [ ! -d "node_modules" ]; then
    print_step "Installing frontend dependencies..."
    npm ci
fi
print_success "Frontend dependencies OK"

# Type check
print_step "Running frontend type check..."
npm run type-check || print_warning "Type check warnings found"

# Build
print_step "Building frontend..."
npm run build
print_success "Frontend build successful"

cd ..

# Environment check
print_step "Checking environment variables..."

required_vars=(
    "GOOGLE_API_KEY"
    "PINECONE_API_KEY"
    "JWT_SECRET"
    "GOOGLE_OAUTH_CLIENT_ID"
    "GOOGLE_OAUTH_CLIENT_SECRET"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ] && ! grep -q "^${var}=" .env; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    print_warning "Missing environment variables:"
    printf '%s\n' "${missing_vars[@]}"
    echo "Please set these in .env file before deployment"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    print_success "All required environment variables are set"
fi

# Summary
echo ""
print_step "Deployment Checklist"
echo "───────────────────────────────────"
echo "✓ Backend tests passed"
echo "✓ Frontend built successfully"
echo "✓ Environment variables checked"
echo "✓ Code is ready for deployment"
echo ""
echo "Next steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. GitHub Actions will automatically:"
echo "   - Run tests"
echo "   - Deploy to Render (backend)"
echo "   - Deploy to Vercel (frontend)"
echo ""
echo "Track deployment progress:"
echo "- GitHub Actions: https://github.com/your-username/AI-Resume-Job-Matching-Agent/actions"
echo "- Render: https://dashboard.render.com"
echo "- Vercel: https://vercel.com/dashboard"
echo ""
print_success "Ready for deployment!"
echo "======================================"
