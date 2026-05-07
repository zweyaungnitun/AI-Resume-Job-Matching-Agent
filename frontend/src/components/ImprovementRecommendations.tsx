import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Zap, Target, BookOpen, Edit3, Plus, Tag, PenTool, TrendingUp, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface PriorityAction {
  action: string;
  section: string;
  example: string;
  impact: 'High' | 'Medium' | 'Low';
}

interface SkillToAdd {
  skill: string;
  how_to_acquire: string;
  timeframe: string;
  importance: 'Required' | 'Preferred';
}

interface BulletRewrite {
  original: string;
  improved: string;
  why: string;
}

interface NewSection {
  section_name: string;
  reason: string;
  example_content: string;
}

interface ImprovementData {
  priority_actions: PriorityAction[];
  skills_to_add: SkillToAdd[];
  keywords_to_add: string[];
  bullet_rewrites: BulletRewrite[];
  new_sections_to_add: NewSection[];
  summary_rewrite: string;
  formatting_improvements: string[];
  quantification_opportunities: string[];
  overall_strategy: string;
  estimated_score_after_improvements: number;
}

interface ImprovementRecommendationsProps {
  data: ImprovementData;
  currentScore?: number;
}

interface SectionHeaderProps {
  icon: React.ReactNode;
  title: string;
  section: string;
  isExpanded: boolean;
  onToggle: (section: string) => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  icon,
  title,
  section,
  isExpanded,
  onToggle,
}) => (
  <button
    onClick={() => onToggle(section)}
    className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors rounded-lg border border-border"
  >
    <div className="flex items-center gap-2">
      {icon}
      <span className="font-semibold">{title}</span>
    </div>
    <ChevronDown
      className={cn(
        'h-5 w-5 text-muted-foreground transition-transform duration-200',
        isExpanded && 'rotate-180'
      )}
    />
  </button>
);

export const ImprovementRecommendations: React.FC<ImprovementRecommendationsProps> = ({
  data,
  currentScore = 0,
}) => {
  const [expandedSection, setExpandedSection] = useState<string>('priority');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  const scoreImprovement = data.estimated_score_after_improvements - currentScore;
  const scoreColor = scoreImprovement > 0 ? 'text-green-600' : 'text-muted-foreground';

  return (
    <div className="space-y-4">
      {/* Score Projection */}
      <Card className="border-2 bg-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Potential Score Improvement</CardTitle>
            <div className={`text-3xl font-bold ${scoreColor}`}>
              {currentScore} → {data.estimated_score_after_improvements}
              {scoreImprovement > 0 && <span className="ml-2 text-lg text-green-600">+{scoreImprovement}</span>}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Overall Strategy */}
      {data.overall_strategy && (
        <Card className="bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-sm leading-relaxed text-foreground">{data.overall_strategy}</p>
          </CardContent>
        </Card>
      )}

      {/* Priority Actions */}
      {data.priority_actions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <SectionHeader
              icon={<Target className="h-5 w-5 text-primary" />}
              title={`Priority Actions (${data.priority_actions.length})`}
              section="priority"
              isExpanded={expandedSection === 'priority'}
              onToggle={toggleSection}
            />
          </CardHeader>
          {expandedSection === 'priority' && (
            <CardContent className="space-y-3 pt-0">
              {data.priority_actions.map((action, idx) => (
                <div key={idx} className="border-l-2 border-primary pl-4 py-2">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h5 className="font-semibold text-sm">{action.action}</h5>
                    <Badge variant={action.impact === 'High' ? 'default' : action.impact === 'Medium' ? 'outline' : 'secondary'} className={action.impact === 'High' ? 'bg-green-600 hover:bg-green-700' : ''}>
                      {action.impact}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground"><strong>Section:</strong> {action.section}</p>
                  <p className="text-xs text-muted-foreground mt-1"><strong>Example:</strong> {action.example}</p>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Skills to Add */}
      {data.skills_to_add.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <SectionHeader icon={<BookOpen className="h-5 w-5 text-primary" />} title={`Skills to Acquire (${data.skills_to_add.length})`} section="skills" isExpanded={expandedSection === 'skills'} onToggle={toggleSection} />
          </CardHeader>
          {expandedSection === 'skills' && (
            <CardContent className="space-y-3 pt-0">
              {data.skills_to_add.map((skill, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{skill.skill}</span>
                    <Badge variant={skill.importance === 'Required' ? 'destructive' : 'secondary'}>
                      {skill.importance}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground"><strong>How:</strong> {skill.how_to_acquire}</p>
                  <p className="text-xs text-muted-foreground"><strong>Timeline:</strong> {skill.timeframe}</p>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Bullet Rewrites */}
      {data.bullet_rewrites.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <SectionHeader icon={<Edit3 className="h-5 w-5 text-primary" />} title={`Rewrite Suggestions (${data.bullet_rewrites.length})`} section="bullets" isExpanded={expandedSection === 'bullets'} onToggle={toggleSection} />
          </CardHeader>
          {expandedSection === 'bullets' && (
            <CardContent className="space-y-3 pt-0">
              {data.bullet_rewrites.map((rewrite, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Before:</p>
                    <p className="text-sm line-through opacity-60">{rewrite.original}</p>
                  </div>
                  <div className="text-center text-xs text-primary">↓</div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">After:</p>
                    <p className="text-sm text-foreground font-medium">{rewrite.improved}</p>
                  </div>
                  <p className="text-xs text-muted-foreground"><strong>Why:</strong> {rewrite.why}</p>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Keywords */}
      {data.keywords_to_add.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <SectionHeader icon={<Tag className="h-5 w-5 text-primary" />} title={`Keywords to Add (${data.keywords_to_add.length})`} section="keywords" isExpanded={expandedSection === 'keywords'} onToggle={toggleSection} />
          </CardHeader>
          {expandedSection === 'keywords' && (
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {data.keywords_to_add.map((keyword, idx) => (
                  <Badge key={idx} variant="outline">{keyword}</Badge>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* New Sections */}
      {data.new_sections_to_add.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <SectionHeader icon={<Plus className="h-5 w-5 text-primary" />} title={`New Sections (${data.new_sections_to_add.length})`} section="sections" isExpanded={expandedSection === 'sections'} onToggle={toggleSection} />
          </CardHeader>
          {expandedSection === 'sections' && (
            <CardContent className="space-y-3 pt-0">
              {data.new_sections_to_add.map((section, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2">
                  <h5 className="font-semibold text-sm">{section.section_name}</h5>
                  <p className="text-xs text-muted-foreground"><strong>Why:</strong> {section.reason}</p>
                  <div className="bg-secondary/50 rounded p-2 text-xs font-mono overflow-x-auto">
                    {section.example_content}
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Formatting */}
      {data.formatting_improvements.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <SectionHeader icon={<PenTool className="h-5 w-5 text-primary" />} title={`Formatting Tips (${data.formatting_improvements.length})`} section="formatting" isExpanded={expandedSection === 'formatting'} onToggle={toggleSection} />
          </CardHeader>
          {expandedSection === 'formatting' && (
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {data.formatting_improvements.map((item, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>
      )}

      {/* Quantification */}
      {data.quantification_opportunities.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <SectionHeader icon={<TrendingUp className="h-5 w-5 text-primary" />} title={`Quantifiable Metrics (${data.quantification_opportunities.length})`} section="quantification" isExpanded={expandedSection === 'quantification'} onToggle={toggleSection} />
          </CardHeader>
          {expandedSection === 'quantification' && (
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {data.quantification_opportunities.map((item, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>
      )}

      {/* Summary Rewrite */}
      {data.summary_rewrite && (
        <Card>
          <CardHeader className="pb-2">
            <SectionHeader icon={<Zap className="h-5 w-5 text-primary" />} title="Suggested Professional Summary" section="summary" isExpanded={expandedSection === 'summary'} onToggle={toggleSection} />
          </CardHeader>
          {expandedSection === 'summary' && (
            <CardContent className="pt-0">
              <p className="text-sm text-foreground leading-relaxed">{data.summary_rewrite}</p>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};
