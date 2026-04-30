import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflow } from '../context/WorkflowContext';
import { reviewCV } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { AlertCircle, CheckCircle, AlertTriangle, Zap, ArrowRight, ChevronLeft } from 'lucide-react';

export const CVReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { cvText, cvReview, isLoadingReview, errorReview, setCVReview, setIsLoadingReview, setErrorReview } = useWorkflow();

  useEffect(() => {
    if (!cvText) {
      navigate('/cv-input');
      return;
    }

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Analyzing your CV...</p>
          <p className="text-sm text-muted-foreground">This may take a moment</p>
        </div>
      </div>
    );
  }

  if (errorReview) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex flex-col gap-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive">Analysis Failed</h3>
                <p className="text-sm text-destructive mt-1">{errorReview}</p>
              </div>
            </div>
            <Button onClick={() => navigate('/cv-input')} variant="outline">
              Back to Upload
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!cvReview) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex flex-col gap-4">
            <h3 className="font-semibold text-destructive">No Review Data</h3>
            <p className="text-sm text-muted-foreground">The CV review could not be completed. Please try again.</p>
            <Button onClick={() => navigate('/cv-input')} variant="outline">
              Back to Upload
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overallScore = cvReview.overall_score || 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge>Step 2 of 4</Badge>
        </div>
        <h1 className="text-3xl font-bold text-foreground">CV Quality Review</h1>
        <p className="mt-2 text-muted-foreground">
          Detailed analysis of your resume and recommendations for improvement
        </p>
      </div>

      {/* Overall Score Card */}
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Overall Score</CardTitle>
              <CardDescription>Your CV quality assessment</CardDescription>
            </div>
            <div className={`text-4xl font-bold ${overallScore >= 80 ? 'text-green-600' : overallScore >= 60 ? 'text-blue-600' : 'text-amber-600'}`}>
              {overallScore}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={overallScore} className="h-3" />

          {/* Score Breakdown */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            {[
              { label: 'ATS Score', value: cvReview.ats_score || 0, color: 'bg-red-100 text-red-700' },
              { label: 'Structure', value: cvReview.structure_score || 0, color: 'bg-amber-100 text-amber-700' },
              { label: 'Content', value: cvReview.content_score || 0, color: 'bg-green-100 text-green-700' },
            ].map((item) => (
              <div key={item.label} className={`p-3 rounded-lg ${item.color} text-center`}>
                <p className="text-sm font-semibold">{item.value}</p>
                <p className="text-xs opacity-80">{item.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overall Assessment */}
      {cvReview.overall_assessment && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-sm text-foreground leading-relaxed">{cvReview.overall_assessment}</p>
          </CardContent>
        </Card>
      )}

      {/* Strengths */}
      {cvReview.strengths && cvReview.strengths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {cvReview.strengths.map((strength: string, idx: number) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Areas for Improvement */}
      {cvReview.weaknesses && cvReview.weaknesses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {cvReview.weaknesses.map((weakness: string, idx: number) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Quick Wins */}
      {cvReview.immediate_fixes && cvReview.immediate_fixes.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-green-600" />
              Quick Wins (Immediate Fixes)
            </CardTitle>
            <CardDescription>Easy improvements you can make right now</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {cvReview.immediate_fixes.map((fix: string, idx: number) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <Zap className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{fix}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ATS Compatibility */}
      {cvReview.ats_issues && cvReview.ats_issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ATS Compatibility Issues</CardTitle>
            <CardDescription>Problems that may prevent your CV from being parsed correctly</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {cvReview.ats_issues.map((issue: string, idx: number) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Sections */}
      <div className="grid gap-4 md:grid-cols-2">
        {cvReview.sections_found && cvReview.sections_found.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sections Found</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {cvReview.sections_found.map((section: string, idx: number) => (
                  <Badge key={idx} variant="default" className="bg-green-100 text-green-800 border-green-300">
                    ✓ {section}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {cvReview.sections_missing && cvReview.sections_missing.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Missing Sections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {cvReview.sections_missing.map((section: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="border-destructive text-destructive">
                    ✗ {section}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Contact Information Status */}
      {cvReview.contact_info && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              {cvReview.contact_info.present ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              <span className="text-sm">
                Contact information {cvReview.contact_info.present ? 'present' : 'missing'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {cvReview.contact_info.complete ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              <span className="text-sm">
                Contact information {cvReview.contact_info.complete ? 'complete' : 'incomplete'}
              </span>
            </div>
            {cvReview.contact_info.issues && cvReview.contact_info.issues.length > 0 && (
              <div className="mt-3 space-y-1 pl-8">
                {cvReview.contact_info.issues.map((issue: string, idx: number) => (
                  <p key={idx} className="text-xs text-destructive">⚠️ {issue}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={() => navigate('/job-input')}
          className="flex items-center gap-2 flex-1"
          size="lg"
        >
          Next: Enter Job Details
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
