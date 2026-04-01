'use client'
import { usePrices, useUI } from '@/store'
import { ChangeText } from '@/components/ui'
import { formatUSD } from '@/lib/prices'
import { clsx } from 'clsx'

interface TickerItem {
  symbol:   string
  value:    string
  change:   number
  isToken?: boolean
}

// Combine spot + meld prices into ticker display
function useTickerItems(): TickerItem[] {
  const { spotPrices, meldPrices } = usePrices()

  const spots: TickerItem[] = spotPrices.map(p => ({
    symbol: p.symbol + (p.symbol.length <= 3 && !p.symbol.startsWith('X') ? '/lb' : '/USD'),
    value:  formatUSD(p.priceUSD, p.priceUSD < 10 ? 2 : 2),
    change: p.change24h,
  }))

  const tokens: TickerItem[] = meldPrices.map(p => ({
    symbol:   p.symbol,
    value:    `$${p.pricePerGram.toFixed(4)}/g`,
    change:   p.change24h,
    isToken:  true,
  }))

  return [...tokens.slice(0, 4), ...spots]
}

export function Ticker() {
  const items = useTickerItems()
  const { setActiveNav } = useUI()

  return (
    <div className={clsx(
      'flex-shrink-0 flex overflow-x-auto',
      'bg-surface-raised border-b border-default',
      'scrollbar-none',
      '[&::-webkit-scrollbar]:hidden',
    )}>
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => setActiveNav('markets')}
          className={clsx(
            'flex-shrink-0 flex flex-col gap-0.5 min-w-[110px]',
            'px-4 py-2 border-r border-default',
            'cursor-pointer transition-colors duration-150',
            'hover:bg-surface-hover text-left',
          )}
        >
          <span className="font-display text-[8px] tracking-[0.14em] text-muted">
            {item.symbol}
            {item.isToken && (
              <span className="ml-1 text-algo text-[7px]">●</span>
            )}
          </span>
          <span className="text-[13px] font-light text-primary">{item.value}</span>
          <ChangeText value={item.change} className="text-[10px]" />
        </button>
      ))}
    </div>
  )
}
