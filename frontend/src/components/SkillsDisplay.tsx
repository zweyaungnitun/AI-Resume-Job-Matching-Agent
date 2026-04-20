import React from 'react';
import './SkillsDisplay.css';

interface SkillsDisplayProps {
  matchedSkills: string[];
  missingRequired: string[];
  missingPreferred: string[];
}

export const SkillsDisplay: React.FC<SkillsDisplayProps> = ({
  matchedSkills,
  missingRequired,
  missingPreferred,
}) => {
  return (
    <div className="skills-display">
      {matchedSkills.length > 0 && (
        <div className="skills-section">
          <h4>Matched Skills ✓</h4>
          <div className="skills-tags">
            {matchedSkills.map((skill, idx) => (
              <span key={idx} className="skill-tag skill-matched">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {missingRequired.length > 0 && (
        <div className="skills-section">
          <h4>Missing Required Skills ⚠️</h4>
          <div className="skills-tags">
            {missingRequired.map((skill, idx) => (
              <span key={idx} className="skill-tag skill-required">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {missingPreferred.length > 0 && (
        <div className="skills-section">
          <h4>Missing Preferred Skills</h4>
          <div className="skills-tags">
            {missingPreferred.map((skill, idx) => (
              <span key={idx} className="skill-tag skill-preferred">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
