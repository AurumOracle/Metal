import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import 'dotenv/config'

const app = express()
app.use(cors())
app.use(express.json())

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are AurumOracle, an expert precious metals and commodities market analyst.
You provide concise, insightful price predictions based on current market fundamentals, technicals, and macro factors.
Structure your response with:
• Current price context (approximate range)
• Short-term outlook (1-4 weeks) with direction and confidence
• Top 3 market drivers right now
• One key risk to watch
Keep responses focused, data-driven, and under 250 words. Use bullet points for clarity.`

// ── Claude AI Prediction (streaming) ──────────────────────────────────

app.post('/api/predict', async (req, res) => {
  const { metal } = req.body
  if (!metal || typeof metal !== 'string') {
    return res.status(400).json({ error: 'Metal is required' })
  }

  const allowed = ['Gold', 'Silver', 'Platinum', 'Palladium', 'Copper']
  if (!allowed.includes(metal)) {
    return res.status(400).json({ error: 'Invalid metal' })
  }

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Provide a price prediction and market outlook for ${metal} right now. Include current approximate price range, short-term direction, the top 3 market drivers, and one key risk.`,
        },
      ],
    })

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`)
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      res.status(error.status).json({ error: error.message })
    } else {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
})

// ── Metal Prices (proxy to avoid CORS) ────────────────────────────────

const PRICE_CACHE: { data: unknown; ts: number } = { data: null, ts: 0 }
const CACHE_TTL = 60_000 // 1 minute

app.get('/api/prices', async (_req, res) => {
  const now = Date.now()
  if (PRICE_CACHE.data && now - PRICE_CACHE.ts < CACHE_TTL) {
    return res.json(PRICE_CACHE.data)
  }

  const apiKey = process.env.GOLDAPI_KEY
  if (!apiKey) {
    return res.json({ source: 'fallback', prices: getFallbackPrices() })
  }

  try {
    const metals = ['XAU', 'XAG', 'XPT', 'XPD']
    const results = await Promise.allSettled(
      metals.map(async (symbol) => {
        const resp = await fetch(`https://www.goldapi.io/api/${symbol}/USD`, {
          headers: { 'x-access-token': apiKey, 'Content-Type': 'application/json' },
        })
        if (!resp.ok) throw new Error(`GoldAPI ${symbol}: ${resp.status}`)
        return resp.json()
      })
    )

    const prices = metals.map((symbol, i) => {
      const result = results[i]
      if (result.status === 'fulfilled' && result.value?.price) {
        const d = result.value
        return {
          symbol,
          name: metalName(symbol),
          price: d.price,
          prevClose: d.prev_close_price ?? d.price,
          change: d.ch ?? 0,
          changePct: d.chp ?? 0,
          high: d.high_price ?? d.price,
          low: d.low_price ?? d.price,
          updatedAt: new Date().toISOString(),
        }
      }
      return getFallbackPrice(symbol)
    })

    const data = { source: 'goldapi', prices }
    PRICE_CACHE.data = data
    PRICE_CACHE.ts = now
    res.json(data)
  } catch {
    res.json({ source: 'fallback', prices: getFallbackPrices() })
  }
})

function metalName(sym: string): string {
  const names: Record<string, string> = { XAU: 'Gold', XAG: 'Silver', XPT: 'Platinum', XPD: 'Palladium' }
  return names[sym] ?? sym
}

function getFallbackPrice(symbol: string) {
  const fallback: Record<string, number> = { XAU: 2340, XAG: 29.5, XPT: 1020, XPD: 960 }
  return {
    symbol,
    name: metalName(symbol),
    price: fallback[symbol] ?? 0,
    prevClose: fallback[symbol] ?? 0,
    change: 0,
    changePct: 0,
    high: fallback[symbol] ?? 0,
    low: fallback[symbol] ?? 0,
    updatedAt: new Date().toISOString(),
  }
}

function getFallbackPrices() {
  return ['XAU', 'XAG', 'XPT', 'XPD'].map(getFallbackPrice)
}

// ── Start ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`AurumOracle API → http://localhost:${PORT}`)
})
