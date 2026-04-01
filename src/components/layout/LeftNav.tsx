'use client'
import { useUI, useAurumStore } from '@/store'
import { SectionLabel } from '@/components/ui'
import { clsx } from 'clsx'

const NAV_MARKETS = [
  { key: 'gold',        label: 'Gold',           dot: '#C9A84C' },
  { key: 'precious',    label: 'Precious metals', dot: '#D4DCE4' },
  { key: 'base',        label: 'Base metals',     dot: '#B87333' },
  { key: 'commodities', label: 'Commodities',     dot: '#8DB08D' },
  { key: 'history',     label: 'Historical',      dot: '#5E5A56' },
  { key: 'predictions', label: 'Predictions',     dot: '#A88BD4' },
] as const

const LEADERBOARD = [
  { rank: 'I',   name: 'Meridian_Au',  xpc: '1,840', gold: true },
  { rank: 'II',  name: 'SilverSerpent',xpc: '1,520' },
  { rank: 'III', name: 'VaultKeeper',  xpc: '1,210' },
  { rank: 'IV',  name: 'AlchemyDesk',  xpc: '980'   },
  { rank: '—',   name: 'You',          xpc: '340',  you: true },
]

export function LeftNav() {
  const { activeNav, setActiveNav, setActivePanel } = useUI()

  function navigate(key: string) {
    setActiveNav(key)
    const panelMap: Record<string, string> = {
      gold:        'overview',
      precious:    'precious',
      base:        'base',
      commodities: 'commodities',
      history:     'history',
      predictions: 'predictions',
    }
    setActivePanel(panelMap[key] ?? key)
  }

  return (
    <nav className={clsx(
      'border-r border-default overflow-y-auto',
      'flex flex-col gap-5 p-3',
      '[scrollbar-width:thin]',
    )}>
      {/* Markets */}
      <div>
        <SectionLabel className="mb-2">Markets</SectionLabel>
        <div className="flex flex-col gap-0.5">
          {NAV_MARKETS.map(item => (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={clsx(
                'flex items-center gap-2 px-2.5 py-1.5 rounded-lg',
                'text-[13px] cursor-pointer transition-all duration-150 text-left border border-transparent',
                activeNav === item.key
                  ? 'bg-gold-dim border-gold text-gold-lt'
                  : 'text-secondary hover:bg-surface-hover hover:text-primary',
              )}
            >
              <span
                className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                style={{ backgroundColor: item.dot }}
              />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <div>
        <SectionLabel className="mb-2">Top Oracles · XPC</SectionLabel>
        <div className="flex flex-col">
          {LEADERBOARD.map((row, i) => (
            <div
              key={i}
              className={clsx(
                'flex items-center gap-1.5 py-1 border-b border-default last:border-0 text-[12px]',
                row.you && 'text-gold-lt',
              )}
            >
              <span className={clsx(
                'font-display text-[9px] w-3.5',
                row.gold ? 'text-gold' : 'text-muted',
              )}>
                {row.rank}
              </span>
              <span className="flex-1">{row.name}</span>
              <span className="font-display text-[9px] text-gold">{row.xpc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sponsor */}
      <div>
        <SectionLabel className="mb-2">Sponsor</SectionLabel>
        <a
          href="https://www.cbdgold.io"
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            'block rounded-lg overflow-hidden border cursor-pointer transition-all duration-200',
            'border-[rgba(0,200,80,0.18)] hover:border-[rgba(0,200,80,0.38)]',
          )}
          style={{ background: 'linear-gradient(150deg,#0a180d,#0f2215)' }}
        >
          <div className="label px-2.5 pt-2 pb-0 text-[rgba(255,255,255,0.25)]">
            Featured partner
          </div>
          <div className="p-2.5 pt-1.5">
            <div
              className="font-display text-[13px] font-bold tracking-[0.08em] mb-1"
              style={{
                background: 'linear-gradient(120deg,#00C853,#C9A84C)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              CBDGold
            </div>
            <div className="text-[10px] italic text-[rgba(180,255,180,0.5)] mb-2">
              Crypto × Cannabis × Algo
            </div>
            <div className="text-[10px] italic text-[rgba(160,240,160,0.4)] leading-relaxed mb-2">
              WEED + HEMP dual-token cannabis ecosystem on Algorand.
            </div>
            <div className="flex gap-1 flex-wrap mb-2">
              {['WEED','HEMP','ALGO'].map(t => (
                <span key={t} className={clsx(
                  'font-display text-[8px] tracking-[0.1em] px-1.5 py-0.5 rounded-full border',
                  t === 'WEED' && 'bg-[rgba(0,180,80,0.13)] text-[#00C853] border-[rgba(0,180,80,0.26)]',
                  t === 'HEMP' && 'bg-gold-dim text-gold border-gold',
                  t === 'ALGO' && 'bg-algo-dim text-algo border-algo',
                )}>
                  {t}
                </span>
              ))}
            </div>
            <div className={clsx(
              'text-center font-display text-[8px] tracking-[0.12em] text-[#00C853]',
              'bg-[rgba(0,180,80,0.09)] border border-[rgba(0,180,80,0.22)]',
              'rounded py-1',
            )}>
              cbdgold.io →
            </div>
          </div>
        </a>
      </div>
    </nav>
  )
}
