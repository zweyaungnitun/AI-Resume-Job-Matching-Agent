#!/bin/bash

# Setup script for local development
# This script sets up the entire development environment

set -e

echo "======================================"
echo "Job Matcher - Local Development Setup"
echo "======================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📋 Copying .env.example to .env"
    cp .env.example .env
    echo "⚠️  Please edit .env with your actual API keys"
fi

# Check if frontend .env exists
if [ ! -f frontend/.env ]; then
    echo "📋 Copying frontend/.env.example to frontend/.env"
    cp frontend/.env.example frontend/.env
fi

# Backend setup
echo ""
echo "📦 Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "📥 Installing backend dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Run backend tests
echo "✅ Running backend tests..."
pytest tests/ -v || true

echo "✨ Backend setup complete!"

# Frontend setup
echo ""
echo "📦 Setting up frontend..."
cd ../frontend

# Install dependencies
echo "📥 Installing frontend dependencies..."
npm ci

# Type check
echo "✅ Type checking frontend..."
npm run type-check || true

echo "✨ Frontend setup complete!"

# Summary
echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "To start development:"
echo ""
echo "Option 1: Docker Compose (recommended)"
echo "  docker-compose up"
echo ""
echo "Option 2: Manual"
echo "  # Terminal 1 - Backend"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  uvicorn main:app --reload"
echo ""
echo "  # Terminal 2 - Frontend"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "======================================"
