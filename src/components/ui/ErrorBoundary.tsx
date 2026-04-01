'use client'
import React from 'react'

interface Props {
  children:  React.ReactNode
  fallback?: React.ReactNode
  onError?:  (error: Error, info: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error:    Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AurumOracle] Unhandled error:', error, info)
    this.props.onError?.(error, info)
  }

  reset() {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="font-display text-[10px] tracking-[0.18em] text-down uppercase mb-3">
            Something went wrong
          </div>
          <p className="text-[13px] italic text-muted mb-4 max-w-xs leading-relaxed">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.reset()}
            className="font-display text-[9px] tracking-[0.12em] uppercase px-4 py-2 rounded-lg border border-gold bg-gold-dim text-gold hover:bg-[rgba(201,168,76,0.22)] cursor-pointer transition-all"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ── PANEL ERROR FALLBACK ───────────────────────────────────────────────
// Lightweight version for inner panels — doesn't crash the whole page

export function PanelError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
      <div className="text-[24px] opacity-30">⚠</div>
      <p className="text-[12px] italic text-muted max-w-[240px] leading-relaxed">
        {message ?? 'Failed to load. Check your connection and try again.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-[10px] font-display tracking-[0.1em] uppercase text-algo hover:underline cursor-pointer"
        >
          Retry
        </button>
      )}
    </div>
  )
}
