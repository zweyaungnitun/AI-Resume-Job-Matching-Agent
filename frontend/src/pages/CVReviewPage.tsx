import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflow } from '../context/WorkflowContext';
import { exportResumeToDOCX } from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { AlertCircle, CheckCircle, AlertTriangle, Zap, ArrowRight, ChevronLeft, Download } from 'lucide-react';
import { scoreToColor } from '../lib/utils';
import { LoadingSpinner } from '../components/ui/loading-spinner';

export const CVReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { cvText, cvReview, isLoadingReview, errorReview } = useWorkflow();
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!cvText) {
      navigate('/cv-input');
      return;
    }
  }, [cvText, navigate]);

  const handleExportDOCX = async () => {
    try {
      setIsExporting(true);
      const blob = await exportResumeToDOCX(cvText, 'resume');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.docx';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export resume as DOCX');
    } finally {
      setIsExporting(false);
    }
  };

  if (!cvText) return null;

  if (isLoadingReview) {
    return (
      <LoadingSpinner
        message="Analyzing your CV..."
        subMessage="This may take a moment"
        size="md"
      />
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
        <h1 className="text-3xl font-bold text-foreground">Resume Quality Snapshot</h1>
        <p className="mt-2 text-muted-foreground">
          Review strengths, gaps, and quick wins before matching to jobs.
        </p>
      </div>

      {/* Overall Score Card */}
      <Card className={`border-0 shadow-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-3xl transition-all duration-500 ${scoreToColor(overallScore).border}`}> 
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-extrabold tracking-tight text-gray-900">Overall Score</CardTitle>
              <CardDescription className="text-base text-gray-500">Your CV quality assessment</CardDescription>
            </div>
            <div className={`text-5xl font-black drop-shadow-lg ${scoreToColor(overallScore).text}`}>
              {overallScore}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Progress value={overallScore} className="h-4 rounded-full bg-gray-200/70" />

          {/* Score Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            {[
              { label: 'ATS Score', value: cvReview.ats_score || 0 },
              { label: 'Structure', value: cvReview.structure_score || 0 },
              { label: 'Content', value: cvReview.content_score || 0 },
            ].map((item) => {
              const colors = scoreToColor(item.value);
              return (
                <div
                  key={item.label}
                  className={`p-5 rounded-2xl shadow-md bg-gradient-to-br from-white via-gray-50 to-${colors.bg.replace('bg-', '')} border ${colors.border} flex flex-col items-center hover:scale-105 transition-transform duration-300`}
                >
                  <p className={`text-2xl font-bold ${colors.text}`}>{item.value}</p>
                  <p className="text-xs opacity-80 mt-1 font-medium uppercase tracking-wide text-gray-500">{item.label}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Overall Assessment */}
      {cvReview.overall_assessment && (
        <Card className="border-blue-200/80 bg-blue-50/80">
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
        <Card className="border-green-200/80 bg-green-50/80">
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
          variant="outline"
          onClick={handleExportDOCX}
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          {isExporting ? 'Exporting...' : 'Export as DOCX'}
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
