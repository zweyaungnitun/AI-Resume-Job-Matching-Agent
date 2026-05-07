import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { SegmentedTabs } from './ui/segmented-tabs';

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
  const [activeTab, setActiveTab] = useState<string>('matched');

  const tabs = [
    ...(matchedSkills.length > 0 ? [{ id: 'matched', label: `Matched (${matchedSkills.length})`, icon: <CheckCircle className="h-4 w-4" /> }] : []),
    ...(missingRequired.length > 0 ? [{ id: 'required', label: `Missing Required (${missingRequired.length})`, icon: <AlertCircle className="h-4 w-4" /> }] : []),
    ...(missingPreferred.length > 0 ? [{ id: 'preferred', label: `Missing Preferred (${missingPreferred.length})`, icon: <Clock className="h-4 w-4" /> }] : []),
  ];

  if (tabs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">No skill data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <SegmentedTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <div className="flex flex-wrap gap-2">
          {activeTab === 'matched' && matchedSkills.map((skill, idx) => (
            <Badge key={idx} variant="default" className="bg-green-100 text-green-800 border-green-300">
              ✓ {skill}
            </Badge>
          ))}

          {activeTab === 'required' && missingRequired.map((skill, idx) => (
            <Badge key={idx} variant="destructive" className="bg-red-100 text-red-800 border-red-300">
              {skill}
            </Badge>
          ))}

          {activeTab === 'preferred' && missingPreferred.map((skill, idx) => (
            <Badge key={idx} variant="outline" className="border-amber-300 text-amber-700">
              {skill}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
