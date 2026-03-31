// Algorand SDK utilities and NFD integration

import algosdk from 'algosdk'

const NETWORK = process.env.NEXT_PUBLIC_ALGORAND_NETWORK || 'testnet'
const SERVER = process.env.NEXT_PUBLIC_ALGORAND_SERVER || 'https://testnet-api.algonode.cloud'
const INDEXER = process.env.NEXT_PUBLIC_ALGORAND_INDEXER || 'https://testnet-idx.algonode.cloud'
const PORT = parseInt(process.env.NEXT_PUBLIC_ALGORAND_PORT || '443')

export const algodClient = new algosdk.Algodv2('', SERVER, PORT)
export const indexerClient = new algosdk.Indexer('', INDEXER, PORT)

export interface NFDProfile {
  name: string
  address: string
  avatar?: string
  bio?: string
  caAlgo?: boolean
}

export async function resolveNFD(address: string): Promise<NFDProfile | null> {
  try {
    const resp = await fetch(`https://api.nf.domains/nfd/lookup?address=${address}&view=thumbnail`)
    if (!resp.ok) return null
    const data = await resp.json()
    if (!data.nfds || data.nfds.length === 0) return null

    const nfd = data.nfds[0]
    return {
      name: nfd.name,
      address,
      avatar: nfd.properties?.avatar || undefined,
      bio: nfd.properties?.bio || undefined,
      caAlgo: nfd.caAlgo,
    }
  } catch (err) {
    console.error('NFD resolution error:', err)
    return null
  }
}

export async function resolveNFDBulk(addresses: string[]): Promise<Record<string, NFDProfile>> {
  const results: Record<string, NFDProfile> = {}
  const batch = addresses.join(',')

  try {
    const resp = await fetch(
      `https://api.nf.domains/nfd/lookup?address=${batch}&view=thumbnail`
    )
    if (!resp.ok) return results

    const data = await resp.json()
    if (!data.nfds) return results

    data.nfds.forEach((nfd: any) => {
      results[nfd.address] = {
        name: nfd.name,
        address: nfd.address,
        avatar: nfd.properties?.avatar,
        bio: nfd.properties?.bio,
        caAlgo: nfd.caAlgo,
      }
    })
  } catch (err) {
    console.error('NFD bulk resolution error:', err)
  }

  return results
}

// Comment encoding for Algorand note fields
const AO_PREFIX = 'AO/v1/'

export function encodeComment(text: string, vote: 'YES' | 'NO'): string {
  try {
    const payload = JSON.stringify({ vote, text })
    const maxLen = 1024 - AO_PREFIX.length
    if (payload.length > maxLen) {
      return AO_PREFIX + payload.slice(0, maxLen)
    }
    return AO_PREFIX + payload
  } catch {
    return AO_PREFIX + text.slice(0, 1000)
  }
}

export function decodeComment(note: string): { vote: 'YES' | 'NO'; text: string } | null {
  if (!note.startsWith(AO_PREFIX)) return null
  try {
    const json = JSON.parse(note.slice(AO_PREFIX.length))
    return { vote: json.vote || 'YES', text: json.text || '' }
  } catch {
    return { vote: 'YES', text: note.slice(AO_PREFIX.length) }
  }
}

export async function fetchMarketComments(
  marketId: string,
  appId: number
): Promise<{ txn_id: string; author: string; vote: 'YES' | 'NO'; content: string; timestamp: number }[]> {
  const comments: any[] = []
  let nextToken = ''

  try {
    do {
      const resp = await indexerClient
        .searchForTransactions()
        .applicationID(appId)
        .notePrefix(AO_PREFIX)
        .nextToken(nextToken)
        .do()

      if (resp.transactions) {
        resp.transactions.forEach((txn: any) => {
          if (txn.note) {
            const decoded = Buffer.from(txn.note, 'base64').toString('utf-8')
            const parsed = decodeComment(decoded)
            if (parsed) {
              comments.push({
                txn_id: txn.id,
                author: txn['sender'],
                vote: parsed.vote,
                content: parsed.text,
                timestamp: txn['confirmed-round'],
              })
            }
          }
        })
      }

      nextToken = (resp as any)['next-token']
    } while (nextToken)
  } catch (err) {
    console.error('Fetch comments error:', err)
  }

  return comments
}

export async function getXPCBalance(address: string, asaId: number): Promise<number> {
  try {
    const acct = await algodClient.accountInformation(address).do()
    const asset = acct.assets?.find((a: any) => a['asset-id'] === asaId)
    return asset ? Number(asset.amount) / Math.pow(10, (asset as any).decimals || 0) : 0
  } catch {
    return 0
  }
}
