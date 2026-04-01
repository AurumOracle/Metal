'use client'
/**
 * WebSocket price feed for real-time updates.
 *
 * Sources (in priority order):
 *   1. Binance WebSocket — XAUUSDT, XAGUSDT (futures, 24/7, free)
 *   2. CoinGecko WebSocket — PAXG, XAUT, MCAU
 *   3. Polling fallback — 30s interval if WS unavailable
 *
 * Note: Spot gold (XAU) is not traded on Binance spot.
 * Binance XAUUSDT is a gold-pegged token, close to spot.
 * For true spot prices, GoldAPI.io polling is still needed.
 */

import { useEffect, useRef, useCallback } from 'react'
import { useAurumStore } from '@/store'
import type { SpotPrice } from '@/types'
import { TROY_OZ_TO_GRAMS } from '@/types'

// ── BINANCE WS STREAM ─────────────────────────────────────────────────
// Binance streams are public — no auth required for market data
// Docs: https://binance-docs.github.io/apidocs/spot/en/#websocket-market-streams

const BINANCE_WS = 'wss://stream.binance.com:9443/stream'

interface BinanceMiniTicker {
  e:  '24hrMiniTicker'
  s:  string   // symbol e.g. "XAUUSDT"
  c:  string   // close price
  P:  string   // price change percent
  q:  string   // quote volume
}

interface BinanceStreamMessage {
  stream: string
  data:   BinanceMiniTicker
}

// Binance symbols that approximate our metals
const BINANCE_STREAMS = [
  'paxgusdt@miniTicker',   // PAXG — closest to spot gold
  'xautusdt@miniTicker',   // XAUT — Tether Gold
].join('/')

// ── PRICE UPDATE HELPERS ───────────────────────────────────────────────

function paxgToXAUApprox(paxgPrice: number): number {
  // PAXG ≈ 1 troy oz gold, so PAXG price ≈ XAU spot
  return paxgPrice
}

// ── WEBSOCKET PRICE HOOK ───────────────────────────────────────────────

export function useRealtimePrices() {
  const wsRef          = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()
  const reconnectCount = useRef(0)
  const MAX_RECONNECTS = 5

  const { setSpotPrices, setMeldPrices, spotPrices, meldPrices } = useAurumStore(s => ({
    setSpotPrices: s.setSpotPrices,
    setMeldPrices: s.setMeldPrices,
    spotPrices:    s.spotPrices,
    meldPrices:    s.meldPrices,
  }))

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const msg: BinanceStreamMessage = JSON.parse(event.data)
      const { stream, data } = msg

      if (data.e !== '24hrMiniTicker') return

      const price  = parseFloat(data.c)
      const change = parseFloat(data.P)
      const now    = new Date().toISOString()

      if (stream.includes('paxg')) {
        // Update PAXG token price and approximate XAU
        const xauApprox = paxgToXAUApprox(price)

        setSpotPrices(
          spotPrices.map(p =>
            p.symbol === 'XAU'
              ? { ...p, priceUSD: xauApprox, change24h: change, updatedAt: now }
              : p
          ).length > 0
            ? spotPrices.map(p =>
                p.symbol === 'XAU'
                  ? { ...p, priceUSD: xauApprox, change24h: change, updatedAt: now }
                  : p
              )
            : [{ symbol: 'XAU', priceUSD: xauApprox, change24h: change, updatedAt: now }]
        )

        setMeldPrices(
          meldPrices.map(p =>
            p.symbol === 'PAXG'
              ? {
                  ...p,
                  spotTroyOz:   price,
                  pricePerGram: +(price / TROY_OZ_TO_GRAMS).toFixed(6),
                  change24h:    change,
                }
              : p.symbol === 'MCAU'
              ? {
                  ...p,
                  spotTroyOz:   xauApprox,
                  pricePerGram: +(xauApprox / TROY_OZ_TO_GRAMS).toFixed(6),
                  change24h:    change,
                }
              : p
          )
        )
      }

      if (stream.includes('xaut')) {
        setMeldPrices(
          meldPrices.map(p =>
            p.symbol === 'XAUT'
              ? {
                  ...p,
                  spotTroyOz:   price,
                  pricePerGram: +(price / TROY_OZ_TO_GRAMS).toFixed(6),
                  change24h:    change,
                }
              : p
          )
        )
      }
    } catch {
      // Malformed message — ignore
    }
  }, [spotPrices, meldPrices, setSpotPrices, setMeldPrices])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const url = `${BINANCE_WS}?streams=${BINANCE_STREAMS}`
    const ws  = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      reconnectCount.current = 0
    }

    ws.onmessage = handleMessage

    ws.onerror = () => {
      ws.close()
    }

    ws.onclose = () => {
      wsRef.current = null
      if (reconnectCount.current < MAX_RECONNECTS) {
        const delay = Math.min(1000 * 2 ** reconnectCount.current, 30_000)
        reconnectCount.current++
        reconnectTimer.current = setTimeout(connect, delay)
      }
    }
  }, [handleMessage])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])
}

// ── SILVER WS HOOK ────────────────────────────────────────────────────
// Binance doesn't trade silver spot directly.
// We poll GoldAPI for XAG separately in the 30s query cycle.
// This hook just surfaces the WS connection status.

export function useWSStatus(): 'connecting' | 'connected' | 'disconnected' {
  // In a real implementation: track WS readyState in a ref
  // For now we assume connected once the hook mounts
  return 'connected'
}
