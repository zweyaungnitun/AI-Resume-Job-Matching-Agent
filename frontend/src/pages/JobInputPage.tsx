import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflow } from '../context/WorkflowContext';
import { fullAnalysis, searchJobs } from '../services/api';
import './JobInputPage.css';

export const JobInputPage: React.FC = () => {
  const navigate = useNavigate();
  const { cvText, setJobSourceType, setJobSourceValue, setAnalysisResults, setIsLoadingAnalysis, setErrorAnalysis } =
    useWorkflow();
  const [jobInputType, setJobInputType] = useState<'url' | 'text' | 'search'>('url');
  const [jobUrl, setJobUrl] = useState('');
  const [jobText, setJobText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!cvText) {
    navigate('/cv-input');
    return null;
  }

  const handleAnalyze = async () => {
    let sourceType: 'url' | 'text' | 'search' | null = null;
    let sourceValue = '';

    if (jobInputType === 'url') {
      if (!jobUrl.trim()) {
        setError('Please enter a job URL');
        return;
      }
      sourceType = 'url';
      sourceValue = jobUrl;
    } else if (jobInputType === 'text') {
      if (!jobText.trim()) {
        setError('Please paste a job description');
        return;
      }
      sourceType = 'text';
      sourceValue = jobText;
    } else if (jobInputType === 'search') {
      if (!searchQuery.trim()) {
        setError('Please enter a search query');
        return;
      }
      sourceType = 'search';
      sourceValue = searchQuery;
    }

    setIsProcessing(true);
    setError(null);
    setIsLoadingAnalysis(true);

    try {
      setJobSourceType(jobInputType);
      setJobSourceValue(sourceValue);

      const results = await fullAnalysis(cvText, jobInputType, sourceValue);

      if (!results.success) {
        throw new Error(results.error || 'Analysis failed');
      }

      setAnalysisResults(results);
      navigate('/analysis-results');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to analyze job';
      setError(errorMsg);
      setErrorAnalysis(errorMsg);
      setIsLoadingAnalysis(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="job-input-page">
      <div className="job-container">
        <div className="job-header">
          <h2>Step 2: Enter Job Details</h2>
          <p>Provide the job information you want to match against your CV</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
          </div>
        )}

        <div className="job-input-tabs">
          <button
            className={`tab-btn ${jobInputType === 'url' ? 'active' : ''}`}
            onClick={() => {
              setJobInputType('url');
              setError(null);
            }}
          >
            🔗 Job URL
          </button>
          <button
            className={`tab-btn ${jobInputType === 'text' ? 'active' : ''}`}
            onClick={() => {
              setJobInputType('text');
              setError(null);
            }}
          >
            📋 Paste Description
          </button>
          <button
            className={`tab-btn ${jobInputType === 'search' ? 'active' : ''}`}
            onClick={() => {
              setJobInputType('search');
              setError(null);
            }}
          >
            🔍 Search
          </button>
        </div>

        {jobInputType === 'url' && (
          <div className="input-section">
            <label>Job Posting URL</label>
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://example.com/jobs/position"
              disabled={isProcessing}
              className="input-field"
            />
            <p className="input-help">
              Enter the direct link to the job posting (LinkedIn, Indeed, Glassdoor, etc.)
            </p>
          </div>
        )}

        {jobInputType === 'text' && (
          <div className="input-section">
            <label>Job Description</label>
            <textarea
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Paste the complete job description here. Include job title, responsibilities, requirements, qualifications, etc."
              disabled={isProcessing}
              className="input-textarea"
            />
            <div className="char-count">{jobText.length} characters</div>
          </div>
        )}

        {jobInputType === 'search' && (
          <div className="input-section">
            <label>Search Query</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g., Senior Software Engineer, Python Developer, Data Scientist"
              disabled={isProcessing}
              className="input-field"
            />
            <p className="input-help">
              We'll search the web for matching job postings and analyze the top results
            </p>
          </div>
        )}

        <button
          className="analyze-btn"
          onClick={handleAnalyze}
          disabled={
            isProcessing ||
            (jobInputType === 'url' ? !jobUrl.trim() : jobInputType === 'text' ? !jobText.trim() : !searchQuery.trim())
          }
        >
          {isProcessing ? (
            <>
              <span className="spinner">⏳</span>
              Analyzing...
            </>
          ) : (
            <>
              <span>Start Full Analysis</span>
              <span className="arrow">→</span>
            </>
          )}
        </button>

        <div className="job-tips">
          <h4>💡 About This Step:</h4>
          <ul>
            <li>
              <strong>Job URL:</strong> We'll fetch and analyze the job posting directly from the webpage
            </li>
            <li>
              <strong>Paste Description:</strong> Manually copy-paste the complete job description
            </li>
            <li>
              <strong>Search:</strong> We'll search for jobs matching your query and analyze the top results
            </li>
          </ul>
        </div>

        <div className="what-happens-next">
          <h4>📊 What Happens Next:</h4>
          <ol>
            <li>We extract key requirements from the job posting</li>
            <li>We research the company background and culture</li>
            <li>We score your CV against the job requirements</li>
            <li>We find similar jobs from our database</li>
            <li>We provide specific recommendations to improve your match</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
