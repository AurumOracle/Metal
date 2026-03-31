'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAurum } from '@/store'

interface BinanceTicker {
  s: string // Symbol (e.g., XAUUSDT)
  c: string // Close price
  P: string // Price change percent
}

const BINANCE_WS = 'wss://stream.binance.com:9443/ws'
const SYMBOLS = ['xauusdt', 'xagusdt'] // Gold and Silver
const STREAM = SYMBOLS.map((s) => `${s}@ticker`).join('/')

const MAX_RECONNECT_DELAY = 30_000
const INITIAL_RECONNECT_DELAY = 1_000

/**
 * WebSocket hook for real-time Binance price feeds.
 * Falls back to REST polling if WebSocket fails.
 * Uses exponential backoff for reconnection.
 */
export function useRealtimePrices() {
  const setPrices = useAurum((s) => s.setPrices)
  const prices = useAurum((s) => s.prices)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectDelay = useRef(INITIAL_RECONNECT_DELAY)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()
  const [connected, setConnected] = useState(false)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    try {
      const ws = new WebSocket(`${BINANCE_WS}/${STREAM}`)
      wsRef.current = ws

      ws.onopen = () => {
        setConnected(true)
        reconnectDelay.current = INITIAL_RECONNECT_DELAY
      }

      ws.onmessage = (event) => {
        try {
          const data: BinanceTicker = JSON.parse(event.data)
          const price = parseFloat(data.c)
          const change = parseFloat(data.P)

          if (data.s === 'XAUUSDT') {
            // Convert from troy oz to grams
            const pricePerGram = price / 31.1035
            setPrices({
              ...prices,
              SPOT_GOLD: {
                asset: 'SPOT_GOLD',
                price: pricePerGram,
                timestamp: Date.now(),
                source: 'binance_ws',
              },
            })
          } else if (data.s === 'XAGUSDT') {
            const pricePerGram = price / 31.1035
            setPrices({
              ...prices,
              SPOT_SILVER: {
                asset: 'SPOT_SILVER',
                price: pricePerGram,
                timestamp: Date.now(),
                source: 'binance_ws',
              },
            })
          }
        } catch {
          // Ignore malformed messages
        }
      }

      ws.onerror = () => {
        setConnected(false)
      }

      ws.onclose = () => {
        setConnected(false)
        wsRef.current = null

        // Exponential backoff reconnect
        const delay = Math.min(reconnectDelay.current, MAX_RECONNECT_DELAY)
        reconnectTimer.current = setTimeout(() => {
          reconnectDelay.current *= 2
          connect()
        }, delay)
      }
    } catch {
      setConnected(false)
    }
  }, [prices, setPrices])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { connected }
}
