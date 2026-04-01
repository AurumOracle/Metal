'use client'
import { useState } from 'react'
import { useMarkets, useWallet, useUI } from '@/store'
import { useVote, useMarketOnChain, type TxSigner } from '@/hooks'
import { CommentsSection } from './CommentsSection'
import { Badge, LiveDot, Spinner } from '@/components/ui'
import { useWalletConnect } from '@/components/providers/WalletProvider'
import { calcExpectedPayout, rawToXPC, CONTRACT_IDS } from '@/lib/contracts/client'
import type { Market, VoteSide } from '@/types'
import { clsx } from 'clsx'

// ── MOCK MARKETS ──────────────────────────────────────────────────────
// Replace with: useQuery to /api/markets which reads contract registry

const MOCK_MARKETS: Market[] = [
  {
    id:         'mkt-001',
    question:   'Will spot gold close above $3,150 this Friday?',
    tag:        'Gold · Weekly',
    closesAt:   new Date(Date.now() + 3 * 86_400_000).toISOString(),
    status:     'open',
    yesPct:     62, noPct: 38,
    totalVotes: 841,
    xpcReward:  50,
  },
  {
    id:         'mkt-002',
    question:   'Will silver outperform gold on a percentage basis this week?',
    tag:        'Silver · Weekly',
    closesAt:   new Date(Date.now() + 3 * 86_400_000).toISOString(),
    status:     'open',
    yesPct:     44, noPct: 56,
    totalVotes: 613,
    xpcReward:  50,
  },
  {
    id:         'mkt-003',
    question:   'Will MCAU trade at a premium to spot gold on Monday open?',
    tag:        'MCAU · Tokenised',
    closesAt:   new Date(Date.now() + 5 * 86_400_000).toISOString(),
    status:     'open',
    yesPct:     38, noPct: 62,
    totalVotes: 290,
    xpcReward:  75,
  },
  {
    id:         'mkt-004',
    question:   'Will gold set a new all-time high before end of March 2026?',
    tag:        'Macro · ATH Watch',
    closesAt:   new Date('2026-03-31T23:59:00Z').toISOString(),
    status:     'open',
    yesPct:     71, noPct: 29,
    totalVotes: 1204,
    xpcReward:  100,
  },
]

// ── CLOSE COUNTDOWN ───────────────────────────────────────────────────

function Countdown({ closesAt }: { closesAt: string }) {
  const diff   = new Date(closesAt).getTime() - Date.now()
  const days   = Math.floor(diff / 86_400_000)
  const hours  = Math.floor((diff % 86_400_000) / 3_600_000)
  const mins   = Math.floor((diff % 3_600_000) / 60_000)

  if (diff <= 0) return <span className="text-down italic">Closed</span>

  return (
    <span className="italic text-muted">
      Closes {days > 0 ? `${days}d ` : ''}{hours}h {mins}m
    </span>
  )
}

// ── VOTE BUTTONS ──────────────────────────────────────────────────────

function VoteButtons({
  market,
  myVote,
  stakeXPC,
  onVote,
  isVoting,
}: {
  market:   Market
  myVote?:  VoteSide
  stakeXPC: number
  onVote:   (side: VoteSide) => void
  isVoting: boolean
}) {
  const yp = myVote ? (myVote === 'yes' ? market.yesPct + 2 : market.yesPct - 2) : market.yesPct
  const np = 100 - yp

  return (
    <>
      <div className="flex gap-2 mb-2">
        {(['yes', 'no'] as VoteSide[]).map(side => (
          <button
            key={side}
            onClick={() => !myVote && !isVoting && onVote(side)}
            disabled={!!myVote || isVoting}
            className={clsx(
              'flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2',
              'font-display text-[9px] tracking-[0.1em] uppercase rounded-lg border',
              'transition-all duration-150',
              !myVote && !isVoting && 'cursor-pointer',
              myVote === side && side === 'yes' && 'bg-up-dim border-up text-up',
              myVote === side && side === 'no'  && 'bg-down-dim border-down text-down',
              !myVote && 'bg-surface-hover border-default text-secondary hover:border-gold hover:bg-gold-dim hover:text-gold',
              myVote && myVote !== side && 'opacity-40 cursor-default',
            )}
          >
            {isVoting && !myVote ? (
              <Spinner size={14} />
            ) : (
              <span className={clsx(
                'text-[16px] font-light',
                myVote === side && side === 'yes' ? 'text-up' :
                myVote === side && side === 'no'  ? 'text-down' : 'text-primary',
              )}>
                {side === 'yes' ? yp : np}%
              </span>
            )}
            {side.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Stake display */}
      {!myVote && (
        <div className="text-[10px] italic text-muted text-center mb-2">
          Stake {stakeXPC} XPC · {market.xpcReward} XPC reward on correct call
        </div>
      )}

      {/* Progress bar */}
      <div className="h-[2px] bg-[rgba(255,255,255,0.05)] rounded-full overflow-hidden mb-2">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${yp}%`, background: 'linear-gradient(90deg,#5BAD8A,#C9A84C)' }}
        />
      </div>

      <div className="flex justify-between text-[10px] italic text-muted">
        <span>{market.totalVotes.toLocaleString()} predictions</span>
        <span>+{market.xpcReward} XPC correct</span>
      </div>
    </>
  )
}

// ── SINGLE PREDICTION CARD ────────────────────────────────────────────

function PredictionCard({ market }: { market: Market }) {
  const [expanded,    setExpanded]  = useState(false)
  const [stakeXPC,    setStakeXPC]  = useState(10)
  const [showStake,   setShowStake] = useState(false)

  const { votes, castVote }  = useMarkets()
  const { isConnected }      = useWallet()
  const { showToast }        = useUI()
  const { connect, signAndSend } = useWalletConnect()
  const signer: TxSigner | null = isConnected ? signAndSend : null
  const { mutate: vote, isPending: isVoting } = useVote(signer)

  const myVote = votes[market.id] as VoteSide | undefined

  function handleVote(side: VoteSide) {
    if (!isConnected) {
      showToast('Connect wallet to vote')
      connect()
      return
    }
    // Optimistically update UI
    castVote(market.id, side)
    showToast(`Voted ${side.toUpperCase()} · ${market.xpcReward} XPC on correct call · signing…`)

    // Submit on-chain (requires CONTRACT_IDS.marketRegistry to be set)
    if (CONTRACT_IDS.marketRegistry) {
      vote(
        { appId: CONTRACT_IDS.marketRegistry, side, stakeXPC },
        {
          onError: () => showToast('Vote failed — please try again'),
        }
      )
    }
  }

  return (
    <div className={clsx(
      'bg-surface-card border rounded-xl overflow-hidden mb-3 last:mb-0',
      'transition-colors duration-150',
      myVote ? 'border-[rgba(201,168,76,0.25)]' : 'border-default',
    )}>
      {/* Gold accent bar */}
      <div className={clsx(
        'h-[2px]',
        myVote === 'yes' ? 'bg-up' : myVote === 'no' ? 'bg-down' : 'bg-gold opacity-40'
      )} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-display text-[9px] tracking-[0.16em] text-muted uppercase">
            {market.tag}
          </span>
          <div className="flex items-center gap-2 text-[10px]">
            <Countdown closesAt={market.closesAt} />
            {myVote && (
              <Badge variant={myVote === 'yes' ? 'up' : 'down'}>
                {myVote.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        {/* Question */}
        <p className="text-[16px] font-light leading-snug text-primary mb-3">
          {market.question}
        </p>

        {/* Stake adjuster (shown when wallet connected and not yet voted) */}
        {isConnected && !myVote && showStake && (
          <div className="flex items-center gap-2 mb-3 text-[12px]">
            <span className="text-muted italic">Stake:</span>
            <input
              type="number"
              min="1"
              step="1"
              value={stakeXPC}
              onChange={e => setStakeXPC(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20 bg-surface-hover border border-default rounded px-2 py-1 text-primary outline-none focus:border-gold text-[13px]"
            />
            <span className="text-muted">XPC</span>
          </div>
        )}

        {/* Vote buttons */}
        <VoteButtons
          market={market}
          myVote={myVote}
          stakeXPC={stakeXPC}
          onVote={handleVote}
          isVoting={isVoting}
        />

        {/* Post-vote confirmation */}
        {myVote && (
          <div className="flex items-center gap-1.5 mt-2 text-[11px] italic text-gold">
            <LiveDot color="gold" />
            Voted {myVote.toUpperCase()} · minted on Algorand · xpc.algo
          </div>
        )}

        {/* Expand/collapse comments */}
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="mt-3 w-full text-[10px] italic text-muted hover:text-secondary cursor-pointer transition-colors border-t border-default pt-2.5 text-center"
        >
          {expanded ? '↑ Hide discussion' : '↓ Show discussion'}
        </button>
      </div>

      {/* Comments section */}
      {expanded && (
        <div className="border-t border-default px-4 py-4 bg-surface-raised">
          <CommentsSection marketId={market.id} />
        </div>
      )}
    </div>
  )
}

// ── PREDICTION LIST ───────────────────────────────────────────────────

export function PredictionList() {
  const markets = MOCK_MARKETS   // replace with useQuery in production

  return (
    <div>
      {markets.map(market => (
        <PredictionCard key={market.id} market={market} />
      ))}

      {/* Onboarding callout */}
      <div className="mt-4 p-4 bg-algo-dim border border-algo rounded-xl text-[11px] leading-relaxed">
        <div className="flex items-center gap-1.5 font-display text-[9px] tracking-[0.14em] text-algo uppercase mb-2">
          <LiveDot color="algo" />
          On-chain · Algorand · xpc.algo
        </div>
        <p className="text-secondary italic mb-2">
          All votes and comments are signed by your wallet and permanently stored on Algorand.
          Correct predictions earn XPC tokens. Top predictors earn rank badges as NFTs.
        </p>
        <a
          href="https://app.nf.domains/name/xpc.algo?view=segments"
          target="_blank"
          rel="noopener noreferrer"
          className="text-algo hover:underline font-display text-[9px] tracking-[0.1em] uppercase not-italic"
        >
          Mint xpc.algo segment to get your identity →
        </a>
      </div>
    </div>
  )
}
