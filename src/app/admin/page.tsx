'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useAurum } from '@/store'
import { useMarkets } from '@/hooks'

const RESOLUTIONS = ['YES', 'NO', 'VOID'] as const

export default function AdminPage() {
  const wallet = useAurum((s) => s.wallet)
  const { data: markets } = useMarkets()
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null)
  const [resolution, setResolution] = useState<typeof RESOLUTIONS[number]>('YES')
  const [newQuestion, setNewQuestion] = useState('')
  const [newCategory, setNewCategory] = useState('spot')
  const [newDeadline, setNewDeadline] = useState('')

  // Simple admin check — in production this would be on-chain role verification
  const ADMIN_ADDRESSES = [
    process.env.NEXT_PUBLIC_ADMIN_ADDRESS || '',
  ]
  const isAdmin = wallet && ADMIN_ADDRESSES.includes(wallet)

  if (!wallet) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-900">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-3 text-3xl">🔐</div>
            <h1 className="text-lg font-semibold text-slate-200">Admin Dashboard</h1>
            <p className="mt-1 text-xs text-slate-400">
              Connect an authorized wallet to access admin controls.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-900">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mb-3 text-3xl">⛔</div>
            <h1 className="text-lg font-semibold text-slate-200">Access Denied</h1>
            <p className="mt-1 text-xs text-slate-400">
              Wallet {wallet.slice(0, 8)}... is not authorized for admin access.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gold-400">Admin Dashboard</h1>
          <span className="rounded bg-red-900/30 px-2 py-0.5 text-[10px] font-medium text-red-400">
            ADMIN
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Market Resolution */}
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
            <h2 className="mb-3 text-sm font-semibold text-gold-400">Resolve Markets</h2>

            <div className="mb-3 space-y-2">
              {(markets || [])
                .filter((m: any) => m.status === 'active')
                .map((m: any) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMarket(m.id)}
                    className={`w-full rounded border p-2 text-left text-xs ${
                      selectedMarket === m.id
                        ? 'border-gold-500/50 bg-gold-500/5'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-slate-200">{m.question}</div>
                    <div className="mt-0.5 text-[10px] text-slate-500">
                      YES: {m.yes_pool} | NO: {m.no_pool}
                    </div>
                  </button>
                ))}
            </div>

            {selectedMarket && (
              <div className="border-t border-slate-700 pt-3">
                <div className="mb-2 flex gap-2">
                  {RESOLUTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setResolution(r)}
                      className={`rounded px-3 py-1 text-xs font-medium ${
                        resolution === r
                          ? r === 'YES'
                            ? 'bg-green-600 text-white'
                            : r === 'NO'
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-600 text-white'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <button className="w-full rounded bg-gold-500 py-2 text-xs font-medium text-slate-900 hover:bg-gold-400">
                  Resolve as {resolution}
                </button>
              </div>
            )}
          </div>

          {/* Create Market */}
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
            <h2 className="mb-3 text-sm font-semibold text-gold-400">Create Market</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-[10px] text-slate-400">Question</label>
                <input
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="Will gold exceed $X by date?"
                  className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-xs text-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[10px] text-slate-400">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="spot">Spot Price</option>
                    <option value="ratio">Ratio</option>
                    <option value="tokenized">Tokenized</option>
                    <option value="macro">Macro</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-slate-400">Deadline</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>
              <button
                disabled={!newQuestion || !newDeadline}
                className="w-full rounded bg-gold-500 py-2 text-xs font-medium text-slate-900 hover:bg-gold-400 disabled:opacity-50"
              >
                Create Market
              </button>
            </div>
          </div>

          {/* Platform Stats */}
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
            <h2 className="mb-3 text-sm font-semibold text-gold-400">Platform Stats</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Users', value: '—' },
                { label: 'Active Markets', value: (markets || []).filter((m: any) => m.status === 'active').length },
                { label: 'Total Volume', value: '— XPC' },
                { label: 'XPC Burned', value: '— XPC' },
                { label: 'Premium Subs', value: '—' },
                { label: 'Total Comments', value: '—' },
              ].map((stat) => (
                <div key={stat.label} className="rounded border border-slate-600 p-2">
                  <div className="text-[10px] text-slate-500">{stat.label}</div>
                  <div className="text-sm font-medium text-slate-200">{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Oracle Configuration */}
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
            <h2 className="mb-3 text-sm font-semibold text-gold-400">Oracle Config</h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Price Source</span>
                <span className="text-slate-200">GoldAPI.io</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Update Interval</span>
                <span className="text-slate-200">30s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Platform Fee</span>
                <span className="text-slate-200">0.7%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Network</span>
                <span className="text-slate-200">Algorand Testnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">MCAU ASA</span>
                <span className="font-mono text-slate-200">6547014</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
