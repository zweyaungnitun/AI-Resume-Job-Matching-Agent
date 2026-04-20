import React, { createContext, useContext, useState } from 'react';

interface WorkflowContextType {
  // CV Step
  cvText: string;
  setCVText: (text: string) => void;
  cvReview: any | null;
  setCVReview: (review: any) => void;

  // Job Input Step
  jobSourceType: 'url' | 'text' | 'search' | null;
  setJobSourceType: (type: 'url' | 'text' | 'search') => void;
  jobSourceValue: string;
  setJobSourceValue: (value: string) => void;

  // Analysis Results
  analysisResults: any | null;
  setAnalysisResults: (results: any) => void;

  // Loading states
  isLoadingReview: boolean;
  setIsLoadingReview: (loading: boolean) => void;
  isLoadingAnalysis: boolean;
  setIsLoadingAnalysis: (loading: boolean) => void;

  // Error states
  errorReview: string | null;
  setErrorReview: (error: string | null) => void;
  errorAnalysis: string | null;
  setErrorAnalysis: (error: string | null) => void;

  // Clear workflow
  reset: () => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cvText, setCVText] = useState('');
  const [cvReview, setCVReview] = useState<any>(null);
  const [jobSourceType, setJobSourceType] = useState<'url' | 'text' | 'search' | null>(null);
  const [jobSourceValue, setJobSourceValue] = useState('');
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [errorReview, setErrorReview] = useState<string | null>(null);
  const [errorAnalysis, setErrorAnalysis] = useState<string | null>(null);

  const reset = () => {
    setCVText('');
    setCVReview(null);
    setJobSourceType(null);
    setJobSourceValue('');
    setAnalysisResults(null);
    setErrorReview(null);
    setErrorAnalysis(null);
  };

  const value: WorkflowContextType = {
    cvText,
    setCVText,
    cvReview,
    setCVReview,
    jobSourceType,
    setJobSourceType,
    jobSourceValue,
    setJobSourceValue,
    analysisResults,
    setAnalysisResults,
    isLoadingReview,
    setIsLoadingReview,
    isLoadingAnalysis,
    setIsLoadingAnalysis,
    errorReview,
    setErrorReview,
    errorAnalysis,
    setErrorAnalysis,
    reset,
  };

  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within WorkflowProvider');
  }
  return context;
};
