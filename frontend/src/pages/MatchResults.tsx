import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Button } from '../components/ui/button'
import { AlertCircle, Briefcase, TrendingUp, CheckCircle } from 'lucide-react'

interface JobMatch {
  job_title: string
  company: string
  match_score: number
  gap_analysis: string
  improvements: string[]
}

function MatchResults() {
  const [matches, setMatches] = useState<JobMatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // TODO: Fetch matches from API
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading your job matches...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Job Matches</h1>
        <p className="mt-2 text-muted-foreground">
          Discover job opportunities matched to your profile
        </p>
      </div>

      {error && (
        <div className="flex gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {matches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <h3 className="font-semibold text-foreground">No matches yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload your resume to find matching job opportunities
              </p>
            </div>
            <Button variant="outline" className="mt-4">
              Upload Resume
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {matches.map((match, index) => {
            const scorePercentage = Math.round(match.match_score * 100)
            const scoreColor = scorePercentage >= 80 ? 'text-green-600' : scorePercentage >= 60 ? 'text-blue-600' : 'text-amber-600'

            return (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
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

                  {/* Gap Analysis */}
                  <div className="space-y-2 pt-2">
                    <h4 className="font-semibold text-sm">Gap Analysis</h4>
                    <p className="text-sm text-muted-foreground">{match.gap_analysis}</p>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-2 pt-2">
                    <h4 className="font-semibold text-sm">Recommendations</h4>
                    <ul className="space-y-2">
                      {match.improvements.map((imp, i) => (
                        <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action */}
                  <div className="pt-2">
                    <Button size="sm" variant="outline">
                      View Full Details
                    </Button>
                  </div>
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
