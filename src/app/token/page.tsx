import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title:       'XPC Token · Aurum Oracle',
  description: 'XPC is the utility token of Aurum Oracle. Earn XPC by predicting metals markets correctly. Stake XPC to vote. Burn creates deflationary scarcity on Algorand.',
}

const RANK_THRESHOLDS = [
  { rank: 'Apprentice Assayer', xpc: 0,      desc: 'Your journey begins here'              },
  { rank: 'Junior Assayer',     xpc: 250,    desc: 'First correct predictions confirmed'   },
  { rank: 'Assayer',            xpc: 750,    desc: 'Demonstrating consistent accuracy'     },
  { rank: 'Senior Assayer',     xpc: 2000,   desc: 'Trusted voice in the Oracle community' },
  { rank: 'Master Assayer',     xpc: 5000,   desc: 'Expert-level prediction track record'  },
  { rank: 'Alchemist',          xpc: 12000,  desc: 'Among the platform\'s top analysts'    },
  { rank: 'Grand Alchemist',    xpc: 30000,  desc: 'Elite — top 1% of all Oracles'        },
  { rank: 'Oracle of the Vault',xpc: 75000,  desc: 'The rarest rank. Legendary status.'   },
]

const EARN_WAYS = [
  { label: 'Correct prediction',    xpc: '50–100',  note: 'Per market, based on difficulty'  },
  { label: 'Weekly streak (7 days)',xpc: '+25%',    note: 'Bonus on all weekly rewards'      },
  { label: 'Monthly streak (30d)',  xpc: '+50%',    note: 'Stacked with weekly bonus'        },
  { label: 'First prediction',      xpc: '25',      note: 'One-time onboarding bonus'        },
  { label: 'Mint xpc.algo segment', xpc: '100',     note: 'Identity milestone reward'        },
  { label: 'Comment on a market',   xpc: '5',       note: 'Capped at 10 comments per day'    },
  { label: 'Refer a new user',      xpc: '50',      note: 'When referred user mints segment' },
]

const TOKEN_STATS = [
  { label: 'Total supply',  value: '100,000,000', unit: 'XPC', color: 'text-gold' },
  { label: 'Burned to date',value: '48,320',      unit: 'XPC', color: 'text-down' },
  { label: 'Circulating',   value: '99,951,680',  unit: 'XPC', color: 'text-primary' },
  { label: 'Token price',   value: '$0.00142',    unit: 'USD', color: 'text-up' },
  { label: 'Market cap',    value: '$141,930',    unit: 'USD', color: 'text-primary' },
  { label: 'Blockchain',    value: 'Algorand',    unit: 'ASA', color: 'text-algo' },
]

const SUPPLY_SPLIT = [
  { label: 'Public sale',         pct: 60, color: '#C9A84C' },
  { label: 'Community rewards',   pct: 20, color: '#5BAD8A' },
  { label: 'Team (2yr vest)',      pct: 12, color: '#A88BD4' },
  { label: 'Reserve / treasury',  pct: 8,  color: '#A8B4C0' },
]

export default function TokenPage() {
  return (
    <main className="min-h-screen bg-surface-base">

      {/* Hero */}
      <section className="border-b border-default px-8 py-12 bg-surface-raised">
        <div className="max-w-4xl mx-auto">
          <div className="label mb-3">XPC Token</div>
          <h1 className="font-display text-4xl font-bold tracking-[0.1em] text-gold mb-4 leading-tight">
            XP Club — on-chain rewards
          </h1>
          <p className="text-[17px] font-light text-secondary leading-relaxed max-w-2xl">
            XPC is the utility token of Aurum Oracle. Earn it by predicting metals markets correctly.
            Stake it to vote on markets. Your xpc.algo segment is your identity across the platform.
          </p>
          <div className="flex items-center gap-3 mt-6">
            <a
              href="https://app.nf.domains/name/xpc.algo?view=segments"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-display text-[10px] tracking-[0.14em] uppercase px-5 py-2.5 rounded-xl border border-algo bg-algo-dim text-algo hover:bg-[rgba(0,180,216,0.18)] transition-all"
            >
              Mint xpc.algo segment
            </a>
            <Link
              href="/"
              className="inline-block font-display text-[10px] tracking-[0.14em] uppercase px-5 py-2.5 rounded-xl border border-gold bg-gold-dim text-gold hover:bg-[rgba(201,168,76,0.22)] transition-all"
            >
              Start predicting →
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-8 py-10">

        {/* Token stats */}
        <div className="label mb-5">Token stats</div>
        <div className="grid grid-cols-3 gap-3 mb-12">
          {TOKEN_STATS.map(s => (
            <div key={s.label} className="bg-surface-card border border-default rounded-xl p-5">
              <div className="label mb-2">{s.label}</div>
              <div className={`font-display text-[20px] tracking-[0.06em] ${s.color}`}>
                {s.value}
              </div>
              <div className="text-[10px] italic text-muted mt-0.5">{s.unit}</div>
            </div>
          ))}
        </div>

        {/* Supply distribution */}
        <div className="label mb-5">Supply distribution</div>
        <div className="bg-surface-card border border-default rounded-xl p-6 mb-12">
          {/* Visual bar */}
          <div className="flex h-3 rounded-full overflow-hidden mb-4">
            {SUPPLY_SPLIT.map(s => (
              <div
                key={s.label}
                style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                title={`${s.label}: ${s.pct}%`}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4">
            {SUPPLY_SPLIT.map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <div>
                  <div className="text-[12px] text-primary">{s.label}</div>
                  <div className="text-[11px] text-muted">{s.pct}%</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-default text-[12px] italic text-muted leading-relaxed">
            Team tokens vest over 24 months with a 6-month cliff.
            Reserve tokens are controlled by the xpc.algo treasury contract — disbursements require admin multisig.
          </div>
        </div>

        {/* Deflation mechanics */}
        <div className="label mb-5">Deflationary mechanics</div>
        <div className="bg-surface-card border border-gold rounded-xl p-6 mb-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-5">
            {[
              { label: 'Trade fee burn',      value: '~0.25%',  desc: 'Of each platform fee received' },
              { label: 'Market resolution',   value: '0.25%',   desc: 'Of each prediction pool' },
              { label: 'Admin burn events',   value: 'Periodic', desc: 'From treasury excess' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <div className="font-display text-2xl text-down mb-1">{item.value}</div>
                <div className="text-[12px] font-light text-primary mb-0.5">{item.label}</div>
                <div className="text-[11px] italic text-muted">{item.desc}</div>
              </div>
            ))}
          </div>
          <div className="text-[13px] italic text-muted leading-relaxed border-t border-default pt-4">
            Every Meld Gold trade processed through Aurum Oracle generates a 0.7% platform fee routed to the xpc.algo treasury.
            A portion of this is automatically burned, reducing circulating supply permanently.
            Fewer tokens + growing demand = rising token value for holders.
          </div>
        </div>

        {/* How to earn */}
        <div className="label mb-5">How to earn XPC</div>
        <div className="bg-surface-card border border-default rounded-xl overflow-hidden mb-12">
          <table className="w-full">
            <thead>
              <tr className="border-b border-default">
                <th className="label text-left px-5 py-3">Action</th>
                <th className="label text-right px-5 py-3">XPC reward</th>
                <th className="label text-left px-5 py-3 hidden sm:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody>
              {EARN_WAYS.map((w, i) => (
                <tr key={i} className="border-b border-[rgba(255,255,255,0.025)] last:border-0 hover:bg-surface-hover">
                  <td className="px-5 py-3 text-[13px] text-primary">{w.label}</td>
                  <td className="px-5 py-3 text-right font-display text-[12px] tracking-[0.06em] text-gold">
                    +{w.xpc}
                  </td>
                  <td className="px-5 py-3 text-[11px] italic text-muted hidden sm:table-cell">{w.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Rank progression */}
        <div className="label mb-5">Rank progression</div>
        <div className="space-y-2 mb-12">
          {RANK_THRESHOLDS.map((r, i) => {
            const isFirst = i === 0
            return (
              <div
                key={r.rank}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-xl border transition-colors ${
                  isFirst ? 'border-gold bg-gold-dim' : 'border-default bg-surface-card'
                }`}
              >
                <div className={`font-display text-[10px] tracking-[0.06em] w-4 text-center ${
                  isFirst ? 'text-gold' : 'text-muted'
                }`}>
                  {['I','II','III','IV','V','VI','VII','VIII'][i]}
                </div>
                <div className={`font-display text-[12px] tracking-[0.06em] flex-1 ${
                  isFirst ? 'text-gold' : 'text-primary'
                }`}>
                  {r.rank}
                </div>
                <div className="text-[11px] italic text-muted hidden sm:block">{r.desc}</div>
                <div className={`font-display text-[11px] tracking-[0.08em] ${
                  r.xpc === 0 ? 'text-muted' : 'text-gold'
                }`}>
                  {r.xpc === 0 ? 'Start' : `${r.xpc.toLocaleString()} XPC`}
                </div>
              </div>
            )
          })}
        </div>

        {/* xpc.algo segments */}
        <div className="border border-algo rounded-2xl p-7 bg-algo-dim mb-10">
          <div className="label mb-3" style={{ color: 'var(--algo)' }}>xpc.algo · NFD segments</div>
          <h3 className="font-display text-xl tracking-[0.08em] text-algo mb-3">
            Your permanent on-chain identity
          </h3>
          <p className="text-[14px] font-light text-secondary leading-relaxed mb-4">
            Minting a <strong className="font-normal text-primary">name.xpc.algo</strong> segment establishes your identity across the Aurum Oracle platform.
            Your segment appears next to your comments, votes, and on the leaderboard.
            It is an Algorand NFD — a non-fungible domain name permanently on-chain.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-5">
            {[
              { label: 'Identity',  desc: 'Your name appears on all on-chain activity' },
              { label: '+100 XPC', desc: 'Minting bonus — one-time reward'             },
              { label: 'Permanent', desc: 'Lives on Algorand forever, no annual fee'   },
            ].map(item => (
              <div key={item.label} className="text-center p-3 bg-[rgba(0,180,216,0.06)] rounded-lg">
                <div className="font-display text-[14px] tracking-[0.06em] text-algo mb-1">{item.label}</div>
                <div className="text-[11px] italic text-muted">{item.desc}</div>
              </div>
            ))}
          </div>
          <a
            href="https://app.nf.domains/name/xpc.algo?view=segments"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center font-display text-[10px] tracking-[0.14em] uppercase py-3 rounded-xl border border-algo text-algo bg-[rgba(0,180,216,0.08)] hover:bg-[rgba(0,180,216,0.18)] transition-all"
          >
            Mint your xpc.algo segment at NF Domains →
          </a>
        </div>

        {/* Risk disclaimer */}
        <div className="text-[11px] italic text-muted leading-relaxed border-t border-default pt-6">
          <strong className="not-italic font-normal text-secondary">Token disclaimer:</strong>
          {' '}XPC tokens are utility tokens for participation in the Aurum Oracle platform.
          They are not securities, investment contracts, or financial instruments.
          XPC does not represent ownership in Aurum Oracle or any legal entity.
          Token prices are determined by market supply and demand.
          Past XPC rewards are not indicative of future earnings.
          Always conduct your own research before acquiring any digital asset.
        </div>
      </div>
    </main>
  )
}
