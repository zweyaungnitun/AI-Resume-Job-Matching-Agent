import React, { useState, useEffect } from 'react'
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertOctagon,
  ThumbsUp,
  ThumbsDown,
  Sliders,
  Database,
  RefreshCw,
  Search,
  Eye,
  Info
} from 'lucide-react'

// Define typings
interface TelemetrySummary {
  total_calls: number
  avg_latency_ms: number
  total_tokens: number
  total_cost_usd: number
  blocked_calls: number
  block_rate_pct: number
  likes: number
  dislikes: number
  satisfaction_rate_pct: number
  guardrail_status_active: boolean
  strict_mode_active: boolean
  pii_masking_active: boolean
  rate_limit_per_min: number
}

interface TelemetryLog {
  id: string
  user_email: string
  endpoint: string
  prompt_chars: number
  response_chars: number
  prompt_tokens: number
  completion_tokens: number
  estimated_cost: number
  duration_ms: number
  guardrail_status: string
  guardrail_reason: string | null
  user_rating: number
  created_at: string
}

interface TimeSeries {
  date: string
  requests: number
  cost_usd: number
  blocks: number
  avg_latency_ms: number
}

export function AdminDashboard() {
  const [summary, setSummary] = useState<TelemetrySummary | null>(null)
  const [logs, setLogs] = useState<TelemetryLog[]>([])
  const [timeSeries, setTimeSeries] = useState<TimeSeries[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [actionLoading, setActionLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [filterText, setFilterText] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedLog, setSelectedLog] = useState<TelemetryLog | null>(null)

  // Settings states
  const [enableProctoring, setEnableProctoring] = useState<boolean>(true)
  const [strictMode, setStrictMode] = useState<boolean>(true)
  const [maskPii, setMaskPii] = useState<boolean>(true)
  const [rateLimit, setRateLimit] = useState<number>(30)

  const getHeaders = () => {
    const token = localStorage.getItem('access_token')
    return {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    }
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const headers = getHeaders()

      // Fetch summary
      const summaryRes = await fetch(`${baseUrl}/admin/metrics/summary`, { headers })
      if (!summaryRes.ok) throw new Error('Failed to load summary stats')
      const summaryData: TelemetrySummary = await summaryRes.json()
      setSummary(summaryData)

      // Sync settings states
      setEnableProctoring(summaryData.guardrail_status_active)
      setStrictMode(summaryData.strict_mode_active)
      setMaskPii(summaryData.pii_masking_active)
      setRateLimit(summaryData.rate_limit_per_min)

      // Fetch logs
      const logsRes = await fetch(`${baseUrl}/admin/metrics/logs`, { headers })
      if (!logsRes.ok) throw new Error('Failed to load transaction audit logs')
      const logsData = await logsRes.json()
      setLogs(logsData)

      // Fetch time series
      const seriesRes = await fetch(`${baseUrl}/admin/metrics/time-series`, { headers })
      if (!seriesRes.ok) throw new Error('Failed to load charts statistics')
      const seriesData = await seriesRes.json()
      setTimeSeries(seriesData)

    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An unexpected error occurred while loading AIOps telemetry.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleUpdateSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setActionLoading(true)
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const res = await fetch(`${baseUrl}/admin/metrics/settings`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          enable_proctoring: enableProctoring,
          strict_mode: strictMode,
          mask_pii: maskPii,
          rate_limit: rateLimit
        })
      })

      if (!res.ok) throw new Error('Failed to save settings configurations')
      
      // Refresh summary
      const updateData = await res.json()
      if (summary) {
        setSummary({
          ...summary,
          guardrail_status_active: updateData.settings.enable_proctoring,
          strict_mode_active: updateData.settings.strict_mode,
          pii_masking_active: updateData.settings.mask_pii,
          rate_limit_per_min: updateData.settings.rate_limit
        })
      }
      alert('AIOps safety parameters applied successfully!')
    } catch (err: any) {
      alert(`Settings update failed: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  // Filter logs based on search query and status dropdown
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user_email.toLowerCase().includes(filterText.toLowerCase()) ||
      log.endpoint.toLowerCase().includes(filterText.toLowerCase()) ||
      (log.guardrail_reason && log.guardrail_reason.toLowerCase().includes(filterText.toLowerCase()))
    
    if (statusFilter === 'all') return matchesSearch
    return matchesSearch && log.guardrail_status === statusFilter
  })

  // Format currency
  const formatCost = (usd: number) => {
    if (usd === 0) return '$0.00'
    if (usd < 0.01) return `$${usd.toFixed(5)}`
    return `$${usd.toFixed(3)}`
  }

  if (loading && !summary) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading AIOps Telemetry Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            AIOps Security & Telemetry
          </h2>
          <p className="text-sm text-muted-foreground">
            Real-time observability, input/output safety guardrails, and audit logs.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/50 bg-white/70 backdrop-blur-xl px-4 py-2.5 text-sm font-medium shadow-sm transition-all hover:bg-background/80 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Live Stream
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50/50 backdrop-blur-md border border-rose-200 p-4 text-sm text-rose-800 flex items-start gap-3">
          <AlertOctagon className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Telemetry Retrieval Error:</span> {error}
          </div>
        </div>
      )}

      {/* Grid of aggregated hero cards */}
      {summary && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Transactions */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/60 p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="absolute top-0 right-0 h-24 w-24 translate-x-4 -translate-y-4 rounded-full bg-primary/5 transition-all group-hover:scale-110" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">Total API Queries</span>
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                <Activity className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-foreground">{summary.total_calls}</span>
              <span className="text-xs text-muted-foreground">calls logged</span>
            </div>
          </div>

          {/* Cumulative Costs */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/60 p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="absolute top-0 right-0 h-24 w-24 translate-x-4 -translate-y-4 rounded-full bg-emerald-500/5 transition-all group-hover:scale-110" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">Estimated Model Cost</span>
              <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-emerald-600">{formatCost(summary.total_cost_usd)}</span>
              <span className="text-xs text-muted-foreground">USD (Flash Avg)</span>
            </div>
          </div>

          {/* Average Latency */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/60 p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="absolute top-0 right-0 h-24 w-24 translate-x-4 -translate-y-4 rounded-full bg-indigo-500/5 transition-all group-hover:scale-110" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">Avg Latency Time</span>
              <div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-indigo-600">
                {summary.avg_latency_ms > 1000 
                  ? `${(summary.avg_latency_ms / 1000).toFixed(2)}s`
                  : `${summary.avg_latency_ms.toFixed(0)}ms`
                }
              </span>
              <span className="text-xs text-muted-foreground">response cycle</span>
            </div>
          </div>

          {/* Safety blocks */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/70 bg-white/60 p-6 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <div className="absolute top-0 right-0 h-24 w-24 translate-x-4 -translate-y-4 rounded-full bg-rose-500/5 transition-all group-hover:scale-110" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-muted-foreground">Attacks Blocked</span>
              <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-rose-600">{summary.blocked_calls}</span>
              <span className="text-xs text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                {summary.block_rate_pct}% Rate
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main double column layouts */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left: Settings Control center & Satisfaction details */}
        <div className="space-y-8 lg:col-span-1">
          {/* Settings Control Panel */}
          <div className="rounded-3xl border border-white/70 bg-white/65 p-6 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-border/80 pb-4 mb-6">
              <div className="rounded-xl bg-purple-500/10 p-2 text-purple-600">
                <Sliders className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-lg text-foreground">AIOps Runtime Safety Controls</h3>
            </div>

            <form onSubmit={handleUpdateSettings} className="space-y-6">
              {/* Proctoring Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="enableProctoring" className="text-sm font-semibold text-foreground flex items-center gap-1.5 cursor-pointer">
                    Enable Safety Proctoring
                  </label>
                  <p className="text-xs text-muted-foreground">Intercept prompt injections & leaks.</p>
                </div>
                <input
                  id="enableProctoring"
                  type="checkbox"
                  checked={enableProctoring}
                  onChange={(e) => setEnableProctoring(e.target.checked)}
                  className="h-5 w-10 rounded-full bg-muted checked:bg-primary accent-primary transition-all cursor-pointer"
                />
              </div>

              {/* Strict Mode Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="strictMode" className="text-sm font-semibold text-foreground flex items-center gap-1.5 cursor-pointer">
                    Strict Verification Mode
                  </label>
                  <p className="text-xs text-muted-foreground">Fail requests immediately on format errors.</p>
                </div>
                <input
                  id="strictMode"
                  type="checkbox"
                  checked={strictMode}
                  onChange={(e) => setStrictMode(e.target.checked)}
                  className="h-5 w-10 rounded-full bg-muted checked:bg-primary accent-primary transition-all cursor-pointer"
                />
              </div>

              {/* PII Masking Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="maskPii" className="text-sm font-semibold text-foreground flex items-center gap-1.5 cursor-pointer">
                    Mask Prompt PII Logs
                  </label>
                  <p className="text-xs text-muted-foreground">Scrub emails/phones for compliance.</p>
                </div>
                <input
                  id="maskPii"
                  type="checkbox"
                  checked={maskPii}
                  onChange={(e) => setMaskPii(e.target.checked)}
                  className="h-5 w-10 rounded-full bg-muted checked:bg-primary accent-primary transition-all cursor-pointer"
                />
              </div>

              {/* Rate Limit Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-foreground">API Rate Limiter</span>
                  <span className="font-bold text-primary">{rateLimit} req/min</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(Number(e.target.value))}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <p className="text-xs text-muted-foreground">Limits volume per user account to mitigate API cost abuse.</p>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full rounded-2xl bg-gradient-to-r from-primary to-indigo-600 py-3 text-sm font-bold text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg disabled:opacity-50"
              >
                {actionLoading ? 'Applying Changes...' : 'Save Safety Configuration'}
              </button>
            </form>
          </div>

          {/* User Feedback & Alignment card */}
          {summary && (
            <div className="rounded-3xl border border-white/70 bg-white/65 p-6 shadow-sm backdrop-blur-xl relative overflow-hidden">
              <div className="flex items-center gap-3 border-b border-border/80 pb-4 mb-4">
                <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600">
                  <ThumbsUp className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg text-foreground">Model Output Satisfaction</h3>
              </div>
              <div className="flex items-center justify-between mt-6">
                <div>
                  <span className="text-4xl font-extrabold text-foreground">{summary.satisfaction_rate_pct}%</span>
                  <p className="text-xs text-muted-foreground mt-1">User recommendation likes</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-emerald-50 p-2 border border-emerald-100 text-emerald-600 mb-1">
                      <ThumbsUp className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">{summary.likes}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-rose-50 p-2 border border-rose-100 text-rose-600 mb-1">
                      <ThumbsDown className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-muted-foreground">{summary.dislikes}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Charts and Visualizations */}
        <div className="lg:col-span-2 space-y-8">
          {/* Custom SVG telemetry area charts */}
          <div className="rounded-3xl border border-white/70 bg-white/65 p-6 shadow-sm backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-border/80 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-indigo-500/10 p-2 text-indigo-600">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Usage & Operational Trends</h3>
                  <p className="text-xs text-muted-foreground">Aggregated API calls and blocked requests over last 7 days.</p>
                </div>
              </div>
            </div>

            {/* Custom SVG Graph */}
            {timeSeries.length > 0 ? (
              <div className="space-y-4">
                <div className="relative h-60 w-full rounded-2xl bg-slate-900/5 p-4 border border-border/60">
                  <svg className="h-full w-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(226, 232, 240, 0.6)" strokeWidth="1" strokeDasharray="4,4" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(226, 232, 240, 0.6)" strokeWidth="1" strokeDasharray="4,4" />
                    <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(226, 232, 240, 0.6)" strokeWidth="1" strokeDasharray="4,4" />

                    {/* Chart Paths - Requests (Indigo) */}
                    <path
                      d={`M ${timeSeries.map((d, i) => {
                        const maxVal = Math.max(...timeSeries.map(x => x.requests), 5);
                        const x = (i / (timeSeries.length - 1)) * 500;
                        const y = 180 - (d.requests / maxVal) * 150;
                        return `${x} ${y}`;
                      }).join(' L ')}`}
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Area fill for Requests */}
                    <path
                      d={`M 0 180 L ${timeSeries.map((d, i) => {
                        const maxVal = Math.max(...timeSeries.map(x => x.requests), 5);
                        const x = (i / (timeSeries.length - 1)) * 500;
                        const y = 180 - (d.requests / maxVal) * 150;
                        return `${x} ${y}`;
                      }).join(' L ')} L 500 180 Z`}
                      fill="url(#indigoGrad)"
                      opacity="0.12"
                    />

                    {/* Chart Paths - Blocks (Rose) */}
                    <path
                      d={`M ${timeSeries.map((d, i) => {
                        const maxVal = Math.max(...timeSeries.map(x => x.requests), 5);
                        const x = (i / (timeSeries.length - 1)) * 500;
                        const y = 180 - (d.blocks / maxVal) * 150;
                        return `${x} ${y}`;
                      }).join(' L ')}`}
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray="3,3"
                    />

                    {/* Defs for gradients */}
                    <defs>
                      <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Horizontal grid text indicators */}
                  <div className="absolute left-4 top-2 text-[10px] font-bold text-muted-foreground">Max load</div>
                  <div className="absolute left-4 bottom-2 text-[10px] font-bold text-muted-foreground">Idle</div>
                </div>

                {/* X Axis Labels */}
                <div className="flex justify-between px-2 text-xs font-semibold text-muted-foreground">
                  {timeSeries.map((d, i) => (
                    <span key={i}>{d.date}</span>
                  ))}
                </div>

                {/* Legend indicator badges */}
                <div className="flex items-center gap-6 justify-center pt-2 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-indigo-500" />
                    <span className="text-foreground">Queries processed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border-2 border-rose-500 border-dashed bg-rose-50" />
                    <span className="text-rose-600">Guardrail Violations / Blocks</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center border border-dashed rounded-2xl">
                <p className="text-xs text-muted-foreground">Insufficient telemetry history to render graphs.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audit transaction list page logs */}
      <div className="rounded-3xl border border-white/70 bg-white/65 p-6 shadow-sm backdrop-blur-xl">
        <div className="flex flex-col gap-4 border-b border-border/80 pb-6 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-500/10 p-2 text-slate-600">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">Transaction Audit Log</h3>
              <p className="text-xs text-muted-foreground">Granular request stream of security events & cost allocations.</p>
            </div>
          </div>

          {/* Search filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search logs (email, route)..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="rounded-xl border border-border bg-background/50 pl-9 pr-4 py-2 text-sm focus:border-primary focus:outline-none w-full sm:w-60"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-background/50 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="all">All statuses</option>
              <option value="passed">Passed</option>
              <option value="blocked">Blocked</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto rounded-2xl border border-border/60">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100/80 font-bold text-muted-foreground">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Endpoint</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Cost</th>
                <th className="p-4">Tokens</th>
                <th className="p-4">Guardrail status</th>
                <th className="p-4 text-center">Audit Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-transparent">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium text-foreground truncate max-w-40" title={log.user_email}>
                      {log.user_email}
                    </td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">
                      {log.endpoint}
                    </td>
                    <td className="p-4 text-foreground">
                      {log.duration_ms > 1000 
                        ? `${(log.duration_ms / 1000).toFixed(2)}s`
                        : `${log.duration_ms.toFixed(0)}ms`
                      }
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {formatCost(log.estimated_cost)}
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">
                      {log.prompt_tokens + log.completion_tokens} total
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        log.guardrail_status === 'passed' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : log.guardrail_status === 'blocked'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {log.guardrail_status === 'passed' && <ShieldCheck className="h-3 w-3" />}
                        {log.guardrail_status === 'blocked' && <ShieldAlert className="h-3 w-3" />}
                        {log.guardrail_status === 'flagged' && <AlertOctagon className="h-3 w-3" />}
                        {log.guardrail_status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 rounded-lg hover:bg-slate-200 p-1.5 text-primary transition-all"
                        title="Analyze Transaction Telemetry"
                      >
                        <Eye className="h-4.5 w-4.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No matching transaction logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/70 bg-white/90 p-8 shadow-2xl backdrop-blur-2xl animate-scale-up">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-6 right-6 rounded-full hover:bg-slate-100 p-1.5 text-muted-foreground hover:text-foreground"
            >
              <Info className="h-6 w-6 rotate-45" />
            </button>

            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <div className={`rounded-2xl p-2.5 ${
                selectedLog.guardrail_status === 'passed'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-rose-500/10 text-rose-600'
              }`}>
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-foreground">Transaction Telemetry Analysis</h3>
                <p className="text-xs text-muted-foreground">Request ID: <span className="font-mono">{selectedLog.id}</span></p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 text-sm">
              <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-border/40">
                <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Operational Metrics</span>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timestamp</span>
                  <span className="font-semibold">{new Date(selectedLog.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Endpoint</span>
                  <span className="font-mono font-semibold">{selectedLog.endpoint}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Caller User</span>
                  <span className="font-semibold">{selectedLog.user_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Response Duration</span>
                  <span className="font-bold text-primary">{selectedLog.duration_ms.toFixed(1)} ms</span>
                </div>
              </div>

              <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-border/40">
                <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase">Token & Cost Breakdown</span>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated LLM Cost</span>
                  <span className="font-bold text-emerald-600">{formatCost(selectedLog.estimated_cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prompt Characters</span>
                  <span className="font-semibold">{selectedLog.prompt_chars}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prompt Tokens</span>
                  <span className="font-semibold">{selectedLog.prompt_tokens}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Completion Tokens</span>
                  <span className="font-semibold">{selectedLog.completion_tokens}</span>
                </div>
              </div>
            </div>

            {selectedLog.guardrail_reason && (
              <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex gap-3">
                <AlertOctagon className="h-5 w-5 text-rose-600 flex-shrink-0" />
                <div>
                  <span className="font-bold">Guardrail Violation Alert:</span>
                  <p className="mt-1 font-mono text-xs">{selectedLog.guardrail_reason}</p>
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-xl bg-slate-800 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-700"
              >
                Close Audit Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
