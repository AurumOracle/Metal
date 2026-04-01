'use client'
import { useMemo } from 'react'
import {
  LineChart, AreaChart, BarChart,
  Line, Area, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { useUI, usePrices } from '@/store'
import { Button } from '@/components/ui'
import type { TimeRange, ChartView } from '@/types'
import { clsx } from 'clsx'

const TROY_OZ = 31.1035

// ── DATA GENERATOR (replace with real API calls) ───────────────────────

function genPrices(base: number, vol: number, n: number): number[] {
  let p = base
  return Array.from({ length: n }, () => {
    p += p * (Math.random() - 0.48) * vol
    return +p.toFixed(2)
  })
}

function makeLabels(range: TimeRange): string[] {
  const now = new Date()
  switch (range) {
    case '1D': return Array.from({ length: 24 }, (_, i) => {
      const d = new Date(now); d.setHours(now.getHours() - 23 + i)
      return d.getHours().toString().padStart(2,'0') + ':00'
    })
    case '1W': return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - 6 + i)
      return d.toLocaleDateString('en', { weekday: 'short' })
    })
    case '1M': return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - 29 + i)
      return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
    })
    case '3M': return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - 89 + i * 7)
      return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
    })
    case '6M': return Array.from({ length: 24 }, (_, i) => {
      const d = new Date(now); d.setDate(now.getDate() - 179 + i * 7)
      return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
    })
    case '1Y': return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now); d.setMonth(now.getMonth() - 11 + i)
      return d.toLocaleDateString('en', { month: 'short', year: '2-digit' })
    })
    case '5Y': return Array.from({ length: 20 }, (_, i) => {
      const d = new Date(now); d.setMonth(now.getMonth() - 59 + i * 3)
      return d.toLocaleDateString('en', { month: 'short', year: '2-digit' })
    })
    case 'ALL': return ['1980','1985','1990','1995','2000','2005','2008','2010','2012','2015','2018','2020','2022','2024','2026']
  }
}

function makePrices(range: TimeRange): number[] {
  const configs: Record<TimeRange, [number, number]> = {
    '1D': [3100,.002], '1W': [3060,.004], '1M': [2980,.005], '3M': [2800,.006],
    '6M': [2600,.007], '1Y': [2300,.008], '5Y': [1800,.01],
    'ALL': [850,.015],
  }
  const [base, vol] = configs[range]
  const prices = genPrices(base, vol, makeLabels(range).length)
  prices[prices.length - 1] = 3142.80 // pin to current price
  return prices
}

// ── CUSTOM TOOLTIP ─────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-raised border border-gold rounded-lg px-3 py-2 text-[11px]">
      <div className="font-display text-[9px] text-muted mb-1">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5" style={{ color: p.color }}>
          <span>{p.name}:</span>
          <span className="font-light">${p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

// ── CHART TOOLBAR ──────────────────────────────────────────────────────

const TIME_RANGES: TimeRange[] = ['1D','1W','1M','3M','6M','1Y','5Y','ALL']
const VIEWS: { key: ChartView; label: string }[] = [
  { key: 'line', label: '∿ Line' },
  { key: 'area', label: '▲ Area' },
  { key: 'bar',  label: '▌Bars'  },
]
const OVERLAYS = [
  { key: 'silver', label: '+ Silver', color: '#D4DCE4' },
  { key: 'paxg',   label: '+ PAXG',   color: '#5BAD8A' },
  { key: 'xaut',   label: '+ XAUT',   color: '#00B4D8' },
  { key: 'mcau',   label: '+ MCAU',   color: '#E8C97A' },
]

// ── MAIN CHART ─────────────────────────────────────────────────────────

export function PriceChart() {
  const {
    chartTimeRange, chartView, chartOverlays, chartExpanded,
    setChartTimeRange, setChartView, toggleOverlay, setChartExpanded,
  } = useUI()
  const { spotPrices } = usePrices()

  const spotXAG = spotPrices.find(p => p.symbol === 'XAG')?.priceUSD ?? 33.42

  const chartData = useMemo(() => {
    const labels = makeLabels(chartTimeRange)
    const xauPrices = makePrices(chartTimeRange)
    return labels.map((label, i) => {
      const xau = xauPrices[i]
      const entry: Record<string, number | string> = { label, XAU: xau }
      if (chartOverlays.silver) entry['Silver'] = +(xau * (spotXAG / 3142.80) * (1 + (Math.random() - 0.5) * 0.001)).toFixed(2)
      if (chartOverlays.paxg)   entry['PAXG']   = +(xau * 0.9988 * (1 + (Math.random() - 0.5) * 0.001)).toFixed(2)
      if (chartOverlays.xaut)   entry['XAUT']   = +(xau * 0.9994 * (1 + (Math.random() - 0.5) * 0.001)).toFixed(2)
      if (chartOverlays.mcau)   entry['MCAU×31']= +(xau * (101.04/3142.80) * 31 * (1 + (Math.random() - 0.5) * 0.001)).toFixed(2)
      return entry
    })
  }, [chartTimeRange, chartOverlays, spotXAG])

  const hasOverlays = Object.values(chartOverlays).some(Boolean)
  const chartHeight = chartExpanded ? 460 : 280

  const commonAxisProps = {
    stroke:    'transparent',
    tick:      { fill: '#5E5A56', fontSize: 9, fontFamily: "'Cinzel', serif" },
    tickLine:  false,
    axisLine:  false,
  }

  const gridProps = {
    stroke: 'rgba(255,255,255,0.03)',
    strokeDasharray: '0',
  }

  const tooltipStyle = {
    contentStyle: { background: 'none', border: 'none' },
    cursor: { stroke: 'rgba(201,168,76,0.2)', strokeWidth: 1 },
  }

  function renderChart() {
    const sharedProps = {
      data: chartData,
      margin: { top: 4, right: 8, bottom: 0, left: 0 },
    }

    if (chartView === 'bar') {
      return (
        <BarChart {...sharedProps}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...commonAxisProps} />
          <YAxis {...commonAxisProps} orientation="right" domain={['auto', 'auto']} />
          <Tooltip {...tooltipStyle} content={<CustomTooltip />} />
          <Bar dataKey="XAU" fill="rgba(201,168,76,0.45)" radius={[2,2,0,0]} />
        </BarChart>
      )
    }

    if (chartView === 'area') {
      return (
        <AreaChart {...sharedProps}>
          <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#C9A84C" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#C9A84C" stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="label" {...commonAxisProps} />
          <YAxis {...commonAxisProps} orientation="right" domain={['auto', 'auto']} />
          <Tooltip {...tooltipStyle} content={<CustomTooltip />} />
          {hasOverlays && <Legend wrapperStyle={{ fontSize: 8, fontFamily: "'Cinzel', serif", color: '#5E5A56' }} />}
          <Area type="monotone" dataKey="XAU" stroke="#C9A84C" strokeWidth={1.8} fill="url(#goldGrad)" dot={false} activeDot={{ r: 4, fill: '#C9A84C' }} />
          {chartOverlays.silver && <Area type="monotone" dataKey="Silver" stroke="#D4DCE4" strokeWidth={1.2} fill="none" strokeDasharray="4 3" dot={false} />}
          {chartOverlays.paxg   && <Area type="monotone" dataKey="PAXG"   stroke="#5BAD8A" strokeWidth={1.2} fill="none" strokeDasharray="2 3" dot={false} />}
          {chartOverlays.xaut   && <Area type="monotone" dataKey="XAUT"   stroke="#00B4D8" strokeWidth={1.2} fill="none" strokeDasharray="6 2" dot={false} />}
          {chartOverlays.mcau   && <Area type="monotone" dataKey="MCAU×31" stroke="#E8C97A" strokeWidth={1}   fill="none" strokeDasharray="3 3" dot={false} />}
        </AreaChart>
      )
    }

    return (
      <LineChart {...sharedProps}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...commonAxisProps} />
        <YAxis {...commonAxisProps} orientation="right" domain={['auto', 'auto']} />
        <Tooltip {...tooltipStyle} content={<CustomTooltip />} />
        {hasOverlays && <Legend wrapperStyle={{ fontSize: 8, fontFamily: "'Cinzel', serif", color: '#5E5A56' }} />}
        <Line type="monotone" dataKey="XAU" stroke="#C9A84C" strokeWidth={1.8} dot={false} activeDot={{ r: 4, fill: '#C9A84C' }} />
        {chartOverlays.silver && <Line type="monotone" dataKey="Silver" stroke="#D4DCE4" strokeWidth={1.2} strokeDasharray="4 3" dot={false} />}
        {chartOverlays.paxg   && <Line type="monotone" dataKey="PAXG"   stroke="#5BAD8A" strokeWidth={1.2} strokeDasharray="2 3" dot={false} />}
        {chartOverlays.xaut   && <Line type="monotone" dataKey="XAUT"   stroke="#00B4D8" strokeWidth={1.2} strokeDasharray="6 2" dot={false} />}
        {chartOverlays.mcau   && <Line type="monotone" dataKey="MCAU×31" stroke="#E8C97A" strokeWidth={1}   strokeDasharray="3 3" dot={false} />}
      </LineChart>
    )
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-shrink-0 items-center gap-1.5 flex-wrap px-4 py-2 bg-surface-raised border-b border-default">
        <span className="font-display text-[11px] tracking-[0.12em] text-secondary mr-1">
          XAU / USD
        </span>

        {/* Time range */}
        <div className="flex gap-0.5">
          {TIME_RANGES.map(r => (
            <button
              key={r}
              onClick={() => setChartTimeRange(r)}
              className={clsx(
                'font-display text-[8px] tracking-[0.1em] px-2 py-1 rounded cursor-pointer transition-all border',
                chartTimeRange === r
                  ? 'bg-surface-hover text-gold border-default'
                  : 'bg-transparent text-muted border-transparent hover:text-secondary',
              )}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-default mx-0.5" />

        {/* View mode */}
        <div className="flex gap-0.5">
          {VIEWS.map(v => (
            <button
              key={v.key}
              onClick={() => setChartView(v.key)}
              className={clsx(
                'font-display text-[8px] tracking-[0.08em] px-2 py-1 rounded cursor-pointer transition-all border',
                chartView === v.key
                  ? 'bg-gold-dim text-gold border-gold'
                  : 'bg-transparent text-muted border-default hover:text-secondary',
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-default mx-0.5" />

        {/* Overlays */}
        {OVERLAYS.map(o => (
          <button
            key={o.key}
            onClick={() => toggleOverlay(o.key)}
            className={clsx(
              'font-display text-[8px] tracking-[0.08em] px-2 py-1 rounded cursor-pointer transition-all border',
              chartOverlays[o.key]
                ? 'bg-gold-dim text-gold border-gold'
                : 'bg-transparent text-muted border-default hover:text-secondary',
            )}
            style={chartOverlays[o.key] ? { borderColor: o.color, color: o.color } : {}}
          >
            {o.label}
          </button>
        ))}

        <div className="w-px h-4 bg-default mx-0.5" />

        <button
          onClick={() => setChartExpanded(!chartExpanded)}
          className="font-display text-[8px] tracking-[0.08em] px-2 py-1 rounded cursor-pointer transition-all border border-default text-muted hover:text-secondary"
        >
          {chartExpanded ? '⊟ Collapse' : '⊞ Expand'}
        </button>
      </div>

      {/* OHLC strip */}
      <div className="flex gap-5 flex-wrap items-center px-4 py-1.5 bg-surface-raised border-b border-default text-[12px]">
        {[
          { label: 'Open',     value: '$3,116.40', cls: '' },
          { label: 'High',     value: '$3,148.90', cls: 'text-up' },
          { label: 'Low',      value: '$3,108.20', cls: 'text-down' },
          { label: 'Close',    value: '$3,142.80', cls: '' },
          { label: 'Change',   value: '+$26.40 (+0.84%)', cls: 'text-up' },
          { label: 'Vol 24h',  value: '$148.2B',   cls: '' },
        ].map(item => (
          <div key={item.label} className="flex flex-col gap-0.5">
            <span className="font-display text-[8px] tracking-[0.14em] text-muted">{item.label}</span>
            <span className={clsx('font-light', item.cls || 'text-primary')}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="px-4 py-3">
        <div
          className="bg-surface-card border border-default rounded-xl p-4 transition-all duration-300"
          style={{ height: chartHeight }}
        >
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
