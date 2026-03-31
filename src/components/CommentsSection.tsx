'use client'

import { useState } from 'react'
import { useAurum } from '@/store'

interface CommentData {
  id: string
  author: string
  author_nfd?: string
  vote: 'YES' | 'NO'
  content: string
  likes: number
  txn_id: string
  timestamp: number
  replies: CommentData[]
}

// Mock data for display
const MOCK_COMMENTS: CommentData[] = [
  {
    id: '1',
    author: 'AAAA...Y5HVY',
    author_nfd: 'alice.xpc.algo',
    vote: 'YES',
    content: 'Gold has strong momentum. CPI data supports continued bull run.',
    likes: 12,
    txn_id: 'MOCK_TXN_1',
    timestamp: Date.now() / 1000 - 3600,
    replies: [
      {
        id: '1a',
        author: 'BBBB...Y5HVY',
        author_nfd: 'bob.xpc.algo',
        vote: 'NO',
        content: 'Fed meeting next week could push rates higher.',
        likes: 5,
        txn_id: 'MOCK_TXN_2',
        timestamp: Date.now() / 1000 - 1800,
        replies: [],
      },
    ],
  },
]

function CommentItem({
  comment,
  depth = 0,
}: {
  comment: CommentData
  depth?: number
}) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [liked, setLiked] = useState(false)

  const initials = (comment.author_nfd || comment.author).slice(0, 2).toUpperCase()
  const colorHash = comment.author.charCodeAt(0) % 360

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l border-slate-700 pl-3' : ''}`}>
      <div className="flex gap-2 py-2">
        {/* Avatar */}
        <div
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ background: `hsl(${colorHash}, 50%, 40%)` }}
        >
          {initials}
        </div>

        <div className="flex-1">
          {/* Author line */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-200">
              {comment.author_nfd || `${comment.author.slice(0, 8)}...`}
            </span>
            <span
              className={`rounded px-1 py-0.5 text-[9px] font-bold ${
                comment.vote === 'YES'
                  ? 'bg-green-900/50 text-green-400'
                  : 'bg-red-900/50 text-red-400'
              }`}
            >
              {comment.vote}
            </span>
            <span className="text-[10px] text-slate-600">
              {new Date(comment.timestamp * 1000).toLocaleTimeString()}
            </span>
          </div>

          {/* Content */}
          <p className="mt-0.5 text-xs text-slate-300">{comment.content}</p>

          {/* Actions */}
          <div className="mt-1 flex items-center gap-3 text-[10px]">
            <button
              onClick={() => setLiked(!liked)}
              className={`${liked ? 'text-gold-400' : 'text-slate-500'} hover:text-gold-400`}
            >
              ♥ {comment.likes + (liked ? 1 : 0)}
            </button>
            <button
              onClick={() => setShowReply(!showReply)}
              className="text-slate-500 hover:text-slate-300"
            >
              Reply
            </button>
            <a
              href={`https://allo.info/tx/${comment.txn_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-600 hover:text-teal-400"
            >
              TX ↗
            </a>
          </div>

          {/* Reply input */}
          {showReply && (
            <div className="mt-2 flex gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                maxLength={900}
                placeholder="Reply…"
                className="flex-1 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-200"
              />
              <button
                onClick={() => {
                  setReplyText('')
                  setShowReply(false)
                }}
                className="rounded bg-gold-500 px-2 py-1 text-xs font-medium text-slate-900"
              >
                Post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies.map((reply) => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
      ))}
    </div>
  )
}

export function CommentsSection({ marketId }: { marketId: string }) {
  const wallet = useAurum((s) => s.wallet)
  const [sortBy, setSortBy] = useState<'top' | 'new' | 'bulls' | 'bears'>('top')
  const [newComment, setNewComment] = useState('')

  const comments = MOCK_COMMENTS

  const sorted = [...comments].sort((a, b) => {
    if (sortBy === 'top') return b.likes - a.likes
    if (sortBy === 'new') return b.timestamp - a.timestamp
    if (sortBy === 'bulls') return a.vote === 'YES' ? -1 : 1
    if (sortBy === 'bears') return a.vote === 'NO' ? -1 : 1
    return 0
  })

  return (
    <div className="mt-3 border-t border-slate-700 pt-3">
      {/* Sort bar */}
      <div className="mb-2 flex gap-2">
        {(['top', 'new', 'bulls', 'bears'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`rounded px-2 py-0.5 text-[10px] capitalize ${
              sortBy === s ? 'bg-slate-600 text-slate-100' : 'text-slate-500'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Comments list */}
      <div className="space-y-1">
        {sorted.map((c) => (
          <CommentItem key={c.id} comment={c} />
        ))}
      </div>

      {/* New comment */}
      {wallet ? (
        <div className="mt-3 flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={900}
            placeholder="Share your analysis…"
            className="flex-1 rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-xs text-slate-200"
          />
          <button
            onClick={() => setNewComment('')}
            disabled={!newComment.trim()}
            className="rounded bg-gold-500 px-3 py-1.5 text-xs font-medium text-slate-900 disabled:opacity-50"
          >
            Post
          </button>
        </div>
      ) : (
        <p className="mt-3 text-center text-[10px] text-slate-500">
          Connect wallet to comment. No{' '}
          <a
            href="https://app.nf.domains/name/xpc.algo?view=segments"
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-400 underline"
          >
            xpc.algo
          </a>
          ? Mint your segment to get started.
        </p>
      )}
    </div>
  )
}
