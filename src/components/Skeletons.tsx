export function TickerSkeleton() {
  return (
    <div className="flex gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-3 w-16 animate-pulse rounded bg-slate-700" />
          <div className="h-3 w-12 animate-pulse rounded bg-slate-700" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
      <div className="mb-3 flex justify-between">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-700" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-6 w-8 animate-pulse rounded bg-slate-700" />
          ))}
        </div>
      </div>
      <div className="h-64 animate-pulse rounded bg-slate-700/50" />
      <div className="mt-3 flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 flex-1 animate-pulse rounded bg-slate-700/30" />
        ))}
      </div>
    </div>
  )
}

export function PredictionCardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
      <div className="flex items-start justify-between">
        <div className="h-4 w-48 animate-pulse rounded bg-slate-700" />
        <div className="h-5 w-16 animate-pulse rounded bg-slate-700" />
      </div>
      <div className="mt-3 h-2 w-full animate-pulse rounded-full bg-slate-700" />
      <div className="mt-3 flex gap-2">
        <div className="h-8 flex-1 animate-pulse rounded bg-slate-700" />
        <div className="h-8 flex-1 animate-pulse rounded bg-slate-700" />
      </div>
    </div>
  )
}

export function TradeWidgetSkeleton() {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
      <div className="mb-3 h-5 w-24 animate-pulse rounded bg-slate-700" />
      <div className="mb-3 flex gap-2">
        <div className="h-8 flex-1 animate-pulse rounded bg-slate-700" />
        <div className="h-8 flex-1 animate-pulse rounded bg-slate-700" />
      </div>
      <div className="mb-3 h-10 w-full animate-pulse rounded bg-slate-700" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 w-20 animate-pulse rounded bg-slate-700" />
            <div className="h-3 w-16 animate-pulse rounded bg-slate-700" />
          </div>
        ))}
      </div>
      <div className="mt-4 h-10 w-full animate-pulse rounded bg-slate-700" />
    </div>
  )
}

export function LeaderboardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
      <div className="mb-3 h-5 w-28 animate-pulse rounded bg-slate-700" />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <div className="h-6 w-6 animate-pulse rounded-full bg-slate-700" />
          <div className="h-3 flex-1 animate-pulse rounded bg-slate-700" />
          <div className="h-3 w-12 animate-pulse rounded bg-slate-700" />
        </div>
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <div className="h-6 w-48 animate-pulse rounded bg-slate-700" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartSkeleton />
        </div>
        <TradeWidgetSkeleton />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <PredictionCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
