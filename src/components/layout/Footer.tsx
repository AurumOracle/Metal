import { LiveDot } from '@/components/ui'
import { clsx } from 'clsx'

const FOOTER_COLS = [
  {
    title: 'Platform',
    links: [
      { label: 'AurumOracle.com', href: 'https://www.AurumOracle.com' },
      { label: 'Mint xpc.algo',   href: 'https://app.nf.domains/name/xpc.algo?view=segments', external: true },
      { label: 'Premium',         href: '#' },
      { label: 'Enterprise API',  href: '#' },
      { label: 'XPC token',       href: '#' },
    ],
  },
  {
    title: 'Infrastructure',
    links: [
      { label: 'Algorand',   href: 'https://algorand.com',                external: true },
      { label: 'Meld Gold',  href: 'https://meld.gold',                   external: true },
      { label: 'NF Domains', href: 'https://app.nf.domains',              external: true },
      { label: 'Pera Wallet',href: 'https://www.perawallet.app',          external: true },
      { label: 'XRP Ledger', href: 'https://xrpl.org',                    external: true },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of service', href: '#' },
      { label: 'Privacy policy',   href: '#' },
      { label: 'Risk disclosure',  href: '#' },
      { label: 'Cookie policy',    href: '#' },
      { label: 'AML policy',       href: '#' },
    ],
  },
]

const SOCIAL_LINKS = [
  { label: '𝕏 @aurumoracle', href: 'https://x.com/aurumoracle'                              },
  { label: 'xpc.algo',        href: 'https://app.nf.domains/name/xpc.algo'                   },
  { label: 'Meld Gold',       href: 'https://meld.gold'                                       },
  { label: 'Algorand',        href: 'https://algorand.com'                                    },
  { label: 'NF Domains',      href: 'https://app.nf.domains'                                  },
]

const LEGAL_QUICK = ['Terms', 'Privacy', 'Risk disclosure', 'Cookies']

export function Footer() {
  return (
    <footer className="flex-shrink-0 bg-surface-raised border-t border-default">
      <div className="px-6">

        {/* Top columns */}
        <div className="grid grid-cols-4 gap-8 py-5 border-b border-default">
          {/* Brand */}
          <div>
            <div className="font-display text-[13px] font-bold tracking-[0.2em] text-gold mb-1.5">
              Aurum Oracle
            </div>
            <p className="text-[12px] italic text-muted leading-relaxed max-w-[220px] mb-3">
              Professional metals intelligence platform. Live data, tokenised trading, and on-chain prediction markets powered by Algorand and Meld Gold.
            </p>
            <div className="flex items-center gap-1.5 font-display text-[8px] tracking-[0.12em] text-algo">
              <LiveDot color="algo" />
              Powered by Algorand · xpc.algo
            </div>
          </div>

          {/* Nav columns */}
          {FOOTER_COLS.map(col => (
            <div key={col.title}>
              <div className="label mb-2.5">{col.title}</div>
              <div className="space-y-1.5">
                {col.links.map(link => (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="block text-[12px] text-secondary hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between py-3 flex-wrap gap-2">
          <div className="text-[11px] text-muted">
            © 2026 Aurum Oracle · xpc.algo · All rights reserved
          </div>
          <div className="flex gap-3 flex-wrap">
            {LEGAL_QUICK.map(l => (
              <a key={l} href="#" className="text-[11px] text-muted hover:text-secondary transition-colors">
                {l}
              </a>
            ))}
          </div>
          <div className="flex gap-2">
            {SOCIAL_LINKS.map(s => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                  'font-display text-[8px] tracking-[0.1em] text-muted',
                  'px-2.5 py-1 rounded border border-default',
                  'hover:text-gold hover:border-gold hover:bg-gold-dim transition-all',
                )}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-[10px] italic text-muted leading-relaxed pb-3 border-t border-default pt-2.5">
          <strong className="not-italic font-normal text-secondary">Risk disclosure:</strong>
          {' '}Trading tokenised precious metals involves financial risk. Prices can fall as well as rise.
          MCAU and MSOS are Algorand Standard Assets issued by Meld Gold Pty Ltd, each representing
          one gram of physical metal held in secure vaults and fully redeemable for bullion.
          Aurum Oracle is an information and execution interface — not a financial adviser.
          The 0.7% platform fee is applied per transaction and directed to the Aurum Oracle treasury (xpc.algo).
          XPC tokens are utility tokens for platform participation and do not constitute securities or investment contracts.
          Past performance is not indicative of future results. Not available to residents of all jurisdictions.
          Always consult a qualified financial professional before making investment decisions.
        </div>
      </div>
    </footer>
  )
}
