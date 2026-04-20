import { Link } from 'react-router-dom'
import './Home.css'

function Home() {
  return (
    <div className="home">
      <div className="hero">
        <h1>AI Resume Job Matching Agent</h1>
        <p>Your intelligent career companion powered by multi-agent AI and advanced RAG</p>
        <Link to="/cv-input" className="cta-button primary">
          Start Full Analysis
        </Link>
      </div>

      <div className="workflow-section">
        <h2>How It Works</h2>
        <div className="workflow-steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Upload Your CV</h3>
            <p>Upload your resume or paste it directly</p>
          </div>
          <div className="arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>CV Review</h3>
            <p>Get ATS score, structure analysis, and quick wins</p>
          </div>
          <div className="arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>Add Job Details</h3>
            <p>Enter job URL, paste description, or search</p>
          </div>
          <div className="arrow">→</div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Full Analysis</h3>
            <p>Get comprehensive match score and recommendations</p>
          </div>
        </div>
      </div>

      <div className="features">
        <h2>Powerful Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h3>CV Quality Review</h3>
            <p>ATS compatibility score, structure analysis, content quality, immediate improvements</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Job Analysis</h3>
            <p>Extract requirements, skills, experience needs, and responsibilities from any job posting</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Match Scoring</h3>
            <p>Detailed breakdown by skills, experience, education, culture fit, and keywords</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏢</div>
            <h3>Company Research</h3>
            <p>Automatic research on company culture, tech stack, pros/cons, interview tips</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <h3>Smart Recommendations</h3>
            <p>Priority actions, skills to acquire, bullet rewrites, formatting improvements</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>Similar Jobs</h3>
            <p>Find semantically similar jobs from our vector database using RAG</p>
          </div>
        </div>
      </div>

      <div className="why-choose">
        <h2>Why Choose Us</h2>
        <div className="benefits">
          <div className="benefit-item">
            <span className="benefit-icon">✓</span>
            <h4>Multi-Agent AI System</h4>
            <p>Specialized agents handle CV review, job analysis, scoring, company research, and recommendations</p>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">✓</span>
            <h4>RAG + Vector Database</h4>
            <p>Advanced semantic search to find similar jobs and match opportunities beyond keywords</p>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">✓</span>
            <h4>Actionable Insights</h4>
            <p>Get specific, prioritized recommendations to improve your match score</p>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">✓</span>
            <h4>Multiple Input Methods</h4>
            <p>Job URL, copy-paste description, or web search - we handle all formats</p>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h2>Ready to Find Your Perfect Job?</h2>
        <p>Start your AI-powered analysis today and discover your career opportunities</p>
        <Link to="/cv-input" className="cta-button primary large">
          Begin Analysis Now
        </Link>
      </div>
    </div>
  )
}

export default Home
