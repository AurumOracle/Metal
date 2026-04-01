'use client'
import { useState, useEffect, useCallback } from 'react'
import algosdk from 'algosdk'
import { useTrade, usePrices, useWallet, useUI } from '@/store'
import { useWalletConnect } from '@/components/providers/WalletProvider'
import { buildQuote, TROY_OZ_TO_GRAMS } from '@/types'
import type { TradeQuote } from '@/types'
import { Button, Badge, LiveDot, Divider, Spinner } from '@/components/ui'
import { clsx } from 'clsx'

// ── CONFIRM MODAL ──────────────────────────────────────────────────────

function ConfirmModal({ quote, onConfirm, onCancel }: {
  quote:     TradeQuote
  onConfirm: () => void
  onCancel:  () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const isBuy = quote.side === 'buy'
  const { showToast }     = useUI()
  const { walletAddress } = useWallet()
  const { signAndSend }   = useWalletConnect()

  function handleConfirm() {
    if (!walletAddress) return
    setConfirming(true)

    import('@/lib/meld').then(async ({
      buildTinymanTradeTxns,
      buildASAOptInTx,
      isOptedIntoASA,
      getTinymanDeepLink,
    }) => {
      try {
        // 1. Check ASA opt-in — user must hold MCAU/MSOS before receiving
        const optedIn     = await isOptedIntoASA(walletAddress, quote.asset)
        const txnsToSign: algosdk.Transaction[] = []

        if (!optedIn) {
          const optInTx = await buildASAOptInTx(walletAddress, quote.asset)
          txnsToSign.push(optInTx)
          showToast(`Opting into ${quote.symbol} ASA first…`)
        }

        // 2. Build Tinyman swap tx group (+ platform fee tx)
        const { txns, source, tinymanQuote } = await buildTinymanTradeTxns(
          quote.asset,
          quote.side,
          quote.amountGrams,
          walletAddress,
          quote.spotPerTroyOz,
        )

        // 3a. Tinyman pool unavailable — redirect to Tinyman UI
        if (source === 'fallback' || txns.length === 0) {
          onCancel()
          const deepLink = getTinymanDeepLink(quote.asset, quote.side)
          showToast('Low pool liquidity — redirecting to Tinyman DEX…')
          setTimeout(() => window.open(deepLink, '_blank'), 800)
          return
        }

        txnsToSign.push(...txns)

        // 3b. Sign and broadcast via wallet
        const txId = await signAndSend(txnsToSign)
        onConfirm()

        const impact = tinymanQuote
          ? ` · ${tinymanQuote.priceImpactPct.toFixed(2)}% price impact`
          : ''
        showToast(
          `${isBuy ? 'Bought' : 'Sold'} ${quote.amountGrams.toFixed(2)}g ${quote.symbol}${impact} · ${txId.slice(0, 8)}…`
        )
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Transaction failed'
        if (!msg.toLowerCase().includes('cancel')) {
          showToast('Trade failed — ' + msg)
        }
        onCancel()
      } finally {
        setConfirming(false)
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center">
      <div className={clsx(
        'bg-surface-raised border border-gold rounded-2xl p-6 w-[340px] max-w-[92vw]',
        'animate-fade-in',
      )}>
        <h2 className="font-display text-[12px] tracking-[0.16em] text-gold text-center mb-4 uppercase">
          Confirm {isBuy ? 'purchase' : 'sale'} · {quote.symbol}
        </h2>

        <div className="space-y-2 text-[12px]">
          <Row label="Asset"         value={`${quote.symbol} · Meld Gold protocol`} />
          <Row label="Amount"        value={`${quote.amountGrams.toFixed(4)}g = ${quote.amountTroyOz.toFixed(6)} troy oz`} />
          <Row label="Spot per gram" value={`$${quote.spotPerGram.toFixed(6)}`} />
          <Row label="Spot per ozt"  value={`$${quote.spotPerTroyOz.toFixed(2)}`} />
        </div>

        <Divider className="my-3" />

        <div className="space-y-2 text-[12px]">
          <Row label="Subtotal"               value={`$${quote.subtotal.toFixed(6)}`} />
          <Row label="Platform fee (0.7%)"    value={`$${quote.platformFee.toFixed(6)}`} />
          <Row label="Meld protocol fee"      value={`~$${quote.meldFee.toFixed(6)}`} />
        </div>

        <Divider className="my-3" />

        <div className="flex justify-between font-display text-[10px] tracking-[0.08em]">
          <span className="text-secondary">Total payable</span>
          <span className="text-gold">${quote.total.toFixed(6)}</span>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] italic text-algo my-3">
          <LiveDot color="algo" />
          Signed via Pera · settled on Algorand
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            disabled={confirming}
            className="flex-1 py-2.5 font-display text-[9px] tracking-[0.1em] uppercase rounded-lg border border-default text-secondary hover:border-[rgba(255,255,255,0.14)] hover:text-primary cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className={clsx(
              'flex-1 py-2.5 font-display text-[9px] tracking-[0.12em] uppercase rounded-lg border cursor-pointer transition-all',
              'flex items-center justify-center gap-1.5',
              'disabled:opacity-70 disabled:cursor-not-allowed',
              isBuy
                ? 'bg-up-dim border-up text-up hover:bg-[rgba(91,173,138,0.24)]'
                : 'bg-down-dim border-down text-down hover:bg-[rgba(196,95,95,0.24)]',
            )}
          >
            {confirming
              ? <><Spinner size={12} /> Signing…</>
              : <>{isBuy ? 'Buy' : 'Sell'} · Sign in Pera</>
            }
          </button>
        </div>

        <div className="text-center text-[10px] italic text-muted mt-3">
          0.7% fee → xpc.algo treasury · <a href="https://www.AurumOracle.com" className="text-algo hover:underline" target="_blank" rel="noopener noreferrer">AurumOracle.com</a>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-secondary">
      <span>{label}</span>
      <span className="text-primary">{value}</span>
    </div>
  )
}

// ── TRADE WIDGET ───────────────────────────────────────────────────────

export function TradeWidget() {
  const { tradeAsset, tradeSide, tradeAmountGrams, isTradeModalOpen,
          setTradeAsset, setTradeSide, setTradeAmount, setActiveQuote,
          openTradeModal, closeTradeModal, activeQuote } = useTrade()
  const { getMeldGramPrice, spotPrices } = usePrices()
  const { isConnected } = useWallet()
  const { showToast } = useUI()

  // Recalculate quote whenever inputs change
  const recalculate = useCallback(() => {
    const spotXAU = spotPrices.find(p => p.symbol === 'XAU')?.priceUSD ?? 3142.80
    const spotXAG = spotPrices.find(p => p.symbol === 'XAG')?.priceUSD ?? 33.42
    const spotTroyOz = tradeAsset === 'gold' ? spotXAU : spotXAG
    if (tradeAmountGrams > 0) {
      const quote = buildQuote(tradeAsset, tradeSide, tradeAmountGrams, spotTroyOz)
      setActiveQuote(quote)
    }
  }, [tradeAsset, tradeSide, tradeAmountGrams, spotPrices, setActiveQuote])

  useEffect(() => { recalculate() }, [recalculate])

  function handleTradeClick() {
    if (!isConnected) {
      showToast('Connect your wallet to trade')
      return
    }
    openTradeModal()
  }

  const isBuy      = tradeSide === 'buy'
  const spotPerGram = activeQuote?.spotPerGram ?? 0
  const spotTroyOz  = activeQuote?.spotPerTroyOz ?? 0
  const symbol      = tradeAsset === 'gold' ? 'MCAU' : 'MSOS'

  return (
    <>
      <div className="bg-surface-card border border-gold rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-default">
          <span className="font-display text-[10px] tracking-[0.14em] text-gold uppercase">
            Buy · Sell · Tokenised metals
          </span>
          <Badge variant="algo">Algorand ASA</Badge>
        </div>

        {/* Buy / Sell tabs */}
        <div className="flex border-b border-default">
          {(['buy', 'sell'] as const).map(side => (
            <button
              key={side}
              onClick={() => setTradeSide(side)}
              className={clsx(
                'flex-1 py-2 font-display text-[9px] tracking-[0.12em] uppercase cursor-pointer transition-all',
                side === tradeSide
                  ? side === 'buy'
                    ? 'bg-up-dim text-up'
                    : 'bg-down-dim text-down'
                  : 'text-muted hover:text-secondary',
              )}
            >
              {side}
            </button>
          ))}
        </div>

        <div className="p-3">
          {/* Asset selector */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            {(['gold', 'silver'] as const).map(asset => (
              <button
                key={asset}
                onClick={() => setTradeAsset(asset)}
                className={clsx(
                  'py-2 rounded-lg border cursor-pointer transition-all text-center',
                  tradeAsset === asset
                    ? 'bg-gold-dim border-gold'
                    : 'bg-transparent border-default hover:border-[rgba(255,255,255,0.14)]',
                )}
              >
                <span className={clsx(
                  'block font-display text-[10px] tracking-[0.1em] font-bold mb-0.5',
                  tradeAsset === asset ? 'text-gold' : 'text-secondary',
                )}>
                  {asset === 'gold' ? 'MCAU' : 'MSOS'}
                </span>
                <span className="block text-[9px] italic text-muted">
                  {asset === 'gold' ? 'Gold · 1g/token' : 'Silver · 1g/token'}
                </span>
              </button>
            ))}
          </div>

          {/* Amount input */}
          <div className="mb-3">
            <div className="label mb-1.5">Amount — 1 token = 1 gram</div>
            <div className="relative">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={tradeAmountGrams}
                onChange={e => setTradeAmount(Math.max(0.01, parseFloat(e.target.value) || 0))}
                className={clsx(
                  'w-full bg-surface-hover border border-default rounded-lg',
                  'px-3 pr-10 py-2 text-[15px] font-light text-primary outline-none',
                  'focus:border-gold transition-colors',
                  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-display text-[9px] text-muted">
                g
              </span>
            </div>
          </div>

          {/* Fee breakdown */}
          {activeQuote && (
            <table className="w-full text-[11px] mb-3">
              <tbody>
                <FeeRow label="Spot per gram"       value={`$${spotPerGram.toFixed(6)}/g`} />
                <FeeRow label="Spot per troy oz"    value={`$${spotTroyOz.toFixed(2)}/ozt`} />
                <FeeRow label="Subtotal"            value={`$${activeQuote.subtotal.toFixed(6)}`} />
                <FeeRow label="Platform fee (0.7%)" value={`$${activeQuote.platformFee.toFixed(6)}`} />
                <FeeRow label="Meld protocol"       value={`~$${activeQuote.meldFee.toFixed(6)}`} />
                <tr className="border-t border-default">
                  <td className="pt-1.5 font-display text-[9px] tracking-[0.06em] text-secondary">
                    Total payable
                  </td>
                  <td className="pt-1.5 font-display text-[9px] tracking-[0.06em] text-gold text-right">
                    ${activeQuote.total.toFixed(6)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          {/* CTA */}
          <button
            onClick={handleTradeClick}
            className={clsx(
              'w-full py-2.5 mb-2 font-display text-[9px] tracking-[0.14em] uppercase',
              'rounded-lg border cursor-pointer transition-all',
              isBuy
                ? 'bg-up-dim border-up text-up hover:bg-[rgba(91,173,138,0.24)]'
                : 'bg-down-dim border-down text-down hover:bg-[rgba(196,95,95,0.24)]',
            )}
          >
            {isBuy ? 'Buy' : 'Sell'} {tradeAmountGrams.toFixed(2)}g {symbol}
          </button>

          <p className="text-center text-[10px] italic text-muted leading-relaxed">
            Via{' '}
            <a href="https://app.tinyman.org" target="_blank" rel="noopener noreferrer" className="text-algo hover:underline">
              Tinyman DEX
            </a>
            {' '}· MCAU/MSOS ASA · 0.7% platform fee →{' '}
            <a href="https://app.nf.domains/name/xpc.algo" target="_blank" rel="noopener noreferrer" className="text-algo hover:underline">
              xpc.algo
            </a>
          </p>
        </div>
      </div>

      {/* Confirm modal */}
      {isTradeModalOpen && activeQuote && (
        <ConfirmModal
          quote={activeQuote}
          onConfirm={closeTradeModal}
          onCancel={closeTradeModal}
        />
      )}
    </>
  )
}

function FeeRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-0.5 text-muted">{label}</td>
      <td className="py-0.5 text-primary text-right">{value}</td>
    </tr>
  )
}
