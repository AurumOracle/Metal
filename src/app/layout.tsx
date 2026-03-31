import type { Metadata } from 'next'
import { Providers } from '@/components/Providers'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.aurumoracle.com'),
  title: 'Aurum Oracle - Metal Prediction Market',
  description: 'Algorand-based metal prediction market with XPC tokens',
  openGraph: {
    title: 'Aurum Oracle',
    description: 'Metal prediction market on Algorand',
    url: 'https://www.aurumoracle.com',
    images: ['/og-image.svg'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" />
      </head>
      <body className="bg-slate-900 text-slate-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
