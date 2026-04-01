import type { Metadata } from 'next'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { WalletProvider }  from '@/components/providers/WalletProvider'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title:       'Aurum Oracle — Metals Intelligence Platform',
  description: 'Professional gold and silver intelligence. Live tokenised metals trading via Meld Gold, on-chain prediction markets, and XPC rewards — powered by Algorand.',
  metadataBase: new URL('https://www.AurumOracle.com'),
  icons: {
    icon:    '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title:       'Aurum Oracle',
    description: 'Professional metals intelligence. Trade MCAU & MSOS. Predict. Earn XPC.',
    url:         'https://www.AurumOracle.com',
    siteName:    'Aurum Oracle',
    type:        'website',
    images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: 'Aurum Oracle' }],
  },
  twitter: {
    card:    'summary_large_image',
    site:    '@aurumoracle',
    creator: '@aurumoracle',
    images:  ['/og-image.svg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full flex flex-col">
        <QueryProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
