import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title:       'Learn · Aurum Oracle',
  description: 'Gold and silver through history, culture, alchemy, and the blockchain. From ancient monetary systems to tokenised metals on Algorand.',
}

// ── CONTENT DATA ──────────────────────────────────────────────────────

const FEATURED = {
  title:   'Gold: 5,000 years of monetary history',
  excerpt: 'From the Egyptian pharaohs who buried it, to the Roman denarius that funded an empire, to the Bretton Woods system that shaped the modern world — gold has been the constant thread through every monetary regime humanity has tried.',
  tag:     'History',
  readMin: 12,
  slug:    'gold-5000-years',
}

const ARTICLES = [
  {
    tag:     'History',
    title:   'The Roman gold standard and its collapse',
    excerpt: 'The denarius began as 95% silver. By 275 AD it was 5%. The debasement that toppled Rome is being repeated in every fiat currency today.',
    readMin: 8,
    slug:    'roman-gold-standard',
  },
  {
    tag:     'Alchemy & Esoterica',
    title:   "The alchemist's quest: gold as spiritual metaphor",
    excerpt: 'The medieval alchemists were not merely seeking material gold. The transmutation of base metals was a map for the transformation of the self.',
    readMin: 10,
    slug:    'alchemy-gold-metaphor',
  },
  {
    tag:     'Economics',
    title:   'Bretton Woods: how the US dollar was backed by gold',
    excerpt: 'In 1944, 44 nations agreed to peg their currencies to the dollar, which was pegged to gold at $35/oz. Nixon ended it in 1971. What happened next?',
    readMin: 9,
    slug:    'bretton-woods',
  },
  {
    tag:     'Blockchain',
    title:   'How MCAU works: Meld Gold on Algorand explained',
    excerpt: 'Each MCAU token is backed by one gram of physical gold held in audited Australian vaults. Here is exactly how the redemption process works.',
    readMin: 6,
    slug:    'mcau-explained',
  },
  {
    tag:     'Silver',
    title:   'Silver\'s industrial role: why it is not just a monetary metal',
    excerpt: 'Solar panels, EV batteries, 5G infrastructure, medical devices — silver demand from industry is structurally rising in ways gold demand is not.',
    readMin: 7,
    slug:    'silver-industrial',
  },
  {
    tag:     'History',
    title:   'The California Gold Rush and the birth of US financial markets',
    excerpt: 'The 1848 discovery at Sutter\'s Mill did not just bring 300,000 people west. It created the banking infrastructure that became Wall Street.',
    readMin: 11,
    slug:    'california-gold-rush',
  },
  {
    tag:     'Alchemy & Esoterica',
    title:   'Gold in world religions: sacred metal across cultures',
    excerpt: 'From the Ark of the Covenant to Hindu temple offerings, from Aztec sun worship to Buddhist iconography — why did every civilisation independently venerate gold?',
    readMin: 9,
    slug:    'gold-world-religions',
  },
  {
    tag:     'Blockchain',
    title:   'NFD domains on Algorand: your on-chain identity',
    excerpt: 'NF Domains are the Algorand equivalent of ENS on Ethereum. Here is how xpc.algo works, why segments matter, and how to mint yours.',
    readMin: 5,
    slug:    'nfd-domains-explained',
  },
  {
    tag:     'Economics',
    title:   'The gold/silver ratio: 500 years of data',
    excerpt: 'Historically the ratio has averaged around 15:1. Today it sits near 94:1. Is silver dramatically undervalued, or has the world changed permanently?',
    readMin: 8,
    slug:    'gold-silver-ratio-history',
  },
]

const TAG_COLORS: Record<string, string> = {
  'History':           'bg-gold-dim text-gold border-gold',
  'Alchemy & Esoterica': 'bg-[rgba(168,139,212,0.12)] text-[#A88BD4] border-[rgba(168,139,212,0.3)]',
  'Economics':         'bg-[rgba(91,173,138,0.12)] text-up border-[rgba(91,173,138,0.3)]',
  'Blockchain':        'bg-algo-dim text-algo border-algo',
  'Silver':            'bg-[rgba(168,180,192,0.12)] text-silver border-[rgba(168,180,192,0.3)]',
}

const TOPICS = [
  { label: 'All',                  key: 'all'      },
  { label: 'History',              key: 'History'  },
  { label: 'Alchemy',              key: 'Alchemy'  },
  { label: 'Economics',            key: 'Economics'},
  { label: 'Blockchain',           key: 'Blockchain'},
  { label: 'Silver',               key: 'Silver'   },
]

const VIDEO_RESOURCES = [
  {
    title:   'Why gold never rusts — the chemistry of a noble metal',
    channel: 'Royal Institution',
    url:     'https://www.youtube.com/results?search_query=gold+chemistry+noble+metal',
  },
  {
    title:   'The history of money — from barter to blockchain',
    channel: 'Kurzgesagt',
    url:     'https://www.youtube.com/results?search_query=history+of+money+kurzgesagt',
  },
  {
    title:   'Algorand explained in 5 minutes',
    channel: 'Algorand Foundation',
    url:     'https://www.youtube.com/results?search_query=algorand+explained',
  },
]

// ── PAGE ──────────────────────────────────────────────────────────────

export default function LearnPage() {
  return (
    <main className="min-h-screen bg-surface-base">

      {/* Hero */}
      <section className="border-b border-default px-8 py-12 bg-surface-raised">
        <div className="max-w-4xl mx-auto">
          <div className="label mb-3">Knowledge hub</div>
          <h1 className="font-display text-4xl font-bold tracking-[0.1em] text-gold mb-4 leading-tight">
            Gold, Silver &amp; the Blockchain
          </h1>
          <p className="text-[17px] font-light text-secondary leading-relaxed max-w-2xl">
            Five thousand years of monetary history. Ancient alchemy. The economics of precious metals.
            And how Algorand and Meld Gold are bringing it all on-chain.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-8 py-10">

        {/* Topic filter */}
        <div className="flex gap-2 flex-wrap mb-10">
          {TOPICS.map(t => (
            <button
              key={t.key}
              className="font-display text-[9px] tracking-[0.14em] uppercase px-3 py-1.5 rounded border border-default text-muted hover:border-gold hover:text-gold transition-all cursor-pointer"
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Featured article */}
        <article className="bg-surface-card border border-gold rounded-2xl p-8 mb-10 cursor-pointer hover:bg-surface-hover transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-[9px] font-display tracking-[0.14em] px-2.5 py-1 rounded border ${TAG_COLORS[FEATURED.tag]}`}>
              {FEATURED.tag}
            </span>
            <span className="text-[11px] italic text-muted">Featured · {FEATURED.readMin} min read</span>
          </div>
          <h2 className="font-display text-2xl font-semibold tracking-[0.06em] text-gold mb-4 leading-snug">
            {FEATURED.title}
          </h2>
          <p className="text-[15px] font-light text-secondary leading-relaxed mb-5">
            {FEATURED.excerpt}
          </p>
          <span className="font-display text-[9px] tracking-[0.14em] uppercase text-gold hover:text-gold-lt transition-colors">
            Read article →
          </span>
        </article>

        {/* Article grid */}
        <div className="label mb-5">All articles</div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-12">
          {ARTICLES.map(article => (
            <article
              key={article.slug}
              className="bg-surface-card border border-default rounded-xl p-5 cursor-pointer hover:border-gold transition-colors group"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[8px] font-display tracking-[0.14em] px-2 py-0.5 rounded border ${TAG_COLORS[article.tag] ?? 'bg-surface-hover text-muted border-default'}`}>
                  {article.tag}
                </span>
                <span className="text-[10px] italic text-muted">{article.readMin} min</span>
              </div>
              <h3 className="font-display text-[14px] tracking-[0.04em] text-primary group-hover:text-gold transition-colors mb-2 leading-snug">
                {article.title}
              </h3>
              <p className="text-[13px] font-light text-muted leading-relaxed">
                {article.excerpt}
              </p>
            </article>
          ))}
        </div>

        {/* Video resources */}
        <div className="label mb-5">Video resources</div>
        <div className="space-y-3 mb-12">
          {VIDEO_RESOURCES.map(v => (
            <a
              key={v.title}
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 bg-surface-card border border-default rounded-xl px-5 py-4 hover:border-gold transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-[rgba(196,95,95,0.15)] border border-[rgba(196,95,95,0.3)] flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <polygon points="4,2 12,7 4,12" fill="#C45F5F" />
                </svg>
              </div>
              <div>
                <div className="text-[13px] font-light text-primary group-hover:text-gold transition-colors">
                  {v.title}
                </div>
                <div className="text-[11px] italic text-muted">{v.channel}</div>
              </div>
              <span className="ml-auto text-[11px] text-muted group-hover:text-gold transition-colors">↗</span>
            </a>
          ))}
        </div>

        {/* The esoteric corner */}
        <div className="border border-[rgba(168,139,212,0.25)] rounded-2xl p-7 bg-[rgba(168,139,212,0.04)] mb-10">
          <div className="label mb-3" style={{ color: '#A88BD4' }}>Esoteric &amp; alchemical</div>
          <h3 className="font-display text-xl tracking-[0.08em] mb-3" style={{ color: '#A88BD4' }}>
            The Philosopher's Stone — and why alchemists were onto something
          </h3>
          <p className="text-[14px] font-light text-secondary leading-relaxed mb-4">
            The medieval alchemists believed lead could be transmuted into gold. They were wrong about the chemistry — but profoundly right about the metaphysics.
            Every monetary system in history has been an attempt to transmute human labour into stored value.
            Gold simply happened to be the best technology for that purpose for 5,000 years.
            Blockchain may be the next iteration.
          </p>
          <p className="text-[14px] font-light text-secondary leading-relaxed">
            The word <em className="text-primary">aurum</em> — gold in Latin — is also the root of <em className="text-primary">aurora</em>.
            The dawn. The beginning. This platform takes its name from both.
          </p>
        </div>

        {/* CTA - predict */}
        <div className="text-center py-8 border-t border-default">
          <div className="label mb-3">Ready to put your knowledge to work?</div>
          <h3 className="font-display text-xl tracking-[0.08em] text-gold mb-3">
            Join the prediction markets
          </h3>
          <p className="text-[14px] italic text-muted mb-5 max-w-md mx-auto">
            Predict gold and silver price movements. Earn XPC tokens for correct calls.
            All on-chain via Algorand. Your identity is your xpc.algo name.
          </p>
          <Link
            href="/"
            className="inline-block font-display text-[10px] tracking-[0.14em] uppercase px-6 py-3 rounded-xl border border-gold bg-gold-dim text-gold hover:bg-[rgba(201,168,76,0.22)] transition-all"
          >
            View prediction markets →
          </Link>
        </div>
      </div>
    </main>
  )
}
