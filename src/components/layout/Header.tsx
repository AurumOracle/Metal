'use client'
import { useState } from 'react'
import Link from 'next/link'
import { WalletId } from '@txnlab/use-wallet-react'
import { useUI, useWallet } from '@/store'
import { useWalletConnect } from '@/components/providers/WalletProvider'
import { LiveDot } from '@/components/ui'
import { getXPCSegmentMintURL } from '@/lib/algorand'
import { clsx } from 'clsx'

const NAV_ITEMS = [
  { key: 'markets',    label: 'Markets',  href: '/'        },
  { key: 'learn',      label: 'Learn',    href: '/learn'   },
  { key: 'token',      label: 'XPC',      href: '/token'   },
  { key: 'sale',       label: 'Buy XPC',  href: '/sale'    },
  { key: 'premium',    label: 'Premium',  href: '/premium' },
] as const

// ── WALLET PICKER MODAL ───────────────────────────────────────────────

function WalletModal({ onClose }: { onClose: () => void }) {
  const { wallets, connect, isConnected, disconnect } = useWalletConnect()
  const { userProfile } = useWallet()

  const WALLET_META: Record<string, { label: string; icon: string; desc: string }> = {
    [WalletId.PERA]:   { label: 'Pera Wallet',  icon: '◈', desc: 'Mobile & desktop Algorand wallet' },
    [WalletId.DEFLY]:  { label: 'Defly Wallet', icon: '⬡', desc: 'DeFi-focused Algorand wallet'     },
    [WalletId.EXODUS]: { label: 'Exodus',        icon: '⬡', desc: 'Multi-chain desktop wallet'       },
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-surface-raised border border-gold rounded-2xl p-6 w-[360px] max-w-[92vw] animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="font-display text-[12px] tracking-[0.18em] text-gold uppercase text-center mb-5">
          {isConnected ? 'Wallet connected' : 'Connect wallet'}
        </h2>

        {isConnected && userProfile ? (
          <div className="space-y-3">
            {/* Profile */}
            <div className="bg-surface-card border border-default rounded-xl p-4 text-center">
              <div className="font-display text-[14px] tracking-[0.1em] text-gold mb-1">
                {userProfile.nfd?.name ?? 'No NFD'}
              </div>
              <div className="text-[11px] italic text-muted mb-3">
                {userProfile.walletAddress.slice(0, 12)}…{userProfile.walletAddress.slice(-8)}
              </div>
              <div className="flex justify-center gap-3 text-[11px] text-muted">
                <span>{userProfile.xpcBalance.toLocaleString()} XPC</span>
                <span>·</span>
                <span className="text-gold">{userProfile.rank}</span>
              </div>
            </div>

            {/* Mint NFD if missing */}
            {!userProfile.nfd && (
              <a
                href={getXPCSegmentMintURL()}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                  'block text-center font-display text-[9px] tracking-[0.12em] uppercase',
                  'py-2.5 rounded-lg border border-algo text-algo bg-algo-dim',
                  'hover:bg-[rgba(0,180,216,0.18)] transition-colors',
                )}
              >
                Mint xpc.algo segment →
              </a>
            )}

            <button
              onClick={() => { disconnect(); onClose() }}
              className="w-full py-2.5 font-display text-[9px] tracking-[0.12em] uppercase text-muted border border-default rounded-lg hover:border-down hover:text-down transition-all"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {wallets.map(wallet => {
              const meta = WALLET_META[wallet.id] ?? { label: wallet.id, icon: '○', desc: '' }
              return (
                <button
                  key={wallet.id}
                  onClick={() => { connect(); onClose() }}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-default',
                    'bg-surface-card hover:border-gold hover:bg-gold-dim',
                    'cursor-pointer transition-all text-left',
                  )}
                >
                  <span className="text-[20px] text-gold w-8 text-center leading-none">
                    {meta.icon}
                  </span>
                  <div>
                    <div className="font-display text-[11px] tracking-[0.1em] text-primary">
                      {meta.label}
                    </div>
                    <div className="text-[10px] italic text-muted">{meta.desc}</div>
                  </div>
                </button>
              )
            })}

            <div className="pt-2 text-center text-[10px] italic text-muted leading-relaxed">
              Connecting will prompt your wallet to sign a verification message.{' '}
              <a
                href="https://app.nf.domains/name/xpc.algo?view=segments"
                target="_blank"
                rel="noopener noreferrer"
                className="text-algo hover:underline not-italic"
              >
                Get xpc.algo →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── HEADER ────────────────────────────────────────────────────────────

export function Header() {
  const [modalOpen, setModalOpen]   = useState(false)
  const { activeNav, setActiveNav } = useUI()
  const { isConnected, nfdName, walletAddress } = useWallet()

  const displayName = nfdName
    ?? (walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : null)

  return (
    <>
      <header className={clsx(
        'flex-shrink-0 flex items-center justify-between',
        'px-6 h-[52px]',
        'bg-[rgba(11,11,13,0.97)] border-b border-gold',
        'sticky top-0 z-50 backdrop-blur-md',
      )}>
        {/* Wordmark */}
        <div>
          <div className="font-display text-base font-bold tracking-[0.22em] text-gold leading-none">
            Aurum Oracle
          </div>
          <div className="text-[11px] italic text-muted mt-0.5 leading-none">
            metals intelligence · on-chain prediction market
          </div>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-0.5">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.key}
              href={item.href}
              className={clsx(
                'font-display text-[9px] font-semibold tracking-[0.14em] uppercase',
                'px-4 py-2 rounded-lg border border-transparent',
                'cursor-pointer transition-all duration-150',
                activeNav === item.key
                  ? 'bg-gold-dim border-gold text-gold'
                  : 'text-muted hover:text-primary hover:bg-surface-hover',
              )}
              onClick={() => setActiveNav(item.key)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] italic text-algo">
            <LiveDot color="algo" />
            Algorand · live
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className={clsx(
              'font-display text-[9px] font-semibold tracking-[0.12em] uppercase',
              'px-4 py-2 rounded-lg border cursor-pointer transition-all duration-150',
              isConnected
                ? 'border-up bg-up-dim text-up hover:bg-[rgba(91,173,138,0.22)]'
                : 'border-gold bg-gold-dim text-gold hover:bg-[rgba(201,168,76,0.22)]',
            )}
          >
            {isConnected && displayName ? displayName : 'Connect wallet'}
          </button>
        </div>
      </header>

      {modalOpen && <WalletModal onClose={() => setModalOpen(false)} />}
    </>
  )
}
