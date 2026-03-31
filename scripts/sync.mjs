#!/usr/bin/env node
/**
 * Algorand market sync script
 * Runs every 30 seconds, polling contract state and AlgoIndexer
 * Updates PostgreSQL with live market data
 */

import algosdk from 'algosdk'

const NETWORK = process.env.NEXT_PUBLIC_ALGORAND_NETWORK || 'testnet'
const SERVER = process.env.NEXT_PUBLIC_ALGORAND_SERVER || 'https://testnet-api.algonode.cloud'
const INDEXER = process.env.NEXT_PUBLIC_ALGORAND_INDEXER || 'https://testnet-idx.algonode.cloud'
const PORT = parseInt(process.env.NEXT_PUBLIC_ALGORAND_PORT || '443')

const algodClient = new algosdk.Algodv2('', SERVER, PORT)
const indexerClient = new algosdk.Indexer('', INDEXER, PORT)

async function syncMarkets() {
  console.log(`[${new Date().toISOString()}] Syncing markets...`)
  
  try {
    // Get the market contract ID
    const marketAppId = parseInt(process.env.NEXT_PUBLIC_MARKET_CONTRACT_ID || '0')
    if (!marketAppId) {
      console.log('No market contract ID set, skipping sync')
      return
    }

    // Fetch market state from Algorand
    const app = await indexerClient.lookupApplicationByID(marketAppId).do()
    const globalState = app.application.params['global-state'] || []
    
    console.log(`Found ${globalState.length} state entries`)

    // Parse and process market data
    globalState.forEach((item) => {
      const key = Buffer.from(item.key, 'base64').toString()
      const value = item.value.type === 1 ? item.value.uint : item.value.bytes
      console.log(`  ${key}: ${value}`)
    })

    // In production, you'd write this to PostgreSQL
    // Example: await db.query('UPDATE markets SET yes_pool = $1 WHERE id = $2', [...])

  } catch (err) {
    console.error('Sync error:', err)
  }
}

console.log(`Starting market sync on ${NETWORK}...`)
console.log(`Market Contract ID: ${process.env.NEXT_PUBLIC_MARKET_CONTRACT_ID}`)

// Run once, then every 30 seconds
syncMarkets()
setInterval(syncMarkets, 30000)

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...')
  process.exit(0)
})
