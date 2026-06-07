import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflow } from '../context/WorkflowContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { AlertCircle, ArrowRight, ChevronLeft, Target, Zap, Clock, BookOpen, Briefcase } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { RoadmapTimeline } from '../components/RoadmapTimeline';
import { SkillsPathFlow } from '../components/SkillsPathFlow';
import { ResourceSummary } from '../components/ResourceSummary';

export const CareerRoadmapPage: React.FC = () => {
  const navigate = useNavigate();
  const { cvText, analysisResults, careerRoadmap, isLoadingRoadmap, errorRoadmap } = useWorkflow();

  useEffect(() => {
    if (!cvText || !analysisResults) {
      navigate('/cv-input');
      return;
    }
  }, [cvText, analysisResults, navigate]);

  if (!cvText || !analysisResults) return null;

  if (isLoadingRoadmap) {
    return (
      <LoadingSpinner
        message="Building your career roadmap..."
        subMessage="Analyzing skill gaps and creating a personalized learning plan"
        size="md"
      />
    );
  }

  if (errorRoadmap) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex flex-col gap-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive">Roadmap Generation Failed</h3>
                <p className="text-sm text-destructive mt-1">{errorRoadmap}</p>
              </div>
            </div>
            <Button onClick={() => navigate('/analysis-results')} variant="outline">
              Back to Results
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!careerRoadmap) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex flex-col gap-4">
            <h3 className="font-semibold text-destructive">No Roadmap Data</h3>
            <p className="text-sm text-muted-foreground">The career roadmap could not be loaded. Please try again.</p>
            <Button onClick={() => navigate('/analysis-results')} variant="outline">
              Back to Results
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const jobAnalysis = analysisResults.job_analysis || {};
  const scoreResult = analysisResults.score_result || {};
  const roadmapData = careerRoadmap;
  const totalMonths = roadmapData.estimated_timeline_months || 6;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">Career Roadmap</Badge>
        </div>
        <h1 className="text-4xl font-bold text-foreground">Your {totalMonths}-Month Roadmap</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Personalized learning plan to become a <span className="font-semibold text-foreground">{roadmapData.target_level || 'Senior Professional'}</span>
        </p>
      </div>

      {/* Level Progression Card */}
      <Card className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Career Progression</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">Current Level</p>
              <p className="text-lg font-bold text-foreground">{roadmapData.current_level || 'Current Role'}</p>
            </div>
            <div className="h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white">
              <ArrowRight className="h-6 w-6" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-sm font-medium text-muted-foreground mb-1">Target Level</p>
              <p className="text-lg font-bold text-foreground">{roadmapData.target_level || 'Target Role'}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimated Timeline</span>
              <span className="font-semibold">{totalMonths} months</span>
            </div>
            <Progress value={(totalMonths / 12) * 100} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Critical Path */}
      <SkillsPathFlow criticalPath={roadmapData.critical_path || []} />

      {/* Quick Wins */}
      {roadmapData.quick_wins && roadmapData.quick_wins.length > 0 && (
        <Card className="border-green-200/80 bg-green-50/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-green-600" />
              Quick Wins (Start This Week!)
            </CardTitle>
            <CardDescription>Fast momentum builders you can tackle in 1-2 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {roadmapData.quick_wins.map((win: string, idx: number) => (
                <li key={idx} className="flex gap-3 text-sm">
                  <Zap className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{win}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Resource Summary */}
      {roadmapData.learning_resources_summary && (
        <ResourceSummary summary={roadmapData.learning_resources_summary} />
      )}

      {/* Timeline */}
      {roadmapData.roadmap && (
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">Month-by-Month Breakdown</h2>
          <RoadmapTimeline roadmap={roadmapData.roadmap} totalMonths={totalMonths} />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={() => {
            const pdf = generatePDFContent(roadmapData);
            downloadPDF(pdf, `roadmap-${roadmapData.job_title.replace(/\s+/g, '-')}`);
          }}
          variant="outline"
          className="flex items-center gap-2"
        >
          <BookOpen className="h-4 w-4" />
          Export PDF
        </Button>
        <Button
          onClick={() => navigate('/analysis-results')}
          className="flex items-center gap-2 flex-1"
        >
          View Full Analysis
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

function generatePDFContent(roadmapData: any): string {
  return `
Career Roadmap: ${roadmapData.job_title}
Generated on: ${new Date().toLocaleDateString()}

Current Level: ${roadmapData.current_level}
Target Level: ${roadmapData.target_level}
Timeline: ${roadmapData.estimated_timeline_months} months

Critical Path: ${roadmapData.critical_path?.join(', ') || 'N/A'}

Quick Wins:
${roadmapData.quick_wins?.map((w: string) => `- ${w}`).join('\n') || 'None'}

${roadmapData.roadmap?.map((month: any, idx: number) => `
Month ${month.month}: ${month.theme}
Milestones: ${month.milestones?.join(', ') || 'N/A'}
Skills: ${month.skills_targeted?.join(', ') || 'N/A'}
Checkpoint: ${month.checkpoint}
`).join('\n') || 'No timeline data'}
  `;
}

function downloadPDF(content: string, filename: string) {
  const element = document.createElement('a');
  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`);
  element.setAttribute('download', `${filename}.txt`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
