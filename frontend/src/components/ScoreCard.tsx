import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { scoreToColor } from '../lib/utils';

interface ScoreBreakdown {
  label: string;
  score: number;
  color?: string;
}

interface ScoreCardProps {
  overallScore: number;
  matchLevel: string;
  breakdown: ScoreBreakdown[];
  matchLikelihood?: string;
}

const getMatchBadge = (score: number): { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' } => {
  if (score >= 80) return { label: 'Excellent Match', variant: 'default' };
  if (score >= 60) return { label: 'Good Match', variant: 'secondary' };
  if (score >= 40) return { label: 'Fair Match', variant: 'outline' };
  return { label: 'Poor Match', variant: 'destructive' };
};

export const ScoreCard: React.FC<ScoreCardProps> = ({
  overallScore,
  matchLevel,
  breakdown,
  matchLikelihood,
}) => {
  const matchBadge = getMatchBadge(overallScore);
  const colors = scoreToColor(overallScore);

  return (
    <Card className={`border-2 ${colors.border} ${colors.bg}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-lg">Overall Match Score</CardTitle>
            {matchLikelihood && (
              <p className="text-sm text-muted-foreground">
                Hiring likelihood: <strong>{matchLikelihood}</strong>
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`text-5xl font-bold ${colors.text}`}>
              {overallScore}
            </div>
            <span className="text-xs text-muted-foreground font-medium">out of 100</span>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
          <Badge variant={matchBadge.variant}>{matchBadge.label}</Badge>
        </div>
      </CardHeader>

      {breakdown.length > 0 && (
        <CardContent className="space-y-4">
          <h4 className="font-semibold text-sm text-foreground">Score Breakdown</h4>
          <div className="space-y-3">
            {breakdown.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <span className="text-sm font-semibold text-muted-foreground">{item.score}%</span>
                </div>
                <Progress
                  value={item.score}
                  className="h-2 transition-all duration-700"
                />
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
