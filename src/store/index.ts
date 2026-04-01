import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type {
  SpotPrice,
  MeldTokenPrice,
  UserProfile,
  Market,
  TradeQuote,
  TradeAsset,
  TradeSide,
  TimeRange,
  ChartView,
} from '@/types'

// ── WALLET SLICE ──────────────────────────────────────────────────────

interface WalletSlice {
  isConnected:    boolean
  walletAddress:  string | null
  nfdName:        string | null       // e.g. "john.xpc.algo"
  userProfile:    UserProfile | null
  connectWallet:  (address: string) => void
  disconnectWallet: () => void
  setNFD:         (name: string) => void
  setUserProfile: (profile: UserProfile) => void
}

// ── PRICE SLICE ───────────────────────────────────────────────────────

interface PriceSlice {
  spotPrices:       SpotPrice[]
  meldPrices:       MeldTokenPrice[]
  lastUpdated:      string | null
  isLoadingPrices:  boolean
  priceError:       string | null
  setSpotPrices:    (prices: SpotPrice[]) => void
  setMeldPrices:    (prices: MeldTokenPrice[]) => void
  setLoadingPrices: (loading: boolean) => void
  setPriceError:    (error: string | null) => void
  // Helpers
  getSpotPrice:     (symbol: string) => number
  getMeldGramPrice: (asset: 'gold' | 'silver') => number
}

// ── TRADE SLICE ───────────────────────────────────────────────────────

interface TradeSlice {
  tradeAsset:       TradeAsset
  tradeSide:        TradeSide
  tradeAmountGrams: number
  activeQuote:      TradeQuote | null
  isTradeModalOpen: boolean
  setTradeAsset:    (asset: TradeAsset) => void
  setTradeSide:     (side: TradeSide) => void
  setTradeAmount:   (grams: number) => void
  setActiveQuote:   (quote: TradeQuote | null) => void
  openTradeModal:   () => void
  closeTradeModal:  () => void
}

// ── MARKET SLICE ──────────────────────────────────────────────────────

interface MarketSlice {
  markets:          Market[]
  votes:            Record<string, 'yes' | 'no'>   // marketId → side
  setMarkets:       (markets: Market[]) => void
  castVote:         (marketId: string, side: 'yes' | 'no') => void
}

// ── UI SLICE ──────────────────────────────────────────────────────────

interface UISlice {
  activeNav:        string
  activePanel:      string
  chartTimeRange:   TimeRange
  chartView:        ChartView
  chartOverlays:    Record<string, boolean>
  chartExpanded:    boolean
  toastMessage:     string | null
  setActiveNav:     (nav: string) => void
  setActivePanel:   (panel: string) => void
  setChartTimeRange: (range: TimeRange) => void
  setChartView:     (view: ChartView) => void
  toggleOverlay:    (key: string) => void
  setChartExpanded: (expanded: boolean) => void
  showToast:        (message: string) => void
  clearToast:       () => void
}

// ── COMBINED STORE ────────────────────────────────────────────────────

type AurumStore = WalletSlice & PriceSlice & TradeSlice & MarketSlice & UISlice

export const useAurumStore = create<AurumStore>()(
  devtools(
    (set, get) => ({

      // ── WALLET ──────────────────────────────────────────────────────
      isConnected:    false,
      walletAddress:  null,
      nfdName:        null,
      userProfile:    null,

      connectWallet: (address) => set({
        isConnected: true,
        walletAddress: address,
      }, false, 'connectWallet'),

      disconnectWallet: () => set({
        isConnected: false,
        walletAddress: null,
        nfdName: null,
        userProfile: null,
      }, false, 'disconnectWallet'),

      setNFD: (name) => set({ nfdName: name }, false, 'setNFD'),
      setUserProfile: (profile) => set({ userProfile: profile }, false, 'setUserProfile'),

      // ── PRICES ──────────────────────────────────────────────────────
      spotPrices:      [],
      meldPrices:      [],
      lastUpdated:     null,
      isLoadingPrices: false,
      priceError:      null,

      setSpotPrices:    (prices) => set({ spotPrices: prices, lastUpdated: new Date().toISOString() }),
      setMeldPrices:    (prices) => set({ meldPrices: prices }),
      setLoadingPrices: (loading) => set({ isLoadingPrices: loading }),
      setPriceError:    (error) => set({ priceError: error }),

      getSpotPrice: (symbol) => {
        const price = get().spotPrices.find(p => p.symbol === symbol)
        return price?.priceUSD ?? 0
      },

      getMeldGramPrice: (asset) => {
        const symbol = asset === 'gold' ? 'MCAU' : 'MSOS'
        const price = get().meldPrices.find(p => p.symbol === symbol)
        return price?.pricePerGram ?? 0
      },

      // ── TRADE ───────────────────────────────────────────────────────
      tradeAsset:       'gold',
      tradeSide:        'buy',
      tradeAmountGrams: 1,
      activeQuote:      null,
      isTradeModalOpen: false,

      setTradeAsset:  (asset) => set({ tradeAsset: asset }, false, 'setTradeAsset'),
      setTradeSide:   (side)  => set({ tradeSide: side },   false, 'setTradeSide'),
      setTradeAmount: (grams) => set({ tradeAmountGrams: grams }, false, 'setTradeAmount'),
      setActiveQuote: (quote) => set({ activeQuote: quote }, false, 'setActiveQuote'),
      openTradeModal:  () => set({ isTradeModalOpen: true },  false, 'openModal'),
      closeTradeModal: () => set({ isTradeModalOpen: false }, false, 'closeModal'),

      // ── MARKETS ─────────────────────────────────────────────────────
      markets: [],
      votes:   {},

      setMarkets: (markets) => set({ markets }, false, 'setMarkets'),
      castVote: (marketId, side) => set(
        state => ({ votes: { ...state.votes, [marketId]: side } }),
        false, 'castVote'
      ),

      // ── UI ───────────────────────────────────────────────────────────
      activeNav:      'gold',
      activePanel:    'overview',
      chartTimeRange: '1D',
      chartView:      'line',
      chartOverlays:  { silver: false, paxg: false, xaut: false, mcau: false },
      chartExpanded:  false,
      toastMessage:   null,

      setActiveNav:      (nav)    => set({ activeNav: nav },       false, 'setNav'),
      setActivePanel:    (panel)  => set({ activePanel: panel },   false, 'setPanel'),
      setChartTimeRange: (range)  => set({ chartTimeRange: range}, false, 'setRange'),
      setChartView:      (view)   => set({ chartView: view },      false, 'setView'),
      setChartExpanded:  (e)      => set({ chartExpanded: e },     false, 'setExpanded'),

      toggleOverlay: (key) => set(
        state => ({ chartOverlays: { ...state.chartOverlays, [key]: !state.chartOverlays[key] } }),
        false, 'toggleOverlay'
      ),

      showToast: (message) => {
        set({ toastMessage: message }, false, 'showToast')
        setTimeout(() => get().clearToast(), 3400)
      },

      clearToast: () => set({ toastMessage: null }, false, 'clearToast'),
    }),
    { name: 'AurumOracle' }
  )
)

// ── SELECTOR HOOKS (keep components clean) ────────────────────────────

export const useWallet    = () => useAurumStore(s => ({ isConnected: s.isConnected, walletAddress: s.walletAddress, nfdName: s.nfdName, userProfile: s.userProfile, connectWallet: s.connectWallet, disconnectWallet: s.disconnectWallet }))
export const usePrices    = () => useAurumStore(s => ({ spotPrices: s.spotPrices, meldPrices: s.meldPrices, getSpotPrice: s.getSpotPrice, getMeldGramPrice: s.getMeldGramPrice, isLoadingPrices: s.isLoadingPrices }))
export const useTrade     = () => useAurumStore(s => ({ tradeAsset: s.tradeAsset, tradeSide: s.tradeSide, tradeAmountGrams: s.tradeAmountGrams, activeQuote: s.activeQuote, isTradeModalOpen: s.isTradeModalOpen, setTradeAsset: s.setTradeAsset, setTradeSide: s.setTradeSide, setTradeAmount: s.setTradeAmount, setActiveQuote: s.setActiveQuote, openTradeModal: s.openTradeModal, closeTradeModal: s.closeTradeModal }))
export const useMarkets   = () => useAurumStore(s => ({ markets: s.markets, votes: s.votes, castVote: s.castVote }))
export const useUI        = () => useAurumStore(s => ({ activeNav: s.activeNav, activePanel: s.activePanel, chartTimeRange: s.chartTimeRange, chartView: s.chartView, chartOverlays: s.chartOverlays, chartExpanded: s.chartExpanded, toastMessage: s.toastMessage, setActiveNav: s.setActiveNav, setActivePanel: s.setActivePanel, setChartTimeRange: s.setChartTimeRange, setChartView: s.setChartView, toggleOverlay: s.toggleOverlay, setChartExpanded: s.setChartExpanded, showToast: s.showToast }))
