import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflow } from '../context/WorkflowContext';
import { fullAnalysis, searchJobs } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { AlertCircle, Link as LinkIcon, Lightbulb, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

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
      setIsLoadingAnalysis(false);
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge>Step 3 of 4</Badge>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Add Job Details</h1>
        <p className="mt-2 text-muted-foreground">
          Provide the job information you want to match against your CV
        </p>
      </div>

      {error && (
        <div className="flex gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Input Method Tabs */}
      <div className="flex gap-2 rounded-lg border border-border bg-secondary/30 p-1">
        <button
          onClick={() => {
            setJobInputType('url');
            setError(null);
          }}
          className={cn(
            'flex-1 rounded-md px-4 py-2 font-medium text-sm transition-colors',
            jobInputType === 'url'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <LinkIcon className="inline h-4 w-4 mr-2" />
          Job URL
        </button>
        <button
          onClick={() => {
            setJobInputType('text');
            setError(null);
          }}
          className={cn(
            'flex-1 rounded-md px-4 py-2 font-medium text-sm transition-colors',
            jobInputType === 'text'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Paste Description
        </button>
        <button
          onClick={() => {
            setJobInputType('search');
            setError(null);
          }}
          className={cn(
            'flex-1 rounded-md px-4 py-2 font-medium text-sm transition-colors',
            jobInputType === 'search'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Search
        </button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          {jobInputType === 'url' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Job Posting URL</label>
              <Input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://example.com/jobs/position"
                disabled={isProcessing}
              />
              <p className="text-xs text-muted-foreground">
                Enter the direct link to the job posting (LinkedIn, Indeed, Glassdoor, etc.)
              </p>
            </div>
          )}

          {jobInputType === 'text' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Job Description</label>
              <textarea
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                placeholder="Paste the complete job description here. Include job title, responsibilities, requirements, qualifications, etc."
                disabled={isProcessing}
                className="w-full h-64 px-4 py-3 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-xs text-muted-foreground">
                {jobText.length} characters
              </p>
            </div>
          )}

          {jobInputType === 'search' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Search Query</label>
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., Senior Software Engineer, Python Developer, Data Scientist"
                disabled={isProcessing}
              />
              <p className="text-xs text-muted-foreground">
                We'll search the web for matching job postings and analyze the top results
              </p>
            </div>
          )}

          <Button
            onClick={handleAnalyze}
            disabled={
              isProcessing ||
              (jobInputType === 'url' ? !jobUrl.trim() : jobInputType === 'text' ? !jobText.trim() : !searchQuery.trim())
            }
            className="w-full mt-6"
            size="lg"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                Start Full Analysis
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="bg-secondary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5" />
              Input Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-semibold text-sm">Job URL</p>
              <p className="text-xs text-muted-foreground">We'll fetch and analyze the job posting directly from the webpage</p>
            </div>
            <div>
              <p className="font-semibold text-sm">Paste Description</p>
              <p className="text-xs text-muted-foreground">Manually copy-paste the complete job description</p>
            </div>
            <div>
              <p className="font-semibold text-sm">Search</p>
              <p className="text-xs text-muted-foreground">We'll search for jobs matching your query and analyze the top results</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/50">
          <CardHeader>
            <CardTitle className="text-lg">What Happens Next</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm list-decimal list-inside text-muted-foreground">
              <li>Extract key requirements from the job posting</li>
              <li>Research the company background and culture</li>
              <li>Score your CV against the job requirements</li>
              <li>Find similar jobs from our database</li>
              <li>Provide specific recommendations to improve your match</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
