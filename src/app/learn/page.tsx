'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

type Category = 'all' | 'history' | 'alchemy' | 'economics' | 'blockchain' | 'silver'

const CATEGORIES: { id: Category; label: string; emoji: string }[] = [
  { id: 'all', label: 'All', emoji: '📚' },
  { id: 'history', label: 'History', emoji: '🏛️' },
  { id: 'alchemy', label: 'Alchemy & Esoterica', emoji: '⚗️' },
  { id: 'economics', label: 'Economics', emoji: '📊' },
  { id: 'blockchain', label: 'Blockchain', emoji: '⛓️' },
  { id: 'silver', label: 'Silver', emoji: '🪙' },
]

const ARTICLES = [
  {
    id: 'gold-history',
    category: 'history',
    title: 'Gold Through the Ages: 5,000 Years of Value',
    excerpt:
      'From ancient Egypt to modern central banks, gold has served as humanity\'s most enduring store of value. Explore the civilizations that shaped our relationship with the yellow metal.',
    readTime: '8 min',
    content: `Gold's story begins around 3000 BCE in ancient Egypt, where it was considered the flesh of the gods. The first known gold coins were minted in Lydia (modern Turkey) around 600 BCE, establishing gold as money.

The Roman Empire's gold aureus became the world's first reserve currency. When Rome debased its coinage, inflation followed — a lesson repeated throughout history.

The Gold Standard era (1870s-1971) pegged currencies to gold. Britain led with the pound sterling backed by gold reserves. The US followed in 1900. This system provided remarkable price stability — a dollar in 1900 bought roughly the same goods as a dollar in 1800.

President Nixon ended the gold standard in 1971. Since then, gold has risen from $35/oz to over $3,000/oz, reflecting the erosion of fiat currency purchasing power.

Today, central banks hold over 35,000 tonnes of gold reserves. In 2024 alone, central banks purchased over 1,000 tonnes — the highest in decades. Gold remains the ultimate safe haven.`,
  },
  {
    id: 'gold-standard',
    category: 'history',
    title: 'The Rise and Fall of the Gold Standard',
    excerpt:
      'How gold backing shaped global economics for a century, why it was abandoned, and the modern debate about sound money versus monetary flexibility.',
    readTime: '10 min',
    content: `The classical gold standard (1870s-1914) was perhaps the most stable monetary system in history. Countries fixed their currencies to a specific weight of gold, ensuring that trade imbalances self-corrected through gold flows.

World War I destroyed the system as nations printed money to fund the war. The interwar period saw failed attempts to restore it. The Bretton Woods Agreement (1944) created a modified gold standard — the US dollar was pegged to gold at $35/oz, and other currencies were pegged to the dollar.

By the 1960s, the US was printing more dollars than its gold could back. France demanded gold for its dollar reserves. On August 15, 1971, Nixon "temporarily" suspended gold convertibility. It was never restored.

The result: global fiat currencies. Since 1971, the US dollar has lost over 85% of its purchasing power. Gold, meanwhile, has risen 85x from $35 to ~$3,000. The debate between gold bugs and Keynesians continues to this day.`,
  },
  {
    id: 'alchemy-gold',
    category: 'alchemy',
    title: 'The Alchemist\'s Dream: Transmutation & the Philosopher\'s Stone',
    excerpt:
      'Alchemy wasn\'t just proto-chemistry — it was a spiritual practice seeking transformation. The quest to turn lead into gold mirrors humanity\'s desire for perfection.',
    readTime: '7 min',
    content: `For over two millennia, alchemists pursued the Philosopher's Stone — a legendary substance that could transmute base metals into gold and grant eternal life. While never achieving literal transmutation, alchemy laid the foundations for modern chemistry.

The great alchemists — Hermes Trismegistus, Jabir ibn Hayyan, Paracelsus, Isaac Newton — saw gold not merely as wealth but as spiritual perfection. The seven metals corresponded to seven planets: Gold/Sun, Silver/Moon, Mercury/Mercury, Copper/Venus, Iron/Mars, Tin/Jupiter, Lead/Saturn.

The alchemical process (nigredo, albedo, citrinitas, rubedo) mirrors psychological transformation described by Carl Jung centuries later. The "gold" they sought was as much internal as external.

Modern nuclear physics actually achieved transmutation in 1941 — bombarding mercury with neutrons to create gold. The cost far exceeds the gold's value, proving the alchemists were right: true gold cannot be cheaply manufactured.

In the blockchain era, "digital alchemy" takes new form — transforming lines of code into tokenized gold, accessible to anyone with a wallet.`,
  },
  {
    id: 'gold-economics',
    category: 'economics',
    title: 'Gold as an Inflation Hedge: Myth vs Reality',
    excerpt:
      'Does gold actually protect against inflation? Examining the data across decades to understand when and why gold works as a hedge — and when it doesn\'t.',
    readTime: '9 min',
    content: `Gold's reputation as an inflation hedge is well-earned but nuanced. Over very long periods (50+ years), gold has preserved purchasing power remarkably well. One ounce of gold bought a fine men's suit in ancient Rome — and still does today.

However, over shorter periods, the relationship is complex. Gold surged during the high-inflation 1970s (from $35 to $850) but crashed in the deflationary early 1980s. It was flat from 1980-2000 despite moderate inflation.

The real driver isn't inflation per se — it's real interest rates. When real rates (nominal rate minus inflation) are negative, gold thrives because the opportunity cost of holding gold (which pays no yield) disappears. When real rates are positive, gold struggles.

Since 2020, massive monetary expansion, supply chain disruptions, and geopolitical tensions have pushed gold to all-time highs above $3,000/oz. Central bank purchases from China, India, and Turkey have added structural demand.

For portfolio construction, a 5-15% gold allocation has historically improved risk-adjusted returns. Gold's low correlation to stocks and bonds makes it a genuine diversifier.`,
  },
  {
    id: 'gold-silver-ratio',
    category: 'economics',
    title: 'The Gold-Silver Ratio: A 4,000-Year Trading Signal',
    excerpt:
      'The ratio of gold to silver prices has been tracked since ancient Mesopotamia. Learn how traders use this metric to identify when either metal is overvalued.',
    readTime: '6 min',
    content: `The gold-silver ratio tells you how many ounces of silver it takes to buy one ounce of gold. Throughout history, this ratio has been a powerful mean-reverting signal.

Historical ratios: Ancient Egypt fixed it at 2.5:1. Rome set it at 12:1. The US Coinage Act of 1792 set it at 15:1. For most of modern history, it has averaged around 60:1.

Extreme readings signal opportunity. When the ratio exceeds 80:1, silver is historically cheap relative to gold. When it drops below 40:1, gold is the better value. In March 2020, the ratio spiked to 125:1 — an all-time extreme — before silver rallied 140% over the next year.

Aurum Oracle tracks this ratio in real-time. Our prediction markets let you bet on whether the ratio will contract or expand. Combined with Tinyman DEX trading of MCAU (tokenized gold), the full cycle from analysis to execution happens on-chain.`,
  },
  {
    id: 'blockchain-rwa',
    category: 'blockchain',
    title: 'Real-World Assets on Blockchain: Gold Goes Digital',
    excerpt:
      'How tokenization bridges physical gold vaults to your digital wallet. PAXG, XAUT, MCAU — understanding the tokenized gold landscape.',
    readTime: '8 min',
    content: `Tokenized gold represents a revolution in precious metals access. Each token is backed 1:1 by physical gold held in insured vaults, audited regularly, and redeemable for the underlying metal.

Major tokenized gold products:
• PAXG (Pax Gold) — Ethereum-based, backed by London Good Delivery bars at Brink's vaults. 1 PAXG = 1 troy ounce of gold.
• XAUT (Tether Gold) — Ethereum-based, backed by gold in Swiss vaults. Similar 1:1 backing.
• MCAU (Meld Gold) — Algorand-based, backed by gold from Australian refiners. 1 MCAU = 1 gram of gold.

Why Algorand? Transaction finality in ~3.3 seconds, fees under $0.001, carbon-negative blockchain. Perfect for high-frequency trading of real-world assets.

Meld Gold's MCAU enables gram-level gold ownership — you can own 0.5 grams of gold (~$50) without minimum buy-ins that traditional dealers require. Combined with Tinyman DEX liquidity, you get 24/7 trading that physical gold dealers can't match.

Aurum Oracle integrates MCAU directly. Buy tokenized gold, use it as collateral in prediction markets, or simply hold it as a digital gold position.`,
  },
  {
    id: 'prediction-markets',
    category: 'blockchain',
    title: 'How Prediction Markets Work: The Wisdom of Crowds',
    excerpt:
      'Prediction markets aggregate information better than polls or experts. Learn the mechanics of YES/NO shares, probability prices, and market resolution.',
    readTime: '7 min',
    content: `Prediction markets work on a simple principle: people with knowledge are willing to bet on it. When enough informed participants trade, market prices converge on accurate probabilities.

Mechanics:
1. A question is posed: "Will gold exceed $3,200/oz by June 30?"
2. YES and NO shares are created. Their prices always sum to $1.00.
3. If YES trades at $0.65, the market prices a 65% probability of "yes."
4. At resolution, correct shares pay $1.00. Incorrect shares pay $0.00.

Why it works: People with inside knowledge, analytical skills, or unique data are incentivized to trade. A geologist who knows about a major gold discovery will buy YES shares on gold price markets. This information gets incorporated into the price.

Academic research consistently shows prediction markets outperform polls, expert panels, and statistical models. The Iowa Electronic Markets predicted US presidential elections more accurately than polls 74% of the time.

Aurum Oracle applies this to precious metals. Our markets cover spot prices, ratios, tokenized assets, and more. XPC tokens serve as the staking currency, and correct predictions earn rewards.`,
  },
  {
    id: 'silver-industrial',
    category: 'silver',
    title: 'Silver: The Indispensable Industrial Metal',
    excerpt:
      'Silver\'s unique properties make it irreplaceable in electronics, solar panels, medicine, and emerging technologies. Why industrial demand is reshaping silver\'s future.',
    readTime: '8 min',
    content: `Silver is unique among precious metals: roughly 50% of annual demand is industrial, compared to less than 10% for gold. This dual nature as both investment and commodity creates fascinating dynamics.

Key industrial uses:
• Solar panels — Each panel uses ~20g of silver. With solar installations growing 30%+ annually, this alone consumes 140M+ oz/year.
• Electronics — Silver has the highest electrical and thermal conductivity of any element. Every smartphone, laptop, and EV uses silver.
• Medicine — Silver's antibacterial properties are used in wound dressings, water purification, and medical devices.
• 5G infrastructure — Massive silver demand from 5G rollout.
• EVs — Electric vehicles use 25-50g of silver each, 2-3x more than ICE vehicles.

The supply squeeze: Silver mine production has been flat for a decade at ~800M oz/year. Industrial demand alone consumes 600M+ oz. Investment demand (coins, bars, ETFs) takes another 300M+ oz. The structural deficit is growing.

MSOS (Meld Silver) tokenizes silver on Algorand at 1 token = 1 gram. Combined with Aurum Oracle's prediction markets, you can both trade and predict silver's trajectory.`,
  },
  {
    id: 'silver-gold-debate',
    category: 'silver',
    title: 'Silver vs Gold: Which Metal Wins in 2025?',
    excerpt:
      'Comparing risk-reward profiles, supply dynamics, and historical performance. The case for silver as the "poor man\'s gold" — and why it might outperform.',
    readTime: '6 min',
    content: `The gold vs silver debate is as old as money itself. Both are monetary metals, but their investment profiles differ significantly.

Gold's advantages:
• Central bank demand (35,000+ tonnes in reserves)
• Lower volatility (~15% annualized)
• Deeper liquidity
• Pure monetary/store-of-value narrative

Silver's advantages:
• Higher beta — outperforms gold in bull markets (historically 2-3x)
• Growing industrial demand (solar, EVs, 5G)
• Supply deficit (production flat, demand rising)
• More affordable entry point
• Gold-silver ratio at historically elevated levels (>80:1)

Historical pattern: In precious metals bull markets, gold leads first, then silver catches up with explosive moves. In, 2010-2011, gold rose 60% while silver rose 170%. The same pattern is emerging now.

The smart money strategy: Use gold as a portfolio anchor (stability), and silver for asymmetric upside. A 70/30 gold-silver allocation has historically captured the best risk-adjusted returns.

On Aurum Oracle, you can trade both MCAU and MSOS, predict their relative performance in our markets, and earn XPC tokens for accurate forecasts.`,
  },
]

export default function LearnPage() {
  const [category, setCategory] = useState<Category>('all')
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null)

  const filtered =
    category === 'all' ? ARTICLES : ARTICLES.filter((a) => a.category === category)

  return (
    <div className="flex min-h-screen flex-col bg-slate-900">
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gold-400">Knowledge Hub</h1>
          <p className="mt-1 text-sm text-slate-400">
            Deep dives into precious metals, blockchain technology, and market mechanics.
          </p>
        </div>

        {/* Category filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                category === cat.id
                  ? 'bg-gold-500/10 text-gold-400 ring-1 ring-gold-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Articles grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article) => {
            const isExpanded = expandedArticle === article.id
            const catInfo = CATEGORIES.find((c) => c.id === article.category)

            return (
              <article
                key={article.id}
                className={`rounded-lg border border-slate-700 bg-slate-800 transition-all ${
                  isExpanded ? 'md:col-span-2 lg:col-span-3' : ''
                }`}
              >
                <div className="p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400">
                      {catInfo?.emoji} {catInfo?.label}
                    </span>
                    <span className="text-[10px] text-slate-500">{article.readTime}</span>
                  </div>
                  <h2 className="text-sm font-semibold text-slate-100">{article.title}</h2>
                  <p className="mt-1 text-xs text-slate-400">{article.excerpt}</p>

                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t border-slate-700 pt-4">
                      {article.content.split('\n\n').map((para, i) => (
                        <p key={i} className="text-xs leading-relaxed text-slate-300">
                          {para}
                        </p>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() =>
                      setExpandedArticle(isExpanded ? null : article.id)
                    }
                    className="mt-3 text-xs font-medium text-gold-400 hover:text-gold-300"
                  >
                    {isExpanded ? '← Collapse' : 'Read more →'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </main>

      <Footer />
    </div>
  )
}
