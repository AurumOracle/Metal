import { useState } from 'react'
import './App.css'

const metals = [
  { name: 'Gold',     icon: '🥇', symbol: 'XAU' },
  { name: 'Silver',   icon: '🥈', symbol: 'XAG' },
  { name: 'Platinum', icon: '⚪', symbol: 'XPT' },
  { name: 'Copper',   icon: '🔶', symbol: 'XCU' },
]

function App() {
  const [selected, setSelected] = useState('')
  const [prediction, setPrediction] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const getPrediction = async () => {
    if (!selected || loading) return
    setLoading(true)
    setDone(false)
    setPrediction('')
    setError('')

    try {
      const response = await fetch('http://localhost:3001/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metal: selected }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Request failed')
      }

      const reader = response.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break

        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const { text } = JSON.parse(data)
            setPrediction((prev) => prev + text)
          } catch {
            // skip malformed chunks
          }
        }
      }
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const selectedMetal = metals.find((m) => m.name === selected)

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">⚖️</span>
          <h1>Aurum Oracle</h1>
        </div>
        <p>AI-powered precious metals market analysis</p>
      </header>

      <div className="metal-grid">
        {metals.map((metal) => (
          <button
            key={metal.name}
            className={`metal-card ${selected === metal.name ? 'selected' : ''}`}
            onClick={() => setSelected(metal.name)}
          >
            <div className="metal-icon">{metal.icon}</div>
            <div>{metal.name}</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{metal.symbol}</div>
          </button>
        ))}
      </div>

      <button
        className={`predict-btn ${loading ? 'loading' : ''}`}
        onClick={getPrediction}
        disabled={!selected || loading}
      >
        {loading ? '⟳  Analysing market...' : 'Get AI Prediction'}
      </button>

      {error && <div className="error">⚠ {error}</div>}

      {(prediction || loading) && (
        <div className="prediction-card">
          <div className="prediction-header">
            <div className={`prediction-dot ${done ? 'done' : ''}`} />
            <h2>
              {selectedMetal?.icon} {selected} Outlook
            </h2>
          </div>
          <div className="prediction-body">{prediction}</div>
        </div>
      )}
    </div>
  )
}

export default App
