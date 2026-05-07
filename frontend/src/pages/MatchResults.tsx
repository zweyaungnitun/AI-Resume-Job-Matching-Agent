import { useMemo, useState } from 'react'
import { getRAGMatches } from '../services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { AlertCircle, Briefcase, TrendingUp, CheckCircle, Sparkles, Globe, Search, ExternalLink } from 'lucide-react'

interface JobMatch {
  job_title: string
  company: string
  match_score: number
  source?: string
  description?: string
  gap_summary?: string
  improvements?: string[]
  missing_skills?: string[]
  url?: string
}

function MatchResults() {
  const [matches, setMatches] = useState<JobMatch[]>([])
  const [resumeText, setResumeText] = useState('')
  const [jobQuery, setJobQuery] = useState('')
  const [numMatches, setNumMatches] = useState(5)
  const [includeWebSearch, setIncludeWebSearch] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meta, setMeta] = useState<{ smart: number; web: number; total: number }>({ smart: 0, web: 0, total: 0 })

  const hasResults = matches.length > 0
  const averageScore = useMemo(() => {
    if (!matches.length) return 0
    return Math.round(matches.reduce((acc, curr) => acc + curr.match_score, 0) / matches.length)
  }, [matches])

  const runMatching = async () => {
    if (resumeText.trim().length < 50) {
      setError('Please add at least 50 characters of resume text to discover smart matches.')
      return
    }

    setIsLoading(true)
    setError(null)
    setMatches([])

    try {
      const result = await getRAGMatches(resumeText, numMatches, jobQuery, includeWebSearch)
      const jobs = (result.matched_jobs || []) as JobMatch[]
      setMatches(jobs)
      setMeta({
        smart: result.rag_matches_count || 0,
        web: result.web_matches_count || 0,
        total: result.total_matches || jobs.length,
      })
    } catch (err: any) {
      setError(err?.message || 'Failed to run matching.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Finding best-fit opportunities for your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Smart Job Matches</h1>
        <p className="mt-2 text-muted-foreground">
          Discover relevant roles from your resume and optionally include live web opportunities.
        </p>
      </div>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/15">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Start Smart Discovery
          </CardTitle>
          <CardDescription>Paste your resume, choose preferences, and generate ranked opportunities in seconds.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Resume Text</label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              className="min-h-48 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-ring focus-visible:ring-2"
            />
            <p className="text-xs text-muted-foreground">{resumeText.length} characters</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role Focus (optional)</label>
              <Input
                value={jobQuery}
                onChange={(e) => setJobQuery(e.target.value)}
                placeholder="e.g. Senior Python Backend Engineer"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Matches</label>
              <Input
                type="number"
                min={1}
                max={20}
                value={numMatches}
                onChange={(e) => setNumMatches(Math.min(20, Math.max(1, Number(e.target.value) || 5)))}
              />
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={includeWebSearch}
              onChange={(e) => setIncludeWebSearch(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            <span className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Add live web jobs to broaden results
            </span>
          </label>

          <Button onClick={runMatching} className="w-full" size="lg">
            <Search className="mr-2 h-4 w-4" />
            Find Smart Matches
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="flex gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {hasResults && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Total ranked results</p>
              <p className="text-2xl font-bold">{meta.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Average match score</p>
              <p className="text-2xl font-bold">{averageScore}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground">Source mix</p>
              <p className="text-sm font-semibold">Smart DB: {meta.smart} | Web: {meta.web}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {!hasResults ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <h3 className="font-semibold text-foreground">No matches yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add resume content to generate personalized job matches.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {matches.map((match, index) => {
            const scorePercentage = Math.round(match.match_score)
            const scoreColor = scorePercentage >= 80 ? 'text-green-600' : scorePercentage >= 60 ? 'text-blue-600' : 'text-amber-600'

            return (
              <Card key={index} className="overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-xl">{match.job_title}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        {match.company}
                      </CardDescription>
                    </div>
                    <div className="text-right space-y-1">
                      <div className={`text-3xl font-bold ${scoreColor}`}>
                        {scorePercentage}%
                      </div>
                      <Badge variant={scorePercentage >= 80 ? 'default' : scorePercentage >= 60 ? 'secondary' : 'outline'} className="capitalize">
                        {match.source === 'rag' ? 'smart-db' : (match.source || 'match')}
                      </Badge>
                      <Badge variant={scorePercentage >= 80 ? 'default' : scorePercentage >= 60 ? 'secondary' : 'outline'}>
                        {scorePercentage >= 80 ? 'Excellent Match' : scorePercentage >= 60 ? 'Good Match' : 'Consider'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Match Score Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Match Score</span>
                    </div>
                    <Progress value={scorePercentage} className="h-2" />
                  </div>

                  {match.gap_summary && (
                    <div className="space-y-2 pt-2">
                      <h4 className="font-semibold text-sm">Gap Summary</h4>
                      <p className="text-sm text-muted-foreground">{match.gap_summary}</p>
                    </div>
                  )}

                  {/* Recommendations */}
                  {match.improvements && match.improvements.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="font-semibold text-sm">Recommendations</h4>
                      <ul className="space-y-2">
                        {match.improvements.slice(0, 3).map((imp, i) => (
                          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <span>{imp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action */}
                  {match.url && (
                    <div className="pt-2">
                      <a href={match.url} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="inline-flex items-center gap-2">
                          Open Job Link
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MatchResults
