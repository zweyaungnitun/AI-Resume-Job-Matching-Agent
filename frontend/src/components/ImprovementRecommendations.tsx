import React, { useState } from 'react';
import './ImprovementRecommendations.css';

interface PriorityAction {
  action: string;
  section: string;
  example: string;
  impact: 'High' | 'Medium' | 'Low';
}

interface SkillToAdd {
  skill: string;
  how_to_acquire: string;
  timeframe: string;
  importance: 'Required' | 'Preferred';
}

interface BulletRewrite {
  original: string;
  improved: string;
  why: string;
}

interface NewSection {
  section_name: string;
  reason: string;
  example_content: string;
}

interface ImprovementData {
  priority_actions: PriorityAction[];
  skills_to_add: SkillToAdd[];
  keywords_to_add: string[];
  bullet_rewrites: BulletRewrite[];
  new_sections_to_add: NewSection[];
  summary_rewrite: string;
  formatting_improvements: string[];
  quantification_opportunities: string[];
  overall_strategy: string;
  estimated_score_after_improvements: number;
}

interface ImprovementRecommendationsProps {
  data: ImprovementData;
  currentScore?: number;
}

export const ImprovementRecommendations: React.FC<ImprovementRecommendationsProps> = ({
  data,
  currentScore = 0,
}) => {
  const [expandedSection, setExpandedSection] = useState<string>('overview');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  const scoreImprovement = data.estimated_score_after_improvements - currentScore;
  const scoreColor = scoreImprovement > 0 ? '#27ae60' : '#7f8c8d';

  return (
    <div className="improvement-recommendations">
      <div className="improvement-header">
        <h3>CV Improvement Recommendations</h3>
        <div className="score-projection">
          <span>Potential Score Improvement:</span>
          <strong style={{ color: scoreColor }}>
            {currentScore} → {data.estimated_score_after_improvements}
            {scoreImprovement > 0 && <span className="improvement-badge">+{scoreImprovement}</span>}
          </strong>
        </div>
      </div>

      <div className="overall-strategy">
        <p>{data.overall_strategy}</p>
      </div>

      {data.priority_actions.length > 0 && (
        <div className="recommendation-section">
          <div
            className="section-header"
            onClick={() => toggleSection('priority')}
          >
            <span>🎯 Priority Actions ({data.priority_actions.length})</span>
            <span className="toggle-icon">{expandedSection === 'priority' ? '▼' : '▶'}</span>
          </div>
          {expandedSection === 'priority' && (
            <div className="section-content">
              {data.priority_actions.map((action, idx) => (
                <div key={idx} className={`action-card impact-${action.impact.toLowerCase()}`}>
                  <div className="action-header">
                    <h5>{action.action}</h5>
                    <span className={`impact-badge impact-${action.impact.toLowerCase()}`}>
                      {action.impact}
                    </span>
                  </div>
                  <div className="action-detail">
                    <strong>Section:</strong> {action.section}
                  </div>
                  <div className="action-detail">
                    <strong>Example:</strong> <em>{action.example}</em>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {data.skills_to_add.length > 0 && (
        <div className="recommendation-section">
          <div
            className="section-header"
            onClick={() => toggleSection('skills')}
          >
            <span>📚 Skills to Acquire ({data.skills_to_add.length})</span>
            <span className="toggle-icon">{expandedSection === 'skills' ? '▼' : '▶'}</span>
          </div>
          {expandedSection === 'skills' && (
            <div className="section-content">
              {data.skills_to_add.map((skill, idx) => (
                <div key={idx} className={`skill-card importance-${skill.importance.toLowerCase()}`}>
                  <div className="skill-name">
                    {skill.skill}
                    <span className={`importance-badge importance-${skill.importance.toLowerCase()}`}>
                      {skill.importance}
                    </span>
                  </div>
                  <p><strong>How to acquire:</strong> {skill.how_to_acquire}</p>
                  <p><strong>Timeframe:</strong> {skill.timeframe}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {data.bullet_rewrites.length > 0 && (
        <div className="recommendation-section">
          <div
            className="section-header"
            onClick={() => toggleSection('bullets')}
          >
            <span>✏️ Rewrite Suggestions ({data.bullet_rewrites.length})</span>
            <span className="toggle-icon">{expandedSection === 'bullets' ? '▼' : '▶'}</span>
          </div>
          {expandedSection === 'bullets' && (
            <div className="section-content">
              {data.bullet_rewrites.map((rewrite, idx) => (
                <div key={idx} className="rewrite-card">
                  <div className="rewrite-before">
                    <strong>Before:</strong>
                    <p className="before-text">{rewrite.original}</p>
                  </div>
                  <div className="rewrite-arrow">→</div>
                  <div className="rewrite-after">
                    <strong>After:</strong>
                    <p className="after-text">{rewrite.improved}</p>
                  </div>
                  <div className="rewrite-why">
                    <strong>Why:</strong> {rewrite.why}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {data.keywords_to_add.length > 0 && (
        <div className="recommendation-section">
          <div
            className="section-header"
            onClick={() => toggleSection('keywords')}
          >
            <span>🏷️ Keywords to Add ({data.keywords_to_add.length})</span>
            <span className="toggle-icon">{expandedSection === 'keywords' ? '▼' : '▶'}</span>
          </div>
          {expandedSection === 'keywords' && (
            <div className="section-content">
              <div className="keywords-grid">
                {data.keywords_to_add.map((keyword, idx) => (
                  <span key={idx} className="keyword-chip">{keyword}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {data.new_sections_to_add.length > 0 && (
        <div className="recommendation-section">
          <div
            className="section-header"
            onClick={() => toggleSection('sections')}
          >
            <span>➕ New Sections to Add ({data.new_sections_to_add.length})</span>
            <span className="toggle-icon">{expandedSection === 'sections' ? '▼' : '▶'}</span>
          </div>
          {expandedSection === 'sections' && (
            <div className="section-content">
              {data.new_sections_to_add.map((section, idx) => (
                <div key={idx} className="new-section-card">
                  <h5>{section.section_name}</h5>
                  <p><strong>Why:</strong> {section.reason}</p>
                  <p><strong>Example:</strong></p>
                  <pre>{section.example_content}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {data.formatting_improvements.length > 0 && (
        <div className="recommendation-section">
          <div
            className="section-header"
            onClick={() => toggleSection('formatting')}
          >
            <span>🎨 Formatting Improvements ({data.formatting_improvements.length})</span>
            <span className="toggle-icon">{expandedSection === 'formatting' ? '▼' : '▶'}</span>
          </div>
          {expandedSection === 'formatting' && (
            <div className="section-content">
              <ul className="improvements-list">
                {data.formatting_improvements.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {data.quantification_opportunities.length > 0 && (
        <div className="recommendation-section">
          <div
            className="section-header"
            onClick={() => toggleSection('quantification')}
          >
            <span>📊 Add Quantifiable Metrics ({data.quantification_opportunities.length})</span>
            <span className="toggle-icon">{expandedSection === 'quantification' ? '▼' : '▶'}</span>
          </div>
          {expandedSection === 'quantification' && (
            <div className="section-content">
              <ul className="improvements-list">
                {data.quantification_opportunities.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {data.summary_rewrite && (
        <div className="recommendation-section">
          <div
            className="section-header"
            onClick={() => toggleSection('summary')}
          >
            <span>📝 Suggested Professional Summary</span>
            <span className="toggle-icon">{expandedSection === 'summary' ? '▼' : '▶'}</span>
          </div>
          {expandedSection === 'summary' && (
            <div className="section-content">
              <div className="summary-rewrite">
                <p>{data.summary_rewrite}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
