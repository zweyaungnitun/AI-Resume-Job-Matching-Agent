import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflow } from '../context/WorkflowContext';
import { ScoreCard } from '../components/ScoreCard';
import { reviewCV } from '../services/api';
import './CVReviewPage.css';

export const CVReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { cvText, cvReview, isLoadingReview, errorReview, setCVReview, setIsLoadingReview, setErrorReview } = useWorkflow();

  useEffect(() => {
    if (!cvText) {
      navigate('/cv-input');
      return;
    }

    // Trigger CV review if not already loaded
    if (!cvReview && !isLoadingReview && !errorReview) {
      const performReview = async () => {
        setIsLoadingReview(true);
        try {
          const result = await reviewCV(cvText);
          setCVReview(result.cv_review || result);
        } catch (err: any) {
          setErrorReview(err.message || 'Failed to review CV');
        } finally {
          setIsLoadingReview(false);
        }
      };
      performReview();
    }
  }, [cvText, cvReview, isLoadingReview, errorReview, navigate, setCVReview, setIsLoadingReview, setErrorReview]);

  if (!cvText) return null;

  if (isLoadingReview) {
    return (
      <div className="cv-review-page">
        <div className="loading-container">
          <div className="spinner-large">⏳</div>
          <h2>Analyzing Your CV...</h2>
          <p>This may take a moment as we review your resume quality</p>
        </div>
      </div>
    );
  }

  if (errorReview) {
    return (
      <div className="cv-review-page">
        <div className="error-container">
          <h2>Analysis Failed</h2>
          <p>{errorReview}</p>
          <button onClick={() => navigate('/cv-input')} className="btn-primary">
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  if (!cvReview) {
    return (
      <div className="cv-review-page">
        <div className="error-container">
          <h2>No Review Data</h2>
          <p>The CV review could not be completed. Please try again.</p>
          <button onClick={() => navigate('/cv-input')} className="btn-primary">
            Back to Upload
          </button>
        </div>
      </div>
    );
  }

  const scoreBreakdown = [
    { label: 'ATS Score', score: cvReview.ats_score || 0, color: '#e74c3c' },
    { label: 'Structure', score: cvReview.structure_score || 0, color: '#f39c12' },
    { label: 'Content', score: cvReview.content_score || 0, color: '#27ae60' },
  ];

  return (
    <div className="cv-review-page">
      <div className="review-container">
        <div className="review-header">
          <h1>CV Quality Review</h1>
          <p>Detailed analysis of your resume</p>
        </div>

        <ScoreCard
          overallScore={cvReview.overall_score || 0}
          matchLevel={`Overall Score: ${cvReview.overall_score || 0}/100`}
          breakdown={scoreBreakdown}
        />

        <div className="review-content">
          {cvReview.overall_assessment && (
            <section className="review-section">
              <h3>Assessment</h3>
              <p className="assessment-text">{cvReview.overall_assessment}</p>
            </section>
          )}

          {cvReview.contact_info && (
            <section className="review-section">
              <h3>Contact Information</h3>
              <div className="contact-status">
                <div className="status-item">
                  <span className={cvReview.contact_info.present ? 'status-ok' : 'status-missing'}>
                    {cvReview.contact_info.present ? '✓' : '✗'}
                  </span>
                  <span>Contact information {cvReview.contact_info.present ? 'present' : 'missing'}</span>
                </div>
                <div className="status-item">
                  <span className={cvReview.contact_info.complete ? 'status-ok' : 'status-missing'}>
                    {cvReview.contact_info.complete ? '✓' : '✗'}
                  </span>
                  <span>Contact information {cvReview.contact_info.complete ? 'complete' : 'incomplete'}</span>
                </div>
                {cvReview.contact_info.issues && cvReview.contact_info.issues.length > 0 && (
                  <div className="issues-list">
                    {cvReview.contact_info.issues.map((issue: string, idx: number) => (
                      <p key={idx} className="issue">⚠️ {issue}</p>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {cvReview.strengths && cvReview.strengths.length > 0 && (
            <section className="review-section">
              <h3>✓ Strengths</h3>
              <ul className="strengths-list">
                {cvReview.strengths.map((strength: string, idx: number) => (
                  <li key={idx}>{strength}</li>
                ))}
              </ul>
            </section>
          )}

          {cvReview.weaknesses && cvReview.weaknesses.length > 0 && (
            <section className="review-section">
              <h3>⚠️ Areas for Improvement</h3>
              <ul className="weaknesses-list">
                {cvReview.weaknesses.map((weakness: string, idx: number) => (
                  <li key={idx}>{weakness}</li>
                ))}
              </ul>
            </section>
          )}

          {cvReview.ats_issues && cvReview.ats_issues.length > 0 && (
            <section className="review-section">
              <h3>ATS Compatibility Issues</h3>
              <ul className="ats-issues-list">
                {cvReview.ats_issues.map((issue: string, idx: number) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            </section>
          )}

          {cvReview.immediate_fixes && cvReview.immediate_fixes.length > 0 && (
            <section className="review-section">
              <h3>🚀 Quick Wins (Immediate Fixes)</h3>
              <ul className="quick-wins-list">
                {cvReview.immediate_fixes.map((fix: string, idx: number) => (
                  <li key={idx}>{fix}</li>
                ))}
              </ul>
            </section>
          )}

          {cvReview.sections_found && cvReview.sections_found.length > 0 && (
            <section className="review-section">
              <h3>Sections Found</h3>
              <div className="sections-grid">
                {cvReview.sections_found.map((section: string, idx: number) => (
                  <span key={idx} className="section-tag found">{section}</span>
                ))}
              </div>
            </section>
          )}

          {cvReview.sections_missing && cvReview.sections_missing.length > 0 && (
            <section className="review-section">
              <h3>Missing Sections</h3>
              <div className="sections-grid">
                {cvReview.sections_missing.map((section: string, idx: number) => (
                  <span key={idx} className="section-tag missing">{section}</span>
                ))}
              </div>
            </section>
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
            Next: Enter Job Details →
          </button>
        </div>
      </div>
    </div>
  );
};
