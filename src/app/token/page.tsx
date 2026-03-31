'use client'

import Link from 'next/link'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

const DISTRIBUTION = [
  { label: 'Community Rewards', pct: 40, color: '#FFD700', desc: 'Predictions, staking, engagement' },
  { label: 'Treasury', pct: 20, color: '#FFA000', desc: 'Protocol development & operations' },
  { label: 'Team & Advisors', pct: 15, color: '#FF8F00', desc: '2-year vesting, 6-month cliff' },
  { label: 'Public Sale', pct: 15, color: '#E65100', desc: 'Available at launch' },
  { label: 'Liquidity', pct: 10, color: '#BF360C', desc: 'Tinyman DEX pools' },
]

const EARN_TABLE = [
  { action: 'Correct prediction', xpc: '+50', freq: 'Per market' },
  { action: 'Post comment', xpc: '+10', freq: 'Per comment' },
  { action: 'Receive like on comment', xpc: '+2', freq: 'Per like' },
  { action: 'Daily login streak', xpc: '+5', freq: 'Per day' },
  { action: '7-day streak bonus', xpc: '+50', freq: 'Weekly' },
  { action: '30-day streak bonus', xpc: '+500', freq: 'Monthly' },
  { action: 'Rank up', xpc: '+100–1000', freq: 'Per rank' },
  { action: 'Refer a user', xpc: '+25', freq: 'Per referral' },
]

const RANKS = [
  { rank: 'VIII', name: 'Apprentice Assayer', minXP: 0, benefit: 'Basic access' },
  { rank: 'VII', name: 'Ore Seeker', minXP: 500, benefit: '+5% prediction rewards' },
  { rank: 'VI', name: 'Bullion Scout', minXP: 2000, benefit: '+10% rewards, custom avatar frame' },
  { rank: 'V', name: 'Silver Sentinel', minXP: 5000, benefit: '+15% rewards, comment priority' },
  { rank: 'IV', name: 'Mint Warden', minXP: 10000, benefit: '+20% rewards, market creation' },
  { rank: 'III', name: 'Master Goldsmith', minXP: 25000, benefit: '+25% rewards, beta features' },
  { rank: 'II', name: 'Grand Alchemist', minXP: 50000, benefit: '+30% rewards, governance vote' },
  { rank: 'I', name: 'Oracle of the Vault', minXP: 100000, benefit: '+50% rewards, admin nomination' },
]

export default function TokenPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        {/* Hero */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gold-400">XPC Token</h1>
          <p className="mt-2 text-sm text-slate-400">
            The utility token powering Aurum Oracle. Stake, earn, govern.
          </p>
          <div className="mt-4 flex justify-center gap-6">
            <div>
              <div className="text-2xl font-bold text-gold-400">100M</div>
              <div className="text-[10px] text-slate-500">Total Supply</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gold-400">$0.001</div>
              <div className="text-[10px] text-slate-500">Initial Price</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gold-400">$100K</div>
              <div className="text-[10px] text-slate-500">FDV at Launch</div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Token Distribution */}
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
            <h2 className="mb-4 text-sm font-semibold text-gold-400">Supply Distribution</h2>

            {/* Visual bar chart */}
            <div className="mb-4 flex h-6 overflow-hidden rounded-full">
              {DISTRIBUTION.map((d) => (
                <div
                  key={d.label}
                  className="flex items-center justify-center text-[8px] font-bold text-slate-900"
                  style={{ width: `${d.pct}%`, backgroundColor: d.color }}
                  title={`${d.label}: ${d.pct}%`}
                >
                  {d.pct}%
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="space-y-2">
              {DISTRIBUTION.map((d) => (
                <div key={d.label} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="flex-1 text-xs text-slate-300">{d.label}</span>
                  <span className="text-xs font-medium text-slate-200">
                    {(d.pct * 1_000_000).toLocaleString()} XPC
                  </span>
                  <span className="text-[10px] text-slate-500">{d.pct}%</span>
                </div>
              ))}
            </div>

            <p className="mt-3 text-[10px] text-slate-500">
              Team tokens vest linearly over 2 years with a 6-month cliff.
              Community rewards emit over 5 years via smart contract.
            </p>
          </div>

          {/* Earn XPC */}
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
            <h2 className="mb-4 text-sm font-semibold text-gold-400">Earn XPC</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700 text-[10px] text-slate-500">
                  <th className="pb-2 text-left">Action</th>
                  <th className="pb-2 text-right">Reward</th>
                  <th className="pb-2 text-right">Frequency</th>
                </tr>
              </thead>
              <tbody>
                {EARN_TABLE.map((row) => (
                  <tr key={row.action} className="border-b border-slate-700/50">
                    <td className="py-1.5 text-xs text-slate-300">{row.action}</td>
                    <td className="py-1.5 text-right text-xs font-medium text-gold-400">
                      {row.xpc}
                    </td>
                    <td className="py-1.5 text-right text-[10px] text-slate-500">
                      {row.freq}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rank Progression */}
        <div className="mt-6 rounded-lg border border-slate-700 bg-slate-800 p-4">
          <h2 className="mb-4 text-sm font-semibold text-gold-400">Rank Progression</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {RANKS.map((r) => (
              <div
                key={r.rank}
                className="rounded border border-slate-600 p-3 transition-colors hover:border-gold-500/30"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gold-400">{r.rank}</span>
                  <div>
                    <div className="text-xs font-medium text-slate-200">{r.name}</div>
                    <div className="text-[10px] text-slate-500">
                      {r.minXP > 0 ? `${r.minXP.toLocaleString()} XP` : 'Starting rank'}
                    </div>
                  </div>
                </div>
                <p className="mt-1 text-[10px] text-slate-400">{r.benefit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Deflationary Mechanics */}
        <div className="mt-6 rounded-lg border border-slate-700 bg-slate-800 p-4">
          <h2 className="mb-3 text-sm font-semibold text-gold-400">Deflationary Mechanics</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded border border-slate-600 p-3">
              <h3 className="text-xs font-medium text-slate-200">Prediction Fee Burn</h3>
              <p className="mt-1 text-[10px] text-slate-400">
                10% of wrong-side prediction stakes are burned, permanently reducing supply.
              </p>
            </div>
            <div className="rounded border border-slate-600 p-3">
              <h3 className="text-xs font-medium text-slate-200">Premium Subscriptions</h3>
              <p className="mt-1 text-[10px] text-slate-400">
                50% of premium subscription XPC payments are burned.
              </p>
            </div>
            <div className="rounded border border-slate-600 p-3">
              <h3 className="text-xs font-medium text-slate-200">Trade Fee Buyback</h3>
              <p className="mt-1 text-[10px] text-slate-400">
                0.7% platform fees used to buy back and burn XPC on Tinyman.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6 text-center">
          <Link
            href="/sale"
            className="inline-block rounded bg-gold-500 px-6 py-2.5 text-sm font-medium text-slate-900 hover:bg-gold-400"
          >
            Buy XPC Tokens →
          </Link>
          <p className="mt-2 text-[10px] text-slate-500">
            XPC is an Algorand Standard Asset. Trade on{' '}
            <a
              href="https://app.tinyman.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 underline"
            >
              Tinyman DEX
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
