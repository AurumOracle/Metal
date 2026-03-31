'use client'

import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useAurum } from '@/store'

const TIERS = [
  {
    name: 'Free',
    price: '0',
    unit: '',
    highlight: false,
    features: [
      'Spot prices (30s delay)',
      '3 predictions per day',
      'Basic line charts',
      'Community comments',
      'Apprentice Assayer rank',
    ],
    cta: 'Current Plan',
    disabled: true,
  },
  {
    name: 'Silver',
    price: '500',
    unit: 'XPC/mo',
    highlight: true,
    features: [
      'Real-time prices (<1s)',
      'Unlimited predictions',
      'Advanced charts & overlays',
      'Priority comment placement',
      'Historical data (1Y)',
      'Email price alerts',
      'Silver badge on profile',
      'Access to /api endpoint',
    ],
    cta: 'Upgrade to Silver',
    disabled: false,
  },
  {
    name: 'Gold',
    price: '2,000',
    unit: 'XPC/mo',
    highlight: false,
    features: [
      'Everything in Silver',
      'WebSocket live feed',
      'Full API access (1000 req/min)',
      'Historical data (All time)',
      'Custom price alerts',
      'Gold leaderboard badge',
      'Early market access (24h)',
      'Governance proposals',
      'Direct support channel',
    ],
    cta: 'Upgrade to Gold',
    disabled: false,
  },
]

export default function PremiumPage() {
  const wallet = useAurum((s) => s.wallet)
  const xpcBalance = useAurum((s) => s.xpc_balance)

  return (
    <div className="flex min-h-screen flex-col bg-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gold-400">Premium Plans</h1>
          <p className="mt-2 text-sm text-slate-400">
            Unlock advanced features with XPC tokens. All payments are on-chain.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-lg border p-6 ${
                tier.highlight
                  ? 'border-gold-500/50 bg-gold-500/5 ring-1 ring-gold-500/20'
                  : 'border-slate-700 bg-slate-800'
              }`}
            >
              {tier.highlight && (
                <span className="mb-3 inline-block rounded-full bg-gold-500/10 px-2 py-0.5 text-[10px] font-medium text-gold-400">
                  Most Popular
                </span>
              )}
              <h2 className="text-lg font-bold text-slate-100">{tier.name}</h2>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gold-400">{tier.price}</span>
                {tier.unit && (
                  <span className="text-xs text-slate-500">{tier.unit}</span>
                )}
              </div>

              <ul className="mt-4 space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="mt-0.5 text-green-400">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                disabled={tier.disabled || !wallet}
                className={`mt-6 w-full rounded py-2 text-xs font-medium transition-colors ${
                  tier.highlight
                    ? 'bg-gold-500 text-slate-900 hover:bg-gold-400 disabled:opacity-50'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50'
                }`}
              >
                {!wallet ? 'Connect Wallet' : tier.cta}
              </button>
            </div>
          ))}
        </div>

        {wallet && (
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              Your balance: <span className="font-medium text-gold-400">{xpcBalance.toLocaleString()} XPC</span>
            </p>
          </div>
        )}

        <div className="mt-8 rounded-lg border border-slate-700 bg-slate-800 p-4 text-center">
          <h3 className="mb-2 text-sm font-semibold text-slate-200">How Premium Works</h3>
          <div className="grid gap-4 text-xs text-slate-400 md:grid-cols-3">
            <div>
              <span className="text-lg">1️⃣</span>
              <p className="mt-1">Hold XPC tokens in your wallet</p>
            </div>
            <div>
              <span className="text-lg">2️⃣</span>
              <p className="mt-1">Sign a transaction to subscribe</p>
            </div>
            <div>
              <span className="text-lg">3️⃣</span>
              <p className="mt-1">XPC is locked in the premium contract for the month</p>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-slate-500">
            50% of premium XPC is burned. 50% goes to the community rewards pool.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
