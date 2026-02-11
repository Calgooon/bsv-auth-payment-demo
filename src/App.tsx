import { useState, useCallback } from 'react'
import { authFetch } from './wallet'

const SERVER = import.meta.env.DEV
  ? 'http://localhost:8787'
  : 'https://poc-server.dev-a3e.workers.dev'

interface ApiResponse {
  data: unknown
  status: number
  duration: number
  transport?: string
}

type Accent = 'emerald' | 'amber' | 'violet' | 'cyan' | 'sky'

function App() {
  const [results, setResults] = useState<Array<{ id: number; title: string; result: ApiResponse; accent: Accent }>>([])
  const [loadingKey, setLoadingKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const addResult = useCallback((title: string, result: ApiResponse, accent: Accent) => {
    setResults(prev => [{ id: Date.now(), title, result, accent }, ...prev])
  }, [])

  const callEndpoint = useCallback(async (
    path: string,
    title: string,
    accent: Accent,
    key: string,
    fetchOptions?: Record<string, unknown>,
    transportLabel?: string,
  ) => {
    setLoadingKey(key)
    setError(null)
    const start = performance.now()
    try {
      const response = await authFetch.fetch(`${SERVER}${path}`, {
        method: 'POST',
        ...fetchOptions,
      } as never)
      const data = await response.json()
      addResult(title, {
        data,
        status: response.status,
        duration: Math.round(performance.now() - start),
        transport: transportLabel,
      }, accent)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoadingKey(null)
    }
  }, [addResult])

  const fetchBalance = useCallback(async () => {
    setLoadingKey('balance')
    setError(null)
    const start = performance.now()
    try {
      const response = await fetch(`${SERVER}/balance`)
      const data = await response.json()
      addResult('Server Balance', {
        data,
        status: response.status,
        duration: Math.round(performance.now() - start),
      }, 'sky')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoadingKey(null)
    }
  }, [addResult])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center px-4 py-10 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-violet-900/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-amber-900/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-900/5 blur-[150px]" />
      </div>

      <div className="w-full max-w-3xl space-y-10 relative z-10">
        {/* Header */}
        <header className="text-center space-y-3 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-[10px] font-medium tracking-widest uppercase text-zinc-500 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Proof of Concept
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            BSV Auth + Payment
          </h1>
          <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">
            BRC-31 mutual authentication &middot; BRC-29 micropayments &middot; Cloudflare Workers
          </p>
        </header>

        {/* Utility Row */}
        <div className="grid grid-cols-2 gap-3">
          <ActionButton
            label="Free Endpoint"
            sublabel="POST /free"
            detail="Auth only"
            accent="emerald"
            loading={loadingKey === 'free'}
            onClick={() => callEndpoint('/free', 'Free Endpoint', 'emerald', 'free')}
          />
          <ActionButton
            label="Server Balance"
            sublabel="GET /balance"
            detail="No auth"
            accent="sky"
            loading={loadingKey === 'balance'}
            onClick={fetchBalance}
          />
        </div>

        {/* Payment Section */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-400">
              Payment Modes
            </h2>
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-[10px] font-medium text-zinc-600 tracking-wide uppercase">10 sats each</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <ActionButton
              label="Header"
              sublabel="Classic"
              detail="Payment in HTTP header"
              accent="amber"
              loading={loadingKey === 'paid-header'}
              onClick={() => callEndpoint(
                '/paid', 'Paid (Header)', 'amber', 'paid-header',
                { paymentTransport: 'header' }, 'header'
              )}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h10" />
                </svg>
              }
            />
            <ActionButton
              label="Body"
              sublabel="Large TX"
              detail="Payment in request body"
              accent="violet"
              loading={loadingKey === 'paid-body'}
              onClick={() => callEndpoint(
                '/paid', 'Paid (Body)', 'violet', 'paid-body',
                { paymentTransport: 'body' }, 'body'
              )}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <path strokeLinecap="round" d="M8 9h8M8 13h6" />
                </svg>
              }
            />
            <ActionButton
              label="Auto"
              sublabel="Smart"
              detail="Size-based detection"
              accent="cyan"
              loading={loadingKey === 'paid-auto'}
              onClick={() => callEndpoint(
                '/paid', 'Paid (Auto)', 'cyan', 'paid-auto',
                { paymentTransport: 'auto' }, 'auto'
              )}
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" d="M12 3v3m0 12v3M3 12h3m12 0h3" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              }
            />
          </div>
          <p className="text-[11px] text-zinc-600 mt-3 text-center leading-relaxed">
            Header = classic (in x-bsv-payment header) &middot; Body = large TX safe (in request body) &middot; Auto = header if &lt;6KB, body otherwise
          </p>
        </section>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-950/30 border border-red-900/30 backdrop-blur-sm">
            <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" d="M12 8v4m0 4h.01" />
            </svg>
            <div className="text-sm text-red-300/90 font-mono leading-relaxed break-all">{error}</div>
            <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-400 shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-400">
                Responses
              </h2>
              {results.length > 1 && (
                <button
                  onClick={() => setResults([])}
                  className="text-[10px] font-medium tracking-wide uppercase text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="space-y-3">
              {results.map((r) => (
                <ResponseCard key={r.id} title={r.title} result={r.result} accent={r.accent} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

/* ─── Action Button ─── */

const accentClasses: Record<Accent, { text: string; border: string; glow: string; spinner: string }> = {
  emerald: { text: 'text-emerald-400', border: 'hover:border-emerald-500/40', glow: 'group-hover:shadow-emerald-500/5', spinner: 'border-emerald-400' },
  amber:   { text: 'text-amber-400',   border: 'hover:border-amber-500/40',   glow: 'group-hover:shadow-amber-500/5',   spinner: 'border-amber-400' },
  violet:  { text: 'text-violet-400',  border: 'hover:border-violet-500/40',  glow: 'group-hover:shadow-violet-500/5',  spinner: 'border-violet-400' },
  cyan:    { text: 'text-cyan-400',    border: 'hover:border-cyan-500/40',    glow: 'group-hover:shadow-cyan-500/5',    spinner: 'border-cyan-400' },
  sky:     { text: 'text-sky-400',     border: 'hover:border-sky-500/40',     glow: 'group-hover:shadow-sky-500/5',     spinner: 'border-sky-400' },
}

function ActionButton({ label, sublabel, detail, accent, loading, onClick, icon }: {
  label: string
  sublabel: string
  detail: string
  accent: Accent
  loading: boolean
  onClick: () => void
  icon?: React.ReactNode
}) {
  const c = accentClasses[accent]
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`group relative flex flex-col items-start px-5 py-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-sm ${c.border} transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-transparent ${c.glow}`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {icon && <span className={`${c.text} opacity-60`}>{icon}</span>}
        <span className={`text-sm font-semibold ${c.text}`}>{label}</span>
        <span className="text-[10px] font-medium text-zinc-500 bg-zinc-800/80 px-1.5 py-0.5 rounded">{sublabel}</span>
      </div>
      <span className="text-[11px] text-zinc-500 leading-tight">{detail}</span>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm rounded-xl">
          <div className={`w-5 h-5 border-2 ${c.spinner} border-t-transparent rounded-full animate-spin`} />
        </div>
      )}
    </button>
  )
}

/* ─── Response Card ─── */

const responseColors: Record<Accent, { text: string; border: string; bg: string; badge: string }> = {
  emerald: { text: 'text-emerald-400', border: 'border-emerald-900/40', bg: 'bg-emerald-950/20', badge: 'bg-emerald-900/40 text-emerald-300' },
  amber:   { text: 'text-amber-400',   border: 'border-amber-900/40',   bg: 'bg-amber-950/20',   badge: 'bg-amber-900/40 text-amber-300' },
  violet:  { text: 'text-violet-400',  border: 'border-violet-900/40',  bg: 'bg-violet-950/20',  badge: 'bg-violet-900/40 text-violet-300' },
  cyan:    { text: 'text-cyan-400',    border: 'border-cyan-900/40',    bg: 'bg-cyan-950/20',    badge: 'bg-cyan-900/40 text-cyan-300' },
  sky:     { text: 'text-sky-400',     border: 'border-sky-900/40',     bg: 'bg-sky-950/20',     badge: 'bg-sky-900/40 text-sky-300' },
}

function ResponseCard({ title, result, accent }: {
  title: string
  result: ApiResponse
  accent: Accent
}) {
  const c = responseColors[accent]
  const statusOk = result.status >= 200 && result.status < 300

  // Extract txid from response if present
  const data = result.data as Record<string, unknown> | null
  const payment = data?.payment as Record<string, unknown> | undefined
  const txid = payment?.txid as string | undefined

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} overflow-hidden backdrop-blur-sm`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800/50">
        <span className={`text-sm font-medium ${c.text}`}>{title}</span>
        <div className="flex items-center gap-2 ml-auto">
          {result.transport && (
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${c.badge}`}>
              {result.transport}
            </span>
          )}
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${statusOk ? 'bg-emerald-900/40 text-emerald-300' : 'bg-red-900/40 text-red-300'}`}>
            {result.status}
          </span>
          <span className="text-[11px] text-zinc-600 tabular-nums">{result.duration}ms</span>
        </div>
      </div>

      {/* txID row */}
      {txid && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-800/30 bg-zinc-900/30">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">txid</span>
          <code className="text-[11px] text-zinc-400 font-mono truncate flex-1">{txid}</code>
        </div>
      )}

      {/* JSON body */}
      <pre className="px-4 py-3 text-[12px] text-zinc-400 overflow-x-auto leading-relaxed font-mono">
        {JSON.stringify(result.data, null, 2)}
      </pre>
    </div>
  )
}

export default App
