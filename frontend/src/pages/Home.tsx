import { Link } from 'react-router-dom'
import './Home.css'

function Home() {
  return (
    <div className="home">
      <div className="hero">
        <h2>Welcome to Resume Job Matcher</h2>
        <p>AI-powered resume to job matching using RAG and intelligent analysis</p>
        <Link to="/upload" className="cta-button">
          Get Started
        </Link>
      </div>

      <div className="features">
        <div className="feature-card">
          <h3>📄 Smart Resume Parsing</h3>
          <p>Extract and analyze your resume structure, skills, and experience</p>
        </div>
        <div className="feature-card">
          <h3>🎯 Job Matching</h3>
          <p>Find the most relevant jobs using advanced semantic search</p>
        </div>
        <div className="feature-card">
          <h3>📊 Gap Analysis</h3>
          <p>Identify missing skills and experience gaps for each job</p>
        </div>
        <div className="feature-card">
          <h3>✍️ Cover Letters</h3>
          <p>Generate tailored cover letters for your target positions</p>
        </div>
      </div>
    </div>
  )
}

export default Home
