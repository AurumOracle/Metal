'use client'
import { useState, useRef } from 'react'
import { useCommentSection, type TxSigner } from '@/hooks'
import { useWallet, useUI } from '@/store'
import { useWalletConnect } from '@/components/providers/WalletProvider'
import { LiveDot, Badge, Spinner } from '@/components/ui'
import { txExplorerLink, truncateAddress, getXPCSegmentMintURL } from '@/lib/algorand'
import type { Comment, NFDProfile, VoteSide } from '@/types'
import { getRank } from '@/types'
import { clsx } from 'clsx'

// ── NFD AVATAR ────────────────────────────────────────────────────────

function NFDAvatar({
  nfd,
  address,
  size = 32,
}: {
  nfd?:    NFDProfile | null
  address: string
  size?:   number
}) {
  // Derive a deterministic colour from the address for fallback avatar
  const hue = parseInt(address.slice(2, 6) || '0', 16) % 360

  if (nfd?.avatarUrl) {
    return (
      <img
        src={nfd.avatarUrl}
        alt={nfd.name}
        width={size}
        height={size}
        className="rounded-full object-cover flex-shrink-0 border border-default"
        style={{ width: size, height: size }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    )
  }

  // Fallback: initials on coloured background
  const initials = nfd?.name
    ? nfd.name.slice(0, 2).toUpperCase()
    : truncateAddress(address, 2).slice(0, 2).toUpperCase()

  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 border border-default"
      style={{
        width:           size,
        height:          size,
        background:      `hsl(${hue}, 35%, 22%)`,
        borderColor:     `hsl(${hue}, 35%, 35%)`,
        fontFamily:      "'Cinzel', serif",
        fontSize:        size * 0.35,
        color:           `hsl(${hue}, 60%, 70%)`,
      }}
    >
      {initials}
    </div>
  )
}

// ── COMMENT AUTHOR ────────────────────────────────────────────────────

function CommentAuthor({
  address,
  nfd,
  voteSide,
  timestamp,
  txId,
}: {
  address:   string
  nfd?:      NFDProfile | null
  voteSide?: VoteSide
  timestamp: string
  txId:      string
}) {
  const displayName = nfd?.name ?? truncateAddress(address)
  const rankLabel   = nfd ? getRank(0) : undefined   // would fetch from profile in production
  const timeAgo     = formatTimeAgo(timestamp)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-display text-[11px] tracking-[0.06em]" style={{
        color: nfd?.isSegment ? 'var(--gold)' : 'var(--text-secondary)',
      }}>
        {displayName}
      </span>

      {nfd?.isSegment && (
        <Badge variant="gold" className="text-[7px]">xpc</Badge>
      )}

      {voteSide && (
        <span className={clsx(
          'text-[10px] italic px-1.5 py-0.5 rounded-full',
          voteSide === 'yes' ? 'bg-up-dim text-up' : 'bg-down-dim text-down',
        )}>
          {voteSide.toUpperCase()}
        </span>
      )}

      <span className="text-[10px] italic text-muted ml-auto">{timeAgo}</span>

      <a
        href={txExplorerLink(txId)}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(
          'flex items-center gap-1 font-display text-[8px] tracking-[0.08em]',
          'text-algo bg-algo-dim border border-algo rounded px-1.5 py-0.5',
          'hover:bg-[rgba(0,180,216,0.18)] transition-colors',
        )}
        title="View on Allo explorer"
      >
        <LiveDot color="algo" />
        {txId.slice(0, 8)}…
      </a>
    </div>
  )
}

// ── SINGLE COMMENT ────────────────────────────────────────────────────

function CommentItem({
  comment,
  nfds,
  marketId,
  depth = 0,
  onReply,
  signer,
}: {
  comment:  Comment
  nfds:     Map<string, NFDProfile>
  marketId: string
  depth?:   number
  onReply:  (commentId: string) => void
  signer:   TxSigner | null
}) {
  const [liked, setLiked]   = useState(false)
  const [likes, setLikes]   = useState(comment.likes)
  const [liking, setLiking] = useState(false)
  const nfd = nfds.get(comment.walletAddr) ?? null
  const { walletAddress } = useWallet()
  const { showToast }     = useUI()

  async function handleLike() {
    if (liked || liking) return
    setLiked(true)
    setLikes(prev => prev + 1)

    if (!signer || !walletAddress) return   // optimistic UI — no wallet = no on-chain like
    setLiking(true)
    try {
      const { buildCommentTx } = await import('@/lib/algorand')
      const tx = await buildCommentTx(walletAddress, {
        type:     'like',
        marketId,
        replyTo:  comment.txId,   // replyTo = the tx being liked
      } as any)
      await signer([tx])
    } catch {
      // Likes are best-effort — don't undo the optimistic update on failure
    } finally {
      setLiking(false)
    }
  }

  return (
    <div className={clsx(
      'animate-fade-in',
      depth > 0 && 'ml-8 pl-3 border-l border-gold/20',
    )}>
      <div className="flex gap-2.5 py-3">
        {/* Avatar */}
        <NFDAvatar nfd={nfd} address={comment.walletAddr} size={depth > 0 ? 26 : 32} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <CommentAuthor
            address={comment.walletAddr}
            nfd={nfd}
            voteSide={comment.voteSide}
            timestamp={comment.timestamp}
            txId={comment.txId}
          />

          <p className="text-[14px] font-light text-primary leading-relaxed mt-1.5 mb-2">
            {comment.body}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLike}
              className={clsx(
                'flex items-center gap-1 text-[11px] italic cursor-pointer transition-colors',
                liked ? 'text-gold' : 'text-muted hover:text-secondary',
              )}
            >
              {liking ? '…' : liked ? '◆' : '◇'} {likes > 0 && likes}
            </button>

            {depth === 0 && (
              <button
                onClick={() => onReply(comment.id)}
                className="text-[11px] italic text-muted hover:text-secondary cursor-pointer transition-colors"
              >
                ↩ Reply
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies.length > 0 && (
        <div>
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              nfds={nfds}
              marketId={marketId}
              depth={depth + 1}
              onReply={onReply}
              signer={signer}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── COMPOSE BOX ───────────────────────────────────────────────────────

function ComposeBox({
  marketId,
  replyToId,
  replyToName,
  onCancel,
  onSubmit,
  isPosting,
}: {
  marketId:    string
  replyToId?:  string
  replyToName?: string
  onCancel?:   () => void
  onSubmit:    (body: string, replyTo?: string) => void
  isPosting:   boolean
}) {
  const [body, setBody]   = useState('')
  const textRef           = useRef<HTMLTextAreaElement>(null)
  const MAX_CHARS         = 900   // leave buffer under 1KB note limit
  const remaining         = MAX_CHARS - body.length

  function handleSubmit() {
    const trimmed = body.trim()
    if (!trimmed || isPosting) return
    onSubmit(trimmed, replyToId)
    setBody('')
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  return (
    <div className={clsx(
      'bg-surface-card border rounded-xl p-3 transition-colors',
      body.length > 0 ? 'border-gold' : 'border-default',
    )}>
      {replyToName && (
        <div className="text-[10px] italic text-muted mb-2 flex items-center gap-1.5">
          <span>Replying to</span>
          <span className="text-gold font-display text-[9px]">{replyToName}</span>
          {onCancel && (
            <button onClick={onCancel} className="ml-auto text-muted hover:text-down cursor-pointer">
              ✕
            </button>
          )}
        </div>
      )}
      <textarea
        ref={textRef}
        value={body}
        onChange={e => setBody(e.target.value.slice(0, MAX_CHARS))}
        onKeyDown={handleKey}
        placeholder="Share your analysis…"
        rows={3}
        className={clsx(
          'w-full bg-transparent outline-none resize-none',
          'text-[14px] font-light text-primary placeholder:text-muted',
          'leading-relaxed',
        )}
      />
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-default">
        <div className="flex items-center gap-1.5 text-[10px] italic text-muted">
          <LiveDot color="algo" />
          Stored on Algorand · permanent · signed by your wallet
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx(
            'text-[10px] font-display',
            remaining < 100 ? 'text-down' : 'text-muted',
          )}>
            {remaining}
          </span>
          <button
            onClick={handleSubmit}
            disabled={body.trim().length < 3 || isPosting}
            className={clsx(
              'font-display text-[9px] tracking-[0.12em] uppercase',
              'px-4 py-1.5 rounded-lg border cursor-pointer transition-all',
              'border-gold bg-gold-dim text-gold',
              'hover:bg-[rgba(201,168,76,0.22)] disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            {isPosting ? <Spinner size={12} /> : 'Post'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── SORT TABS ─────────────────────────────────────────────────────────

type SortMode = 'top' | 'new' | 'bulls' | 'bears'

function SortTabs({ active, onChange }: { active: SortMode; onChange: (s: SortMode) => void }) {
  const TABS: { key: SortMode; label: string }[] = [
    { key: 'top',   label: 'Top'   },
    { key: 'new',   label: 'New'   },
    { key: 'bulls', label: 'Bulls' },
    { key: 'bears', label: 'Bears' },
  ]
  return (
    <div className="flex gap-0.5 mb-3">
      {TABS.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={clsx(
            'font-display text-[9px] tracking-[0.1em] uppercase px-3 py-1.5 rounded cursor-pointer transition-all border',
            active === t.key
              ? 'bg-surface-hover text-gold border-default'
              : 'bg-transparent text-muted border-transparent hover:text-secondary',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── COMMENTS SECTION ──────────────────────────────────────────────────

export function CommentsSection({ marketId }: { marketId: string }) {
  const { isConnected } = useWallet()
  const { showToast }   = useUI()
  const { connect, signAndSend } = useWalletConnect()
  const signer: TxSigner | null = isConnected ? signAndSend : null
  const { comments, isLoading, nfds, postComment, isPosting, canComment } =
    useCommentSection(marketId, signer)

  const [sortMode, setSortMode]   = useState<SortMode>('top')
  const [replyToId, setReplyToId] = useState<string | undefined>()

  // Sort + filter comments
  const displayed = (() => {
    let list = [...comments]
    if (sortMode === 'new')   list.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    if (sortMode === 'top')   list.sort((a, b) => b.likes - a.likes)
    if (sortMode === 'bulls') list = list.filter(c => c.voteSide === 'yes')
    if (sortMode === 'bears') list = list.filter(c => c.voteSide === 'no')
    return list
  })()

  const replyTarget  = replyToId ? comments.find(c => c.id === replyToId) : undefined
  const replyNFD     = replyTarget ? nfds.get(replyTarget.walletAddr) : undefined
  const replyName    = replyNFD?.name ?? (replyTarget ? truncateAddress(replyTarget.walletAddr) : undefined)
  const totalComments = comments.reduce((n, c) => n + 1 + c.replies.length, 0)

  async function handleSubmit(body: string, replyTo?: string) {
    if (!isConnected) { showToast('Connect wallet to comment'); return }
    try {
      await postComment({ marketId, body, replyTo })
      setReplyToId(undefined)
      showToast('Comment minted on Algorand · live in ~5 seconds')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Post failed'
      if (!msg.toLowerCase().includes('cancel')) showToast('Comment failed — ' + msg)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-display text-[10px] tracking-[0.18em] text-muted uppercase">
          Discussion
        </span>
        <span className="text-[12px] italic text-muted">
          {totalComments} {totalComments === 1 ? 'comment' : 'comments'} · on-chain
        </span>
      </div>

      {/* Sort */}
      <SortTabs active={sortMode} onChange={setSortMode} />

      {/* Compose */}
      {isConnected ? (
        <div className="mb-4">
          <ComposeBox
            marketId={marketId}
            replyToId={replyToId}
            replyToName={replyName}
            onCancel={replyToId ? () => setReplyToId(undefined) : undefined}
            onSubmit={handleSubmit}
            isPosting={isPosting}
          />
        </div>
      ) : (
        <button
          onClick={connect}
          className={clsx(
            'w-full mb-4 py-3 text-[13px] italic text-muted',
            'border border-default rounded-xl hover:border-gold hover:text-gold',
            'cursor-pointer transition-all',
          )}
        >
          Connect wallet to join the discussion
        </button>
      )}

      {/* No NFD warning */}
      {isConnected && (
        <WalletNFDNotice />
      )}

      {/* Comment list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-muted text-[13px] italic">
          <Spinner size={14} /> Loading comments from Algorand…
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-8 text-center text-[13px] italic text-muted">
          {sortMode === 'bulls' || sortMode === 'bears'
            ? 'No comments from this side yet'
            : 'Be the first to share your analysis'
          }
        </div>
      ) : (
        <div className="divide-y divide-default">
          {displayed.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              nfds={nfds}
              marketId={marketId}
              onReply={id => setReplyToId(id)}
              signer={signer}
            />
          ))}
        </div>
      )}

      {/* On-chain footer note */}
      <div className="mt-4 flex items-start gap-2 text-[10px] italic text-muted leading-relaxed">
        <LiveDot color="algo" />
        <span>
          All comments are permanent Algorand transactions.{' '}
          <a
            href="https://app.nf.domains/name/xpc.algo?view=segments"
            target="_blank"
            rel="noopener noreferrer"
            className="text-algo hover:underline not-italic"
          >
            Mint xpc.algo
          </a>
          {' '}to display your identity alongside your comments.
        </span>
      </div>
    </div>
  )
}

// ── NFD NOTICE ────────────────────────────────────────────────────────
// Shown when user is connected but has no NFD

function WalletNFDNotice() {
  const { userProfile } = useWallet()
  if (userProfile?.nfd) return null

  return (
    <div className="mb-3 flex items-center gap-2.5 text-[11px] italic text-muted bg-algo-dim border border-algo rounded-lg px-3 py-2">
      <LiveDot color="algo" />
      <span>
        Comments post without an NFD — but your wallet address is shown.{' '}
        <a
          href={getXPCSegmentMintURL()}
          target="_blank"
          rel="noopener noreferrer"
          className="text-algo hover:underline not-italic"
        >
          Mint xpc.algo for your identity →
        </a>
      </span>
    </div>
  )
}

// ── HELPERS ───────────────────────────────────────────────────────────

function formatTimeAgo(timestamp: string): string {
  const diff  = Date.now() - new Date(timestamp).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 1)  return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}
