import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title:       'Premium · Aurum Oracle',
  description: 'Unlock real-time arb alerts, cross-chain spread monitoring, advanced backtesting, and the full data API. Aurum Oracle Premium.',
}

const PLANS = [
  {
    name:     'Free',
    price:    '$0',
    period:   'forever',
    highlight: false,
    features: [
      'Live gold & silver prices',
      'Precious & base metals data',
      'Commodities vs gold comparison',
      'Historical charts',
      'Prediction markets (limited stake)',
      'On-chain comments & voting',
      'xpc.algo identity',
      'Meld Gold trading (0.7% fee)',
    ],
    cta:      'Get started',
    ctaHref:  '/',
  },
  {
    name:     'Premium',
    price:    '$29',
    period:   'per month',
    highlight: true,
    features: [
      'Everything in Free',
      'Real-time arb spread alerts (push + email)',
      'Cross-chain spread monitor (MCAU vs PAXG vs XAUT)',
      'Strategy backtester — RBI framework',
      'Full OHLCV data export (CSV, JSON)',
      'Premium price feeds (30s refresh)',
      'Advanced chart overlays + indicators',
      'Prediction markets (unlimited stake)',
      'Priority support',
      'Reduced trade fee (0.5%)',
    ],
    cta:      'Start Premium',
    ctaHref:  '#',
  },
  {
    name:     'Enterprise',
    price:    'Custom',
    period:   'contact us',
    highlight: false,
    features: [
      'Everything in Premium',
      'Bespoke data API (white-label ready)',
      'WebSocket real-time price feed',
      'Custom alert rules & webhooks',
      'Execution infrastructure (Algorand + XRPL)',
      'On-chain P&L reporting',
      'Dedicated account manager',
      'SLA guarantee',
      'Trade fee 0.35%',
    ],
    cta:      'Contact us',
    ctaHref:  'mailto:enterprise@AurumOracle.com',
  },
]

const PREMIUM_FEATURES = [
  {
    title:   'Real-time arb alerts',
    desc:    'Instant push notifications when MCAU, PAXG, or XAUT diverge from spot by your configured threshold. Email + webhook support.',
    icon:    '◈',
    color:   'text-up',
  },
  {
    title:   'Cross-chain spread monitor',
    desc:    'Live comparison of MCAU (Algorand) vs PAXG (Ethereum) vs XAUT (XRPL) vs spot gold. Updated every 30 seconds.',
    icon:    '⬡',
    color:   'text-algo',
  },
  {
    title:   'RBI backtester',
    desc:    'Research → Backtest → Incubate. Test strategies against historical tokenised metals data. Win rate, profit factor, Sharpe, max drawdown.',
    icon:    '▲',
    color:   'text-gold',
  },
  {
    title:   'Full data export',
    desc:    'Download any chart data as CSV or JSON. Historical OHLCV for all metals, tokenised prices, and spread data going back years.',
    icon:    '↓',
    color:   'text-silver',
  },
]

export default function PremiumPage() {
  return (
    <main className="min-h-screen bg-surface-base">

      {/* Hero */}
      <section className="border-b border-default px-8 py-12 bg-surface-raised">
        <div className="max-w-4xl mx-auto text-center">
          <div className="label mb-3">Aurum Oracle Premium</div>
          <h1 className="font-display text-4xl font-bold tracking-[0.1em] text-gold mb-4 leading-tight">
            The edge serious traders need
          </h1>
          <p className="text-[17px] font-light text-secondary leading-relaxed max-w-2xl mx-auto">
            Real-time arb alerts. Cross-chain spread monitoring. Full backtesting framework.
            Everything you need to find and act on tokenised metals opportunities.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-8 py-10">

        {/* Premium features highlight */}
        <div className="label mb-5">What you unlock</div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-12">
          {PREMIUM_FEATURES.map(f => (
            <div key={f.title} className="bg-surface-card border border-default rounded-xl p-5">
              <div className={`text-2xl mb-3 ${f.color}`}>{f.icon}</div>
              <h3 className="font-display text-[13px] tracking-[0.06em] text-primary mb-2">{f.title}</h3>
              <p className="text-[13px] font-light text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing plans */}
        <div className="label mb-5">Plans</div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-12">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 flex flex-col ${
                plan.highlight
                  ? 'border-gold bg-gold-dim'
                  : 'border-default bg-surface-card'
              }`}
            >
              {plan.highlight && (
                <div className="label mb-3 text-gold">Most popular</div>
              )}
              <div className="font-display text-[13px] tracking-[0.12em] text-muted mb-2 uppercase">
                {plan.name}
              </div>
              <div className="font-display text-3xl font-bold text-primary mb-0.5">
                {plan.price}
              </div>
              <div className="text-[11px] italic text-muted mb-5">{plan.period}</div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-[12px] text-secondary">
                    <span className="text-up flex-shrink-0 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={plan.ctaHref}
                className={`block text-center font-display text-[9px] tracking-[0.14em] uppercase py-3 rounded-xl border transition-all ${
                  plan.highlight
                    ? 'border-gold bg-[rgba(201,168,76,0.2)] text-gold hover:bg-[rgba(201,168,76,0.32)]'
                    : 'border-default text-muted hover:border-gold hover:text-gold'
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Enterprise CTA */}
        <div className="border border-default rounded-2xl p-8 text-center">
          <div className="label mb-3">Financial sector clients</div>
          <h3 className="font-display text-xl tracking-[0.08em] text-primary mb-3">
            Enterprise data &amp; execution
          </h3>
          <p className="text-[14px] font-light text-muted leading-relaxed max-w-2xl mx-auto mb-5">
            Treasury teams, family offices, commodity traders and fintechs building on Algorand or XRPL —
            contact us for bespoke API access, white-label data feeds, and execution infrastructure.
          </p>
          <a
            href="mailto:enterprise@AurumOracle.com"
            className="inline-block font-display text-[10px] tracking-[0.14em] uppercase px-6 py-3 rounded-xl border border-gold bg-gold-dim text-gold hover:bg-[rgba(201,168,76,0.22)] transition-all"
          >
            Contact enterprise team →
          </a>
        </div>
      </div>
    </main>
  )
}
