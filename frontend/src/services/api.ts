/**
 * Centralized API service for all backend endpoints
 * Integrates with the multi-agent backend system
 */

const API_BASE_URL = `${window.location.origin}/api`;

interface ApiResponse<T> {
  success?: boolean;
  error?: string;
  [key: string]: any;
}

// ──────────────────────────────────────────────────────────────────────
// Resume APIs
// ──────────────────────────────────────────────────────────────────────

export async function uploadResume(file: File): Promise<ApiResponse<any>> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/resume/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`);
  return response.json();
}

// ──────────────────────────────────────────────────────────────────────
// Multi-Agent Endpoints
// ──────────────────────────────────────────────────────────────────────

export async function reviewCV(resumeText: string): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE_URL}/agent/review-cv`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: resumeText }),
  });

  if (!response.ok) throw new Error("CV review failed");
  return response.json();
}

export async function getRAGMatches(resumeText: string, numMatches: number = 5): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE_URL}/agent/rag-match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: resumeText, num_matches: numMatches }),
  });

  if (!response.ok) throw new Error("RAG matching failed");
  return response.json();
}

export async function searchJobs(query: string): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE_URL}/agent/search-jobs`, {
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
  const response = await fetch(`${API_BASE_URL}/agent/full-analysis`, {
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
  const response = await fetch(`${API_BASE_URL}/agent/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: resumeText, num_matches: numMatches }),
  });

  if (!response.ok) throw new Error("Job matching failed");
  return response.json();
}

export async function generateCoverLetter(resumeText: string, jobDescription: string): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE_URL}/agent/generate-cover-letter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription }),
  });

  if (!response.ok) throw new Error("Cover letter generation failed");
  return response.json();
}

export async function analyzeGaps(resumeText: string, jobDescription: string): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_BASE_URL}/agent/analyze-gaps`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: resumeText, job_description: jobDescription }),
  });

  if (!response.ok) throw new Error("Gap analysis failed");
  return response.json();
}
