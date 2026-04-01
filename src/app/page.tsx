'use client'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header }         from '@/components/layout/Header'
import { Ticker }         from '@/components/layout/Ticker'
import { LeftNav }        from '@/components/layout/LeftNav'
import { RightPanel }     from '@/components/layout/RightPanel'
import { Footer }         from '@/components/layout/Footer'
import { PriceChart }     from '@/components/charts/PriceChart'
import { PredictionList } from '@/components/predictions/PredictionList'
import { Toast, SectionLabel } from '@/components/ui'
import { ErrorBoundary, PanelError } from '@/components/ui/ErrorBoundary'
import {
  TickerSkeleton, StatsRowSkeleton, ChartSkeleton, PredictionListSkeleton,
} from '@/components/ui/Skeletons'
import { useUI, usePrices, useAurumStore } from '@/store'
import { useRealtimePrices } from '@/hooks/useRealtimePrices'
import { fetchPrices } from '@/lib/prices'
import { clsx } from 'clsx'

// ── PANEL TABS ─────────────────────────────────────────────────────────

const LOWER_TABS = [
  { key: 'overview',     label: 'Overview'       },
  { key: 'precious',     label: 'Precious'        },
  { key: 'base',         label: 'Base metals'     },
  { key: 'commodities',  label: 'Commodities'     },
  { key: 'history',      label: 'Historical'      },
  { key: 'predictions',  label: 'Predictions'     },
] as const

// ── STATS ROW ─────────────────────────────────────────────────────────

function StatsRow() {
  const { getSpotPrice } = usePrices()
  const xau = getSpotPrice('XAU') || 3142.80
  const xag = getSpotPrice('XAG') || 33.42

  const stats = [
    { label: 'Spot price',       value: `$${xau.toLocaleString()}`,   sub: '+0.84% today',  subClass: 'text-up' },
    { label: '52-week high',     value: '$3,218.40',                   sub: 'Mar 14 2026',   subClass: 'text-muted' },
    { label: '52-week low',      value: '$2,288.20',                   sub: 'Apr 4 2025',    subClass: 'text-muted' },
    { label: 'Gold/silver ratio',value: `${(xau/xag).toFixed(1)}`,    sub: 'oz silver per oz gold', subClass: 'text-muted' },
    { label: 'MCAU/spot spread', value: '−$0.08/g',                   sub: '0.08% discount',subClass: 'text-down' },
  ]

  return (
    <div className="grid grid-cols-5 gap-2 px-4 pb-3">
      {stats.map(s => (
        <div key={s.label} className="bg-surface-card border border-default rounded-lg px-3 py-2.5">
          <div className="label mb-1">{s.label}</div>
          <div className="text-[18px] font-light text-primary">{s.value}</div>
          <div className={clsx('text-[10px] italic mt-0.5', s.subClass)}>{s.sub}</div>
        </div>
      ))}
    </div>
  )
}

// ── PANEL CONTENT ──────────────────────────────────────────────────────

function OverviewPanel() {
  return (
    <div className="px-4 pb-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          'Tokenised gold — spot vs PAXG vs XAUT vs MCAU',
          'Gold/silver ratio — 12 months',
          'PAXG vs XAUT spread vs spot (USD/g)',
          'Gold vs S&P 500 vs BTC — 1Y rebased (%)',
        ].map(title => (
          <div key={title} className="bg-surface-card border border-default rounded-xl p-3">
            <div className="font-display text-[9px] tracking-[0.1em] text-secondary mb-2">{title}</div>
            <div className="h-[130px] flex items-center justify-center text-[11px] italic text-muted">
              Chart · live data in production
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MetalsGridPanel({ type }: { type: 'precious' | 'base' }) {
  const precious = [
    { sym:'XAU', name:'Gold',      price:'$3,142.80', chg:'+0.84%', up:true,  col:'#C9A84C' },
    { sym:'XAG', name:'Silver',    price:'$33.42',    chg:'+1.22%', up:true,  col:'#D4DCE4' },
    { sym:'XPT', name:'Platinum',  price:'$984.10',   chg:'−0.31%', up:false, col:'#E5E4E2' },
    { sym:'XPD', name:'Palladium', price:'$1,042.50', chg:'+0.55%', up:true,  col:'#A9B4BE' },
    { sym:'XRH', name:'Rhodium',   price:'$4,820.00', chg:'+0.20%', up:true,  col:'#B0BEC5' },
    { sym:'XIR', name:'Iridium',   price:'$5,200.00', chg:'0.00%',  up:null,  col:'#90A4AE' },
  ]
  const base = [
    { sym:'Cu', name:'Copper',    price:'$4.82/lb',  chg:'+0.44%', up:true,  col:'#B87333' },
    { sym:'Al', name:'Aluminium', price:'$1.18/lb',  chg:'−0.15%', up:false, col:'#B0BEC5' },
    { sym:'Zn', name:'Zinc',      price:'$1.38/lb',  chg:'−0.18%', up:false, col:'#9E9E9E' },
    { sym:'Ni', name:'Nickel',    price:'$7.14/lb',  chg:'+0.62%', up:true,  col:'#78909C' },
    { sym:'Pb', name:'Lead',      price:'$0.95/lb',  chg:'+0.10%', up:true,  col:'#546E7A' },
    { sym:'Sn', name:'Tin',       price:'$13.20/lb', chg:'+0.38%', up:true,  col:'#80CBC4' },
  ]
  const metals = type === 'precious' ? precious : base

  return (
    <div className="px-4 pb-4">
      <div className="grid grid-cols-3 gap-2.5">
        {metals.map(m => (
          <div key={m.sym} className="bg-surface-card border border-default rounded-xl p-3 hover:border-gold transition-colors cursor-pointer">
            <div className="font-display text-[10px] tracking-[0.16em] font-bold mb-0.5" style={{ color: m.col }}>
              {m.sym}
            </div>
            <div className="text-[11px] italic text-muted mb-2">{m.name}</div>
            <div className="text-[19px] font-light text-primary mb-1">{m.price}</div>
            <div className={clsx('text-[11px]', m.up === true ? 'text-up' : m.up === false ? 'text-down' : 'text-muted')}>
              {m.chg}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CommoditiesPanel() {
  const comms = [
    { i:'🌾', n:'Wheat',     u:'bushel', usd:6.20,  g1970:.062,  g2000:.034,  g2026:.00197, trend:'dn' },
    { i:'🌽', n:'Corn',      u:'bushel', usd:4.85,  g1970:.048,  g2000:.028,  g2026:.00154, trend:'dn' },
    { i:'🐄', n:'Beef',      u:'lb',     usd:2.05,  g1970:.0058, g2000:.0028, g2026:.00065, trend:'dn' },
    { i:'🥛', n:'Milk',      u:'gallon', usd:3.80,  g1970:.0028, g2000:.0016, g2026:.00121, trend:'dn' },
    { i:'🏡', n:'Land (UK)', u:'acre',   usd:10800, g1970:2.4,   g2000:1.8,   g2026:3.44,   trend:'up' },
    { i:'🛢️',n:'Crude oil', u:'barrel', usd:74.20, g1970:.058,  g2000:.018,  g2026:.0236,  trend:'fl' },
    { i:'☕', n:'Coffee',    u:'lb',     usd:2.42,  g1970:.021,  g2000:.0048, g2026:.00077, trend:'dn' },
    { i:'🐔', n:'Chicken',   u:'lb',     usd:1.42,  g1970:.008,  g2000:.004,  g2026:.00045, trend:'dn' },
    { i:'🥚', n:'Eggs',      u:'dozen',  usd:4.80,  g1970:.003,  g2000:.0014, g2026:.00153, trend:'up' },
  ]

  return (
    <div className="px-4 pb-4">
      <div className="text-[13px] italic text-secondary mb-3 p-3 bg-gold-dim border-l-2 border-gold rounded-r-lg leading-relaxed">
        Prices expressed as troy ounces of gold required to purchase one unit. A falling ratio means the commodity is becoming cheaper relative to gold — demonstrating gold&apos;s long-run purchasing power preservation.
      </div>
      <table className="w-full text-[12px]">
        <thead>
          <tr>
            {['Commodity','Unit','USD today','Gold oz today','1970','2000','2026','Trend'].map(h => (
              <th key={h} className="label text-left py-1.5 px-2 border-b border-default">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comms.map((c, i) => (
            <tr key={i} className="border-b border-[rgba(255,255,255,0.025)] hover:bg-surface-hover">
              <td className="py-2 px-2">{c.i} {c.n}</td>
              <td className="py-2 px-2 italic text-muted text-[11px]">{c.u}</td>
              <td className="py-2 px-2">${c.usd.toLocaleString()}</td>
              <td className="py-2 px-2">
                <span className="font-display text-[10px] text-gold">{(c.usd/3142.80*31.1035).toFixed(2)}g</span>
              </td>
              <td className="py-2 px-2 text-muted text-[11px]">{c.g1970}</td>
              <td className="py-2 px-2 text-muted text-[11px]">{c.g2000}</td>
              <td className="py-2 px-2 text-muted text-[11px]">{c.g2026}</td>
              <td className="py-2 px-2">
                <span className={clsx('pill text-[10px]',
                  c.trend === 'up' ? 'pill-up' : c.trend === 'dn' ? 'pill-down' : 'pill-flat',
                )}>
                  {c.trend === 'up' ? 'More expensive' : c.trend === 'dn' ? 'Cheaper' : 'Flat'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function HistoricalPanel() {
  return (
    <div className="px-4 pb-4">
      <div className="text-[13px] italic text-secondary mb-3 p-3 bg-gold-dim border-l-2 border-gold rounded-r-lg leading-relaxed">
        Inflation-adjusted to 2026 USD. One Roman soldier&apos;s annual wage (~10 aurei, ~32g gold) still buys approximately the same basket of goods today. Gold has outlasted every fiat system, empire, and monetary regime in recorded history.
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { title: 'Gold — 100 year history (real, 2026 USD)', span: 2 },
          { title: 'Silver/gold ratio — 120 years',             span: 1 },
          { title: 'Gold vs CPI inflation — 50 years (rebased)',span: 1 },
        ].map(c => (
          <div
            key={c.title}
            className="bg-surface-card border border-default rounded-xl p-3"
            style={{ gridColumn: c.span === 2 ? 'span 2' : undefined }}
          >
            <div className="font-display text-[9px] tracking-[0.1em] text-secondary mb-2">{c.title}</div>
            <div className="h-[140px] flex items-center justify-center text-[11px] italic text-muted">
              Chart · live data in production
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── PANEL ROUTER ───────────────────────────────────────────────────────

function PanelContent({ panel }: { panel: string }) {
  switch (panel) {
    case 'overview':    return <OverviewPanel />
    case 'precious':    return <MetalsGridPanel type="precious" />
    case 'base':        return <MetalsGridPanel type="base" />
    case 'commodities': return <CommoditiesPanel />
    case 'history':     return <HistoricalPanel />
    case 'predictions': return (
      <div className="px-4 pb-4">
        <ErrorBoundary fallback={<PanelError message="Failed to load prediction markets." />}>
          <PredictionList />
        </ErrorBoundary>
      </div>
    )
    default:            return <OverviewPanel />
  }
}

// ── PAGE ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const { activePanel, setActivePanel, toastMessage } = useUI()
  const { setSpotPrices, setMeldPrices } = useAurumStore(s => ({
    setSpotPrices: s.setSpotPrices,
    setMeldPrices: s.setMeldPrices,
  }))

  // REST price polling (30s) — baseline
  const { data, isLoading: pricesLoading } = useQuery({
    queryKey:        ['prices'],
    queryFn:         fetchPrices,
    refetchInterval: 30_000,
  })

  useEffect(() => {
    if (data) {
      setSpotPrices(data.metals)
      setMeldPrices(data.tokens)
    }
  }, [data, setSpotPrices, setMeldPrices])

  // WebSocket real-time overlay (Binance PAXG/XAUT stream)
  useRealtimePrices()

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <ErrorBoundary fallback={<TickerSkeleton />}>
        {pricesLoading ? <TickerSkeleton /> : <Ticker />}
      </ErrorBoundary>

      {/* 3-column layout */}
      <div className="flex flex-1 overflow-hidden" style={{ display: 'grid', gridTemplateColumns: '180px 1fr 240px' }}>

        {/* Left nav */}
        <ErrorBoundary>
          <LeftNav />
        </ErrorBoundary>

        {/* Main content */}
        <main className="flex flex-col overflow-y-auto [scrollbar-width:thin]">
          <ErrorBoundary fallback={<ChartSkeleton />}>
            <PriceChart />
          </ErrorBoundary>

          {pricesLoading ? <StatsRowSkeleton /> : <StatsRow />}

          {/* Lower tabs */}
          <div className="flex-shrink-0 flex gap-0.5 px-4 bg-surface-raised border-b border-default">
            {LOWER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActivePanel(tab.key)}
                className={clsx(
                  'font-display text-[8px] tracking-[0.14em] uppercase',
                  'px-3.5 py-2.5 cursor-pointer border-b-2 transition-all',
                  activePanel === tab.key
                    ? 'text-gold border-gold'
                    : 'text-muted border-transparent hover:text-secondary',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 pt-3 overflow-y-auto [scrollbar-width:thin]">
            <ErrorBoundary fallback={<PanelError />}>
              <PanelContent panel={activePanel} />
            </ErrorBoundary>
          </div>
        </main>

        {/* Right panel */}
        <ErrorBoundary>
          <RightPanel />
        </ErrorBoundary>
      </div>

      <Footer />
      <Toast message={toastMessage} />
    </div>
  )
}
