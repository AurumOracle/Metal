'use client'

import { useState, useMemo } from 'react'
import { useAurum } from '@/store'
import { buildQuote } from '@/types'

const TROY_OZ = 31.1035

export function TradeWidget() {
  const { prices, wallet } = useAurum((s) => ({ prices: s.prices, wallet: s.wallet }))
  const [asset, setAsset] = useState<'MCAU' | 'MSOS'>('MCAU')
  const [tab, setTab] = useState<'buy' | 'sell'>('buy')
  const [grams, setGrams] = useState(1)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const spotPrice = asset === 'MCAU'
    ? (prices['SPOT_GOLD']?.price || 101)
    : (prices['SPOT_SILVER']?.price || 1.07)

  const spotPriceOz = spotPrice * TROY_OZ

  const quote = useMemo(
    () => buildQuote(asset, grams, spotPrice),
    [asset, grams, spotPrice]
  )

  const handleConfirm = async () => {
    setIsLoading(true)
    // In production: buildMeldTradeTxns → signAndSend
    setTimeout(() => {
      setIsLoading(false)
      setShowConfirm(false)
      alert(`Trade confirmed! ${grams}g ${asset} ${tab === 'buy' ? 'purchased' : 'sold'} via Tinyman DEX`)
    }, 2000)
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-100">
        Trade {asset === 'MCAU' ? 'Gold' : 'Silver'}
      </h3>

      {/* Asset selector */}
      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setAsset('MCAU')}
          className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${
            asset === 'MCAU'
              ? 'bg-gold-500 text-slate-900'
              : 'border border-slate-600 text-slate-400 hover:text-slate-200'
          }`}
        >
          MCAU (Gold)
        </button>
        <button
          onClick={() => setAsset('MSOS')}
          className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${
            asset === 'MSOS'
              ? 'bg-slate-300 text-slate-900'
              : 'border border-slate-600 text-slate-400 hover:text-slate-200'
          }`}
        >
          MSOS (Silver)
        </button>
      </div>

      {/* Buy/Sell tabs */}
      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setTab('buy')}
          className={`flex-1 rounded py-1 text-xs font-medium ${
            tab === 'buy' ? 'bg-green-600 text-white' : 'text-slate-400'
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setTab('sell')}
          className={`flex-1 rounded py-1 text-xs font-medium ${
            tab === 'sell' ? 'bg-red-600 text-white' : 'text-slate-400'
          }`}
        >
          Sell
        </button>
      </div>

      {/* Spot price */}
      <div className="mb-3 rounded border border-slate-600 bg-slate-900 p-2 text-center">
        <div className="text-xs text-slate-400">
          Spot {asset === 'MCAU' ? 'Gold' : 'Silver'}
        </div>
        <div className="text-lg font-bold text-gold-400">
          ${spotPrice.toFixed(4)}/g
        </div>
        <div className="text-xs text-slate-500">
          (${spotPriceOz.toFixed(2)}/ozt)
        </div>
      </div>

      {/* Amount input */}
      <div className="mb-3">
        <label className="mb-1 block text-xs text-slate-400">Amount (grams)</label>
        <input
          type="number"
          min={0.01}
          step={0.01}
          value={grams}
          onChange={(e) => setGrams(Math.max(0.01, parseFloat(e.target.value) || 0.01))}
          className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-gold-500 focus:outline-none"
        />
      </div>

      {/* Fee breakdown */}
      <div className="mb-3 space-y-1 text-xs">
        <div className="flex justify-between text-slate-400">
          <span>Subtotal</span>
          <span>${quote.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Platform fee (0.7%)</span>
          <span>${quote.platform_fee.toFixed(4)}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Protocol fee (~0.1%)</span>
          <span>${quote.protocol_fee.toFixed(4)}</span>
        </div>
        <div className="flex justify-between border-t border-slate-700 pt-1 font-medium text-slate-100">
          <span>Total</span>
          <span>${quote.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Confirm button */}
      {wallet ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full rounded-lg bg-gold-500 py-2 text-sm font-medium text-slate-900 hover:bg-gold-400"
        >
          {tab === 'buy' ? 'Buy' : 'Sell'} {grams}g {asset}
        </button>
      ) : (
        <button disabled className="w-full cursor-not-allowed rounded-lg bg-slate-700 py-2 text-sm text-slate-400">
          Connect Wallet to Trade
        </button>
      )}

      {/* Fee note */}
      <p className="mt-2 text-center text-[10px] text-slate-500">
        Trades via{' '}
        <a href="https://app.tinyman.org" target="_blank" rel="noopener noreferrer" className="underline">
          Tinyman DEX
        </a>
        . 0.7% fee supports{' '}
        <a href="https://aurumorcale.com" target="_blank" rel="noopener noreferrer" className="underline">
          AurumOracle.com
        </a>{' '}
        &{' '}
        <a href="https://app.nf.domains/name/xpc.algo" target="_blank" rel="noopener noreferrer" className="underline">
          xpc.algo
        </a>
      </p>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-slate-800 p-6">
            <h3 className="mb-4 text-lg font-bold text-slate-100">
              Confirm {tab === 'buy' ? 'Purchase' : 'Sale'}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Asset</span>
                <span className="text-slate-100">{asset} ({asset === 'MCAU' ? 'Gold' : 'Silver'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount</span>
                <span className="text-slate-100">{grams}g ({(grams / TROY_OZ).toFixed(4)} ozt)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Price</span>
                <span className="text-slate-100">${spotPrice.toFixed(4)}/g (${spotPriceOz.toFixed(2)}/ozt)</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-2 font-bold">
                <span className="text-slate-200">Total</span>
                <span className="text-gold-400">${quote.total.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-lg border border-slate-600 py-2 text-sm text-slate-300 hover:border-slate-400"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 rounded-lg bg-gold-500 py-2 text-sm font-medium text-slate-900 hover:bg-gold-400 disabled:opacity-50"
              >
                {isLoading ? 'Signing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
