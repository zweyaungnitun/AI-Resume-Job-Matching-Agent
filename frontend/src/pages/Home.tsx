import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import {
  FileText, Target, BarChart3, Building2, Zap,
  ArrowRight, CheckCircle, Brain, Lightbulb, Layers
} from 'lucide-react'

function Home() {
  const features = [
    {
      icon: FileText,
      title: 'CV Quality Review',
      description: 'ATS compatibility score, structure analysis, content quality, immediate improvements'
    },
    {
      icon: Target,
      title: 'Job Analysis',
      description: 'Extract requirements, skills, experience needs, and responsibilities from any job posting'
    },
    {
      icon: BarChart3,
      title: 'Match Scoring',
      description: 'Detailed breakdown by skills, experience, education, culture fit, and keywords'
    },
    {
      icon: Building2,
      title: 'Company Research',
      description: 'Automatic research on company culture, tech stack, pros/cons, interview tips'
    },
    {
      icon: Zap,
      title: 'Smart Recommendations',
      description: 'Priority actions, skills to acquire, bullet rewrites, formatting improvements'
    },
    {
      icon: Layers,
      title: 'Similar Jobs',
      description: 'Find semantically similar jobs from our vector database using RAG'
    }
  ]

  const benefits = [
    {
      icon: Brain,
      title: 'Multi-Agent AI System',
      description: 'Specialized agents handle CV review, job analysis, scoring, company research, and recommendations'
    },
    {
      icon: Lightbulb,
      title: 'RAG + Vector Database',
      description: 'Advanced semantic search to find similar jobs and match opportunities beyond keywords'
    },
    {
      icon: CheckCircle,
      title: 'Actionable Insights',
      description: 'Get specific, prioritized recommendations to improve your match score'
    },
    {
      icon: Layers,
      title: 'Multiple Input Methods',
      description: 'Job URL, copy-paste description, or web search - we handle all formats'
    }
  ]

  const steps = [
    {
      number: '1',
      title: 'Upload Your CV',
      description: 'Upload your resume or paste it directly'
    },
    {
      number: '2',
      title: 'CV Review',
      description: 'Get ATS score, structure analysis, and quick wins'
    },
    {
      number: '3',
      title: 'Add Job Details',
      description: 'Enter job URL, paste description, or search'
    },
    {
      number: '4',
      title: 'Full Analysis',
      description: 'Get comprehensive match score and recommendations'
    }
  ]

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-primary/5 via-background to-accent/5 px-6 py-20 sm:px-12 sm:py-24">
        <div className="max-w-3xl">
          <Badge variant="secondary" className="mb-4">AI-Powered Career Matching</Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Find Your Perfect Job Match
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Your intelligent career companion powered by multi-agent AI and advanced retrieval-augmented generation
          </p>
          <div className="flex gap-4">
            <Link to="/cv-input">
              <Button size="lg" className="gap-2">
                Start Analysis <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Workflow Steps */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
          <p className="mt-2 text-muted-foreground">Simple 4-step process to find your ideal job</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              <Card>
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {step.number}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
              {index < steps.length - 1 && (
                <div className="hidden absolute right-0 top-1/2 translate-x-12 -translate-y-1/2 text-muted-foreground lg:block">
                  <ArrowRight className="h-5 w-5" />
                </div>
              )}
            </div>
          ))}
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
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="flex flex-col">
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
            )
          })}
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">Why Choose JobMatch</h2>
          <p className="mt-2 text-muted-foreground">Cutting-edge technology for your career success</p>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          {benefits.map((benefit) => {
            const Icon = benefit.icon
            return (
              <Card key={benefit.title}>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{benefit.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="overflow-hidden rounded-lg border border-border bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-16 sm:px-12">
        <div className="max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground">Ready to Find Your Perfect Job?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start your AI-powered analysis today and discover your career opportunities
          </p>
          <Link to="/cv-input" className="mt-8 inline-block">
            <Button size="lg" className="gap-2">
              Begin Analysis Now <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Home
