import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';

interface CompanyResearchData {
  company_name: string;
  founded: string;
  size: string;
  industry: string;
  headquarters: string;
  overview: string;
  mission_values: string[];
  tech_stack: string[];
  culture_highlights: string[];
  recent_news: Array<{ headline: string; summary: string }>;
  pros_for_candidate: string[];
  cons_for_candidate: string[];
  interview_tips: string[];
  glassdoor_rating: string;
  data_confidence: string;
}

interface CompanyProfileProps {
  data: CompanyResearchData;
}

const getConfidenceColor = (confidence: string): string => {
  switch (confidence.toLowerCase()) {
    case 'high':
      return 'text-green-600';
    case 'medium':
      return 'text-amber-600';
    case 'low':
      return 'text-red-600';
    default:
      return 'text-muted-foreground';
  }
};

export const CompanyProfile: React.FC<CompanyProfileProps> = ({ data }) => {
  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{data.company_name}</CardTitle>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>{data.industry}</span>
                <span>•</span>
                <span>{data.size}</span>
                <span>•</span>
                <span>{data.headquarters}</span>
                <span>•</span>
                <span>Founded {data.founded}</span>
              </div>
            </div>
            {data.glassdoor_rating !== 'Not found' && (
              <div className="text-right">
                <p className="text-3xl font-bold">⭐ {data.glassdoor_rating}</p>
                <p className="text-xs text-muted-foreground">Glassdoor</p>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{data.overview}</p>
        </CardContent>
      </Card>

      {/* Mission & Values */}
      {data.mission_values.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mission & Values</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.mission_values.map((value, idx) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <span className="text-primary">✓</span>
                  <span>{value}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Tech Stack */}
      {data.tech_stack.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tech Stack</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.tech_stack.map((tech, idx) => (
                <Badge key={idx} variant="secondary">{tech}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Culture Highlights */}
      {data.culture_highlights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Culture Highlights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.culture_highlights.map((highlight, idx) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <span className="text-primary">•</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Pros & Cons */}
      <div className="grid gap-4 md:grid-cols-2">
        {data.pros_for_candidate.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Pros for You
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.pros_for_candidate.map((pro, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {data.cons_for_candidate.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Potential Concerns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.cons_for_candidate.map((con, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <span className="text-red-600 font-bold">⚠</span>
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Interview Tips */}
      {data.interview_tips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-amber-600" />
              Interview Tips for This Company
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.interview_tips.map((tip, idx) => (
                <li key={idx} className="flex gap-2 text-sm">
                  <span className="text-amber-600">💡</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recent News */}
      {data.recent_news.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent News</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recent_news.map((news, idx) => (
              <div key={idx} className="border-l-2 border-primary pl-4">
                <h5 className="font-semibold text-sm text-foreground">{news.headline}</h5>
                <p className="text-sm text-muted-foreground mt-1">{news.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Data Confidence */}
      <div className="text-sm text-muted-foreground text-right">
        Data Confidence: <span className={`font-semibold ${getConfidenceColor(data.data_confidence)}`}>{data.data_confidence}</span>
      </div>
    </div>
  );
};
