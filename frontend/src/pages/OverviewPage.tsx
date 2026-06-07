import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowRight, FileText, Target, BarChart3, Building2, Zap, Layers, CheckCircle, Lightbulb, TrendingUp } from 'lucide-react';

function OverviewPage() {
  const features = [
    { icon: FileText, title: 'CV Quality Review', description: 'ATS compatibility score, structure analysis, content quality, immediate improvements' },
    { icon: Target, title: 'Job Analysis', description: 'Extract requirements, skills, experience needs, and responsibilities from any job posting' },
    { icon: BarChart3, title: 'Match Scoring', description: 'Detailed breakdown by skills, experience, education, culture fit, and keywords' },
    { icon: Building2, title: 'Company Research', description: 'Automatic research on company culture, tech stack, pros/cons, interview tips' },
    { icon: Zap, title: 'Smart Recommendations', description: 'Priority actions, skills to acquire, bullet rewrites, formatting improvements' },
    { icon: Layers, title: 'Similar Jobs', description: 'Discover highly relevant roles from our smart semantic search engine' },
  ];

  const steps = [
    { number: 1, title: 'Upload Your Resume', description: 'Submit your CV or resume in any format' },
    { number: 2, title: 'Analyze Job Posting', description: 'Paste or link any job description you\'re interested in' },
    { number: 3, title: 'Get Instant Insights', description: 'Receive AI-powered analysis and matching scores' },
    { number: 4, title: 'Take Action', description: 'Follow prioritized recommendations to improve your fit' },
  ];

  const benefits = [
    { icon: TrendingUp, title: 'Higher Match Rates', description: 'Improve your chances with data-driven insights' },
    { icon: Lightbulb, title: 'Smart Guidance', description: 'Get actionable recommendations tailored to you' },
    { icon: CheckCircle, title: 'Time Savings', description: 'Analyze multiple jobs in minutes, not hours' },
  ];

  const stats = [
    { value: '10,000+', label: 'Job Matches Created' },
    { value: '95%', label: 'User Satisfaction' },
    { value: '3x', label: 'Faster Results' },
  ];

  return (
    <div className="space-y-20">
      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-white/70 bg-gradient-to-br from-primary/15 via-white/80 to-accent/20 px-6 py-20 shadow-[0_20px_50px_-30px_rgb(15_23_42_/_0.25)] sm:px-12 sm:py-28">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 inline-block">🚀 AI‑Powered Career Matching</Badge>
          <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Land Your Dream Job<span className="block text-transparent bg-gradient-to-r from-primary to-accent bg-clip-text">with Confidence</span>
          </h1>
          <p className="mb-8 text-lg text-muted-foreground max-w-2xl mx-auto">
            Your intelligent career companion powered by multi-agent AI. Get precise job matches, actionable insights, and personalized recommendations to stand out.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/login">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="gap-2">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="space-y-12">
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">Simple Process</Badge>
          <h2 className="text-4xl font-bold text-foreground">How It Works</h2>
          <p className="mt-3 text-lg text-muted-foreground">Get matched with your ideal role in four simple steps</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number} className="relative">
              <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-3">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-accent text-white font-bold text-lg mb-3">
                    {step.number}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
              {step.number < 4 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-primary/50 to-transparent"></div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section className="space-y-12">
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">Comprehensive Tools</Badge>
          <h2 className="text-4xl font-bold text-foreground">Powerful Features</h2>
          <p className="mt-3 text-lg text-muted-foreground">Everything you need to succeed in your job search</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:border-primary/20 group">
                <CardHeader className="pb-4">
                  <div className="inline-flex rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 p-3 w-fit group-hover:from-primary/25 group-hover:to-accent/20 transition-colors duration-300">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg mt-2">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="rounded-3xl bg-gradient-to-r from-primary/10 via-white/50 to-accent/10 border border-white/70 px-6 py-16 sm:px-12 sm:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Why Choose Us</Badge>
            <h2 className="text-4xl font-bold text-foreground">Real Benefits for Your Career</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div key={benefit.title} className="text-center">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="space-y-12">
        <div className="grid gap-8 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-6 rounded-2xl border border-white/70 bg-white/30 backdrop-blur-sm hover:bg-white/50 transition-colors duration-300">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <p className="text-muted-foreground font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/90 to-accent/90 border border-primary/50 px-6 py-16 sm:px-12 sm:py-20 shadow-[0_20px_60px_-20px_hsl(251_83%_62%_/_0.4)]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="mb-4 text-4xl font-bold text-white">Ready to Transform Your Job Search?</h2>
          <p className="mb-8 text-lg text-white/90">
            Join thousands of professionals who are landing better jobs with AI-powered matching and insights.
          </p>
          <Link to="/login">
            <Button size="lg" variant="secondary" className="gap-2 font-semibold">
              Start Your Journey <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default OverviewPage;
