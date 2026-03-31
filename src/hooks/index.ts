// Custom React hooks for Aurum Oracle

import { useCallback, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAurum } from '@/store'
import { resolveNFD, getXPCBalance, fetchMarketComments } from '@/lib/algorand'
import { buildTinymanTradeTxns, readMarketState } from '@/lib/contracts/client'
import type { TxSigner } from '@/types'

export function useNFD(address: string | null) {
  return useQuery({
    queryKey: ['nfd', address],
    queryFn: async () => (address ? resolveNFD(address) : null),
    enabled: !!address,
    staleTime: 5 * 60 * 1000,
  })
}

export function useXPCBalance(address: string | null) {
  const asaId = parseInt(process.env.NEXT_PUBLIC_XPC_ASA_ID || '0')
  return useQuery({
    queryKey: ['xpc-balance', address, asaId],
    queryFn: async () => (address && asaId ? getXPCBalance(address, asaId) : 0),
    enabled: !!address && asaId > 0,
    staleTime: 30 * 1000,
  })
}

export function useMarketState(marketId: string) {
  const appId = parseInt(process.env.NEXT_PUBLIC_MARKET_CONTRACT_ID || '0')
  return useQuery({
    queryKey: ['market-state', marketId, appId],
    queryFn: async () => (appId > 0 ? readMarketState(appId) : {}),
    enabled: !!marketId && appId > 0,
    refetchInterval: 5000,
  })
}

export function useMarketComments(marketId: string) {
  const appId = parseInt(process.env.NEXT_PUBLIC_MARKET_CONTRACT_ID || '0')
  return useQuery({
    queryKey: ['comments', marketId, appId],
    queryFn: async () => (appId > 0 ? fetchMarketComments(marketId, appId) : []),
    enabled: !!marketId && appId > 0,
    refetchInterval: 10000,
  })
}

export function useTinymanQuote(
  assetId: number,
  amountGrams: number,
  spotPrice: number,
  isBuy: boolean
) {
  return useQuery({
    queryKey: ['tinyman-quote', assetId, amountGrams, spotPrice, isBuy],
    queryFn: async () => {
      const total = amountGrams * spotPrice
      return {
        amountOut: total,
        priceImpact: 0.5,
        total,
      }
    },
    enabled: amountGrams > 0 && spotPrice > 0,
    staleTime: 3000,
  })
}

export function usePostComment(marketId: string, signer: TxSigner | null) {
  const setComments = useAurum((s) => s.setComments)

  return useCallback(
    async (content: string, vote: 'YES' | 'NO') => {
      if (!signer) throw new Error('No signer available')

      // Build comment transaction
      // This would build an Algorand transaction with the comment encoded
      // For now, it's a placeholder

      console.log('Posting comment:', { marketId, content, vote })
    },
    [marketId, signer, setComments]
  )
}

export function useVote(marketId: string, signer: TxSigner | null) {
  return useCallback(
    async (vote: 'YES' | 'NO', amount: number) => {
      if (!signer) throw new Error('No signer available')

      // Build vote transaction
      console.log('Voting:', { marketId, vote, amount })
    },
    [marketId, signer]
  )
}

export function usePrices() {
  return useQuery({
    queryKey: ['prices'],
    queryFn: async () => {
      const res = await fetch('/api/prices')
      return res.json()
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  })
}

export function useMarkets() {
  return useQuery({
    queryKey: ['markets'],
    queryFn: async () => {
      const res = await fetch('/api/markets')
      return res.json()
    },
    staleTime: 60 * 1000,
  })
}
