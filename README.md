# Aurum Oracle - Metal Prediction Market

A Next.js 14 + TypeScript application for an Algorand-based metal prediction market integrated with XPC tokens.

## 🚀 Quick Start

### 1. Install & Setup (2 minutes)
```bash
npm install
cp .env.example .env.local
# Add your GOLDAPI_KEY to .env.local
```

### 2. Run Dev Server
```bash
npm run dev
# Visit http://localhost:3000
```

That's it! The app runs with mock data and live prices from GoldAPI.io.

## ✨ Features

- **Live Metal Prices** — Gold, Silver, Platinum, Palladium from GoldAPI.io
- **Prediction Markets** — Bet on metal price movements  
- **XPC Token System** — Earn tokens for correct predictions
- **Algorand Integration** — On-chain comments, votes, and transactions (when contracts deployed)
- **Real World Assets** — Trade Meld Gold (MCAU/MSOS) via Tinyman DEX
- **Knowledge Hub** — Learn about precious metals and blockchain

## 🏗️ Architecture

```
Frontend (Next.js 14)
  ├─ TypeScript + Tailwind CSS
  ├─ Zustand for state management
  ├─ React Query for data fetching
  └─ Algorand SDK integration

APIs
  ├─ [/api/prices] → GoldAPI.io + CoinGecko
  ├─ [/api/markets] → Mock markets (PostgreSQL in production)
  └─ [/api/nfd] → NFD resolution (coming soon)

Smart Contracts (PyTeal)
  ├─ XPC ASA (Algorand Standard Asset)  
  ├─ Prediction Market Contract
  └─ Treasury / Fee Distribution
```

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