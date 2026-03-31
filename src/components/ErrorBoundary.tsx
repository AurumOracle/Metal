'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AurumOracle] Unhandled error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <PanelError
            message={this.state.error?.message || 'Something went wrong'}
            onRetry={() => this.setState({ hasError: false })}
          />
        )
      )
    }
    return this.props.children
  }
}

export function PanelError({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-red-900/30 bg-slate-800/50 p-8 text-center">
      <div className="text-3xl">⚠️</div>
      <p className="text-sm text-slate-300">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded bg-gold-500 px-4 py-1.5 text-xs font-medium text-slate-900 hover:bg-gold-400"
        >
          Try Again
        </button>
      )}
    </div>
  )
}
