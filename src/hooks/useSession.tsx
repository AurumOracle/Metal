'use client'
/**
 * Session management hook.
 * Handles the full Algorand wallet auth flow:
 *   1. Request challenge from /api/session
 *   2. Wallet signs the challenge message
 *   3. POST signature to /api/session → sets httpOnly cookie
 *   4. Premium access determined by XPC balance
 */

import { useState, useCallback } from 'react'
import { useWalletConnect } from '@/components/providers/WalletProvider'
import { useWallet as useWalletReact } from '@txnlab/use-wallet-react'
import { ScopeType } from '@txnlab/use-wallet'
import { useAurumStore } from '@/store'
import algosdk from 'algosdk'
import type { SessionPayload } from '@/app/api/session/route'

interface SessionState {
  isAuthenticated: boolean
  isPremium:       boolean
  session:         SessionPayload | null
  isLoading:       boolean
  error:           string | null
}

export function useSession() {
  const [state, setState] = useState<SessionState>({
    isAuthenticated: false,
    isPremium:       false,
    session:         null,
    isLoading:       false,
    error:           null,
  })

  const { wallets, activeAddress } = useWalletConnect()
  const { signData } = useWalletReact()
  const { userProfile, showToast } = useAurumStore(s => ({
    userProfile: s.userProfile,
    showToast:   s.showToast,
  }))

  const signIn = useCallback(async () => {
    if (!activeAddress) {
      setState(s => ({ ...s, error: 'Wallet not connected' }))
      return
    }

    setState(s => ({ ...s, isLoading: true, error: null }))

    try {
      // 1. Request challenge
      const challengeRes = await fetch(`/api/session?address=${activeAddress}`)
      const { challenge, authenticated, session: existingSession } = await challengeRes.json()

      // Already authenticated via cookie
      if (authenticated && existingSession) {
        setState({
          isAuthenticated: true,
          isPremium:       existingSession.premium,
          session:         existingSession,
          isLoading:       false,
          error:           null,
        })
        return
      }

      if (!challenge) throw new Error('No challenge received')

      // 2. Sign the challenge with the connected wallet
      const signResult  = await signData(challenge, { scope: ScopeType.AUTH, encoding: 'utf-8' })
      const signatureB64 = Buffer.from(signResult.signature).toString('base64')

      // 3. Submit signature
      const signInRes = await fetch('/api/session', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          address:    activeAddress,
          signature:  signatureB64,
          nfdName:    userProfile?.nfd?.name,
          xpcBalance: userProfile?.xpcBalance ?? 0,
          rank:       userProfile?.rank,
        }),
      })

      if (!signInRes.ok) {
        const { error } = await signInRes.json()
        throw new Error(error ?? 'Sign-in failed')
      }

      const { session } = await signInRes.json()

      setState({
        isAuthenticated: true,
        isPremium:       session.premium,
        session,
        isLoading:       false,
        error:           null,
      })

      showToast(session.premium
        ? 'Premium access unlocked · Welcome back'
        : 'Signed in · 1,000 XPC needed for Premium'
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign-in failed'
      setState(s => ({ ...s, isLoading: false, error: msg }))
      showToast('Sign-in failed — ' + msg)
    }
  }, [activeAddress, wallets, userProfile, showToast])

  const signOut = useCallback(async () => {
    await fetch('/api/session', { method: 'DELETE' })
    setState({
      isAuthenticated: false,
      isPremium:       false,
      session:         null,
      isLoading:       false,
      error:           null,
    })
    showToast('Signed out')
  }, [showToast])

  return { ...state, signIn, signOut }
}

// ── PREMIUM GATE COMPONENT ─────────────────────────────────────────────

import React from 'react'

export function PremiumGate({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { isPremium, isAuthenticated, isLoading, signIn } = useSession()
  const { isConnected } = useAurumStore(s => ({ isConnected: s.isConnected }))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted text-[12px] italic">
        Checking access…
      </div>
    )
  }

  if (isPremium) return <>{children}</>

  if (fallback) return <>{fallback}</>

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4 text-center">
      <div className="font-display text-[10px] tracking-[0.18em] text-gold uppercase">
        Premium feature
      </div>
      <p className="text-[13px] italic text-muted max-w-[260px] leading-relaxed">
        Hold 1,000+ XPC or subscribe to Premium to unlock this feature.
      </p>
      <div className="flex gap-2">
        {isConnected && !isAuthenticated && (
          <button
            onClick={signIn}
            className="font-display text-[9px] tracking-[0.12em] uppercase px-4 py-2 rounded-lg border border-gold bg-gold-dim text-gold hover:bg-[rgba(201,168,76,0.22)] cursor-pointer transition-all"
          >
            Verify wallet
          </button>
        )}
        <a
          href="/premium"
          className="font-display text-[9px] tracking-[0.12em] uppercase px-4 py-2 rounded-lg border border-default text-muted hover:border-gold hover:text-gold cursor-pointer transition-all"
        >
          View Premium →
        </a>
      </div>
    </div>
  )
}
