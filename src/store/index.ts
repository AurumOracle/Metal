import { create } from 'zustand'
import type { Market, PricePoint, UserProfile, Comment } from '@/types'

interface AurumState {
  // Wallet & Auth
  wallet: string | null
  nfd: string | null
  xpc_balance: number
  premium: boolean
  
  // Prices
  prices: Record<string, PricePoint>
  last_updated: number
  
  // Markets
  markets: Market[]
  selected_market: Market | null
  
  // User
  profile: UserProfile | null
  
  // Comments
  comments: Record<string, Comment[]>
  
  // UI State
  panel: 'dashboard' | 'markets' | 'learn' | 'token' | 'premium'
  show_trade_widget: boolean
  
  // Actions
  setWallet: (address: string | null) => void
  setNFD: (nfd: string | null) => void
  setXPCBalance: (balance: number) => void
  setPremium: (premium: boolean) => void
  setPrices: (prices: Record<string, PricePoint>) => void
  setMarkets: (markets: Market[]) => void
  setSelectedMarket: (market: Market | null) => void
  setProfile: (profile: UserProfile | null) => void
  setComments: (market_id: string, comments: Comment[]) => void
  setPanel: (panel: AurumState['panel']) => void
  setShowTradeWidget: (show: boolean) => void
}

export const useAurum = create<AurumState>((set) => ({
  wallet: null,
  nfd: null,
  xpc_balance: 0,
  premium: false,
  prices: {},
  last_updated: 0,
  markets: [],
  selected_market: null,
  profile: null,
  comments: {},
  panel: 'dashboard',
  show_trade_widget: false,

  setWallet: (address) => set({ wallet: address }),
  setNFD: (nfd) => set({ nfd }),
  setXPCBalance: (balance) => set({ xpc_balance: balance }),
  setPremium: (premium) => set({ premium }),
  setPrices: (prices) => set({ prices, last_updated: Date.now() }),
  setMarkets: (markets) => set({ markets }),
  setSelectedMarket: (market) => set({ selected_market: market }),
  setProfile: (profile) => set({ profile }),
  setComments: (market_id, comments) =>
    set((state) => ({
      comments: { ...state.comments, [market_id]: comments },
    })),
  setPanel: (panel) => set({ panel }),
  setShowTradeWidget: (show) => set({ show_trade_widget: show }),
}))
