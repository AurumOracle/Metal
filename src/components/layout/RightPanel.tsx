'use client'
import { TradeWidget } from '@/components/trade/TradeWidget'
import { SectionLabel, LiveDot, ChangeText } from '@/components/ui'
import { PremiumGate } from '@/hooks/useSession'
import { usePoolPrice } from '@/hooks'
import { usePrices } from '@/store'
import { calcSpread } from '@/lib/prices'
import { TROY_OZ_TO_GRAMS } from '@/types'
import { clsx } from 'clsx'

// ── ARB ALERTS ─────────────────────────────────────────────────────────

function ArbAlerts() {
  const { getSpotPrice } = usePrices()
  const goldPool  = usePoolPrice('gold')
  const silverPool = usePoolPrice('silver')

  const xauSpot = getSpotPrice('XAU') || 3142.80
  const xagSpot = getSpotPrice('XAG') || 33.42

  // Pool price is in ALGO/gram — we need USD/gram to compare to spot
  // For now show spread if available, else static fallback
  const goldPoolPriceAlgo = goldPool.data
  const silverPoolPriceAlgo = silverPool.data

  const spotGoldPerGram   = xauSpot / TROY_OZ_TO_GRAMS
  const spotSilverPerGram = xagSpot / TROY_OZ_TO_GRAMS

  const alerts = [
    {
      label:    'MCAU on-chain',
      assetLabel: 'MCAU · Tinyman DEX',
      spread:   goldPoolPriceAlgo ? '~Live' : '−$0.08/g',
      sub:      goldPoolPriceAlgo
        ? `Pool price: ${goldPoolPriceAlgo.toFixed(4)} ALGO/g`
        : 'vs spot gold · fetching…',
      positive: false,
    },
    {
      label:    'MSOS on-chain',
      assetLabel: 'MSOS · Tinyman DEX',
      spread:   silverPoolPriceAlgo ? '~Live' : '+$0.02/g',
      sub:      silverPoolPriceAlgo
        ? `Pool price: ${silverPoolPriceAlgo.toFixed(4)} ALGO/g`
        : 'vs spot silver · fetching…',
      positive: true,
    },
  ]

  return (
    <div className="rsec px-3.5 py-3 border-b border-default">
      <div className="flex items-center justify-between mb-2.5">
        <SectionLabel>Live arb spreads</SectionLabel>
        <a
          href="https://app.tinyman.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[9px] italic text-algo hover:underline"
        >
          Tinyman ↗
        </a>
      </div>
      {alerts.map((a, i) => (
        <div
          key={i}
          className={clsx(
            'rounded-lg p-2.5 mb-2 last:mb-0 border',
            a.positive
              ? 'bg-[rgba(91,173,138,0.07)] border-up'
              : 'bg-[rgba(196,95,95,0.07)] border-down',
          )}
        >
          <div className={clsx(
            'font-display text-[8px] tracking-[0.12em] uppercase mb-0.5',
            a.positive ? 'text-up' : 'text-down',
          )}>
            {a.label}
          </div>
          <div className={clsx(
            'text-[18px] font-light mb-0.5',
            a.positive ? 'text-up' : 'text-down',
          )}>
            {a.spread}
          </div>
          <div className="text-[10px] italic text-muted">{a.sub}</div>
        </div>
      ))}
    </div>
  )
}

// ── XPC TOKEN ──────────────────────────────────────────────────────────

function XPCToken() {
  const stats = [
    { k: 'Total supply', v: '100,000,000 XPC', color: '#C9A84C' },
    { k: 'Burned',       v: '−48,320 XPC',     color: '#C45F5F' },
    { k: 'Circulating',  v: '99,951,680 XPC',  color: undefined },
    { k: 'Token price',  v: '$0.00142',         color: '#5BAD8A' },
    { k: 'Market cap',   v: '$141,930',         color: undefined },
  ]

  return (
    <div className="px-3.5 py-3 border-b border-default">
      <SectionLabel className="mb-2.5">XPC Token · XP Club</SectionLabel>

      <div className={clsx(
        'bg-surface-card border border-gold rounded-xl p-3',
        'mb-3',
      )}>
        <div className="space-y-1.5">
          {stats.map(s => (
            <div key={s.k} className="flex justify-between items-center text-[11px]">
              <span className="text-muted">{s.k}</span>
              <span
                className="font-display text-[10px] tracking-[0.06em]"
                style={{ color: s.color ?? 'var(--text-primary)' }}
              >
                {s.v}
              </span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="mt-2.5 h-[2px] bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: '52%',
              background: 'linear-gradient(90deg, #C9A84C, #E8C97A)',
            }}
          />
        </div>
        <div className="text-[9px] italic text-muted mt-1">52% public sale complete</div>
      </div>

      {/* NFD segment */}
      <div className="bg-algo-dim border border-algo rounded-xl p-3">
        <div className="flex items-center gap-1.5 font-display text-[8px] tracking-[0.14em] text-algo uppercase mb-2">
          <LiveDot color="algo" />
          xpc.algo · NFD segments
        </div>
        <p className="text-[11px] italic text-secondary leading-relaxed mb-2.5">
          Mint{' '}
          <strong className="not-italic font-normal text-primary">you.xpc.algo</strong>
          {' '}using XPC tokens. Your permanent on-chain identity across Aurum Oracle.
        </p>
        <a
          href="https://app.nf.domains/name/xpc.algo?view=segments"
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            'block text-center font-display text-[8px] tracking-[0.12em] text-algo',
            'bg-[rgba(0,180,216,0.08)] border border-algo rounded py-1.5',
            'hover:bg-[rgba(0,180,216,0.18)] transition-colors',
          )}
        >
          Mint xpc.algo segment →
        </a>
      </div>
    </div>
  )
}

// ── SPONSOR ────────────────────────────────────────────────────────────

function SponsorRight() {
  return (
    <div className="px-3.5 py-3">
      <SectionLabel className="mb-2.5">Advertisement</SectionLabel>
      <a
        href="https://www.cbdgold.io"
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(
          'block rounded-xl overflow-hidden border cursor-pointer transition-all duration-200',
          'border-[rgba(0,200,80,0.18)] hover:border-[rgba(0,200,80,0.38)]',
        )}
        style={{ background: 'linear-gradient(150deg,#0a180d,#0f2215)' }}
      >
        <div className="label px-3 pt-2.5 pb-0 text-[rgba(255,255,255,0.25)]">Sponsor</div>
        <div className="p-3 pt-2">
          <div
            className="font-display text-[13px] font-bold tracking-[0.08em] mb-1"
            style={{
              background: 'linear-gradient(120deg,#00C853,#C9A84C)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            CBDGold.io
          </div>
          <div className="text-[10px] italic text-[rgba(180,255,180,0.5)] mb-2">
            Cryptography meets cannabis
          </div>
          <div className="text-[10px] italic text-[rgba(160,240,160,0.4)] leading-relaxed mb-2.5">
            Dual-token Algorand ecosystem bridging DeFi and the global cannabis market.
            WEED + HEMP tokens. Carbon-negative. Provenance on-chain.
          </div>
          <div className="flex gap-1 flex-wrap mb-2.5">
            {[
              { t: 'WEED', cls: 'bg-[rgba(0,180,80,0.13)] text-[#00C853] border-[rgba(0,180,80,0.26)]' },
              { t: 'HEMP', cls: 'bg-gold-dim text-gold border-gold' },
              { t: 'ALGO', cls: 'bg-algo-dim text-algo border-algo' },
            ].map(p => (
              <span key={p.t} className={clsx(
                'font-display text-[8px] tracking-[0.1em] px-1.5 py-0.5 rounded-full border',
                p.cls,
              )}>
                {p.t}
              </span>
            ))}
          </div>
          <div className={clsx(
            'text-center font-display text-[8px] tracking-[0.12em] text-[#00C853]',
            'bg-[rgba(0,180,80,0.09)] border border-[rgba(0,180,80,0.22)] rounded py-1',
          )}>
            Visit cbdgold.io →
          </div>
        </div>
      </a>
    </div>
  )
}

// ── RIGHT PANEL ────────────────────────────────────────────────────────

export function RightPanel() {
  return (
    <aside className={clsx(
      'border-l border-default overflow-y-auto',
      'flex flex-col',
      '[scrollbar-width:thin]',
    )}>
      <div className="px-3.5 py-3 border-b border-default">
        <div className="flex items-center justify-between mb-2.5">
          <SectionLabel>Trade via Meld Gold</SectionLabel>
          <a
            href="https://meld.gold"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] italic text-algo hover:underline"
          >
            meld.gold ↗
          </a>
        </div>
        <TradeWidget />
      </div>

      <PremiumGate
        fallback={
          <div className="px-3.5 py-3 border-b border-default">
            <div className="flex items-center justify-between mb-2">
              <SectionLabel>Arb alerts</SectionLabel>
              <a href="/premium" className="text-[9px] italic text-algo hover:underline">Premium →</a>
            </div>
            <div className="rounded-lg border border-dashed border-default p-4 text-center">
              <div className="text-[11px] italic text-muted mb-2">Real-time arb alerts</div>
              <a href="/premium" className="font-display text-[8px] tracking-[0.12em] uppercase text-gold hover:underline">
                Unlock with Premium
              </a>
            </div>
          </div>
        }
      >
        <ArbAlerts />
      </PremiumGate>
      <XPCToken />
      <SponsorRight />
    </aside>
  )
}
