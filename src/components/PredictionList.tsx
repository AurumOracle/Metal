'use client'

import { useState } from 'react'
import { useAurum } from '@/store'
import type { Market } from '@/types'
import { CommentsSection } from './CommentsSection'

function countdown(closesAt: number): string {
  const diff = closesAt - Date.now() / 1000
  if (diff <= 0) return 'Closed'
  const d = Math.floor(diff / 86400)
  const h = Math.floor((diff % 86400) / 3600)
  const m = Math.floor((diff % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function PredictionCard({ market }: { market: Market }) {
  const wallet = useAurum((s) => s.wallet)
  const [userVote, setUserVote] = useState<'YES' | 'NO' | null>(null)
  const [stakeAmount, setStakeAmount] = useState(100)
  const [showComments, setShowComments] = useState(false)

  const totalPool = market.yes_pool + market.no_pool
  const yesPct = totalPool > 0 ? (market.yes_pool / totalPool) * 100 : 50
  const noPct = 100 - yesPct

  const handleVote = (vote: 'YES' | 'NO') => {
    if (!wallet) {
      alert('Connect your wallet to vote')
      return
    }
    setUserVote(vote)
    // In production: build vote txn → sign → send
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <span className="mr-2 rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">
            {market.category}
          </span>
          <span className="text-[10px] text-slate-500">{countdown(market.closes_at)}</span>
        </div>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
            market.status === 'OPEN'
              ? 'bg-green-900/50 text-green-400'
              : market.status === 'RESOLVED'
              ? 'bg-gold-900/50 text-gold-400'
              : 'bg-red-900/50 text-red-400'
          }`}
        >
          {market.status}
        </span>
      </div>

      <h4 className="mb-3 text-sm font-medium text-slate-100">{market.question}</h4>

      {/* Probability bar */}
      <div className="mb-3">
        <div className="flex h-6 overflow-hidden rounded-full">
          <div
            className="flex items-center justify-center bg-green-600 text-xs font-medium text-white transition-all"
            style={{ width: `${yesPct}%` }}
          >
            {yesPct.toFixed(0)}%
          </div>
          <div
            className="flex items-center justify-center bg-red-600 text-xs font-medium text-white transition-all"
            style={{ width: `${noPct}%` }}
          >
            {noPct.toFixed(0)}%
          </div>
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-slate-500">
          <span>YES: {market.yes_pool.toLocaleString()} XPC</span>
          <span>NO: {market.no_pool.toLocaleString()} XPC</span>
        </div>
      </div>

      {/* Vote buttons */}
      {market.status === 'OPEN' && (
        <div className="mb-3 flex gap-2">
          <button
            onClick={() => handleVote('YES')}
            disabled={!!userVote}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              userVote === 'YES'
                ? 'bg-green-600 text-white'
                : 'border border-green-600 text-green-400 hover:bg-green-600/20'
            }`}
          >
            YES
          </button>
          <button
            onClick={() => handleVote('NO')}
            disabled={!!userVote}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              userVote === 'NO'
                ? 'bg-red-600 text-white'
                : 'border border-red-600 text-red-400 hover:bg-red-600/20'
            }`}
          >
            NO
          </button>
        </div>
      )}

      {/* Stake adjuster (if voted) */}
      {userVote && (
        <div className="mb-3 flex items-center gap-2 text-xs">
          <span className="text-slate-400">Stake:</span>
          <input
            type="range"
            min={10}
            max={1000}
            step={10}
            value={stakeAmount}
            onChange={(e) => setStakeAmount(parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-gold-400">{stakeAmount} XPC</span>
        </div>
      )}

      {/* Reward indicator */}
      {userVote && (
        <div className="mb-3 rounded border border-gold-500/30 bg-gold-500/10 p-2 text-center text-xs text-gold-400">
          +50 XPC reward if correct
        </div>
      )}

      {/* Comments toggle */}
      <button
        onClick={() => setShowComments(!showComments)}
        className="text-xs text-slate-500 hover:text-slate-300"
      >
        💬 Comments {showComments ? '▴' : '▾'}
      </button>

      {showComments && <CommentsSection marketId={market.id} />}
    </div>
  )
}

export function PredictionList() {
  const markets = useAurum((s) => s.markets)
  const [filter, setFilter] = useState<'all' | 'spot' | 'ratio' | 'tokenized'>('all')

  const filtered = filter === 'all' ? markets : markets.filter((m) => m.category === filter)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-100">Prediction Markets</h2>
        <div className="flex gap-1">
          {(['all', 'spot', 'ratio', 'tokenized'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded px-2 py-0.5 text-xs capitalize ${
                filter === f ? 'bg-gold-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.map((m) => <PredictionCard key={m.id} market={m} />)
        ) : (
          <p className="text-sm text-slate-500">No markets available</p>
        )}
      </div>
    </div>
  )
}
