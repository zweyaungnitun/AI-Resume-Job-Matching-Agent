import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import {
  FileText, Target, BarChart3, Building2, Zap,
  ArrowRight, CheckCircle, Brain, Lightbulb, TrendingUp, Rocket, Layers
} from 'lucide-react'

function Home() {

  const features = [
    {
      icon: FileText,
      title: 'CV Quality Review',
      description: 'ATS compatibility score, structure analysis, content quality, immediate improvements',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Target,
      title: 'Job Analysis',
      description: 'Extract requirements, skills, experience needs, and responsibilities from any job posting',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: BarChart3,
      title: 'Match Scoring',
      description: 'Detailed breakdown by skills, experience, education, culture fit, and keywords',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Building2,
      title: 'Company Research',
      description: 'Automatic research on company culture, tech stack, pros/cons, interview tips',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Zap,
      title: 'Smart Recommendations',
      description: 'Priority actions, skills to acquire, bullet rewrites, formatting improvements',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Layers,
      title: 'Similar Jobs',
      description: 'Discover highly relevant roles from our smart semantic search engine',
      color: 'from-indigo-500 to-purple-500'
    }
  ]

  const benefits = [
    {
      icon: Brain,
      title: 'Multi-Agent AI System',
      description: 'Specialized agents handle CV review, job analysis, scoring, company research, and recommendations',
      number: '01'
    },
    {
      icon: Lightbulb,
      title: 'Smart Semantic Discovery',
      description: 'Go beyond keywords and uncover better-fit opportunities with context-aware matching',
      number: '02'
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Insights',
      description: 'Get instant feedback and live match scoring as you explore opportunities',
      number: '03'
    },
    {
      icon: Rocket,
      title: 'Career Acceleration',
      description: 'Fast-track your job search with AI-powered guidance and strategic recommendations',
      number: '04'
    }
  ]

  const steps = [
    {
      number: '1',
      title: 'Upload Your CV',
      description: 'Upload your resume or paste it directly',
      icon: FileText
    },
    {
      number: '2',
      title: 'CV Review',
      description: 'Get ATS score, structure analysis, and quick wins',
      icon: CheckCircle
    },
    {
      number: '3',
      title: 'Add Job Details',
      description: 'Enter job URL, paste description, or search',
      icon: Target
    },
    {
      number: '4',
      title: 'Full Analysis',
      description: 'Get comprehensive match score and recommendations',
      icon: TrendingUp
    }
  ]

  return (
    <div className="space-y-0">
      {/* Hero Section - Full Viewport */}
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center py-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-blue-300/20 to-purple-300/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-10 w-96 h-96 bg-gradient-to-tr from-pink-300/20 to-blue-300/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto px-6 sm:px-8 text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
            ✨ AI-Powered Career Matching
          </Badge>
          <h1 className="mb-8 text-6xl sm:text-7xl font-bold tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Find Your Perfect
            </span>
            <br />
            <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Job Match
            </span>
          </h1>
          <p className="mb-12 text-2xl sm:text-3xl text-muted-foreground font-medium max-w-3xl mx-auto leading-relaxed">
            Powered by advanced multi-agent AI that understands your career better than you do
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link to="/cv-input" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-14 text-lg gap-2 shadow-lg hover:shadow-xl hover:scale-105 transition-all bg-gradient-to-r from-blue-600 to-purple-600">
                Start Your Analysis <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" className="w-full sm:w-auto h-14 text-lg" variant="outline" >
              Watch Demo
            </Button>
          </div>

          {/* Quick Stats - Inside Hero */}
          <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { label: 'Job Matches', value: '10k+' },
              { label: 'Success Rate', value: '94%' },
              { label: 'Active Users', value: '50k+' },
              { label: 'Companies', value: '5k+' }
            ].map((stat) => (
              <div key={stat.label} className="text-center p-6 rounded-2xl bg-white/50 backdrop-blur-sm border border-white/70 hover:shadow-lg transition-shadow">
                <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-sm text-muted-foreground font-medium mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Full Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center py-20 px-6 sm:px-8 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30">
        <div className="text-center mb-20">
          <h2 className="text-5xl sm:text-6xl font-bold mb-4">How It Works</h2>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto">Get from CV to job match in 4 simple steps</p>
        </div>

        <div className="max-w-7xl mx-auto w-full">
          <div className="grid sm:grid-cols-4 gap-8 sm:gap-6">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              return (
                <div key={step.number} className="relative">
                  <div className="flex flex-col items-center h-full">
                    <div className="relative z-10 mb-8">
                      <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-2xl hover:shadow-3xl transition-all hover:scale-110 transform duration-300">
                        <StepIcon className="h-16 w-16" />
                      </div>
                      <div className="absolute -bottom-3 -right-3 h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                        {step.number}
                      </div>
                    </div>
                    <h3 className="font-bold text-xl mb-3 mt-4">{step.title}</h3>
                    <p className="text-base text-muted-foreground text-center flex-1">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden sm:block absolute top-16 left-[60%] w-[80%] h-2 bg-gradient-to-r from-blue-400 to-transparent"></div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features - Full Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center py-20 px-6 sm:px-8 bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30">
        <div className="text-center mb-20">
          <h2 className="text-5xl sm:text-6xl font-bold mb-4">Powerful Features</h2>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto">Everything to supercharge your job search</p>
        </div>

        <div className="max-w-7xl mx-auto w-full grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group relative rounded-3xl p-8 bg-white border border-gray-200/50 hover:border-gray-300 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col"
              >
                <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-15 transition-opacity duration-500 blur-2xl`}></div>

                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} text-white mb-6 group-hover:scale-125 transition-transform duration-300 w-fit`}>
                  <Icon className="h-8 w-8" />
                </div>

                <h3 className="text-2xl font-bold mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all">
                  {feature.title}
                </h3>
                <p className="text-base text-muted-foreground group-hover:text-foreground transition-colors flex-1">
                  {feature.description}
                </p>

                <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Why Choose Us - Full Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center py-20 px-6 sm:px-8 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50">
        <div className="text-center mb-20">
          <h2 className="text-5xl sm:text-6xl font-bold mb-4">Why JobMatch</h2>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto">What makes us different</p>
        </div>

        <div className="max-w-6xl mx-auto w-full grid sm:grid-cols-2 gap-10">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex gap-8 p-8 rounded-3xl bg-white/50 hover:bg-white backdrop-blur-sm border border-white/70 hover:border-blue-200/50 transition-all hover:shadow-xl">
              <div className="flex-shrink-0">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-300/50 hover:border-blue-400">
                  <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {benefit.number}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA - Full Screen */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 sm:px-8">
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-95"></div>
        <div className="absolute inset-0 -z-10 opacity-10"></div>

        <div className="relative max-w-4xl mx-auto text-center text-white py-20">
          <h2 className="text-6xl sm:text-7xl font-bold mb-8">Ready to Land Your Dream Job?</h2>
          <p className="text-2xl sm:text-3xl text-white/95 mb-16 max-w-3xl mx-auto leading-relaxed">
            Join thousands of job seekers who've found their perfect match with our AI-powered platform
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link to="/cv-input" className="w-full sm:w-auto">
              <Button size="lg" className="w-full h-16 text-lg gap-2 bg-white text-purple-600 hover:bg-gray-100 shadow-2xl hover:shadow-3xl transition-all">
                Begin Analysis Now <ArrowRight className="h-6 w-6" />
              </Button>
            </Link>
            <Button size="lg" className="w-full sm:w-auto h-16 text-lg" variant="outline">
              Explore Features
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
