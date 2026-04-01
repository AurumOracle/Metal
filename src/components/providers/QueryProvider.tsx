'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime:   30_000,   // prices fresh for 30s
        refetchInterval: 30_000,
        retry: 2,
      },
    },
  }))

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
