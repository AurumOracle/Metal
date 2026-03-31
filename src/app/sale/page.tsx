'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { useAurum } from '@/store'

const SALE_TIERS = [
  { amount: 10000, bonus: '0%', price: 10, label: 'Starter' },
  { amount: 50000, bonus: '+5%', price: 47.50, label: 'Builder' },
  { amount: 100000, bonus: '+10%', price: 90, label: 'Believer' },
  { amount: 500000, bonus: '+15%', price: 425, label: 'Whale' },
]

export default function SalePage() {
  const wallet = useAurum((s) => s.wallet)
  const [selectedTier, setSelectedTier] = useState(0)
  const [customAmount, setCustomAmount] = useState('')

  const tier = SALE_TIERS[selectedTier]
  const xpcAmount = customAmount ? parseInt(customAmount) || 0 : tier.amount
  const algoPrice = xpcAmount * 0.001

  return (
    <div className="flex min-h-screen flex-col bg-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gold-400">XPC Token Sale</h1>
          <p className="mt-2 text-sm text-slate-400">
            Purchase XPC tokens to participate in Aurum Oracle. Early buyers get bonus tokens.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-green-900/50 bg-green-900/10 px-3 py-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-green-400">Sale Active</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8 rounded-lg border border-slate-700 bg-slate-800 p-4">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Sold: 2,450,000 XPC</span>
            <span>Target: 15,000,000 XPC</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-400"
              style={{ width: '16.3%' }}
            />
          </div>
          <div className="mt-1 text-right text-[10px] text-slate-500">16.3% sold</div>
        </div>

        {/* Tier selection */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SALE_TIERS.map((t, i) => (
            <button
              key={t.label}
              onClick={() => {
                setSelectedTier(i)
                setCustomAmount('')
              }}
              className={`rounded-lg border p-3 text-left transition-colors ${
                selectedTier === i && !customAmount
                  ? 'border-gold-500/50 bg-gold-500/5'
                  : 'border-slate-700 bg-slate-800 hover:border-slate-600'
              }`}
            >
              <div className="text-[10px] text-slate-500">{t.label}</div>
              <div className="text-sm font-bold text-gold-400">
                {t.amount.toLocaleString()} XPC
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">${t.price}</span>
                {t.bonus !== '0%' && (
                  <span className="rounded bg-green-900/30 px-1 py-0.5 text-[9px] text-green-400">
                    {t.bonus}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-4">
          <label className="mb-1 block text-xs text-slate-400">Custom amount</label>
          <div className="flex gap-3">
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Enter XPC amount"
              min={1000}
              className="flex-1 rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-200"
            />
            <div className="flex items-center rounded border border-slate-600 bg-slate-900 px-3">
              <span className="text-xs text-slate-400">
                ≈ {algoPrice.toFixed(2)} ALGO
              </span>
            </div>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">
            Rate: 1 XPC = $0.001 USD ≈ 0.001 ALGO. Min purchase: 1,000 XPC.
          </p>
        </div>

        {/* Purchase summary */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-200">Purchase Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">XPC Amount</span>
              <span className="text-slate-200">{xpcAmount.toLocaleString()} XPC</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Price per XPC</span>
              <span className="text-slate-200">$0.001</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Bonus</span>
              <span className="text-green-400">
                {customAmount ? '—' : tier.bonus}
              </span>
            </div>
            <div className="border-t border-slate-700 pt-2">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-slate-300">Total</span>
                <span className="text-gold-400">{algoPrice.toFixed(2)} ALGO</span>
              </div>
            </div>
          </div>

          <button
            disabled={!wallet || xpcAmount < 1000}
            className="mt-4 w-full rounded bg-gold-500 py-2.5 text-sm font-medium text-slate-900 hover:bg-gold-400 disabled:opacity-50"
          >
            {!wallet ? 'Connect Wallet to Purchase' : `Buy ${xpcAmount.toLocaleString()} XPC`}
          </button>

          <p className="mt-2 text-center text-[10px] text-slate-500">
            Tokens are delivered instantly to your connected wallet via Algorand ASA transfer.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
