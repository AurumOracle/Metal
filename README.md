# AurumOracle

AI-powered precious metals prediction market — built with React, Claude, and Algorand.

## Quick Start

```bash
# Install dependencies
npm install

# Start the API server (requires ANTHROPIC_API_KEY in .env)
npm run server

# Start the frontend (separate terminal)
npm run dev
```

Frontend: http://localhost:5173  
API: http://localhost:3001

## Environment Variables

Create a `.env` file in the project root:

```
ANTHROPIC_API_KEY=your-api-key-here
GOLDAPI_KEY=your-goldapi-key       # optional — falls back to static prices
PORT=3001                          # optional
```

## Architecture

```
┌─────────────────────────────────────────┐
│  Frontend (Vite + React + TypeScript)   │
│  └─ App.tsx — single-file SPA          │
│     ├─ Dashboard — live metal prices    │
│     ├─ AI Predict — Claude streaming    │
│     ├─ Learn — metals knowledge hub     │
│     └─ About — project info & roadmap   │
├─────────────────────────────────────────┤
│  API Server (Express + TypeScript)      │
│  └─ server.ts                          │
│     ├─ POST /api/predict — Claude SSE   │
│     └─ GET /api/prices — GoldAPI proxy  │
└─────────────────────────────────────────┘
```

## Tech Stack

- **React 18** + TypeScript — frontend
- **Vite 5** — build tool
- **Claude AI** — market analysis (streaming SSE)
- **GoldAPI.io** — real-time metal prices
- **Express** — API server
- **Lucide React** — icons
- **Algorand** — blockchain layer (roadmap)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build |
| `npm run server` | Start Express API server |

## License

MIT

## 📋 Project Structure

- `src/app/` — Next.js pages and API routes  
- `src/components/` — React components
- `src/hooks/` — Custom React hooks  
- `src/lib/` — Utilities (prices, Algorand, contracts)
- `src/types/` — TypeScript type definitions
- `src/store/` — Zustand global state
- `scripts/` — Deployment & sync scripts

## 🔧 Environment Variables

**Essential:**
```bash
GOLDAPI_KEY=your_key_from_goldapi.io
NEXT_PUBLIC_ALGORAND_NETWORK=testnet
```

**Optional (for smart contracts):**
```bash
NEXT_PUBLIC_XPC_ASA_ID=
NEXT_PUBLIC_MARKET_CONTRACT_ID=
DATABASE_URL=postgresql://...
```

See `.env.example` for all options.

## 🧪 Development

### Type Check
```bash
npm run type-check
```

### Run Tests
```bash
npm test
```

### Compile Contracts (if building locally)
```bash
npm run compile-teal
```

### Sync Markets from Blockchain
```bash
npm run sync  # Runs in background every 30s
```

## 🚢 Deployment

### To Vercel
```bash
vercel
```

### To Your Server
```bash
npm run build
npm start
```

## Technologies

- React 18
- TypeScript
- Next.js 14
- Tailwind CSS
- Algorand SDK
- Zustand
- React Query

## 📚 Learn More

- [Algorand Developer Docs](https://developer.algorand.org)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Meld Gold Documentation](https://meld.gold)
- [NF Domains](https://nf.domains)

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📄 License

- React 18
- TypeScript
- Vite
- Algorand SDK
- Anthropic Claude SDK

## License

MIT