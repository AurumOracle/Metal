'use client'
import { useState, useEffect } from 'react'
import { useWallet, useUI } from '@/store'
import { useWalletConnect } from '@/components/providers/WalletProvider'
import { algodClient } from '@/lib/algorand'
import { readMarketState } from '@/lib/contracts/client'
import { LiveDot, Spinner, Badge } from '@/components/ui'
import algosdk from 'algosdk'
import { clsx } from 'clsx'

// ── AUTH GUARD ─────────────────────────────────────────────────────────
// Admin is gated to the oracle address from env

const ORACLE_ADDRESS = process.env.NEXT_PUBLIC_ORACLE_ADDRESS ?? ''

function useIsAdmin(): boolean {
  const { walletAddress } = useWallet()
  if (!ORACLE_ADDRESS) return false  // no oracle set = no admin
  return walletAddress === ORACLE_ADDRESS
}

// ── RESOLVE MARKET ─────────────────────────────────────────────────────

async function buildResolveTx(
  appId:     number,
  outcome:   'yes' | 'no',
  oracleAddr: string,
): Promise<algosdk.Transaction> {
  const sp = await algodClient.getTransactionParams().do()
  return algosdk.makeApplicationNoOpTxnFromObject({
    sender:          oracleAddr,
    appIndex:        appId,
    appArgs:         [
      new TextEncoder().encode('resolve'),
      new TextEncoder().encode(outcome),
    ],
    suggestedParams: { ...sp, fee: 4000 },   // extra fee covers inner txns (fee + burn)
  })
}

async function buildCloseTx(
  appId:      number,
  callerAddr: string,
): Promise<algosdk.Transaction> {
  const sp = await algodClient.getTransactionParams().do()
  return algosdk.makeApplicationNoOpTxnFromObject({
    sender:          callerAddr,
    appIndex:        appId,
    appArgs:         [new TextEncoder().encode('close')],
    suggestedParams: sp,
  })
}

// ── CREATE MARKET TX ───────────────────────────────────────────────────

async function buildCreateMarketTx(
  creatorAddr:     string,
  question:        string,
  closesAtUnix:    number,
  xpcAsaId:        number,
  treasuryAddr:    string,
  oracleAddr:      string,
  approvalBytes:   Uint8Array,
  clearBytes:      Uint8Array,
): Promise<algosdk.Transaction> {
  const sp = await algodClient.getTransactionParams().do()
  return algosdk.makeApplicationCreateTxnFromObject({
    sender:           creatorAddr,
    approvalProgram:  approvalBytes,
    clearProgram:     clearBytes,
    numGlobalByteSlices: 3,
    numGlobalInts:    6,
    numLocalByteSlices: 0,
    numLocalInts:     3,
    appArgs:          [
      new TextEncoder().encode(question),
      algosdk.encodeUint64(closesAtUnix),
      algosdk.encodeUint64(xpcAsaId),
      algosdk.decodeAddress(treasuryAddr).publicKey,
      algosdk.decodeAddress(oracleAddr).publicKey,
    ],
    foreignAssets:    [xpcAsaId],
    onComplete:       algosdk.OnApplicationComplete.NoOpOC,
    suggestedParams:  sp,
  })
}

// ── MARKET ROW ─────────────────────────────────────────────────────────

interface MarketRow {
  id:       string
  question: string
  appId:    number
  status:   'open' | 'closed' | 'resolved'
  outcome?: 'yes' | 'no'
}

const MOCK_MARKETS: MarketRow[] = [
  { id:'mkt-001', question:'Will gold close above $3,150 this Friday?',        appId: 0, status:'open'   },
  { id:'mkt-002', question:'Will silver outperform gold this week?',            appId: 0, status:'open'   },
  { id:'mkt-003', question:'Will MCAU trade at a premium on Monday open?',     appId: 0, status:'closed' },
  { id:'mkt-004', question:'Will gold set a new ATH before end of March 2026?',appId: 0, status:'open'   },
]

function MarketAdminRow({
  market,
  onResolve,
  onClose,
  isProcessing,
}: {
  market:      MarketRow
  onResolve:   (appId: number, outcome: 'yes' | 'no') => void
  onClose:     (appId: number) => void
  isProcessing: boolean
}) {
  const [showResolve, setShowResolve] = useState(false)

  return (
    <div className="border border-default rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Badge variant={
          market.status === 'open' ? 'up' :
          market.status === 'closed' ? 'gold' : 'flat'
        }>
          {market.status}
        </Badge>
        <div className="flex-1">
          <div className="text-[14px] font-light text-primary leading-snug">
            {market.question}
          </div>
          <div className="text-[10px] italic text-muted mt-0.5">
            App ID: {market.appId || 'not deployed'}
          </div>
        </div>
      </div>

      {market.status === 'open' && market.appId > 0 && (
        <button
          onClick={() => onClose(market.appId)}
          disabled={isProcessing}
          className="text-[9px] font-display tracking-[0.1em] uppercase text-muted border border-default px-3 py-1.5 rounded cursor-pointer hover:border-gold hover:text-gold transition-all disabled:opacity-50"
        >
          Close market
        </button>
      )}

      {market.status === 'closed' && market.appId > 0 && (
        <>
          {!showResolve ? (
            <button
              onClick={() => setShowResolve(true)}
              className="text-[9px] font-display tracking-[0.1em] uppercase text-gold border border-gold bg-gold-dim px-3 py-1.5 rounded cursor-pointer hover:bg-[rgba(201,168,76,0.22)] transition-all"
            >
              Resolve market
            </button>
          ) : (
            <div className="flex gap-2 items-center">
              <span className="text-[11px] italic text-muted">Outcome:</span>
              <button
                onClick={() => { onResolve(market.appId, 'yes'); setShowResolve(false) }}
                disabled={isProcessing}
                className="font-display text-[9px] tracking-[0.1em] uppercase px-4 py-1.5 rounded border border-up bg-up-dim text-up cursor-pointer hover:bg-[rgba(91,173,138,0.24)] disabled:opacity-50 transition-all"
              >
                {isProcessing ? <Spinner size={12} /> : 'YES won'}
              </button>
              <button
                onClick={() => { onResolve(market.appId, 'no'); setShowResolve(false) }}
                disabled={isProcessing}
                className="font-display text-[9px] tracking-[0.1em] uppercase px-4 py-1.5 rounded border border-down bg-down-dim text-down cursor-pointer hover:bg-[rgba(196,95,95,0.24)] disabled:opacity-50 transition-all"
              >
                {isProcessing ? <Spinner size={12} /> : 'NO won'}
              </button>
              <button onClick={() => setShowResolve(false)} className="text-[11px] text-muted cursor-pointer hover:text-secondary">
                Cancel
              </button>
            </div>
          )}
        </>
      )}

      {market.status === 'resolved' && market.outcome && (
        <Badge variant={market.outcome === 'yes' ? 'up' : 'down'}>
          Resolved: {market.outcome.toUpperCase()} won
        </Badge>
      )}
    </div>
  )
}

// ── CREATE MARKET FORM ─────────────────────────────────────────────────

function CreateMarketForm({ onCreated }: { onCreated: () => void }) {
  const [question,    setQuestion]    = useState('')
  const [closeDays,   setCloseDays]   = useState(7)
  const [closeHour,   setCloseHour]   = useState(21)
  const [isCreating,  setIsCreating]  = useState(false)

  const { walletAddress } = useWallet()
  const { showToast }     = useUI()
  const { signAndSend }   = useWalletConnect()

  async function handleCreate() {
    if (!question.trim() || !walletAddress) return
    setIsCreating(true)

    const closesAt = Math.floor(Date.now() / 1000) + closeDays * 86400 + (closeHour - new Date().getHours()) * 3600
    const xpcAsaId = parseInt(process.env.NEXT_PUBLIC_XPC_ASA_ID ?? '0')
    const treasury = process.env.NEXT_PUBLIC_TREASURY_ADDRESS ?? ''
    const oracle   = ORACLE_ADDRESS || walletAddress

    try {
      // Load pre-compiled TEAL bytecodes from public/teal.json
      // Run: python scripts/compile_teal.py  to regenerate
      const tealRes = await fetch('/teal.json')
      if (!tealRes.ok) throw new Error('TEAL bytecodes not found — run: python scripts/compile_teal.py')
      const teal    = await tealRes.json()

      const approvalB64 = teal.market?.approvalB64
      const clearB64    = teal.market?.clearB64
      if (!approvalB64 || !clearB64) {
        showToast('TEAL bytecodes not compiled — run: python scripts/compile_teal.py')
        return
      }

      const approvalBytes = Uint8Array.from(atob(approvalB64), c => c.charCodeAt(0))
      const clearBytes    = Uint8Array.from(atob(clearB64),    c => c.charCodeAt(0))

      const tx = await buildCreateMarketTx(
        walletAddress,
        question.trim().slice(0, 200),
        closesAt,
        xpcAsaId,
        treasury,
        oracle,
        approvalBytes,
        clearBytes,
      )
      const txId = await signAndSend([tx])
      showToast(`Market created on Algorand · ${txId.slice(0, 8)}…`)
      setQuestion('')
      onCreated()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Create failed'
      showToast('Create failed — ' + msg)
    } finally {
      setIsCreating(false)
    }
  }

  const closesAtISO = new Date(Date.now() + closeDays * 86400_000).toLocaleDateString('en', {
    weekday: 'short', month: 'short', day: 'numeric',
  }) + ` ${closeHour}:00 UTC`

  return (
    <div className="bg-surface-card border border-default rounded-2xl p-6 space-y-4">
      <div className="label">Create new market</div>

      <div>
        <div className="label mb-1.5">Question</div>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Will gold close above $3,200 this Friday?"
          rows={2}
          className="w-full bg-surface-hover border border-default rounded-xl px-4 py-2.5 text-[14px] font-light text-primary outline-none focus:border-gold resize-none placeholder:text-muted"
        />
        <div className="text-[10px] italic text-muted mt-1">{question.length}/200 characters</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="label mb-1.5">Closes in (days)</div>
          <input
            type="number"
            min={1} max={30}
            value={closeDays}
            onChange={e => setCloseDays(parseInt(e.target.value) || 7)}
            className="w-full bg-surface-hover border border-default rounded-xl px-4 py-2.5 text-[14px] font-light text-primary outline-none focus:border-gold [appearance:textfield]"
          />
        </div>
        <div>
          <div className="label mb-1.5">Close hour (UTC)</div>
          <input
            type="number"
            min={0} max={23}
            value={closeHour}
            onChange={e => setCloseHour(parseInt(e.target.value) || 21)}
            className="w-full bg-surface-hover border border-default rounded-xl px-4 py-2.5 text-[14px] font-light text-primary outline-none focus:border-gold [appearance:textfield]"
          />
        </div>
      </div>

      <div className="text-[11px] italic text-muted">
        Closes: {closesAtISO}
      </div>

      <button
        onClick={handleCreate}
        disabled={!question.trim() || isCreating}
        className="w-full py-2.5 font-display text-[9px] tracking-[0.14em] uppercase rounded-xl border border-gold bg-gold-dim text-gold hover:bg-[rgba(201,168,76,0.22)] cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isCreating ? <><Spinner size={12} /> Deploying…</> : 'Create market on Algorand'}
      </button>

      <div className="text-[10px] italic text-muted leading-relaxed">
        This deploys the PyTeal prediction market contract to Algorand. The caller pays the minimum balance (~0.1 ALGO). For bulk creation use: <code className="bg-surface-hover px-1 rounded text-[9px]">python scripts/deploy.py --network mainnet</code>
      </div>
    </div>
  )
}

// ── TREASURY PANEL ─────────────────────────────────────────────────────

function TreasuryPanel() {
  const [burnAmount, setBurnAmount] = useState(1000)
  const [isBurning,  setIsBurning]  = useState(false)

  const { walletAddress } = useWallet()
  const { showToast }     = useUI()
  const { signAndSend }   = useWalletConnect()

  const appId  = parseInt(process.env.NEXT_PUBLIC_TREASURY_APP_ID ?? '0')
  const xpcAsa = parseInt(process.env.NEXT_PUBLIC_XPC_ASA_ID ?? '0')

  async function handleBurn() {
    if (!walletAddress || !appId || !xpcAsa) return
    setIsBurning(true)
    try {
      const sp  = await algodClient.getTransactionParams().do()
      const tx  = algosdk.makeApplicationNoOpTxnFromObject({
        sender:          walletAddress,
        appIndex:        appId,
        appArgs:         [
          new TextEncoder().encode('burn'),
          algosdk.encodeUint64(burnAmount * 1_000_000),
        ],
        suggestedParams: { ...sp, fee: 3000 },
      })
      const txId = await signAndSend([tx])
      showToast(`Burned ${burnAmount.toLocaleString()} XPC · ${txId.slice(0,8)}…`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Burn failed'
      showToast('Burn failed — ' + msg)
    } finally {
      setIsBurning(false)
    }
  }

  return (
    <div className="bg-surface-card border border-default rounded-2xl p-6 space-y-4">
      <div className="label">Treasury controls</div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'App ID',        value: appId  || 'not set' },
          { label: 'XPC ASA ID',    value: xpcAsa || 'not set' },
          { label: 'Oracle addr',   value: ORACLE_ADDRESS ? ORACLE_ADDRESS.slice(0,8)+'…' : 'not set' },
        ].map(s => (
          <div key={s.label} className="bg-surface-hover rounded-xl p-3">
            <div className="label mb-1">{s.label}</div>
            <div className="font-display text-[11px] tracking-[0.06em] text-primary">{String(s.value)}</div>
          </div>
        ))}
      </div>

      {/* Manual burn */}
      <div>
        <div className="label mb-2">Manual XPC burn</div>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={burnAmount}
            onChange={e => setBurnAmount(parseInt(e.target.value) || 1000)}
            className="flex-1 bg-surface-hover border border-default rounded-xl px-3 py-2 text-[14px] font-light text-primary outline-none focus:border-gold [appearance:textfield]"
          />
          <span className="self-center text-[11px] italic text-muted">XPC</span>
          <button
            onClick={handleBurn}
            disabled={!appId || isBurning}
            className="font-display text-[9px] tracking-[0.1em] uppercase px-4 py-2 rounded-xl border border-down bg-down-dim text-down cursor-pointer hover:bg-[rgba(196,95,95,0.22)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
          >
            {isBurning ? <Spinner size={12} /> : 'Burn XPC'}
          </button>
        </div>
        <div className="text-[10px] italic text-muted mt-1">
          Sends XPC to the Algorand zero address — permanently removes from supply.
        </div>
      </div>
    </div>
  )
}

// ── ADMIN PAGE ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const isAdmin           = useIsAdmin()
  const { isConnected }   = useWallet()
  const { connect }       = useWalletConnect()
  const { showToast }     = useUI()
  const { signAndSend, activeAddress: walletAddress } = useWalletConnect()

  const [markets,      setMarkets]      = useState<MarketRow[]>(MOCK_MARKETS)
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeTab,    setActiveTab]    = useState<'markets'|'create'|'treasury'>('markets')

  async function handleResolve(appId: number, outcome: 'yes' | 'no') {
    if (!walletAddress) return
    setIsProcessing(true)
    try {
      const tx   = await buildResolveTx(appId, outcome, walletAddress)
      const txId = await signAndSend([tx])
      showToast(`Market resolved: ${outcome.toUpperCase()} · ${txId.slice(0,8)}…`)
      setMarkets(prev => prev.map(m =>
        m.appId === appId ? { ...m, status: 'resolved', outcome } : m
      ))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Resolve failed'
      showToast('Resolve failed — ' + msg)
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleClose(appId: number) {
    if (!walletAddress) return
    setIsProcessing(true)
    try {
      const tx   = await buildCloseTx(appId, walletAddress)
      const txId = await signAndSend([tx])
      showToast(`Market closed · ${txId.slice(0,8)}…`)
      setMarkets(prev => prev.map(m =>
        m.appId === appId ? { ...m, status: 'closed' } : m
      ))
    } catch (err: unknown) {
      showToast('Close failed')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <div className="font-display text-[11px] tracking-[0.16em] text-muted uppercase mb-4">Admin access</div>
          <button onClick={connect} className="font-display text-[10px] tracking-[0.14em] uppercase px-5 py-2.5 rounded-xl border border-gold bg-gold-dim text-gold hover:bg-[rgba(201,168,76,0.22)] cursor-pointer transition-all">
            Connect wallet
          </button>
        </div>
      </main>
    )
  }

  if (!isAdmin && ORACLE_ADDRESS) {
    return (
      <main className="min-h-screen bg-surface-base flex items-center justify-center">
        <div className="text-center">
          <div className="font-display text-[11px] tracking-[0.16em] text-down uppercase mb-2">Access denied</div>
          <div className="text-[13px] italic text-muted">Only the oracle address can access admin.</div>
        </div>
      </main>
    )
  }

  const TABS = [
    { key: 'markets',  label: 'Markets' },
    { key: 'create',   label: 'Create market' },
    { key: 'treasury', label: 'Treasury' },
  ] as const

  return (
    <main className="min-h-screen bg-surface-base">
      <section className="border-b border-default px-8 py-6 bg-surface-raised flex items-center justify-between">
        <div>
          <div className="label mb-1">Aurum Oracle — Admin</div>
          <h1 className="font-display text-xl font-bold tracking-[0.14em] text-gold">Oracle dashboard</h1>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] italic text-up">
          <LiveDot color="up" />
          Oracle connected
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-0.5 mb-6 border-b border-default">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={clsx(
                'font-display text-[9px] tracking-[0.14em] uppercase px-4 py-2.5 cursor-pointer border-b-2 transition-all',
                activeTab === t.key ? 'text-gold border-gold' : 'text-muted border-transparent hover:text-secondary',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'markets' && (
          <div className="space-y-3">
            {markets.map(m => (
              <MarketAdminRow
                key={m.id}
                market={m}
                onResolve={handleResolve}
                onClose={handleClose}
                isProcessing={isProcessing}
              />
            ))}
          </div>
        )}

        {activeTab === 'create' && (
          <CreateMarketForm onCreated={() => setActiveTab('markets')} />
        )}

        {activeTab === 'treasury' && <TreasuryPanel />}
      </div>
    </main>
  )
}
