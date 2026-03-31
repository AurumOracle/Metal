# Aurum Oracle - Launch Checklist

## Prerequisites ✅

- Node.js 18+ 
- PostgreSQL 13+ (optional for full DB features)
- Algorand testnet native currency (get from dispenser)

## Quick Start (10 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Environment
```bash
cp .env.example .env.local
```

Then edit `.env.local` and fill in:
- `GOLDAPI_KEY` — Get free API key from https://www.goldapi.io/
- `NEXT_PUBLIC_ALGORAND_NETWORK=testnet`
- `NEXT_PUBLIC_ALGORAND_SERVER=https://testnet-api.algonode.cloud`
- `NEXT_PUBLIC_ALGORAND_INDEXER=https://testnet-idx.algonode.cloud`

### 3. Run Dev Server
```bash
npm run dev
```

Navigate to **http://localhost:3000** and you'll see the dashboard with live prices.

## Deployment Phases

### Phase 1: Frontend Running (Now ✅)
```bash
npm run dev
# Visit http://localhost:3000
```

### Phase 2: Smart Contracts (Optional for Testnet)
```bash
# You'll need AlgoKit and Python
python scripts/deploy.py --network testnet
# Then copy the App IDs to .env.local
```

### Phase 3: Database Setup (Optional)
```bash
# Create PostgreSQL database
createdb aurum_oracle

# Load schema
psql aurum_oracle -f scripts/schema.sql

WAIT_FOR_IT=1 npm run sync  # Start indexer sync
```

### Phase 4: Production
```bash
npm run build
npm run start
```

Deploy to Vercel:
```bash
vercel
```

## Project Structure

```
src/
├── app/                          # Next.js pages & API routes
│   ├── page.tsx                 # Homepage dashboard
│   ├── learn/page.tsx           # Knowledge hub
│   ├── token/page.tsx           # XPC tokenomics
│   ├── api/
│   │   ├── prices/route.ts      # Live price feed
│   │   └── markets/route.ts     # Market data
│   └── layout.tsx               # Root layout
├── components/                   # React components (mostly placeholder)
├── hooks/                       # Custom hooks (prices, markets, wallet)
├── lib/
│   ├── prices.ts               # GoldAPI.io integration
│   ├── algorand.ts             # Algorand SDK & NFD resolution
│   └── contracts/client.ts     # Contract building & state reading
├── types/index.ts              # Type definitions (Market, UserProfile, Vote, etc)
├── store/index.ts              # Zustand global state
└── styles/globals.css          # Tailwind CSS

```

## Key Features Roadmap

- [x] Live metal prices (GoldAPI.io)
- [x] Next.js 14 scaffold with TypeScript
- [x] Tailwind CSS styling
- [x] Mock markets API
- [x] Zustand state management
- [ ] Wallet connect (Pera/Defly) — requires @txnlab/use-wallet-react
- [ ] On-chain comments — requires Algorand smart contract
- [ ] XPC token trading — requires PyTeal contracts
- [ ] Premium subscription gate
- [ ] Admin dashboard for market resolution
- [ ] Real-time WebSocket price feeds

## Environment Variables

### Required for Basic Run
- `GOLDAPI_KEY` — Free tier at https://www.goldapi.io/

### For Smart Contracts
- `NEXT_PUBLIC_XPC_ASA_ID` 
- `NEXT_PUBLIC_MARKET_CONTRACT_ID`
- `NEXT_PUBLIC_TREASURY_CONTRACT_ID`
- `NEXT_PUBLIC_ORACLE_ADDRESS`

### For Database  
- `DATABASE_URL=postgresql://...`

### For Auth
- `SESSION_SECRET` — Random 32-byte hex (generate: `openssl rand -hex 16`)

## Common Issues

**Error: `GOLDAPI_KEY not set`**
→ Add your API key to `.env.local`

**Error: `Failed to fetch prices`**
→ Check your internet connection and GoldAPI.io quota

**Port 3000 already in use?**
```bash
npm run dev -- -p 3001
```

## Next Steps

1. Connect a wallet (once wallet components are built)
2. Deploy smart contracts to testnet with `deploy.py`
3. Seed XPC tokens and test trading flow
4. Set up PostgreSQL for persistent market state
5. Deploy frontend to Vercel for team access

## Support

- Algorand docs: https://developer.algorand.org
- Next.js docs: https://nextjs.org/docs
- Tailwind docs: https://tailwindcss.com/docs
