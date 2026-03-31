-- PostgreSQL schema for Aurum Oracle

CREATE TABLE IF NOT EXISTS markets (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  category TEXT,
  closes_at BIGINT NOT NULL,
  resolved_at BIGINT,
  outcome TEXT,
  yes_pool NUMERIC,
  no_pool NUMERIC,
  status TEXT DEFAULT 'OPEN',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  market_id TEXT NOT NULL REFERENCES markets(id),
  user_address TEXT NOT NULL,
  vote TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  txn_id TEXT,
  timestamp BIGINT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  address TEXT PRIMARY KEY,
  nfd TEXT,
  xpc_balance NUMERIC DEFAULT 0,
  xp BIGINT DEFAULT 0,
  streak INT DEFAULT 0,
  rank TEXT DEFAULT 'Apprentice Assayer',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  market_id TEXT NOT NULL REFERENCES markets(id),
  author TEXT NOT NULL,
  vote TEXT,
  content TEXT,
  likes INT DEFAULT 0,
  txn_id TEXT,
  timestamp BIGINT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS xpc_transactions (
  id TEXT PRIMARY KEY,
  user_address TEXT REFERENCES users(address),
  transaction_type TEXT,
  amount NUMERIC,
  txn_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Views for analytics
CREATE VIEW leaderboard AS
SELECT
  address,
  nfd,
  xpc_balance,
  xp,
  rank,
  streak,
  ROW_NUMBER() OVER (ORDER BY xp DESC) as position
FROM users
ORDER BY xp DESC;

CREATE VIEW market_stats AS
SELECT
  m.id,
  m.question,
  COUNT(DISTINCT v.user_address) as participants,
  SUM(CASE WHEN v.vote = 'YES' THEN v.amount ELSE 0 END) as yes_volume,
  SUM(CASE WHEN v.vote = 'NO' THEN v.amount ELSE 0 END) as no_volume,
  COUNT(DISTINCT c.author) as commenters
FROM markets m
LEFT JOIN votes v ON m.id = v.market_id
LEFT JOIN comments c ON m.id = c.market_id
GROUP BY m.id, m.question;

-- Sample data
INSERT INTO markets (id, question, category, closes_at, yes_pool, no_pool, status)
VALUES
  ('1', 'Will gold close above $3,150 on Friday?', 'spot', EXTRACT(EPOCH FROM NOW()) + 604800, 15000, 12000, 'OPEN'),
  ('2', 'Will silver outperform gold this week?', 'ratio', EXTRACT(EPOCH FROM NOW()) + 604800, 8000, 10000, 'OPEN'),
  ('3', 'Will MCAU trade at a premium on Monday?', 'tokenized', EXTRACT(EPOCH FROM NOW()) + 259200, 5000, 6000, 'OPEN')
ON CONFLICT DO NOTHING;

INSERT INTO users (address, nfd, xpc_balance, xp, rank)
VALUES
  ('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HVY', 'alice.xpc.algo', 5000, 2500, 'Assayer'),
  ('BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBY5HVY', 'bob.xpc.algo', 3000, 1500, 'Junior Assayer')
ON CONFLICT DO NOTHING;
