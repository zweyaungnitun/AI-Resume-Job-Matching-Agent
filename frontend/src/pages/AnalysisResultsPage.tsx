import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkflow } from '../context/WorkflowContext';
import { ScoreCard } from '../components/ScoreCard';
import { SkillsDisplay } from '../components/SkillsDisplay';
import { CompanyProfile } from '../components/CompanyProfile';
import { ImprovementRecommendations } from '../components/ImprovementRecommendations';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Briefcase, CheckCircle, AlertCircle, Building2, Zap, BarChart3, ArrowRight, ChevronLeft, MapPin, LineChart, Rocket, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { SegmentedTabs } from '../components/ui/segmented-tabs';
import { LoadingSpinner } from '../components/ui/loading-spinner';

export const AnalysisResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const { cvText, analysisResults, isLoadingAnalysis, errorAnalysis } = useWorkflow();
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'improvements' | 'company' | 'similar'>('overview');

  useEffect(() => {
    if (!cvText || !analysisResults) {
      navigate('/cv-input');
    }
  }, [cvText, analysisResults, navigate]);

  if (!cvText || !analysisResults) return null;

  if (isLoadingAnalysis) {
    return (
      <LoadingSpinner
        message="Analyzing your match..."
        subMessage="Running multi-agent pipeline (CV review, smart matching, job analysis, company research, scoring, improvements)"
        size="md"
      />
    );
  }

  if (errorAnalysis) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6 flex flex-col gap-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive">Analysis Failed</h3>
                <p className="text-sm text-destructive mt-1">{errorAnalysis}</p>
              </div>
            </div>
            <Button onClick={() => navigate('/cv-input')} variant="outline">
              Start Over
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scoreResult = analysisResults.score_result || {};
  const scoreBreakdown = [
    { label: 'Skills Match', score: scoreResult.skills_match_score || 0 },
    { label: 'Experience Match', score: scoreResult.experience_match_score || 0 },
    { label: 'Education Match', score: scoreResult.education_match_score || 0 },
    { label: 'Culture Fit', score: scoreResult.culture_fit_score || 0 },
    { label: 'Keyword Match', score: scoreResult.keyword_match_score || 0 },
  ];

  const ragMatches = analysisResults.rag_matches || [];
  const jobAnalysis = analysisResults.job_analysis || {};
  const companyResearch = analysisResults.company_research || {};
  const improvements = analysisResults.improvements || {};

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge>Step 4 of 4</Badge>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{jobAnalysis.job_title || 'Job Opportunity'}</h1>
            <div className="flex items-center gap-2 mt-2 text-muted-foreground flex-wrap">
              <Briefcase className="h-4 w-4" />
              <span>{jobAnalysis.company || 'Company'}</span>
              {jobAnalysis.location && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{jobAnalysis.location}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/cv-input')}>
            New Analysis
          </Button>
        </div>
      </div>

      {/* Multi-Agent Pipeline Banner */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/15 border-primary/20">
        <CardContent className="pt-6">
          <p className="text-sm font-semibold text-foreground mb-4">Your Insight Pipeline</p>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {['CV Review', 'Smart Matching', 'Job Analysis', 'Company', 'Scoring', 'Recommendations'].map((step, idx, arr) => (
              <div key={step} className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{step}</span>
                </div>
                {idx < arr.length - 1 && <span className="text-muted-foreground">→</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <SegmentedTabs
        tabs={[
          { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
          { id: 'skills', label: 'Skills', icon: <TrendingUp className="h-4 w-4" /> },
          { id: 'improvements', label: 'Improvements', icon: <Rocket className="h-4 w-4" /> },
          { id: 'company', label: 'Company', icon: <Building2 className="h-4 w-4" /> },
          ...(ragMatches.length > 0 ? [{ id: 'similar', label: 'More Like This', icon: <LineChart className="h-4 w-4" /> }] : []),
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
      />

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <ScoreCard
              overallScore={scoreResult.overall_score || 0}
              matchLevel={scoreResult.match_level || 'No Match'}
              breakdown={scoreBreakdown}
              matchLikelihood={scoreResult.hiring_likelihood}
            />

            {scoreResult.explanation && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Match Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{scoreResult.explanation}</p>
                </CardContent>
              </Card>
            )}

            {scoreResult.strengths_for_this_role && scoreResult.strengths_for_this_role.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Your Strengths for This Role
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {scoreResult.strengths_for_this_role.map((strength: string, idx: number) => (
                      <li key={idx} className="flex gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {scoreResult.concerns_for_this_role && scoreResult.concerns_for_this_role.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    Areas of Concern
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {scoreResult.concerns_for_this_role.map((concern: string, idx: number) => (
                      <li key={idx} className="flex gap-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <span>{concern}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {scoreResult.experience_analysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Experience Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{scoreResult.experience_analysis}</p>
                </CardContent>
              </Card>
            )}

            {jobAnalysis.summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Job Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{jobAnalysis.summary}</p>
                </CardContent>
              </Card>
            )}

            {jobAnalysis.key_responsibilities && jobAnalysis.key_responsibilities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Responsibilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {jobAnalysis.key_responsibilities.slice(0, 5).map((resp: string, idx: number) => (
                      <li key={idx} className="flex gap-2 text-sm">
                        <span className="text-primary">•</span>
                        <span>{resp}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-4">
            <SkillsDisplay
              matchedSkills={scoreResult.matched_skills || []}
              missingRequired={scoreResult.missing_required_skills || []}
              missingPreferred={scoreResult.missing_preferred_skills || []}
            />

            {jobAnalysis.required_experience_years && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Experience Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Minimum experience required: <strong>{jobAnalysis.required_experience_years} years</strong></p>
                </CardContent>
              </Card>
            )}

            {jobAnalysis.tech_stack && jobAnalysis.tech_stack.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tech Stack</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {jobAnalysis.tech_stack.map((tech: string, idx: number) => (
                      <Badge key={idx} variant="secondary">{tech}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {jobAnalysis.soft_skills && jobAnalysis.soft_skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Soft Skills Required</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {jobAnalysis.soft_skills.map((skill: string, idx: number) => (
                      <Badge key={idx} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'improvements' && (
          <div>
            {improvements && Object.keys(improvements).length > 0 ? (
              <ImprovementRecommendations
                data={improvements}
                currentScore={scoreResult.overall_score || 0}
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">No improvement recommendations available at this time.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'company' && (
          <div>
            {companyResearch && Object.keys(companyResearch).length > 0 ? (
              <CompanyProfile data={companyResearch} />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">Company information not available.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'similar' && ragMatches.length > 0 && (
          <div className="space-y-4">
            {ragMatches.map((job: any, idx: number) => (
              <Card key={idx}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{job.job_title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{job.company}</p>
                    </div>
                    <div className={`text-3xl font-bold ${job.match_score >= 80 ? 'text-green-600' : job.match_score >= 60 ? 'text-blue-600' : 'text-amber-600'}`}>
                      {job.match_score}%
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={job.match_score} className="h-2" />

                  {job.gap_summary && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Gap Summary</p>
                      <p className="text-sm text-muted-foreground">{job.gap_summary}</p>
                    </div>
                  )}

                  {job.missing_skills && job.missing_skills.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Missing Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {job.missing_skills.map((skill: string, i: number) => (
                          <Badge key={i} variant="destructive" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {job.improvements && job.improvements.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Improvements Needed</p>
                      <ul className="space-y-1">
                        {job.improvements.slice(0, 3).map((imp: string, i: number) => (
                          <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                            <span className="text-primary">•</span>
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {job.description_snippet && (
                    <div className="border-t pt-3">
                      <p className="text-xs text-muted-foreground line-clamp-2">{job.description_snippet}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
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
          Analyze Another Job
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
