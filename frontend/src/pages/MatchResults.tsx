import { useEffect, useState } from 'react'
import './MatchResults.css'

interface JobMatch {
  job_title: string
  company: string
  match_score: number
  gap_analysis: string
  improvements: string[]
}

function MatchResults() {
  const [matches, setMatches] = useState<JobMatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // TODO: Fetch matches from API
    setIsLoading(false)
  }, [])

  if (isLoading) return <div className="loading">Loading matches...</div>

  return (
    <div className="match-results">
      <h2>Job Matches</h2>

      {error && <p className="error-message">{error}</p>}

      {matches.length === 0 ? (
        <div className="no-matches">
          <p>Upload a resume to find matching jobs</p>
        </div>
      ) : (
        <div className="matches-container">
          {matches.map((match, index) => (
            <div key={index} className="match-card">
              <div className="match-header">
                <h3>{match.job_title}</h3>
                <span className="match-score">{(match.match_score * 100).toFixed(0)}%</span>
              </div>
              <p className="company">{match.company}</p>
              <div className="gap-analysis">
                <h4>Gap Analysis</h4>
                <p>{match.gap_analysis}</p>
              </div>
              <div className="improvements">
                <h4>Recommendations</h4>
                <ul>
                  {match.improvements.map((imp, i) => (
                    <li key={i}>{imp}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MatchResults
