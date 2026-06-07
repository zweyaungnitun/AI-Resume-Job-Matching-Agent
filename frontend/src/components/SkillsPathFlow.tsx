import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ArrowRight, Zap } from 'lucide-react';

interface SkillsPathFlowProps {
  criticalPath: string[];
}

export const SkillsPathFlow: React.FC<SkillsPathFlowProps> = ({ criticalPath }) => {
  if (!criticalPath || criticalPath.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 border-indigo-200/80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-indigo-600" />
          Critical Path to Success
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Master these skills in order for maximum impact
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-3">
          {criticalPath.map((skill: string, idx: number) => (
            <React.Fragment key={idx}>
              <Badge className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white border-0 px-3 py-2 text-sm font-medium">
                {idx + 1}. {skill}
              </Badge>
              {idx < criticalPath.length - 1 && (
                <ArrowRight className="h-4 w-4 text-indigo-400 flex-shrink-0 hidden sm:block" />
              )}
            </React.Fragment>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4 p-3 bg-white/50 rounded-lg border border-indigo-100">
          💡 Focus on mastering these core skills first. They form the foundation for all other learning in this roadmap.
        </p>
      </CardContent>
    </Card>
  );
};
