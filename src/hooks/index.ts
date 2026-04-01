'use client'
/**
 * Custom hooks for Aurum Oracle.
 * These are the primary interface between React components and on-chain data.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type algosdk from 'algosdk'
import { useWallet as useWalletStore } from '@/store'
import { resolveNFD, resolveNFDBulk, fetchMarketComments, fetchMarketVotes, buildCommentTx } from '@/lib/algorand'
import { readMarketState, readUserMarketState, buildVoteTxns, buildMarketOptInTx } from '@/lib/contracts/client'
import { fetchPrices } from '@/lib/prices'
import type { NFDProfile } from '@/types'

// ── PRICES ────────────────────────────────────────────────────────────

export function useLivePrices() {
  return useQuery({
    queryKey:       ['prices'],
    queryFn:        fetchPrices,
    refetchInterval: 30_000,
    staleTime:       25_000,
  })
}

// ── NFD RESOLUTION ────────────────────────────────────────────────────

export function useNFD(address: string | null | undefined) {
  return useQuery({
    queryKey: ['nfd', address],
    queryFn:  () => address ? resolveNFD(address) : null,
    enabled:  !!address,
    staleTime: 5 * 60_000,       // NFDs don't change often — cache 5 min
    retry: 1,
  })
}

export function useNFDBulk(addresses: string[]) {
  return useQuery({
    queryKey: ['nfd-bulk', addresses.sort().join(',')],
    queryFn:  () => resolveNFDBulk(addresses),
    enabled:  addresses.length > 0,
    staleTime: 5 * 60_000,
  })
}

// ── MARKET STATE ──────────────────────────────────────────────────────

export function useMarketOnChain(appId: number | null | undefined) {
  return useQuery({
    queryKey:       ['market-state', appId],
    queryFn:        () => appId ? readMarketState(appId) : null,
    enabled:        !!appId,
    refetchInterval: 15_000,
  })
}

export function useUserMarketState(appId: number | null | undefined) {
  const { walletAddress } = useWalletStore()
  return useQuery({
    queryKey: ['user-market-state', appId, walletAddress],
    queryFn:  () => (appId && walletAddress) ? readUserMarketState(appId, walletAddress) : null,
    enabled:  !!(appId && walletAddress),
    refetchInterval: 20_000,
  })
}

// ── COMMENTS ──────────────────────────────────────────────────────────

export function useComments(marketId: string) {
  return useQuery({
    queryKey:       ['comments', marketId],
    queryFn:        () => fetchMarketComments(marketId, 50),
    refetchInterval: 20_000,
    staleTime:       15_000,
  })
}

// ── VOTES ─────────────────────────────────────────────────────────────

export function useMarketVotes(marketId: string) {
  return useQuery({
    queryKey:       ['votes', marketId],
    queryFn:        () => fetchMarketVotes(marketId),
    refetchInterval: 15_000,
  })
}

// Signer passed from components — avoids calling hooks inside mutations
export type TxSigner = (txns: algosdk.Transaction[]) => Promise<string>

// ── POST COMMENT (mutation) ────────────────────────────────────────────

interface PostCommentArgs {
  marketId: string
  body:     string
  replyTo?: string
}

export function usePostComment(signer: TxSigner | null) {
  const queryClient       = useQueryClient()
  const { walletAddress } = useWalletStore()

  return useMutation({
    mutationFn: async ({ marketId, body, replyTo }: PostCommentArgs) => {
      if (!walletAddress) throw new Error('Wallet not connected')
      if (!signer)        throw new Error('No signer — connect wallet first')

      const tx   = await buildCommentTx(walletAddress, { type: 'comment', marketId, body, replyTo })
      const txId = await signer([tx])
      return { txId, marketId }
    },
    onSuccess: ({ marketId }) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['comments', marketId] })
      }, 5_000)
    },
  })
}

// ── VOTE (mutation) ────────────────────────────────────────────────────

interface VoteArgs {
  appId:    number
  side:     'yes' | 'no'
  stakeXPC: number
}

export function useVote(signer: TxSigner | null) {
  const queryClient       = useQueryClient()
  const { walletAddress } = useWalletStore()

  return useMutation({
    mutationFn: async ({ appId, side, stakeXPC }: VoteArgs) => {
      if (!walletAddress) throw new Error('Wallet not connected')
      if (!signer)        throw new Error('No signer — connect wallet first')

      const txns: algosdk.Transaction[] = []
      const userState = await readUserMarketState(appId, walletAddress)
      if (!userState) {
        txns.push(await buildMarketOptInTx(appId, walletAddress))
      }
      txns.push(...await buildVoteTxns(appId, walletAddress, side, stakeXPC))

      const txId = await signer(txns)
      return { txId, appId }
    },
    onSuccess: ({ appId }) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['market-state', appId] })
        queryClient.invalidateQueries({ queryKey: ['user-market-state', appId] })
        queryClient.invalidateQueries({ queryKey: ['votes', appId.toString()] })
      }, 5_000)
    },
  })
}

// ── POOL PRICE (on-chain, Tinyman) ────────────────────────────────────

export function usePoolPrice(asset: 'gold' | 'silver') {
  return useQuery({
    queryKey:       ['pool-price', asset],
    queryFn:        async () => {
      const { getOnChainPoolPrice } = await import('@/lib/meld')
      return getOnChainPoolPrice(asset)
    },
    refetchInterval: 30_000,
    staleTime:       25_000,
  })
}

// ── TINYMAN QUOTE ──────────────────────────────────────────────────────

export function useTinymanQuote(
  asset:       'gold' | 'silver',
  side:        'buy' | 'sell',
  amountGrams: number,
  enabled      = true,
) {
  return useQuery({
    queryKey: ['tinyman-quote', asset, side, amountGrams],
    queryFn:  async () => {
      const { getTinymanQuote } = await import('@/lib/meld')
      return getTinymanQuote(asset, side, amountGrams)
    },
    enabled:   enabled && amountGrams > 0,
    staleTime: 15_000,
    refetchInterval: 20_000,
  })
}

// useWalletConnect lives in @/components/providers/WalletProvider
// Import it from there — not from hooks — to avoid circular deps

// ── COMMENT SECTION HOOK ──────────────────────────────────────────────

export function useCommentSection(marketId: string, signer: TxSigner | null = null) {
  const comments   = useComments(marketId)
  const postComment = usePostComment(signer)
  const { walletAddress } = useWalletStore()
  const nfds       = useNFDBulk(
    (comments.data ?? []).flatMap(c => [
      c.walletAddr,
      ...c.replies.map(r => r.walletAddr),
    ])
  )

  return {
    comments:        comments.data ?? [],
    isLoading:       comments.isLoading,
    nfds:            nfds.data ?? new Map<string, NFDProfile>(),
    postComment:     postComment.mutate,
    isPosting:       postComment.isPending,
    canComment:      !!walletAddress,
  }
}
