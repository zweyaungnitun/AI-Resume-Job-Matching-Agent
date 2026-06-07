import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, BookOpen, Zap, Users } from 'lucide-react';

interface ResourceSummaryProps {
  summary: {
    total_estimated_hours: number;
    free_resources: number;
    paid_courses: number;
    books: number;
    community_resources: number;
  };
}

export const ResourceSummary: React.FC<ResourceSummaryProps> = ({ summary }) => {
  const resources = [
    {
      label: 'Total Hours',
      value: summary.total_estimated_hours || 0,
      icon: Clock,
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50',
    },
    {
      label: 'Paid Courses',
      value: summary.paid_courses || 0,
      icon: BookOpen,
      color: 'from-purple-500 to-pink-500',
      bg: 'bg-purple-50',
    },
    {
      label: 'Free Resources',
      value: summary.free_resources || 0,
      icon: Zap,
      color: 'from-green-500 to-emerald-500',
      bg: 'bg-green-50',
    },
    {
      label: 'Community Resources',
      value: summary.community_resources || 0,
      icon: Users,
      color: 'from-orange-500 to-red-500',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <Card className="bg-gradient-to-br from-white via-gray-50 to-white border-gray-200">
      <CardHeader>
        <CardTitle>Learning Resources Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {resources.map((resource, idx) => {
            const Icon = resource.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-lg border border-gray-200 ${resource.bg} hover:shadow-md transition-shadow`}
              >
                <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${resource.color} text-white mb-3`}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold text-foreground">{resource.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{resource.label}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-foreground">
            <span className="font-semibold">Estimated Commitment:</span> {summary.total_estimated_hours} hours over {Math.ceil(summary.total_estimated_hours / (40 / 4))} weeks at 10 hours/week
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Adjust your pace based on your schedule. Some resources can be done in parallel.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
