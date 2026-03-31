'use client'

import Link from 'next/link'
import { useAurum } from '@/store'

const TIERS = [
  { name: 'Free', price: 0, features: ['Spot prices (30s delay)', '3 predictions/day', 'Basic charts', 'Community comments'] },
  { name: 'Silver', price: 500, unit: 'XPC/mo', features: ['Real-time prices', 'Unlimited predictions', 'Advanced charts & overlays', 'Priority comments', 'Historical data (1Y)', 'Email alerts'] },
  { name: 'Gold', price: 2000, unit: 'XPC/mo', features: ['Everything in Silver', 'WebSocket live feed', 'API access', 'Historical data (All)', 'Custom alerts', 'Leaderboard badge', 'Early market access'] },
]

export function PremiumGate({
  tier = 'Silver',
  children,
}: {
  tier?: 'Silver' | 'Gold'
  children: React.ReactNode
}) {
  const premium = useAurum((s) => s.premium)
  const wallet = useAurum((s) => s.wallet)

  // Premium is currently a boolean — when premium tiers are implemented,
  // this will check the specific tier level
  const hasAccess = premium

  if (hasAccess) return <>{children}</>

  return (
    <div className="relative">
      {/* Blurred content preview */}
      <div className="pointer-events-none select-none blur-sm">{children}</div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
        <div className="rounded-lg border border-gold-500/30 bg-slate-800 p-6 text-center shadow-xl">
          <div className="mb-2 text-2xl">🔒</div>
          <h3 className="mb-1 text-sm font-semibold text-gold-400">
            {tier} Feature
          </h3>
          <p className="mb-3 text-xs text-slate-400">
            {wallet
              ? `Upgrade to ${tier} to unlock this feature`
              : 'Connect your wallet to access premium features'}
          </p>
          {wallet ? (
            <Link
              href="/premium"
              className="inline-block rounded bg-gold-500 px-4 py-1.5 text-xs font-medium text-slate-900 hover:bg-gold-400"
            >
              Upgrade to {tier}
            </Link>
          ) : (
            <p className="text-[10px] text-slate-500">Connect wallet first →</p>
          )}
        </div>
      </div>
    </div>
  )
}
