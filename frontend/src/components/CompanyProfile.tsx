import React from 'react';
import './CompanyProfile.css';

interface CompanyResearchData {
  company_name: string;
  founded: string;
  size: string;
  industry: string;
  headquarters: string;
  overview: string;
  mission_values: string[];
  tech_stack: string[];
  culture_highlights: string[];
  recent_news: Array<{ headline: string; summary: string }>;
  pros_for_candidate: string[];
  cons_for_candidate: string[];
  interview_tips: string[];
  glassdoor_rating: string;
  data_confidence: string;
}

interface CompanyProfileProps {
  data: CompanyResearchData;
}

export const CompanyProfile: React.FC<CompanyProfileProps> = ({ data }) => {
  const confidenceColor = {
    high: '#27ae60',
    medium: '#f39c12',
    low: '#e74c3c',
  }[data.data_confidence] || '#7f8c8d';

  return (
    <div className="company-profile">
      <div className="company-header">
        <div className="company-info">
          <h2>{data.company_name}</h2>
          <div className="company-meta">
            <span>{data.industry}</span>
            <span>•</span>
            <span>{data.size}</span>
            <span>•</span>
            <span>{data.headquarters}</span>
            <span>•</span>
            <span>Founded: {data.founded}</span>
          </div>
        </div>
        {data.glassdoor_rating !== 'Not found' && (
          <div className="glassdoor-rating">
            ⭐ {data.glassdoor_rating}
          </div>
        )}
      </div>

      <p className="company-overview">{data.overview}</p>

      {data.mission_values.length > 0 && (
        <div className="company-section">
          <h4>Mission & Values</h4>
          <ul className="value-list">
            {data.mission_values.map((value, idx) => (
              <li key={idx}>{value}</li>
            ))}
          </ul>
        </div>
      )}

      {data.tech_stack.length > 0 && (
        <div className="company-section">
          <h4>Tech Stack</h4>
          <div className="tech-tags">
            {data.tech_stack.map((tech, idx) => (
              <span key={idx} className="tech-tag">{tech}</span>
            ))}
          </div>
        </div>
      )}

      {data.culture_highlights.length > 0 && (
        <div className="company-section">
          <h4>Culture Highlights</h4>
          <ul className="culture-list">
            {data.culture_highlights.map((highlight, idx) => (
              <li key={idx}>{highlight}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="pros-cons">
        {data.pros_for_candidate.length > 0 && (
          <div className="company-section pros">
            <h4>✓ Pros for You</h4>
            <ul>
              {data.pros_for_candidate.map((pro, idx) => (
                <li key={idx}>{pro}</li>
              ))}
            </ul>
          </div>
        )}

        {data.cons_for_candidate.length > 0 && (
          <div className="company-section cons">
            <h4>✗ Potential Concerns</h4>
            <ul>
              {data.cons_for_candidate.map((con, idx) => (
                <li key={idx}>{con}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {data.interview_tips.length > 0 && (
        <div className="company-section">
          <h4>Interview Tips for This Company</h4>
          <ul className="tips-list">
            {data.interview_tips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {data.recent_news.length > 0 && (
        <div className="company-section">
          <h4>Recent News</h4>
          <div className="news-list">
            {data.recent_news.map((news, idx) => (
              <div key={idx} className="news-item">
                <h5>{news.headline}</h5>
                <p>{news.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="data-confidence">
        Data Confidence: <span style={{ color: confidenceColor }}>{data.data_confidence}</span>
      </div>
    </div>
  );
};
