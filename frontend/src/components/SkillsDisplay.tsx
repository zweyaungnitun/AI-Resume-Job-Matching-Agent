import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface SkillsDisplayProps {
  matchedSkills: string[];
  missingRequired: string[];
  missingPreferred: string[];
}

export const SkillsDisplay: React.FC<SkillsDisplayProps> = ({
  matchedSkills,
  missingRequired,
  missingPreferred,
}) => {
  return (
    <div className="space-y-4">
      {matchedSkills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Matched Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.map((skill, idx) => (
                <Badge key={idx} variant="default" className="bg-green-100 text-green-800 border-green-300">
                  ✓ {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {missingRequired.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Missing Required Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {missingRequired.map((skill, idx) => (
                <Badge key={idx} variant="destructive" className="bg-red-100 text-red-800 border-red-300">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {missingPreferred.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Missing Preferred Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {missingPreferred.map((skill, idx) => (
                <Badge key={idx} variant="outline" className="border-amber-300 text-amber-700">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
