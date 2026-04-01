'use client'
import { useState, useCallback } from 'react'
import type { Metadata } from 'next'
import { useWallet, useUI } from '@/store'
import { useWalletConnect } from '@/components/providers/WalletProvider'
import { algodClient } from '@/lib/algorand'
import { LiveDot, Spinner } from '@/components/ui'
import algosdk from 'algosdk'
import { clsx } from 'clsx'

// ── SALE CONFIG ────────────────────────────────────────────────────────
// Adjust these before launch

const SALE_CONFIG = {
  xpcAsaId:        parseInt(process.env.NEXT_PUBLIC_XPC_ASA_ID   ?? '0'),
  treasuryAddr:    process.env.NEXT_PUBLIC_TREASURY_ADDRESS       ?? '',
  // Price in ALGO per XPC (update this as ALGO price changes)
  algoPerXPC:      0.02,      // ~$0.00142 at $0.071/ALGO — approximate
  // Sale limits
  minPurchaseXPC:  100,
  maxPurchaseXPC:  50_000,
  totalSaleXPC:    60_000_000,  // 60% of supply = public sale allocation
  soldXPC:         31_248_000,  // update from DB / on-chain read
  // Bonus tiers
  bonusTiers: [
    { minXPC: 10_000, bonusPct: 10, label: '10% bonus',  color: 'text-gold' },
    { minXPC:  5_000, bonusPct:  5, label:  '5% bonus',  color: 'text-up'   },
    { minXPC:  1_000, bonusPct:  2, label:  '2% bonus',  color: 'text-algo' },
  ],
}

function getBonus(amount: number): { bonusPct: number; label: string; color: string } | null {
  return SALE_CONFIG.bonusTiers.find(t => amount >= t.minXPC) ?? null
}

function progressPct(): number {
  return (SALE_CONFIG.soldXPC / SALE_CONFIG.totalSaleXPC) * 100
}

// ── PURCHASE FLOW ──────────────────────────────────────────────────────

async function buildXPCPurchaseTxns(
  buyerAddr:  string,
  xpcAmount:  number,
  algoPerXPC: number,
): Promise<algosdk.Transaction[]> {
  const sp          = await algodClient.getTransactionParams().do()
  const algoAmount  = Math.floor(xpcAmount * algoPerXPC * 1_000_000)  // microALGO
  const treasury    = SALE_CONFIG.treasuryAddr

  if (!treasury) throw new Error('Treasury address not configured')

  const txns: algosdk.Transaction[] = []

  // 1. Opt into XPC ASA if needed (self-transfer of 0)
  if (SALE_CONFIG.xpcAsaId) {
    const acctInfo = await algodClient.accountInformation(buyerAddr).do()
    const optedIn  = (acctInfo.assets ?? []).some(
      (a: any) => Number(a.assetId) === SALE_CONFIG.xpcAsaId
    )
    if (!optedIn) {
      txns.push(algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        sender:          buyerAddr,
        receiver:        buyerAddr,
        assetIndex:      SALE_CONFIG.xpcAsaId,
        amount:          0,
        suggestedParams: sp,
      }))
    }
  }

  // 2. Payment to treasury
  txns.push(algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    sender:          buyerAddr,
    receiver:        treasury,
    amount:          algoAmount,
    note:            new TextEncoder().encode(
      `AO/v1/{"type":"xpc_purchase","xpc":${xpcAmount},"buyer":"${buyerAddr}"}`
    ),
    suggestedParams: sp,
  }))

  if (txns.length > 1) algosdk.assignGroupID(txns)
  return txns
}

// ── SALE WIDGET ────────────────────────────────────────────────────────

function SaleWidget() {
  const [amount,     setAmount]     = useState(1000)
  const [txStatus,   setTxStatus]   = useState<'idle'|'signing'|'confirmed'|'error'>('idle')
  const [txId,       setTxId]       = useState<string | null>(null)
  const [errorMsg,   setErrorMsg]   = useState<string | null>(null)

  const { isConnected, walletAddress } = useWallet()
  const { showToast }                  = useUI()
  const { connect, signAndSend }       = useWalletConnect()

  const bonus       = getBonus(amount)
  const bonusXPC    = bonus ? Math.floor(amount * bonus.bonusPct / 100) : 0
  const totalXPC    = amount + bonusXPC
  const algoNeeded  = (amount * SALE_CONFIG.algoPerXPC).toFixed(4)
  const usdValue    = (amount * SALE_CONFIG.algoPerXPC * 0.071).toFixed(2)

  const handlePurchase = useCallback(async () => {
    if (!isConnected || !walletAddress) { connect(); return }
    if (amount < SALE_CONFIG.minPurchaseXPC) {
      showToast(`Minimum purchase is ${SALE_CONFIG.minPurchaseXPC} XPC`)
      return
    }

    setTxStatus('signing')
    setErrorMsg(null)

    try {
      const txns = await buildXPCPurchaseTxns(walletAddress, amount, SALE_CONFIG.algoPerXPC)
      const id   = await signAndSend(txns)
      setTxId(id)
      setTxStatus('confirmed')
      showToast(`Purchased ${totalXPC.toLocaleString()} XPC · tx confirmed`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Transaction failed'
      if (!msg.toLowerCase().includes('cancel')) {
        setTxStatus('error')
        setErrorMsg(msg)
        showToast('Purchase failed — ' + msg)
      } else {
        setTxStatus('idle')
      }
    }
  }, [isConnected, walletAddress, amount, totalXPC, connect, signAndSend, showToast])

  if (txStatus === 'confirmed' && txId) {
    return (
      <div className="text-center py-8">
        <div className="text-[40px] mb-4">◆</div>
        <div className="font-display text-[14px] tracking-[0.12em] text-gold mb-2">
          Purchase confirmed
        </div>
        <div className="text-[16px] font-light text-primary mb-1">
          {totalXPC.toLocaleString()} XPC received
        </div>
        {bonusXPC > 0 && (
          <div className="text-[13px] italic text-up mb-4">
            Including {bonusXPC.toLocaleString()} XPC bonus
          </div>
        )}
        <a
          href={`https://allo.info/tx/${txId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 text-[10px] font-display tracking-[0.1em] text-algo hover:underline mb-6"
        >
          <LiveDot color="algo" />
          {txId.slice(0, 12)}… · View on Allo
        </a>
        <button
          onClick={() => { setTxStatus('idle'); setTxId(null) }}
          className="font-display text-[9px] tracking-[0.12em] uppercase px-5 py-2.5 rounded-xl border border-gold bg-gold-dim text-gold hover:bg-[rgba(201,168,76,0.22)] cursor-pointer transition-all"
        >
          Buy more XPC
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Amount input */}
      <div>
        <div className="label mb-2">XPC amount</div>
        <div className="relative">
          <input
            type="number"
            min={SALE_CONFIG.minPurchaseXPC}
            max={SALE_CONFIG.maxPurchaseXPC}
            step={100}
            value={amount}
            onChange={e => setAmount(Math.max(SALE_CONFIG.minPurchaseXPC, parseInt(e.target.value) || 0))}
            className={clsx(
              'w-full bg-surface-hover border border-default rounded-xl',
              'px-4 py-3 text-[20px] font-light text-primary outline-none',
              'focus:border-gold transition-colors',
              '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none',
              '[&::-webkit-inner-spin-button]:appearance-none',
            )}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 font-display text-[10px] tracking-[0.1em] text-muted">
            XPC
          </span>
        </div>

        {/* Quick select */}
        <div className="flex gap-1.5 mt-2">
          {[500, 1000, 5000, 10000].map(n => (
            <button
              key={n}
              onClick={() => setAmount(n)}
              className={clsx(
                'flex-1 py-1.5 font-display text-[8px] tracking-[0.1em] rounded border cursor-pointer transition-all',
                amount === n
                  ? 'bg-gold-dim border-gold text-gold'
                  : 'border-default text-muted hover:border-gold hover:text-gold',
              )}
            >
              {n.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* Bonus tier */}
      {bonus && (
        <div className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded-lg border',
          'border-[rgba(201,168,76,0.25)] bg-gold-dim',
        )}>
          <span className="text-gold text-[14px]">◆</span>
          <span className={clsx('font-display text-[10px] tracking-[0.1em]', bonus.color)}>
            {bonus.label} — +{bonusXPC.toLocaleString()} XPC free
          </span>
        </div>
      )}

      {/* Cost breakdown */}
      <div className="bg-surface-card border border-default rounded-xl p-4 space-y-2 text-[12px]">
        <div className="flex justify-between text-secondary">
          <span>XPC purchased</span>
          <span className="text-primary">{amount.toLocaleString()} XPC</span>
        </div>
        {bonusXPC > 0 && (
          <div className="flex justify-between text-secondary">
            <span>Bonus XPC ({bonus?.bonusPct}%)</span>
            <span className="text-up">+{bonusXPC.toLocaleString()} XPC</span>
          </div>
        )}
        <div className="flex justify-between text-secondary border-t border-default pt-2">
          <span>Total XPC received</span>
          <span className="text-gold font-display text-[13px]">{totalXPC.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-secondary">
          <span>Cost in ALGO</span>
          <span className="text-primary">{algoNeeded} ALGO</span>
        </div>
        <div className="flex justify-between text-secondary">
          <span>Approximate USD</span>
          <span className="text-muted italic">~${usdValue}</span>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handlePurchase}
        disabled={txStatus === 'signing'}
        className={clsx(
          'w-full py-3.5 font-display text-[10px] tracking-[0.14em] uppercase',
          'rounded-xl border cursor-pointer transition-all',
          'flex items-center justify-center gap-2',
          'disabled:opacity-70 disabled:cursor-not-allowed',
          isConnected
            ? 'bg-gold-dim border-gold text-gold hover:bg-[rgba(201,168,76,0.22)]'
            : 'border-default text-muted hover:border-gold hover:text-gold',
        )}
      >
        {txStatus === 'signing' ? (
          <><Spinner size={14} /> Signing in wallet…</>
        ) : isConnected ? (
          <>Buy {totalXPC.toLocaleString()} XPC for {algoNeeded} ALGO</>
        ) : (
          <>Connect wallet to purchase</>
        )}
      </button>

      {errorMsg && (
        <div className="text-[11px] italic text-down text-center">{errorMsg}</div>
      )}

      <div className="flex items-center gap-1.5 text-[10px] italic text-muted">
        <LiveDot color="algo" />
        Instant delivery · Algorand ASA · signed in your wallet
      </div>
    </div>
  )
}

// ── PAGE ───────────────────────────────────────────────────────────────

export default function SalePage() {
  const pct = progressPct()
  const remaining = (SALE_CONFIG.totalSaleXPC - SALE_CONFIG.soldXPC).toLocaleString()

  return (
    <main className="min-h-screen bg-surface-base">

      {/* Hero */}
      <section className="border-b border-default px-8 py-12 bg-surface-raised">
        <div className="max-w-4xl mx-auto text-center">
          <div className="label mb-3">Public token sale · live</div>
          <h1 className="font-display text-4xl font-bold tracking-[0.1em] text-gold mb-4 leading-tight">
            Buy XPC tokens
          </h1>
          <p className="text-[17px] font-light text-secondary max-w-xl mx-auto leading-relaxed">
            XPC is the utility token of Aurum Oracle. Earn it by predicting metals markets. Use it to vote, unlock premium, and build your xpc.algo identity.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

          {/* Left — sale info */}
          <div className="space-y-6">

            {/* Progress */}
            <div className="bg-surface-card border border-default rounded-2xl p-6">
              <div className="flex justify-between items-baseline mb-3">
                <div className="label">Sale progress</div>
                <div className="font-display text-[11px] tracking-[0.08em] text-gold">
                  {pct.toFixed(1)}% sold
                </div>
              </div>
              <div className="h-2 bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg,#C9A84C,#E8C97A)',
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: 'Sold',       value: SALE_CONFIG.soldXPC.toLocaleString() },
                  { label: 'Remaining',  value: remaining },
                  { label: 'Total sale', value: (SALE_CONFIG.totalSaleXPC / 1e6).toFixed(0) + 'M' },
                ].map(s => (
                  <div key={s.label}>
                    <div className="label mb-1">{s.label}</div>
                    <div className="font-display text-[14px] tracking-[0.06em] text-primary">{s.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bonus tiers */}
            <div className="bg-surface-card border border-default rounded-2xl p-6">
              <div className="label mb-4">Purchase bonuses</div>
              <div className="space-y-2">
                {SALE_CONFIG.bonusTiers.map(tier => (
                  <div
                    key={tier.minXPC}
                    className="flex items-center gap-3 py-2 border-b border-default last:border-0"
                  >
                    <span className={clsx('font-display text-[11px] tracking-[0.08em]', tier.color)}>
                      {tier.label}
                    </span>
                    <span className="flex-1 text-[12px] italic text-muted">
                      on purchases of {tier.minXPC.toLocaleString()}+ XPC
                    </span>
                  </div>
                ))}
                <div className="text-[11px] italic text-muted pt-1">
                  Bonuses are applied automatically at checkout.
                </div>
              </div>
            </div>

            {/* Use cases */}
            <div className="bg-surface-card border border-default rounded-2xl p-6">
              <div className="label mb-4">What XPC unlocks</div>
              <div className="space-y-2.5">
                {[
                  { icon: '◈', text: 'Stake to vote on prediction markets' },
                  { icon: '⬡', text: 'Hold 1,000 XPC → Premium access' },
                  { icon: '▲', text: 'Earn rank badges — up to Oracle of the Vault' },
                  { icon: '◆', text: 'Mint your xpc.algo identity' },
                  { icon: '↗', text: 'Deflationary — burns with every market' },
                ].map(u => (
                  <div key={u.icon} className="flex items-center gap-3 text-[13px] text-secondary">
                    <span className="text-gold text-[16px] w-5 text-center flex-shrink-0">{u.icon}</span>
                    {u.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — purchase widget */}
          <div>
            <div className="bg-surface-card border border-gold rounded-2xl p-6 sticky top-[68px]">
              <div className="font-display text-[11px] tracking-[0.16em] text-gold uppercase text-center mb-5">
                Buy XPC · Algorand
              </div>
              <SaleWidget />
            </div>

            {/* Disclaimer */}
            <div className="mt-4 text-[10px] italic text-muted leading-relaxed">
              XPC tokens are utility tokens for the Aurum Oracle platform. They do not constitute securities, investment contracts, or financial instruments. Token prices are determined by market supply and demand. Sale terms subject to change. Not available where prohibited by law.
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
