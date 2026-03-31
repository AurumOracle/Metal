'use client'

import { useState } from 'react'
import { useAurum } from '@/store'

const TROY_OZ = 31.1035

type TimeRange = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'All'
type ChartMode = 'line' | 'area' | 'bar'

export function PriceChart() {
  const prices = useAurum((s) => s.prices)
  const [timeRange, setTimeRange] = useState<TimeRange>('1M')
  const [chartMode, setChartMode] = useState<ChartMode>('area')
  const [overlays, setOverlays] = useState<string[]>([])
  const [expanded, setExpanded] = useState(false)

  const goldPrice = prices['SPOT_GOLD']?.price || 101
  const silverPrice = prices['SPOT_SILVER']?.price || 1.07
  const goldPriceOz = goldPrice * TROY_OZ
  const silverPriceOz = silverPrice * TROY_OZ

  const toggleOverlay = (name: string) => {
    setOverlays((prev) =>
      prev.includes(name) ? prev.filter((o) => o !== name) : [...prev, name]
    )
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/80">
      {/* Header strip — OHLC */}
      <div className="flex items-center gap-4 border-b border-slate-700 px-4 py-2 text-xs">
        <button className="font-medium text-gold-400">SPOT GOLD</button>
        <span className="text-slate-400">
          O <span className="text-slate-200">${(goldPriceOz - 5).toFixed(2)}</span>
        </span>
        <span className="text-slate-400">
          H <span className="text-green-400">${(goldPriceOz + 12).toFixed(2)}</span>
        </span>
        <span className="text-slate-400">
          L <span className="text-red-400">${(goldPriceOz - 18).toFixed(2)}</span>
        </span>
        <span className="text-slate-400">
          C <span className="text-slate-200">${goldPriceOz.toFixed(2)}</span>
        </span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700 px-4 py-2">
        {/* Time ranges */}
        <div className="flex gap-1">
          {(['1D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'All'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`rounded px-2 py-0.5 text-xs ${
                timeRange === range
                  ? 'bg-gold-500 text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Chart mode */}
        <div className="flex gap-1">
          {(['line', 'area', 'bar'] as ChartMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setChartMode(mode)}
              className={`rounded px-2 py-0.5 text-xs capitalize ${
                chartMode === mode
                  ? 'bg-slate-600 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-2 rounded px-2 py-0.5 text-xs text-slate-400 hover:text-slate-200"
          >
            {expanded ? '↙' : '↗'} Expand
          </button>
        </div>
      </div>

      {/* Overlays */}
      <div className="flex gap-2 border-b border-slate-700 px-4 py-1.5">
        {['Silver', 'PAXG', 'XAUT', 'MCAU'].map((name) => (
          <button
            key={name}
            onClick={() => toggleOverlay(name)}
            className={`rounded-full px-2 py-0.5 text-[10px] ${
              overlays.includes(name)
                ? 'bg-teal-600 text-white'
                : 'border border-slate-600 text-slate-400'
            }`}
          >
            + {name}
          </button>
        ))}
      </div>

      {/* Chart Area */}
      <div
        className={`relative bg-slate-900/50 ${expanded ? 'h-[520px]' : 'h-64'}`}
        style={{ transition: 'height 0.3s' }}
      >
        {/* SVG chart placeholder — in production use Chart.js or Recharts */}
        <svg className="h-full w-full" viewBox="0 0 800 300" preserveAspectRatio="none">
          <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f7a935" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f7a935" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Main gold line */}
          <path
            d="M0,200 L50,180 L100,190 L150,170 L200,160 L250,140 L300,150 L350,130 L400,120 L450,110 L500,100 L550,90 L600,80 L650,85 L700,70 L750,60 L800,50"
            fill={chartMode === 'area' ? 'url(#goldGrad)' : 'none'}
            stroke="#f7a935"
            strokeWidth="2"
          />
          {/* Silver overlay */}
          {overlays.includes('Silver') && (
            <path
              d="M0,220 L50,210 L100,215 L150,205 L200,195 L250,190 L300,185 L350,175 L400,170 L450,160 L500,155 L550,150 L600,145 L650,140 L700,135 L750,130 L800,125"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="4,2"
            />
          )}
        </svg>

        {/* Price label */}
        <div className="absolute right-4 top-4 rounded bg-slate-800/90 px-2 py-1 text-xs text-gold-400">
          ${goldPriceOz.toFixed(2)}/ozt
        </div>
      </div>

      {/* Mini charts row */}
      <div className="grid grid-cols-4 gap-px border-t border-slate-700 bg-slate-700">
        {[
          { label: 'Gold vs Silver', change: '+2.1%' },
          { label: 'PAXG vs XAUT', change: '+0.3%' },
          { label: 'MCAU Spread', change: '-0.1%' },
          { label: 'Gold vs S&P', change: '+4.7%' },
        ].map((item) => (
          <div key={item.label} className="bg-slate-800 p-2 text-center">
            <div className="text-[10px] text-slate-400">{item.label}</div>
            <div
              className={`text-xs font-medium ${
                item.change.startsWith('+') ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {item.change}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
