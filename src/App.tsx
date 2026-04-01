import { useState, useEffect, useCallback, useRef } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  BarChart3,
  Shield,
  Zap,
  Globe,
  ChevronDown,
  Loader2,
  RefreshCw,
  ExternalLink,
  Clock,
  AlertTriangle,
  BookOpen,
  Coins,
  Award,
  Users,
} from 'lucide-react'
import './App.css'

// ═══════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════

interface MetalPrice {
  symbol: string
  name: string
  price: number
  prevClose: number
  change: number
  changePct: number
  high: number
  low: number
  updatedAt: string
}

type Metal = 'Gold' | 'Silver' | 'Platinum' | 'Palladium' | 'Copper'
type Tab = 'dashboard' | 'predict' | 'learn' | 'about'

const METALS: { name: Metal; symbol: string; color: string }[] = [
  { name: 'Gold', symbol: 'XAU', color: '#d4a017' },
  { name: 'Silver', symbol: 'XAG', color: '#c0c0c0' },
  { name: 'Platinum', symbol: 'XPT', color: '#e5e4e2' },
  { name: 'Palladium', symbol: 'XPD', color: '#cec8c6' },
]

// ═══════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════

function formatUSD(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function formatPct(n: number): string {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return 'just now'
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`
  return `${Math.floor(sec / 3600)}h ago`
}

// ═══════════════════════════════════════════════════════════════════════
// Hooks
// ═══════════════════════════════════════════════════════════════════════

function usePrices() {
  const [prices, setPrices] = useState<MetalPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch('/api/prices')
      if (!res.ok) throw new Error('Failed to fetch prices')
      const data = await res.json()
      setPrices(data.prices)
      setSource(data.source)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 60_000)
    return () => clearInterval(interval)
  }, [fetchPrices])

  return { prices, loading, source, error, refresh: fetchPrices }
}

function usePrediction() {
  const [prediction, setPrediction] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const predict = useCallback(async (metal: Metal) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setPrediction('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metal }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Prediction failed')
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') break
          try {
            const { text } = JSON.parse(payload)
            setPrediction((prev) => prev + text)
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Prediction failed')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    abortRef.current?.abort()
    setPrediction('')
    setError(null)
    setLoading(false)
  }, [])

  return { prediction, loading, error, predict, clear }
}

// ═══════════════════════════════════════════════════════════════════════
// Components
// ═══════════════════════════════════════════════════════════════════════

function Header({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo">
          <span className="logo-icon">⚜️</span>
          <span className="logo-text">AurumOracle</span>
        </div>
        <nav className="nav">
          {([
            ['dashboard', 'Dashboard', BarChart3],
            ['predict', 'AI Predict', Sparkles],
            ['learn', 'Learn', BookOpen],
            ['about', 'About', Globe],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              className={`nav-btn ${tab === key ? 'active' : ''}`}
              onClick={() => setTab(key as Tab)}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}

function PriceCard({ metal }: { metal: MetalPrice }) {
  const isUp = metal.changePct > 0
  const isFlat = metal.changePct === 0
  const TrendIcon = isUp ? TrendingUp : isFlat ? Minus : TrendingDown

  return (
    <div className={`price-card ${isUp ? 'up' : isFlat ? 'flat' : 'down'}`}>
      <div className="price-card-header">
        <span className="metal-symbol">{metal.symbol}</span>
        <span className="metal-name">{metal.name}</span>
      </div>
      <div className="price-card-price">{formatUSD(metal.price)}</div>
      <div className={`price-card-change ${isUp ? 'up' : isFlat ? '' : 'down'}`}>
        <TrendIcon size={14} />
        <span>{formatPct(metal.changePct)}</span>
        <span className="change-abs">({formatUSD(Math.abs(metal.change))})</span>
      </div>
      <div className="price-card-range">
        <span>L {formatUSD(metal.low)}</span>
        <span>H {formatUSD(metal.high)}</span>
      </div>
    </div>
  )
}

function PriceTicker({ prices }: { prices: MetalPrice[] }) {
  return (
    <div className="ticker-bar">
      <div className="ticker-track">
        {[...prices, ...prices].map((p, i) => (
          <span key={i} className="ticker-item">
            <strong>{p.symbol}</strong> {formatUSD(p.price)}{' '}
            <span className={p.changePct >= 0 ? 'up' : 'down'}>
              {formatPct(p.changePct)}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

function DashboardTab({
  prices,
  loading,
  source,
  error,
  refresh,
}: {
  prices: MetalPrice[]
  loading: boolean
  source: string
  error: string | null
  refresh: () => void
}) {
  return (
    <section className="tab-content">
      <div className="section-header">
        <div>
          <h2>Live Metal Prices</h2>
          <p className="subtitle">
            Real-time precious metals spot prices
            {source && <span className="source-badge">{source}</span>}
          </p>
        </div>
        <button className="icon-btn" onClick={refresh} title="Refresh prices">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="alert alert-warn">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {loading && prices.length === 0 ? (
        <div className="loading-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      ) : (
        <div className="price-grid">
          {prices.map((p) => (
            <PriceCard key={p.symbol} metal={p} />
          ))}
        </div>
      )}

      <div className="section-header" style={{ marginTop: '2.5rem' }}>
        <h2>Market Overview</h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon gold">
            <Coins size={20} />
          </div>
          <div>
            <div className="stat-label">Gold/Silver Ratio</div>
            <div className="stat-value">
              {prices.length >= 2
                ? (prices[0].price / prices[1].price).toFixed(1)
                : '—'}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">
            <BarChart3 size={20} />
          </div>
          <div>
            <div className="stat-label">Metals Tracked</div>
            <div className="stat-value">{prices.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="stat-label">Gainers Today</div>
            <div className="stat-value">
              {prices.filter((p) => p.changePct > 0).length}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <Clock size={20} />
          </div>
          <div>
            <div className="stat-label">Last Update</div>
            <div className="stat-value">
              {prices[0] ? timeAgo(prices[0].updatedAt) : '—'}
            </div>
          </div>
        </div>
      </div>

      <div className="section-header" style={{ marginTop: '2.5rem' }}>
        <h2>Metal Comparison</h2>
      </div>

      <div className="comparison-table-wrap">
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Metal</th>
              <th>Price</th>
              <th>Change</th>
              <th>Day Low</th>
              <th>Day High</th>
              <th>Prev Close</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((p) => (
              <tr key={p.symbol}>
                <td>
                  <strong>{p.name}</strong>{' '}
                  <span className="text-muted">{p.symbol}</span>
                </td>
                <td className="mono">{formatUSD(p.price)}</td>
                <td
                  className={`mono ${p.changePct >= 0 ? 'up' : 'down'}`}
                >
                  {formatPct(p.changePct)}
                </td>
                <td className="mono">{formatUSD(p.low)}</td>
                <td className="mono">{formatUSD(p.high)}</td>
                <td className="mono">{formatUSD(p.prevClose)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function PredictTab() {
  const [selectedMetal, setSelectedMetal] = useState<Metal>('Gold')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { prediction, loading, error, predict, clear } = usePrediction()

  const selected = METALS.find((m) => m.name === selectedMetal)!

  return (
    <section className="tab-content">
      <div className="section-header">
        <div>
          <h2>AI Price Prediction</h2>
          <p className="subtitle">
            Powered by Claude — real-time market analysis
          </p>
        </div>
      </div>

      <div className="predict-panel">
        <div className="predict-controls">
          <div className="dropdown-wrap">
            <button
              className="dropdown-trigger"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <span
                className="metal-dot"
                style={{ background: selected.color }}
              />
              <span>{selectedMetal}</span>
              <ChevronDown
                size={16}
                className={dropdownOpen ? 'flip' : ''}
              />
            </button>
            {dropdownOpen && (
              <div className="dropdown-menu">
                {METALS.map((m) => (
                  <button
                    key={m.name}
                    className={`dropdown-item ${
                      m.name === selectedMetal ? 'active' : ''
                    }`}
                    onClick={() => {
                      setSelectedMetal(m.name)
                      setDropdownOpen(false)
                    }}
                  >
                    <span
                      className="metal-dot"
                      style={{ background: m.color }}
                    />
                    <span>{m.name}</span>
                    <span className="text-muted">{m.symbol}</span>
                  </button>
                ))}
                <button
                  className={`dropdown-item ${
                    selectedMetal === 'Copper' ? 'active' : ''
                  }`}
                  onClick={() => {
                    setSelectedMetal('Copper')
                    setDropdownOpen(false)
                  }}
                >
                  <span
                    className="metal-dot"
                    style={{ background: '#b87333' }}
                  />
                  <span>Copper</span>
                  <span className="text-muted">HG</span>
                </button>
              </div>
            )}
          </div>

          <button
            className="btn btn-primary"
            onClick={() => predict(selectedMetal)}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin" />
                <span>Analyzing…</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Get Prediction</span>
              </>
            )}
          </button>

          {prediction && (
            <button className="btn btn-ghost" onClick={clear}>
              Clear
            </button>
          )}
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        {(prediction || loading) && (
          <div className="prediction-result">
            <div className="prediction-header">
              <Sparkles size={16} className="gold" />
              <span>AurumOracle Analysis — {selectedMetal}</span>
            </div>
            <div className="prediction-body">
              {prediction || (
                <span className="typing-dots">
                  <span />
                  <span />
                  <span />
                </span>
              )}
            </div>
            {!loading && prediction && (
              <div className="prediction-footer">
                <span className="text-muted">
                  AI-generated analysis · Not financial advice
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="info-cards">
        <div className="info-card">
          <Shield size={20} className="gold" />
          <h3>Trusted Analysis</h3>
          <p>
            Powered by Claude, our AI evaluates macro trends, central bank
            policy, supply/demand dynamics, and technical signals to generate
            comprehensive forecasts.
          </p>
        </div>
        <div className="info-card">
          <Zap size={20} className="gold" />
          <h3>Real-Time Streaming</h3>
          <p>
            Predictions stream in real-time as they're generated, giving you
            instant access to analysis without waiting for batch processing.
          </p>
        </div>
        <div className="info-card">
          <Globe size={20} className="gold" />
          <h3>Global Coverage</h3>
          <p>
            Track Gold, Silver, Platinum, Palladium, and Copper — the five
            major metals that drive global commodity markets.
          </p>
        </div>
      </div>
    </section>
  )
}

function LearnTab() {
  return (
    <section className="tab-content">
      <div className="section-header">
        <div>
          <h2>Knowledge Hub</h2>
          <p className="subtitle">
            Essential guides to precious metals markets
          </p>
        </div>
      </div>

      <div className="learn-grid">
        <article className="learn-card">
          <div className="learn-card-icon gold-bg">
            <Coins size={24} />
          </div>
          <h3>Gold (XAU)</h3>
          <p>
            The ultimate safe-haven asset. Gold has been a store of value for
            over 5,000 years and remains central to global monetary systems.
            Central banks hold approximately 36,000 tonnes collectively.
          </p>
          <ul className="learn-facts">
            <li>Annual mine production: ~3,600 tonnes</li>
            <li>Largest holder: US Federal Reserve (~8,133 tonnes)</li>
            <li>Key driver: Real interest rates (inverse correlation)</li>
            <li>Trading hours: 23/5 globally across COMEX, LBMA, SGE</li>
          </ul>
        </article>

        <article className="learn-card">
          <div className="learn-card-icon silver-bg">
            <Coins size={24} />
          </div>
          <h3>Silver (XAG)</h3>
          <p>
            A dual-purpose metal — both precious and industrial. Silver's
            industrial demand (solar panels, electronics, EVs) makes it more
            volatile than gold but with higher upside potential.
          </p>
          <ul className="learn-facts">
            <li>~50% industrial, ~25% jewelry, ~20% investment demand</li>
            <li>Gold/Silver ratio: historically 15:1, currently ~80:1</li>
            <li>Key driver: Solar panel demand and green energy transition</li>
            <li>More volatile than gold — higher beta to monetary metals</li>
          </ul>
        </article>

        <article className="learn-card">
          <div className="learn-card-icon platinum-bg">
            <Coins size={24} />
          </div>
          <h3>Platinum (XPT)</h3>
          <p>
            Rarer than gold and critical for catalytic converters, hydrogen
            fuel cells, and jewelry. Platinum trades at a historic discount to
            gold, presenting potential value opportunity.
          </p>
          <ul className="learn-facts">
            <li>Annual production: ~180 tonnes (30x rarer than gold)</li>
            <li>~75% of supply from South Africa (geopolitical risk)</li>
            <li>Key driver: Hydrogen economy and fuel cell adoption</li>
            <li>Currently trading below gold — historically traded at premium</li>
          </ul>
        </article>

        <article className="learn-card">
          <div className="learn-card-icon palladium-bg">
            <Coins size={24} />
          </div>
          <h3>Palladium (XPD)</h3>
          <p>
            Critical for gasoline catalytic converters. Palladium surged
            1,500% from 2016–2022 on supply deficits, and has since corrected
            as EV adoption threatens demand.
          </p>
          <ul className="learn-facts">
            <li>~40% of supply from Russia (sanctions risk)</li>
            <li>~85% of demand from auto catalytic converters</li>
            <li>Key driver: ICE vehicle production vs EV transition</li>
            <li>Most volatile of the four precious metals</li>
          </ul>
        </article>
      </div>

      <div className="section-header" style={{ marginTop: '2.5rem' }}>
        <h2>Market Concepts</h2>
      </div>

      <div className="concepts-grid">
        <div className="concept-card">
          <h4>Spot vs Futures</h4>
          <p>
            Spot price is for immediate delivery. Futures contracts lock in a
            price for future delivery. The difference (contango/backwardation)
            reflects storage costs and market expectations.
          </p>
        </div>
        <div className="concept-card">
          <h4>Troy Ounce</h4>
          <p>
            Precious metals trade in troy ounces (31.1035g), not standard
            ounces (28.35g). One troy ounce is ~10% heavier than a regular
            ounce.
          </p>
        </div>
        <div className="concept-card">
          <h4>Safe Haven Demand</h4>
          <p>
            During economic uncertainty, investors move capital into gold and
            silver. Key triggers: inflation spikes, currency devaluation,
            geopolitical crises, and equity market crashes.
          </p>
        </div>
        <div className="concept-card">
          <h4>Central Bank Buying</h4>
          <p>
            Since 2022, central banks (China, Poland, India) have been buying
            gold at record pace — over 1,000 tonnes annually — diversifying
            away from USD reserves.
          </p>
        </div>
      </div>
    </section>
  )
}

function AboutTab() {
  return (
    <section className="tab-content">
      <div className="section-header">
        <div>
          <h2>About AurumOracle</h2>
          <p className="subtitle">
            AI-powered precious metals intelligence
          </p>
        </div>
      </div>

      <div className="about-hero">
        <p className="about-lead">
          AurumOracle combines real-time market data with Claude AI to deliver
          institutional-grade precious metals analysis — accessible to
          everyone.
        </p>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">
            <BarChart3 size={24} />
          </div>
          <h3>Live Market Data</h3>
          <p>
            Real-time spot prices for Gold, Silver, Platinum, and Palladium
            sourced from GoldAPI.io with automatic fallback pricing.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <Sparkles size={24} />
          </div>
          <h3>AI Predictions</h3>
          <p>
            Claude-powered market analysis with streaming responses. Get
            insights on price direction, key drivers, and risk factors
            instantly.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <Shield size={24} />
          </div>
          <h3>Algorand Ready</h3>
          <p>
            Built for the Algorand ecosystem. Future integration with XPC
            prediction markets, on-chain voting, and Meld Gold tokenized
            metals.
          </p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">
            <Zap size={24} />
          </div>
          <h3>Fast & Light</h3>
          <p>
            Built with Vite + React + TypeScript. Zero bloat, instant loading,
            and a streamlined single-page architecture.
          </p>
        </div>
      </div>

      <div className="section-header" style={{ marginTop: '2.5rem' }}>
        <h2>Roadmap</h2>
      </div>

      <div className="roadmap">
        <div className="roadmap-item done">
          <div className="roadmap-marker" />
          <div>
            <h4>Phase 1 — Foundation</h4>
            <p>Live metal prices, Claude AI predictions, responsive UI</p>
          </div>
        </div>
        <div className="roadmap-item active">
          <div className="roadmap-marker" />
          <div>
            <h4>Phase 2 — Algorand Integration</h4>
            <p>
              Wallet connection, XPC token, prediction market contracts,
              on-chain comments and voting
            </p>
          </div>
        </div>
        <div className="roadmap-item">
          <div className="roadmap-marker" />
          <div>
            <h4>Phase 3 — DEX Trading</h4>
            <p>
              Tinyman integration for MCAU/MSOS trading, portfolio tracking,
              fee distribution
            </p>
          </div>
        </div>
        <div className="roadmap-item">
          <div className="roadmap-marker" />
          <div>
            <h4>Phase 4 — Premium Features</h4>
            <p>
              AI portfolio advisor, alert system, historical analysis,
              multi-chain expansion
            </p>
          </div>
        </div>
      </div>

      <div className="section-header" style={{ marginTop: '2.5rem' }}>
        <h2>Tech Stack</h2>
      </div>

      <div className="tech-grid">
        {[
          ['React 18', 'Frontend framework'],
          ['TypeScript', 'Type safety'],
          ['Vite 5', 'Build tool'],
          ['Claude AI', 'Market analysis'],
          ['GoldAPI.io', 'Price data'],
          ['Algorand', 'Blockchain layer'],
          ['Express', 'API server'],
          ['Lucide', 'Icon system'],
        ].map(([name, desc]) => (
          <div key={name} className="tech-badge">
            <strong>{name}</strong>
            <span>{desc}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="logo-icon">⚜️</span>
          <span>AurumOracle</span>
        </div>
        <p className="footer-disclaimer">
          Market data for informational purposes only. AI predictions are not
          financial advice. Always do your own research before making
          investment decisions.
        </p>
        <div className="footer-links">
          <a
            href="https://github.com/AurumOracle/Metal"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub <ExternalLink size={12} />
          </a>
          <a
            href="https://www.goldapi.io"
            target="_blank"
            rel="noopener noreferrer"
          >
            GoldAPI <ExternalLink size={12} />
          </a>
          <a
            href="https://algorand.co"
            target="_blank"
            rel="noopener noreferrer"
          >
            Algorand <ExternalLink size={12} />
          </a>
        </div>
        <p className="footer-copy">
          &copy; {new Date().getFullYear()} AurumOracle. Built on Algorand.
        </p>
      </div>
    </footer>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// App
// ═══════════════════════════════════════════════════════════════════════

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard')
  const { prices, loading, source, error, refresh } = usePrices()

  return (
    <div className="app">
      <Header tab={tab} setTab={setTab} />

      {prices.length > 0 && <PriceTicker prices={prices} />}

      <main className="main">
        {tab === 'dashboard' && (
          <DashboardTab
            prices={prices}
            loading={loading}
            source={source}
            error={error}
            refresh={refresh}
          />
        )}
        {tab === 'predict' && <PredictTab />}
        {tab === 'learn' && <LearnTab />}
        {tab === 'about' && <AboutTab />}
      </main>

      <Footer />
    </div>
  )
}