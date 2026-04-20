import React from 'react';
import './ScoreCard.css';

interface ScoreBreakdown {
  label: string;
  score: number;
  color?: string;
}

interface ScoreCardProps {
  overallScore: number;
  matchLevel: string;
  breakdown: ScoreBreakdown[];
  matchLikelihood?: string;
}

export const ScoreCard: React.FC<ScoreCardProps> = ({
  overallScore,
  matchLevel,
  breakdown,
  matchLikelihood,
}) => {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#27ae60';
    if (score >= 60) return '#f39c12';
    if (score >= 40) return '#e67e22';
    return '#e74c3c';
  };

  const getScoreBg = (score: number): string => {
    if (score >= 80) return 'rgba(39, 174, 96, 0.1)';
    if (score >= 60) return 'rgba(243, 156, 18, 0.1)';
    if (score >= 40) return 'rgba(230, 126, 34, 0.1)';
    return 'rgba(231, 76, 60, 0.1)';
  };

  return (
    <div className="score-card">
      <div className="overall-score">
        <div
          className="score-circle"
          style={{
            backgroundColor: getScoreBg(overallScore),
            borderColor: getScoreColor(overallScore),
          }}
        >
          <div className="score-number">{overallScore}</div>
          <div className="score-label">Match %</div>
        </div>
        <div className="score-info">
          <h3 className="match-level">{matchLevel}</h3>
          {matchLikelihood && (
            <p className="match-likelihood">Hiring: {matchLikelihood}</p>
          )}
        </div>
      </div>

      {breakdown.length > 0 && (
        <div className="score-breakdown">
          <h4>Score Breakdown</h4>
          {breakdown.map((item, idx) => (
            <div key={idx} className="breakdown-item">
              <div className="breakdown-label">{item.label}</div>
              <div className="breakdown-bar">
                <div
                  className="breakdown-fill"
                  style={{
                    width: `${item.score}%`,
                    backgroundColor: item.color || getScoreColor(item.score),
                  }}
                />
              </div>
              <div className="breakdown-value">{item.score}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
