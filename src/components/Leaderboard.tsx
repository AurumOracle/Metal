'use client'

const RANK_DATA = [
  { rank: 1, label: 'Oracle of the Vault', roman: 'I', minXP: 100000, color: '#FFD700' },
  { rank: 2, label: 'Grand Alchemist', roman: 'II', minXP: 50000, color: '#FFC107' },
  { rank: 3, label: 'Master Goldsmith', roman: 'III', minXP: 25000, color: '#FFB300' },
  { rank: 4, label: 'Mint Warden', roman: 'IV', minXP: 10000, color: '#FFA000' },
  { rank: 5, label: 'Silver Sentinel', roman: 'V', minXP: 5000, color: '#C0C0C0' },
  { rank: 6, label: 'Bullion Scout', roman: 'VI', minXP: 2000, color: '#B0BEC5' },
  { rank: 7, label: 'Ore Seeker', roman: 'VII', minXP: 500, color: '#90A4AE' },
  { rank: 8, label: 'Apprentice Assayer', roman: 'VIII', minXP: 0, color: '#78909C' },
]

interface LeaderEntry {
  rank: number
  name: string
  nfd?: string
  xp: number
  streak: number
  xpc: number
}

const MOCK_LEADERS: LeaderEntry[] = [
  { rank: 1, name: 'AAAA...Y5HVY', nfd: 'alice.xpc.algo', xp: 125000, streak: 42, xpc: 50000 },
  { rank: 2, name: 'BBBB...Y5HVY', nfd: 'bob.xpc.algo', xp: 89000, streak: 31, xpc: 35000 },
  { rank: 3, name: 'CCCC...Y5HVY', nfd: 'carol.xpc.algo', xp: 67000, streak: 27, xpc: 22000 },
  { rank: 4, name: 'DDDD...Y5HVY', nfd: 'dave.xpc.algo', xp: 45000, streak: 19, xpc: 15000 },
  { rank: 5, name: 'EEEE...Y5HVY', xp: 32000, streak: 15, xpc: 12000 },
  { rank: 6, name: 'FFFF...Y5HVY', nfd: 'frank.xpc.algo', xp: 18000, streak: 11, xpc: 8000 },
  { rank: 7, name: 'GGGG...Y5HVY', xp: 9000, streak: 7, xpc: 4500 },
  { rank: 8, name: 'HHHH...Y5HVY', nfd: 'helen.xpc.algo', xp: 3500, streak: 4, xpc: 2000 },
  { rank: 9, name: 'IIII...Y5HVY', xp: 1200, streak: 2, xpc: 800 },
  { rank: 10, name: 'JJJJ...Y5HVY', xp: 400, streak: 1, xpc: 200 },
]

function getRankInfo(xp: number) {
  return RANK_DATA.find((r) => xp >= r.minXP) || RANK_DATA[RANK_DATA.length - 1]
}

export function Leaderboard() {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gold-400">🏆 Leaderboard</h3>
        <span className="text-[10px] text-slate-500">Top Oracles</span>
      </div>

      <div className="space-y-1">
        {MOCK_LEADERS.map((entry) => {
          const rankInfo = getRankInfo(entry.xp)
          return (
            <div
              key={entry.rank}
              className={`flex items-center gap-2 rounded px-2 py-1.5 ${
                entry.rank <= 3 ? 'bg-slate-700/50' : ''
              }`}
            >
              {/* Rank number */}
              <span
                className="w-5 text-center text-xs font-bold"
                style={{ color: entry.rank <= 3 ? rankInfo.color : '#94a3b8' }}
              >
                {entry.rank}
              </span>

              {/* Avatar */}
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
                style={{ background: `hsl(${entry.name.charCodeAt(0) % 360}, 50%, 40%)` }}
              >
                {(entry.nfd || entry.name).slice(0, 2).toUpperCase()}
              </div>

              {/* Name + rank label */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="truncate text-xs text-slate-200">
                    {entry.nfd || entry.name}
                  </span>
                  {entry.streak >= 7 && (
                    <span className="text-[9px]" title={`${entry.streak} day streak`}>
                      🔥
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="text-[9px] font-medium"
                    style={{ color: rankInfo.color }}
                  >
                    {rankInfo.roman}
                  </span>
                  <span className="text-[9px] text-slate-500">{rankInfo.label}</span>
                </div>
              </div>

              {/* XPC balance */}
              <div className="text-right">
                <div className="text-[10px] font-medium text-gold-400">
                  {entry.xpc.toLocaleString()}
                </div>
                <div className="text-[9px] text-slate-500">XPC</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-3 border-t border-slate-700 pt-2 text-center">
        <p className="text-[10px] text-slate-500">
          Earn XP by voting, commenting &amp; staking.{' '}
          <span className="text-gold-400">Connect wallet to see your rank.</span>
        </p>
      </div>
    </div>
  )
}
