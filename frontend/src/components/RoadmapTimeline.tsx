import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp, BookOpen, Code2, Target, CheckCircle } from 'lucide-react';

interface RoadmapMonth {
  month: number;
  theme: string;
  milestones: string[];
  skills_targeted: string[];
  courses: Array<{
    title: string;
    provider: string;
    url: string;
    duration_hours: number;
    difficulty: string;
    priority: string;
  }>;
  practice_projects: string[];
  checkpoint: string;
}

interface RoadmapTimelineProps {
  roadmap: RoadmapMonth[];
  totalMonths: number;
}

export const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({ roadmap, totalMonths }) => {
  const [expandedMonths, setExpandedMonths] = useState<Set<number>>(new Set([1]));

  const toggleMonth = (month: number) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(month)) {
      newExpanded.delete(month);
    } else {
      newExpanded.add(month);
    }
    setExpandedMonths(newExpanded);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'advanced':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      {roadmap.map((month: RoadmapMonth) => {
        const isExpanded = expandedMonths.has(month.month);
        const isCompleted = month.month < 1;
        const isCurrent = month.month === 1;

        return (
          <Card
            key={month.month}
            className={`border-2 transition-all ${
              isCurrent
                ? 'border-blue-500 bg-blue-50/50'
                : isCompleted
                ? 'border-green-300 bg-green-50/50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <button
              onClick={() => toggleMonth(month.month)}
              className="w-full text-left"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                        Month {month.month}
                      </Badge>
                      {isCurrent && (
                        <Badge className="bg-blue-600 text-white border-0">Current</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{month.theme}</CardTitle>
                  </div>
                  <div className="text-muted-foreground">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </button>

            {isExpanded && (
              <CardContent className="space-y-6 border-t pt-6">
                {/* Milestones */}
                {month.milestones && month.milestones.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      Key Milestones
                    </h4>
                    <ul className="space-y-2">
                      {month.milestones.map((milestone: string, idx: number) => (
                        <li key={idx} className="flex gap-2 text-sm">
                          <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                          <span className="text-foreground">{milestone}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Skills Targeted */}
                {month.skills_targeted && month.skills_targeted.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3">Skills to Master</h4>
                    <div className="flex flex-wrap gap-2">
                      {month.skills_targeted.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="bg-blue-50">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Courses */}
                {month.courses && month.courses.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-green-600" />
                      Recommended Courses
                    </h4>
                    <div className="space-y-3">
                      {month.courses.map((course: any, idx: number) => (
                        <div key={idx} className="p-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-foreground">{course.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{course.provider}</p>
                            </div>
                            {course.url && (
                              <a
                                href={course.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline ml-2 whitespace-nowrap"
                              >
                                View
                              </a>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline" className={`text-xs border ${getDifficultyColor(course.difficulty)}`}>
                              {course.difficulty}
                            </Badge>
                            <Badge variant="outline" className={`text-xs border ${getPriorityColor(course.priority)}`}>
                              {course.priority} Priority
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-gray-100">
                              {course.duration_hours}h
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Practice Projects */}
                {month.practice_projects && month.practice_projects.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Code2 className="h-4 w-4 text-purple-600" />
                      Hands-On Projects
                    </h4>
                    <ul className="space-y-2">
                      {month.practice_projects.map((project: string, idx: number) => (
                        <li key={idx} className="flex gap-2 text-sm p-2 bg-purple-50 rounded-lg border border-purple-200">
                          <Code2 className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                          <span className="text-foreground">{project}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Checkpoint */}
                {month.checkpoint && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm text-green-900">End of Month Checkpoint</p>
                        <p className="text-sm text-green-800 mt-1">{month.checkpoint}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
};
