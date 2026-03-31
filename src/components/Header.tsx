'use client'

import { useState, useCallback } from 'react'
import { useAurum } from '@/store'
import Link from 'next/link'

export function Header() {
  const { wallet, nfd, xpc_balance, setWallet, setNFD } = useAurum((s) => ({
    wallet: s.wallet,
    nfd: s.nfd,
    xpc_balance: s.xpc_balance,
    setWallet: s.setWallet,
    setNFD: s.setNFD,
  }))
  const [showWalletPicker, setShowWalletPicker] = useState(false)

  const connectWallet = useCallback(async () => {
    // In production, this uses @txnlab/use-wallet-react
    // For now, simulate connection
    const mockAddress = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HVY'
    setWallet(mockAddress)
    setNFD('you.xpc.algo')
    setShowWalletPicker(false)
  }, [setWallet, setNFD])

  const disconnectWallet = useCallback(() => {
    setWallet(null)
    setNFD(null)
  }, [setWallet, setNFD])

  return (
    <header className="sticky top-0 z-50 border-b border-slate-700 bg-slate-900/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-500 text-sm font-bold text-slate-900">
            A
          </div>
          <span className="text-lg font-bold text-gold-400">Aurum Oracle</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/" className="text-sm text-slate-300 hover:text-gold-400">
            Dashboard
          </Link>
          <Link href="/learn" className="text-sm text-slate-300 hover:text-gold-400">
            Learn
          </Link>
          <Link href="/token" className="text-sm text-slate-300 hover:text-gold-400">
            XPC Token
          </Link>
          <Link href="/premium" className="text-sm text-slate-300 hover:text-gold-400">
            Premium
          </Link>
        </nav>

        {/* Wallet */}
        <div className="flex items-center gap-3">
          {/* xpc.algo indicator */}
          <a
            href="https://app.nf.domains/name/xpc.algo"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 text-xs text-teal-500 md:flex"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-teal-500" />
            xpc.algo
          </a>

          {wallet ? (
            <div className="flex items-center gap-3">
              <span className="rounded bg-slate-800 px-2 py-1 text-xs text-gold-400">
                {xpc_balance.toLocaleString()} XPC
              </span>
              <button
                onClick={disconnectWallet}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:border-gold-500"
              >
                {nfd || `${wallet.slice(0, 6)}...${wallet.slice(-4)}`}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowWalletPicker(true)}
              className="rounded-lg bg-gold-500 px-4 py-1.5 text-sm font-medium text-slate-900 hover:bg-gold-400"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>

      {/* Wallet Picker Modal */}
      {showWalletPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-800 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100">Connect Wallet</h3>
              <button
                onClick={() => setShowWalletPicker(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {['Pera Wallet', 'Defly', 'Exodus'].map((name) => (
                <button
                  key={name}
                  onClick={connectWallet}
                  className="flex w-full items-center gap-3 rounded-lg border border-slate-600 p-3 text-left hover:border-gold-500"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700 text-lg">
                    {name === 'Pera Wallet' ? '🔵' : name === 'Defly' ? '🟢' : '🟣'}
                  </div>
                  <div>
                    <div className="font-medium text-slate-100">{name}</div>
                    <div className="text-xs text-slate-400">
                      {name === 'Pera Wallet' ? 'Recommended' : 'Algorand wallet'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-slate-500">
              No xpc.algo?{' '}
              <a
                href="https://app.nf.domains/name/xpc.algo?view=segments"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 underline"
              >
                Mint your segment
              </a>
            </p>
          </div>
        </div>
      )}
    </header>
  )
}
