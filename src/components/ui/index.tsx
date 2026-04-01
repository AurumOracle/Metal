'use client'
import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, HTMLAttributes } from 'react'

// ── BUTTON ─────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'buy' | 'sell' | 'ghost' | 'algo'
  size?:    'sm' | 'md'
}

export function Button({ variant = 'ghost', size = 'md', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'font-display font-semibold tracking-widest uppercase cursor-pointer transition-all duration-150 rounded-lg border',
        size === 'sm' ? 'text-[8px] px-3 py-1.5' : 'text-[9px] px-4 py-2',
        variant === 'gold'  && 'bg-gold-dim border-gold text-gold hover:bg-[rgba(201,168,76,0.22)]',
        variant === 'buy'   && 'bg-up-dim border-up text-up hover:bg-[rgba(91,173,138,0.24)]',
        variant === 'sell'  && 'bg-down-dim border-down text-down hover:bg-[rgba(196,95,95,0.24)]',
        variant === 'algo'  && 'bg-algo-dim border-algo text-algo hover:bg-[rgba(0,180,216,0.18)]',
        variant === 'ghost' && 'bg-transparent border-default text-secondary hover:border-[rgba(255,255,255,0.14)] hover:text-primary',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// ── BADGE ──────────────────────────────────────────────────────────────

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'gold' | 'algo' | 'up' | 'down' | 'flat'
}

export function Badge({ variant = 'flat', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-block font-display text-[8px] tracking-[0.1em] px-2 py-0.5 rounded-full border',
        variant === 'gold' && 'bg-gold-dim border-gold text-gold',
        variant === 'algo' && 'bg-algo-dim border-algo text-algo',
        variant === 'up'   && 'bg-up-dim border-up text-up',
        variant === 'down' && 'bg-down-dim border-down text-down',
        variant === 'flat' && 'bg-[rgba(255,255,255,0.05)] border-default text-muted',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

// ── CARD ───────────────────────────────────────────────────────────────

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('bg-surface-card border border-default rounded-xl', className)}
      {...props}
    >
      {children}
    </div>
  )
}

// ── SECTION LABEL ──────────────────────────────────────────────────────

export function SectionLabel({ className, children, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={clsx('label block', className)}
      {...props}
    >
      {children}
    </span>
  )
}

// ── DIVIDER ────────────────────────────────────────────────────────────

export function Divider({ className }: { className?: string }) {
  return <div className={clsx('border-t border-default', className)} />
}

// ── LIVE DOT ───────────────────────────────────────────────────────────

export function LiveDot({ color = 'algo' }: { color?: 'algo' | 'gold' | 'up' }) {
  const colorMap = {
    algo: 'bg-[#00B4D8]',
    gold: 'bg-[#C9A84C]',
    up:   'bg-[#5BAD8A]',
  }
  return (
    <span className={clsx('inline-block w-[5px] h-[5px] rounded-full animate-blink flex-shrink-0', colorMap[color])} />
  )
}

// ── SPINNER ────────────────────────────────────────────────────────────

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      className="animate-spin"
      style={{ color: 'var(--gold)' }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

// ── CHANGE DISPLAY ─────────────────────────────────────────────────────

export function ChangeText({ value, className }: { value: number; className?: string }) {
  const sign  = value >= 0 ? '+' : ''
  const color = value > 0 ? 'text-up' : value < 0 ? 'text-down' : 'text-muted'
  return (
    <span className={clsx(color, className)}>
      {sign}{value.toFixed(2)}%
    </span>
  )
}

// ── TOAST ──────────────────────────────────────────────────────────────

export function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className={clsx(
      'fixed bottom-16 left-1/2 -translate-x-1/2',
      'bg-surface-raised border border-gold rounded-lg',
      'px-5 py-2.5 font-display text-[9px] tracking-widest text-gold',
      'z-[300] whitespace-nowrap animate-fade-in pointer-events-none',
    )}>
      {message}
    </div>
  )
}
