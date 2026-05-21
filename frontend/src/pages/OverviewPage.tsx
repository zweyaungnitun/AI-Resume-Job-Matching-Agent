import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowRight, FileText, Target, BarChart3, Building2, Zap, Layers } from 'lucide-react';

function OverviewPage() {
  const features = [
    { icon: FileText, title: 'CV Quality Review', description: 'ATS compatibility score, structure analysis, content quality, immediate improvements' },
    { icon: Target, title: 'Job Analysis', description: 'Extract requirements, skills, experience needs, and responsibilities from any job posting' },
    { icon: BarChart3, title: 'Match Scoring', description: 'Detailed breakdown by skills, experience, education, culture fit, and keywords' },
    { icon: Building2, title: 'Company Research', description: 'Automatic research on company culture, tech stack, pros/cons, interview tips' },
    { icon: Zap, title: 'Smart Recommendations', description: 'Priority actions, skills to acquire, bullet rewrites, formatting improvements' },
    { icon: Layers, title: 'Similar Jobs', description: 'Discover highly relevant roles from our smart semantic search engine' },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-primary/10 via-white/75 to-accent/15 px-6 py-20 shadow-[0_20px_50px_-30px_rgb(15_23_42_/_0.25)] sm:px-12 sm:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">AI‑Powered Career Matching</Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Find Your Perfect Job Match
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Your intelligent career companion powered by multi‑agent AI and smart semantic discovery.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/login">
              <Button size="lg" className="gap-2">
                Log In <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">Powerful Features</h2>
          <p className="mt-2 text-muted-foreground">Everything you need to succeed in your job search</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="flex flex-col transition-transform hover:-translate-y-1">
                <CardHeader>
                  <div className="mb-2 inline-flex rounded-lg bg-primary/10 p-3 w-fit">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default OverviewPage;
