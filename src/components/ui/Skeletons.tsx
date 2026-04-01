'use client'
import { clsx } from 'clsx'

// ── BASE SHIMMER ───────────────────────────────────────────────────────

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'rounded animate-pulse',
        'bg-[rgba(255,255,255,0.05)]',
        className,
      )}
    />
  )
}

// ── TICKER SKELETON ────────────────────────────────────────────────────

export function TickerSkeleton() {
  return (
    <div className="flex border-b border-default bg-surface-raised h-[60px]">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 min-w-[110px] px-4 py-3 border-r border-default flex flex-col gap-1.5">
          <Shimmer className="h-[8px] w-10" />
          <Shimmer className="h-[14px] w-16" />
          <Shimmer className="h-[9px] w-8" />
        </div>
      ))}
    </div>
  )
}

// ── PRICE CARD SKELETON ────────────────────────────────────────────────

export function PriceCardSkeleton() {
  return (
    <div className="bg-surface-card border border-default rounded-lg px-3 py-2.5">
      <Shimmer className="h-[8px] w-16 mb-2" />
      <Shimmer className="h-[18px] w-24 mb-1.5" />
      <Shimmer className="h-[9px] w-12" />
    </div>
  )
}

export function StatsRowSkeleton() {
  return (
    <div className="grid grid-cols-5 gap-2 px-4 pb-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <PriceCardSkeleton key={i} />
      ))}
    </div>
  )
}

// ── CHART SKELETON ─────────────────────────────────────────────────────

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="px-4 py-3">
      <div
        className="bg-surface-card border border-default rounded-xl overflow-hidden"
        style={{ height }}
      >
        {/* Fake chart bars */}
        <div className="flex items-end gap-1 h-full px-6 pb-6 pt-8">
          {Array.from({ length: 24 }).map((_, i) => {
            const h = 20 + Math.abs(Math.sin(i * 0.7 + 1)) * 70
            return (
              <div
                key={i}
                className="flex-1 rounded-t animate-pulse"
                style={{
                  height:          `${h}%`,
                  backgroundColor: 'rgba(201,168,76,0.08)',
                  animationDelay:  `${i * 40}ms`,
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── PREDICTION CARD SKELETON ───────────────────────────────────────────

export function PredictionCardSkeleton() {
  return (
    <div className="bg-surface-card border border-default rounded-xl p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <Shimmer className="h-[8px] w-24" />
        <Shimmer className="h-[8px] w-20" />
      </div>
      <Shimmer className="h-[16px] w-full mb-1.5" />
      <Shimmer className="h-[16px] w-4/5 mb-4" />
      <div className="flex gap-2 mb-2">
        <Shimmer className="flex-1 h-[52px] rounded-lg" />
        <Shimmer className="flex-1 h-[52px] rounded-lg" />
      </div>
      <Shimmer className="h-[2px] w-full mb-2 rounded-full" />
      <div className="flex justify-between">
        <Shimmer className="h-[9px] w-24" />
        <Shimmer className="h-[9px] w-20" />
      </div>
    </div>
  )
}

export function PredictionListSkeleton() {
  return (
    <div>
      {Array.from({ length: 3 }).map((_, i) => (
        <PredictionCardSkeleton key={i} />
      ))}
    </div>
  )
}

// ── COMMENT SKELETON ───────────────────────────────────────────────────

export function CommentSkeleton() {
  return (
    <div className="flex gap-2.5 py-3 border-b border-default">
      <Shimmer className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Shimmer className="h-[10px] w-24" />
          <Shimmer className="h-[10px] w-16 ml-auto" />
        </div>
        <Shimmer className="h-[13px] w-full mb-1" />
        <Shimmer className="h-[13px] w-3/4 mb-2" />
        <Shimmer className="h-[9px] w-12" />
      </div>
    </div>
  )
}

export function CommentsSkeleton() {
  return (
    <div>
      {Array.from({ length: 4 }).map((_, i) => (
        <CommentSkeleton key={i} />
      ))}
    </div>
  )
}

// ── TRADE WIDGET SKELETON ──────────────────────────────────────────────

export function TradeWidgetSkeleton() {
  return (
    <div className="bg-surface-card border border-gold rounded-xl overflow-hidden">
      <div className="px-3 py-2.5 border-b border-default flex items-center justify-between">
        <Shimmer className="h-[9px] w-32" />
        <Shimmer className="h-[16px] w-20 rounded-full" />
      </div>
      <div className="flex border-b border-default">
        <Shimmer className="flex-1 h-[32px] m-2 rounded" />
        <Shimmer className="flex-1 h-[32px] m-2 rounded" />
      </div>
      <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-1.5">
          <Shimmer className="h-[52px] rounded-lg" />
          <Shimmer className="h-[52px] rounded-lg" />
        </div>
        <Shimmer className="h-[40px] rounded-lg" />
        <div className="space-y-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Shimmer className="h-[10px] w-24" />
              <Shimmer className="h-[10px] w-20" />
            </div>
          ))}
        </div>
        <Shimmer className="h-[36px] rounded-lg" />
      </div>
    </div>
  )
}

// ── LEFT NAV SKELETON ──────────────────────────────────────────────────

export function LeftNavSkeleton() {
  return (
    <div className="p-3 space-y-5">
      <div>
        <Shimmer className="h-[8px] w-16 mb-3" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Shimmer key={i} className="h-[30px] rounded-lg mb-1" />
        ))}
      </div>
      <div>
        <Shimmer className="h-[8px] w-24 mb-3" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between py-1 border-b border-default">
            <Shimmer className="h-[11px] w-20" />
            <Shimmer className="h-[11px] w-10" />
          </div>
        ))}
      </div>
    </div>
  )
}
