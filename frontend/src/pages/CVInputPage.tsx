import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadResume, reviewCV } from '../services/api';
import { useWorkflow } from '../context/WorkflowContext';
import './CVInputPage.css';

export const CVInputPage: React.FC = () => {
  const navigate = useNavigate();
  const { setCVText, setIsLoadingReview, setErrorReview, cvText } = useWorkflow();
  const [inputMethod, setInputMethod] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const uploadResult = await uploadResume(file);
      const resumeText = uploadResult.text || '';

      if (!resumeText) {
        setError('Failed to extract text from the file. Please try again.');
        return;
      }

      setCVText(resumeText);
      setIsLoadingReview(true);
      const reviewResult = await reviewCV(resumeText);
      navigate('/cv-review');
    } catch (err: any) {
      setError(err.message || 'Failed to upload resume');
      setIsLoadingReview(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaste = async () => {
    if (!pastedText.trim()) {
      setError('Please paste your CV text');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      setCVText(pastedText);
      setIsLoadingReview(true);
      setErrorReview(null);

      await reviewCV(pastedText);
      navigate('/cv-review');
    } catch (err: any) {
      setError(err.message || 'Failed to analyze CV');
      setErrorReview(err.message || 'Failed to analyze CV');
      setIsLoadingReview(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (inputMethod === 'upload') {
      await handleUpload();
    } else {
      await handlePaste();
    }
  };

  return (
    <div className="cv-input-page">
      <div className="input-container">
        <div className="input-header">
          <h2>Step 1: Upload Your Resume</h2>
          <p>Start by uploading your CV or pasting it directly</p>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
          </div>
        )}

        <div className="input-method-tabs">
          <button
            className={`tab-btn ${inputMethod === 'upload' ? 'active' : ''}`}
            onClick={() => setInputMethod('upload')}
          >
            📤 Upload File
          </button>
          <button
            className={`tab-btn ${inputMethod === 'paste' ? 'active' : ''}`}
            onClick={() => setInputMethod('paste')}
          >
            📋 Paste Text
          </button>
        </div>

        {inputMethod === 'upload' ? (
          <div className="upload-section">
            <div className="file-input-wrapper">
              <input
                type="file"
                id="file-input"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileSelect}
                disabled={isProcessing}
              />
              <label htmlFor="file-input" className="file-label">
                <div className="file-icon">📄</div>
                <div className="file-text">
                  {file ? (
                    <>
                      <strong>{file.name}</strong>
                      <span>({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </>
                  ) : (
                    <>
                      <strong>Click to select or drag file</strong>
                      <span>PDF, DOCX, DOC, or TXT</span>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>
        ) : (
          <div className="paste-section">
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste your resume or CV here. Include all sections: Contact Info, Summary, Experience, Education, Skills, etc."
              className="paste-textarea"
              disabled={isProcessing}
            />
            <div className="char-count">
              {pastedText.length} characters
            </div>
          </div>
        )}

        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={
            isProcessing || (inputMethod === 'upload' ? !file : !pastedText.trim())
          }
        >
          {isProcessing ? (
            <>
              <span className="spinner">⏳</span>
              Processing...
            </>
          ) : (
            <>
              <span>Continue</span>
              <span className="arrow">→</span>
            </>
          )}
        </button>

        <div className="tips-section">
          <h4>💡 Tips for Best Results:</h4>
          <ul>
            <li>Include all your professional experience and education</li>
            <li>List all relevant skills and certifications</li>
            <li>Use clear formatting and standard section headings</li>
            <li>Include measurable achievements and metrics</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
