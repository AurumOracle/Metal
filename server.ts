import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import 'dotenv/config'

const app = express()
app.use(cors())
app.use(express.json())

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const METALS_CONTEXT = `You are AurumOracle, an expert precious metals market analyst.
You provide concise, insightful price predictions for metals based on current market fundamentals.
Always structure your response with: a short-term price outlook, key drivers, and a confidence level (Low/Medium/High).
Keep responses focused and under 200 words.`

app.post('/api/predict', async (req, res) => {
  const { metal } = req.body

  if (!metal) {
    return res.status(400).json({ error: 'Metal is required' })
  }

  try {
    const stream = client.messages.stream({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      system: METALS_CONTEXT,
      messages: [
        {
          role: 'user',
          content: `Provide a price prediction and market outlook for ${metal} right now. Include current approximate price range, short-term direction, and the top 3 market drivers.`,
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

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`AurumOracle API running on http://localhost:${PORT}`)
})
