/**
 * Centralized API service for all backend endpoints
 * Integrates with the multi-agent backend system
 */

import { logger } from '../lib/logger';

const API_BASE_URL = `${window.location.origin}/api`;

// ──────────────────────────────────────────────────────────────────────
// Auth API
// ──────────────────────────────────────────────────────────────────────

export async function apiLoginWithPassword(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/auth/login-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Invalid email or password');
  }
  return response.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number }>;
}

export async function apiSignup(email: string, password: string, name?: string) {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Signup failed');
  }
  return response.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number }>;
}

export async function apiRefreshToken(refreshToken: string) {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!response.ok) throw new Error('Session expired. Please log in again.');
  return response.json() as Promise<{ access_token: string; refresh_token: string }>;
}

export async function apiAuthLogout(token: string) {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ApiResponse<_T = unknown> {
  success?: boolean;
  error?: string;
  [key: string]: any;
}

// Helper function to make authenticated fetch requests
async function authedFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const headers: HeadersInit = {
    ...(options.headers instanceof Headers ? Object.fromEntries(options.headers) : options.headers),
    'Authorization': `Bearer ${token}`,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

// ──────────────────────────────────────────────────────────────────────
// Resume APIs
// ──────────────────────────────────────────────────────────────────────

export async function uploadResume(file: File): Promise<ApiResponse<any>> {
  logger.info('Uploading resume', { fileName: file.name });
  const token = localStorage.getItem('auth_token');
  console.log('Auth token present:', !!token);

  if (!token) {
    throw new Error('No authentication token found. Please login first.');
  }

  const formData = new FormData();
  formData.append("file", file);

  console.log('Sending upload request with token:', token.substring(0, 20) + '...');

  const response = await fetch(`${API_BASE_URL}/resume/upload`, {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    logger.error('Upload failed', response.statusText);
    const error = await response.json().catch(() => ({}));
    console.log('Upload error details:', error);
    throw new Error(error.detail?.[0]?.msg || error.detail || `Upload failed: ${response.statusText}`);
  }
  const data = await response.json();
  logger.debug('Upload response', data);

  // Normalize response to match frontend expectations
  return {
    ...data,
    text: data.raw_text || data.text,
  };
}

export async function extractResumeData(
  rawText: string,
  fileType: string,
  filename: string
): Promise<ApiResponse<any>> {
  logger.info('Extracting resume data', { fileType, filename });
  const response = await authedFetch(`${API_BASE_URL}/resume/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      raw_text: rawText,
      file_type: fileType,
      filename: filename,
    }),
  });

  if (!response.ok) {
    logger.error('Resume extraction failed');
    throw new Error("Resume extraction failed");
  }
  const data = await response.json();
  logger.debug('Extracted resume data', data);
  return data;
}

// ──────────────────────────────────────────────────────────────────────
// Multi-Agent Endpoints
// ──────────────────────────────────────────────────────────────────────

export async function reviewCV(resumeText: string): Promise<ApiResponse<any>> {
  logger.info('Reviewing CV');
  const response = await authedFetch(`${API_BASE_URL}/agent/review-cv`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: resumeText }),
  });

  if (!response.ok) {
    logger.error('CV review failed');
    const data = await response.json().catch(() => ({}));
    if (data && data.error && data.error.includes('region is not supported')) {
      return {
        success: false,
        error: 'Your region is not supported for this AI service. Please try again from a supported location.'
      };
    }
    throw new Error("CV review failed");
  }
  const data = await response.json();
  logger.debug('CV review response', data);
  return data;
}

export async function getRAGMatches(
  resumeText: string,
  numMatches: number = 5,
  jobQuery?: string,
  includeWebSearch: boolean = false
): Promise<ApiResponse<any>> {
  logger.info('Getting RAG matches', { numMatches, includeWebSearch });
  const response = await authedFetch(`${API_BASE_URL}/agent/rag-match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resume_text: resumeText,
      num_matches: numMatches,
      job_query: jobQuery?.trim() ? jobQuery.trim() : null,
      include_web_search: includeWebSearch,
    }),
  });

  if (!response.ok) {
    logger.error('RAG matching failed');
    throw new Error("RAG matching failed");
  }
  const data = await response.json();
  logger.debug('RAG matches response', data);
  return data;
}

export async function searchJobs(query: string): Promise<ApiResponse<any>> {
  const response = await authedFetch(`${API_BASE_URL}/agent/search-jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) throw new Error("Job search failed");
  return response.json();
}

export async function fullAnalysis(
  resumeText: string,
  jobSourceType: "url" | "text" | "search",
  jobSourceValue: string,
  numRagMatches: number = 5
): Promise<ApiResponse<any>> {
  const response = await authedFetch(`${API_BASE_URL}/agent/full-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resume_text: resumeText,
      job_source_type: jobSourceType,
      job_source_value: jobSourceValue,
      num_rag_matches: numRagMatches,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Full analysis failed");
  }
  return response.json();
}

// ──────────────────────────────────────────────────────────────────────
// Legacy Endpoints
// ──────────────────────────────────────────────────────────────────────

export async function matchJobs(resumeText: string, numMatches: number = 5): Promise<ApiResponse<any>> {
  const response = await authedFetch(`${API_BASE_URL}/agent/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: resumeText, num_matches: numMatches }),
  });

  if (!response.ok) throw new Error("Job matching failed");
  return response.json();
}

export async function generateCoverLetter(resumeText: string, jobDescription: string): Promise<ApiResponse<any>> {
  const response = await authedFetch(`${API_BASE_URL}/agent/generate-cover-letter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription }),
  });

  if (!response.ok) throw new Error("Cover letter generation failed");
  return response.json();
}

export async function analyzeGaps(resumeText: string, jobDescription: string): Promise<ApiResponse<any>> {
  const response = await authedFetch(`${API_BASE_URL}/agent/analyze-gaps`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription }),
  });

  if (!response.ok) throw new Error("Gap analysis failed");
  return response.json();
}

export async function generateCareerRoadmap(
  resumeText: string,
  jobTitle: string,
  company: string,
  missingRequiredSkills: string[] = [],
  missingPreferredSkills: string[] = [],
  targetTimeframeMonths: number = 6
): Promise<ApiResponse<any>> {
  logger.info('Generating career roadmap', { jobTitle });
  const response = await authedFetch(`${API_BASE_URL}/agent/career-roadmap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resume_text: resumeText,
      job_title: jobTitle,
      company: company,
      missing_required_skills: missingRequiredSkills,
      missing_preferred_skills: missingPreferredSkills,
      target_timeframe_months: targetTimeframeMonths,
    }),
  });

  if (!response.ok) {
    logger.error('Career roadmap generation failed', { status: response.status });
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Career roadmap generation failed");
  }
  const data = await response.json();
  logger.debug('Career roadmap response', data);
  // Ensure success field is set
  return {
    ...data,
    success: data.success !== false,
  };
}

export async function exportResumeToDOCX(resumeText: string, filename: string = "resume"): Promise<Blob> {
  logger.info('Exporting resume as DOCX', { filename });
  const response = await authedFetch(`${API_BASE_URL}/resume/export-docx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resume_text: resumeText,
      filename: filename,
    }),
  });

  if (!response.ok) {
    logger.error('Resume export failed');
    throw new Error("Resume export to DOCX failed");
  }
  const blob = await response.blob();
  logger.debug('Resume exported successfully', { size: blob.size });
  return blob;
}
