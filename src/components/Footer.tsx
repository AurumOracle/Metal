import Link from 'next/link'

const PLATFORM_LINKS = [
  { label: 'Dashboard', href: '/' },
  { label: 'Learn', href: '/learn' },
  { label: 'XPC Token', href: '/token' },
  { label: 'Premium', href: '/premium' },
  { label: 'Token Sale', href: '/sale' },
]

const INFRASTRUCTURE = [
  { label: 'Algorand', href: 'https://algorand.co', desc: 'Layer-1 blockchain' },
  { label: 'Meld Gold', href: 'https://meld.gold', desc: 'Tokenized gold & silver' },
  { label: 'NF Domains', href: 'https://nf.domains', desc: 'Algorand identity' },
  { label: 'Pera Wallet', href: 'https://perawallet.app', desc: 'Mobile wallet' },
  { label: 'Tinyman', href: 'https://tinyman.org', desc: 'Permissionless DEX' },
]

const LEGAL_LINKS = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Risk Disclosure', href: '/risk' },
  { label: 'API Docs', href: '/docs' },
]

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Main footer grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xl font-bold text-gold-400">A</span>
              <span className="text-sm font-semibold text-slate-200">Aurum Oracle</span>
            </div>
            <p className="mb-3 text-xs text-slate-400">
              Precious metals prediction market on Algorand. Real-time spot prices,
              tokenized gold &amp; silver trading, and community-driven market forecasts.
            </p>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              <span className="text-[10px] text-slate-500">Built on Algorand</span>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Platform
            </h4>
            <ul className="space-y-1.5">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-slate-400 hover:text-gold-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Infrastructure */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Infrastructure
            </h4>
            <ul className="space-y-1.5">
              {INFRASTRUCTURE.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group text-xs"
                  >
                    <span className="text-slate-400 group-hover:text-gold-400 transition-colors">
                      {item.label}
                    </span>
                    <span className="ml-1 text-[10px] text-slate-600">{item.desc}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Legal
            </h4>
            <ul className="space-y-1.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-slate-400 hover:text-gold-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sponsor */}
        <div className="mt-6 rounded-lg border border-slate-700/50 bg-slate-800/30 p-3 text-center">
          <span className="text-[10px] text-slate-500">Sponsored by </span>
          <a
            href="https://cbdgold.io"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-medium text-green-400 hover:text-green-300"
          >
            CBDGold.io
          </a>
          <span className="text-[10px] text-slate-500">
            {' '}
            — Algorand&apos;s cannabis project · WEED &amp; HEMP tokens
          </span>
        </div>

        {/* Social row */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-4">
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com/aurumoracle"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-gold-400"
            >
              𝕏 @aurumoracle
            </a>
            <a
              href="https://app.nf.domains/name/xpc.algo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-teal-400"
            >
              xpc.algo
            </a>
            <a
              href="https://github.com/AurumOracle"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-slate-300"
            >
              GitHub
            </a>
          </div>
          <div className="text-[10px] text-slate-600">
            © {new Date().getFullYear()} Aurum Oracle · www.AurumOracle.com
          </div>
        </div>

        {/* Risk disclosure */}
        <div className="mt-4 rounded border border-slate-800 bg-slate-900/50 p-2">
          <p className="text-[9px] leading-relaxed text-slate-600">
            <strong>Risk Disclosure:</strong> This platform is for informational purposes
            only. Trading precious metals and digital assets involves substantial risk. Past
            performance does not guarantee future results. Prediction markets are speculative
            instruments. Never invest more than you can afford to lose. Not financial advice.
            DYOR.
          </p>
        </div>
      </div>
    </footer>
  )
}
