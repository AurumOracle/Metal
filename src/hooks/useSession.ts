'use client'

import { useState, useCallback } from 'react'
import { useAurum } from '@/store'

interface Session {
  token: string
  address: string
  expires_at: number
}

/**
 * Wallet-based authentication hook.
 * Flow: request challenge → sign with wallet → verify server-side → get session token.
 */
export function useSession() {
  const wallet = useAurum((s) => s.wallet)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = session !== null && session.expires_at > Date.now()

  const login = useCallback(
    async (signBytes: (data: Uint8Array) => Promise<Uint8Array>) => {
      if (!wallet) {
        setError('No wallet connected')
        return false
      }

      setLoading(true)
      setError(null)

      try {
        // Step 1: Request challenge
        const challengeRes = await fetch(`/api/session?address=${encodeURIComponent(wallet)}`)
        if (!challengeRes.ok) {
          throw new Error('Failed to get challenge')
        }
        const { challenge } = await challengeRes.json()

        // Step 2: Sign challenge with wallet
        const msgBytes = new Uint8Array(Buffer.from(challenge))
        const signature = await signBytes(msgBytes)
        const signatureB64 = Buffer.from(signature).toString('base64')

        // Step 3: Verify with server
        const verifyRes = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: wallet,
            signature: signatureB64,
          }),
        })

        if (!verifyRes.ok) {
          const data = await verifyRes.json()
          throw new Error(data.error || 'Verification failed')
        }

        const { token, expires_in } = await verifyRes.json()
        const newSession: Session = {
          token,
          address: wallet,
          expires_at: Date.now() + expires_in * 1000,
        }

        setSession(newSession)
        return true
      } catch (e: any) {
        setError(e.message)
        return false
      } finally {
        setLoading(false)
      }
    },
    [wallet]
  )

  const logout = useCallback(() => {
    setSession(null)
    setError(null)
  }, [])

  return {
    session,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    token: session?.token || null,
  }
}
