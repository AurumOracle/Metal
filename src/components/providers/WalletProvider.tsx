'use client'
import {
  NetworkId,
  WalletId,
  WalletManager,
  WalletProvider as UseWalletProvider,
  useWallet as useWalletReact,
} from '@txnlab/use-wallet-react'
import algosdk from 'algosdk'
import { useEffect, useRef, useMemo, useCallback } from 'react'
import { useAurumStore } from '@/store'
import { resolveNFD, getXPCBalance, truncateAddress, algodClient } from '@/lib/algorand'
import { getRank } from '@/types'

// ── WALLET SYNC ───────────────────────────────────────────────────────
// Inner component — must live inside UseWalletProvider to call useWalletReact()
// Watches activeAddress and syncs into Zustand + triggers NFD resolution

function WalletSync() {
  const { activeAddress, isReady } = useWalletReact()
  const prevAddress = useRef<string | null>(null)

  const { connectWallet, disconnectWallet, setNFD, setUserProfile, showToast } =
    useAurumStore(s => ({
      connectWallet:    s.connectWallet,
      disconnectWallet: s.disconnectWallet,
      setNFD:           s.setNFD,
      setUserProfile:   s.setUserProfile,
      showToast:        s.showToast,
    }))

  const handleConnect = useCallback(async (address: string) => {
    connectWallet(address)

    // Resolve NFD and XPC balance in parallel — don't block render
    const [nfd, xpcBalance] = await Promise.all([
      resolveNFD(address).catch(() => null),
      getXPCBalance(address).catch(() => 0),
    ])

    const rank = getRank(xpcBalance)

    if (nfd) {
      setNFD(nfd.name)
      showToast(`Connected · ${nfd.name} · ${xpcBalance.toLocaleString()} XPC`)
    } else {
      showToast(`Connected · ${truncateAddress(address, 6)} · Mint xpc.algo for your identity`)
    }

    setUserProfile({
      walletAddress:     address,
      nfd:               nfd ?? undefined,
      xpcBalance,
      rank,
      totalXPC:          xpcBalance,
      predictionHistory: [],
    })
  }, [connectWallet, setNFD, setUserProfile, showToast])

  const handleDisconnect = useCallback(() => {
    disconnectWallet()
    showToast('Wallet disconnected')
  }, [disconnectWallet, showToast])

  useEffect(() => {
    if (!isReady) return
    if (activeAddress === prevAddress.current) return

    if (activeAddress) {
      handleConnect(activeAddress)
    } else if (prevAddress.current) {
      handleDisconnect()
    }

    prevAddress.current = activeAddress ?? null
  }, [activeAddress, isReady, handleConnect, handleDisconnect])

  return null
}

// ── PROVIDER ──────────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const isDev     = process.env.NEXT_PUBLIC_APP_ENV === 'development'
  const network   = isDev ? NetworkId.TESTNET : NetworkId.MAINNET

  const algoNode  = isDev
    ? 'https://testnet-api.algonode.cloud'
    : 'https://mainnet-api.algonode.cloud'

  const manager = useMemo(() => new WalletManager({
    wallets: [
      WalletId.PERA,
      WalletId.DEFLY,
      WalletId.EXODUS,
    ],
    defaultNetwork: network,
    networks: {
      [network]: {
        algod: {
          baseServer: process.env.NEXT_PUBLIC_ALGOD_SERVER ?? algoNode,
          port:       parseInt(process.env.NEXT_PUBLIC_ALGOD_PORT ?? '443'),
          token:      process.env.NEXT_PUBLIC_ALGOD_TOKEN ?? '',
        },
      },
    },
  }), [network, algoNode])

  return (
    <UseWalletProvider manager={manager}>
      <WalletSync />
      {children}
    </UseWalletProvider>
  )
}

// ── USE WALLET CONNECT ────────────────────────────────────────────────
// The primary hook for wallet actions in components

export function useWalletConnect() {
  const { wallets, activeAddress, isReady, signTransactions } = useWalletReact()
  const showToast = useAurumStore(s => s.showToast)

  // Open Pera (or first available wallet) to connect
  async function connect() {
    if (!isReady) return
    try {
      const preferred = wallets.find(w => w.id === WalletId.PERA)
        ?? wallets.find(w => w.id === WalletId.DEFLY)
        ?? wallets[0]
      if (!preferred) throw new Error('No wallets available')
      await preferred.connect()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      if (!msg.toLowerCase().includes('cancel')) {
        showToast('Connection failed — please try again')
      }
    }
  }

  async function disconnect() {
    const active = wallets.find(w => w.isActive)
    await active?.disconnect()
  }

  // Sign and broadcast a group of transactions, return the txId
  async function signAndSend(txns: algosdk.Transaction[]): Promise<string> {
    const encoded  = txns.map(t => t.toByte())
    const signed   = await signTransactions(encoded)
    const valid    = signed.filter((s: Uint8Array | null): s is Uint8Array => s !== null)

    const result = await algodClient.sendRawTransaction(valid).do()
    const txid = result.txid
    await algosdk.waitForConfirmation(algodClient, txid, 4)
    return txid
  }

  return {
    wallets,
    activeAddress,
    isReady,
    isConnected: !!activeAddress,
    connect,
    disconnect,
    signAndSend,
  }
}
