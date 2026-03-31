import { useState } from 'react'
import './App.css'

function App() {
  const [metal, setMetal] = useState('')
  const [prediction, setPrediction] = useState('')

  const metals = ['Gold', 'Silver', 'Copper', 'Platinum']

  const getPrediction = async () => {
    // Integrate Claude here
    setPrediction(`Predicted price for ${metal}: $1000 (placeholder)`)
  }

  return (
    <div className="App">
      <h1>Aurum Oracle - Metal Prediction Market</h1>
      <select value={metal} onChange={(e) => setMetal(e.target.value)}>
        <option value="">Select a metal</option>
        {metals.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <button onClick={getPrediction} disabled={!metal}>Get Prediction</button>
      {prediction && <p>{prediction}</p>}
    </div>
  )
}

export default App