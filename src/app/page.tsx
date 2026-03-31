'use client'

import { useEffect, useState } from 'react'
import { useAurum } from '@/store'
import { usePrices, useMarkets } from '@/hooks'
import { Header } from '@/components/Header'
import { PriceChart } from '@/components/PriceChart'
import { TradeWidget } from '@/components/TradeWidget'
import { PredictionList } from '@/components/PredictionList'
import { Leaderboard } from '@/components/Leaderboard'
import { Footer } from '@/components/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { TickerSkeleton } from '@/components/Skeletons'

type DashTab = 'gold' | 'precious' | 'base' | 'vs-gold' | 'historical' | 'predictions'

const DASH_TABS: { id: DashTab; label: string }[] = [
  { id: 'gold', label: 'Gold' },
  { id: 'precious', label: 'Precious Metals' },
  { id: 'base', label: 'Base Metals' },
  { id: 'vs-gold', label: 'Commodities vs Gold' },
  { id: 'historical', label: 'Historical' },
  { id: 'predictions', label: 'Predictions' },
]

const TICKER_ASSETS = [
  { key: 'SPOT_GOLD', label: 'Gold', unit: '/g' },
  { key: 'SPOT_SILVER', label: 'Silver', unit: '/g' },
  { key: 'MCAU', label: 'MCAU', unit: '' },
  { key: 'PAXG', label: 'PAXG', unit: '' },
  { key: 'XAUT', label: 'XAUT', unit: '' },
]

export default function Home() {
  const [dashTab, setDashTab] = useState<DashTab>('gold')
  const prices = useAurum((s) => s.prices)
  const setPrices = useAurum((s) => s.setPrices)
  const setMarkets = useAurum((s) => s.setMarkets)
  const showTrade = useAurum((s) => s.show_trade_widget)

  const { data: pricesData, isLoading: pricesLoading } = usePrices()
  const { data: marketsData } = useMarkets()

  useEffect(() => {
    if (pricesData) setPrices(pricesData)
  }, [pricesData, setPrices])

  useEffect(() => {
    if (marketsData) setMarkets(marketsData)
  }, [marketsData, setMarkets])

  return (
    <div className="flex min-h-screen flex-col bg-slate-900">
      <ErrorBoundary>
        <Header />
      </ErrorBoundary>

      {/* Price ticker strip */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-6 overflow-x-auto px-4 py-2">
          {pricesLoading ? (
            <TickerSkeleton />
          ) : (
            TICKER_ASSETS.map((asset) => {
              const p = prices?.[asset.key]
              return (
                <div key={asset.key} className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-[10px] font-medium text-slate-500">{asset.label}</span>
                  <span className="text-xs font-semibold text-gold-400">
                    ${p?.price?.toFixed(2) || '—'}{asset.unit}
                  </span>
                </div>
              )
            })
          )}
          <div className="ml-auto flex items-center gap-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
            <span className="text-[9px] text-slate-600">Live</span>
          </div>
        </div>
      </div>

      {/* Dashboard tabs */}
      <div className="border-b border-slate-800 bg-slate-800/30">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-1">
          {DASH_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDashTab(tab.id)}
              className={`whitespace-nowrap rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                dashTab === tab.id
                  ? 'bg-gold-500/10 text-gold-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {dashTab === 'predictions' ? (
          <ErrorBoundary>
            <PredictionList />
          </ErrorBoundary>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Chart area — 2 columns */}
            <div className="lg:col-span-2">
              <ErrorBoundary>
                <PriceChart />
              </ErrorBoundary>

              {/* Context panel for selected tab */}
              {dashTab === 'vs-gold' && (
                <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-gold-400">Commodities vs Gold</h3>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {['Oil/Gold', 'S&P/Gold', 'BTC/Gold', 'Silver/Gold'].map((ratio) => (
                      <div key={ratio} className="rounded border border-slate-600 p-2 text-center">
                        <span className="text-[10px] text-slate-400">{ratio}</span>
                        <div className="mt-1 text-sm font-semibold text-slate-200">—</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dashTab === 'historical' && (
                <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-gold-400">Historical Data</h3>
                  <p className="text-xs text-slate-400">
                    Explore gold price history from ancient civilizations to modern markets.
                    Data spanning 50+ years of spot prices with inflation-adjusted values.
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {['1Y Return', '5Y Return', '10Y Return'].map((period) => (
                      <div key={period} className="rounded border border-slate-600 p-2 text-center">
                        <span className="text-[10px] text-slate-400">{period}</span>
                        <div className="mt-1 text-sm font-semibold text-green-400">—</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dashTab === 'base' && (
                <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-gold-400">Base Metals</h3>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {['Copper', 'Aluminum', 'Zinc', 'Nickel'].map((metal) => (
                      <div key={metal} className="rounded border border-slate-600 p-2 text-center">
                        <span className="text-[10px] text-slate-400">{metal}</span>
                        <div className="mt-1 text-sm font-semibold text-slate-200">—</div>
                        <span className="text-[9px] text-slate-500">Coming soon</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dashTab === 'precious' && (
                <div className="mt-4 rounded-lg border border-slate-700 bg-slate-800 p-4">
                  <h3 className="mb-2 text-sm font-semibold text-gold-400">Precious Metals</h3>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {[
                      { name: 'Gold', symbol: 'XAU' },
                      { name: 'Silver', symbol: 'XAG' },
                      { name: 'Platinum', symbol: 'XPT' },
                      { name: 'Palladium', symbol: 'XPD' },
                    ].map((metal) => (
                      <div key={metal.symbol} className="rounded border border-slate-600 p-2 text-center">
                        <span className="text-[10px] text-slate-400">{metal.name}</span>
                        <div className="text-[9px] text-slate-600">{metal.symbol}</div>
                        <div className="mt-1 text-sm font-semibold text-gold-400">
                          ${prices?.[`SPOT_${metal.name.toUpperCase()}`]?.price?.toFixed(2) || '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar — 1 column */}
            <div className="space-y-4">
              {showTrade && (
                <ErrorBoundary>
                  <TradeWidget />
                </ErrorBoundary>
              )}

              <ErrorBoundary>
                <Leaderboard />
              </ErrorBoundary>

              {/* CBDGold sponsor card */}
              <div className="rounded-lg border border-green-900/30 bg-gradient-to-br from-slate-800 to-green-900/10 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[10px] font-medium text-slate-500">SPONSOR</span>
                </div>
                <a
                  href="https://cbdgold.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <h4 className="text-sm font-semibold text-green-400 group-hover:text-green-300">
                    CBDGold.io
                  </h4>
                  <p className="mt-1 text-[10px] text-slate-400">
                    Algorand&apos;s cannabis project. WEED &amp; HEMP tokens.
                    Real-world asset tokenization meets DeFi.
                  </p>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
