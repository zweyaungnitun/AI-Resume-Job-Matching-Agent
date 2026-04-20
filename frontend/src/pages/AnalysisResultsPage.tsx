import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflow } from '../context/WorkflowContext';
import { ScoreCard } from '../components/ScoreCard';
import { SkillsDisplay } from '../components/SkillsDisplay';
import { CompanyProfile } from '../components/CompanyProfile';
import { ImprovementRecommendations } from '../components/ImprovementRecommendations';
import './AnalysisResultsPage.css';

export const AnalysisResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { cvText, analysisResults, isLoadingAnalysis, errorAnalysis } = useWorkflow();
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'improvements' | 'company' | 'similar'>('overview');

  useEffect(() => {
    if (!cvText || !analysisResults) {
      navigate('/cv-input');
    }
  }, [cvText, analysisResults, navigate]);

  if (!cvText || !analysisResults) return null;

  if (isLoadingAnalysis) {
    return (
      <div className="analysis-results-page">
        <div className="loading-container">
          <div className="spinner-large">⏳</div>
          <h2>Analyzing Your Match...</h2>
          <p>Comparing your CV with the job, researching company, and gathering recommendations</p>
        </div>
      </div>
    );
  }

  if (errorAnalysis) {
    return (
      <div className="analysis-results-page">
        <div className="error-container">
          <h2>Analysis Failed</h2>
          <p>{errorAnalysis}</p>
          <button onClick={() => navigate('/cv-input')} className="btn-primary">
            Start Over
          </button>
        </div>
      </div>
    );
  }

  const scoreResult = analysisResults.score_result || {};
  const scoreBreakdown = [
    { label: 'Skills Match', score: scoreResult.skills_match_score || 0 },
    { label: 'Experience Match', score: scoreResult.experience_match_score || 0 },
    { label: 'Education Match', score: scoreResult.education_match_score || 0 },
    { label: 'Culture Fit', score: scoreResult.culture_fit_score || 0 },
    { label: 'Keyword Match', score: scoreResult.keyword_match_score || 0 },
  ];

  const ragMatches = analysisResults.rag_matches || [];
  const jobAnalysis = analysisResults.job_analysis || {};
  const companyResearch = analysisResults.company_research || {};
  const improvements = analysisResults.improvements || {};

  return (
    <div className="analysis-results-page">
      <div className="results-container">
        <div className="results-header">
          <div className="job-header-info">
            <h1>{jobAnalysis.job_title || 'Job Opportunity'}</h1>
            <p className="company-name">{jobAnalysis.company || 'Company'}</p>
            {jobAnalysis.location && <p className="location">📍 {jobAnalysis.location}</p>}
          </div>
          <button
            className="btn-new-analysis"
            onClick={() => navigate('/cv-input')}
          >
            New Analysis
          </button>
        </div>

        <div className="tabs-container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Overview
            </button>
            <button
              className={`tab ${activeTab === 'skills' ? 'active' : ''}`}
              onClick={() => setActiveTab('skills')}
            >
              🎯 Skills
            </button>
            <button
              className={`tab ${activeTab === 'improvements' ? 'active' : ''}`}
              onClick={() => setActiveTab('improvements')}
            >
              🚀 Improvements
            </button>
            <button
              className={`tab ${activeTab === 'company' ? 'active' : ''}`}
              onClick={() => setActiveTab('company')}
            >
              🏢 Company
            </button>
            {ragMatches.length > 0 && (
              <button
                className={`tab ${activeTab === 'similar' ? 'active' : ''}`}
                onClick={() => setActiveTab('similar')}
              >
                🔄 Similar Jobs
              </button>
            )}
          </div>
        </div>

        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="tab-pane">
              <ScoreCard
                overallScore={scoreResult.overall_score || 0}
                matchLevel={scoreResult.match_level || 'No Match'}
                breakdown={scoreBreakdown}
                matchLikelihood={scoreResult.hiring_likelihood}
              />

              {scoreResult.explanation && (
                <div className="info-section">
                  <h3>Match Summary</h3>
                  <p>{scoreResult.explanation}</p>
                </div>
              )}

              {scoreResult.strengths_for_this_role && scoreResult.strengths_for_this_role.length > 0 && (
                <div className="info-section">
                  <h3>✓ Your Strengths for This Role</h3>
                  <ul className="strengths-list">
                    {scoreResult.strengths_for_this_role.map((strength: string, idx: number) => (
                      <li key={idx}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {scoreResult.concerns_for_this_role && scoreResult.concerns_for_this_role.length > 0 && (
                <div className="info-section">
                  <h3>⚠️ Areas of Concern</h3>
                  <ul className="concerns-list">
                    {scoreResult.concerns_for_this_role.map((concern: string, idx: number) => (
                      <li key={idx}>{concern}</li>
                    ))}
                  </ul>
                </div>
              )}

              {scoreResult.experience_analysis && (
                <div className="info-section">
                  <h3>Experience Analysis</h3>
                  <p>{scoreResult.experience_analysis}</p>
                </div>
              )}

              {jobAnalysis.summary && (
                <div className="info-section">
                  <h3>Job Summary</h3>
                  <p>{jobAnalysis.summary}</p>
                </div>
              )}

              {jobAnalysis.key_responsibilities && jobAnalysis.key_responsibilities.length > 0 && (
                <div className="info-section">
                  <h3>Key Responsibilities</h3>
                  <ul className="responsibilities-list">
                    {jobAnalysis.key_responsibilities.slice(0, 5).map((resp: string, idx: number) => (
                      <li key={idx}>{resp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="tab-pane">
              <SkillsDisplay
                matchedSkills={scoreResult.matched_skills || []}
                missingRequired={scoreResult.missing_required_skills || []}
                missingPreferred={scoreResult.missing_preferred_skills || []}
              />

              {jobAnalysis.required_experience_years && (
                <div className="info-section">
                  <h3>Experience Requirements</h3>
                  <p>Minimum experience required: <strong>{jobAnalysis.required_experience_years} years</strong></p>
                </div>
              )}

              {jobAnalysis.tech_stack && jobAnalysis.tech_stack.length > 0 && (
                <div className="info-section">
                  <h3>Tech Stack</h3>
                  <div className="tech-tags">
                    {jobAnalysis.tech_stack.map((tech: string, idx: number) => (
                      <span key={idx} className="tech-tag">{tech}</span>
                    ))}
                  </div>
                </div>
              )}

              {jobAnalysis.soft_skills && jobAnalysis.soft_skills.length > 0 && (
                <div className="info-section">
                  <h3>Soft Skills Required</h3>
                  <div className="soft-skills">
                    {jobAnalysis.soft_skills.map((skill: string, idx: number) => (
                      <span key={idx} className="soft-skill">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'improvements' && (
            <div className="tab-pane">
              {improvements && Object.keys(improvements).length > 0 ? (
                <ImprovementRecommendations
                  data={improvements}
                  currentScore={scoreResult.overall_score || 0}
                />
              ) : (
                <div className="info-section">
                  <p>No improvement recommendations available at this time.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'company' && (
            <div className="tab-pane">
              {companyResearch && Object.keys(companyResearch).length > 0 ? (
                <CompanyProfile data={companyResearch} />
              ) : (
                <div className="info-section">
                  <p>Company information not available.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'similar' && ragMatches.length > 0 && (
            <div className="tab-pane">
              <div className="similar-jobs">
                {ragMatches.map((job: any, idx: number) => (
                  <div key={idx} className="similar-job-card">
                    <div className="job-title-row">
                      <h4>{job.job_title}</h4>
                      <span className="match-badge">{job.match_score}%</span>
                    </div>
                    <p className="company">{job.company}</p>
                    <p className="description">{job.description_snippet}</p>
                    {job.missing_skills && job.missing_skills.length > 0 && (
                      <div className="missing-skills">
                        <strong>Missing skills:</strong>
                        <div className="skills-list">
                          {job.missing_skills.map((skill: string, i: number) => (
                            <span key={i} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="action-buttons">
          <button
            className="btn-secondary"
            onClick={() => window.history.back()}
          >
            ← Back
          </button>
          <button
            className="btn-primary"
            onClick={() => navigate('/job-input')}
          >
            Analyze Another Job →
          </button>
        </div>
      </div>
    </div>
  );
};
