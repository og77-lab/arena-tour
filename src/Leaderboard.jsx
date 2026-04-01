import { useState, useEffect } from 'react'
import { getLeaderboard } from './firebase'

function fmt(n) {
  if (n == null) return '$0'
  if (n >= 1000000) return '$' + (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'K'
  return '$' + n
}

export default function Leaderboard() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('bestRank') // bestRank, careerMoney, totalTitles

  useEffect(() => {
    getLeaderboard()
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError('Failed to load leaderboard'); setLoading(false); console.error(e) })
  }, [])

  const sorted = [...data].sort((a, b) => {
    if (sortBy === 'bestRank') return (a.bestRank || 9999) - (b.bestRank || 9999)
    if (sortBy === 'careerMoney') return (b.careerMoney || 0) - (a.careerMoney || 0)
    if (sortBy === 'totalTitles') return (b.totalTitles || 0) - (a.totalTitles || 0)
    return 0
  })

  const W = {
    minHeight: 'calc(100vh - 40px)',
    background: 'linear-gradient(180deg,#080810 0%,#0f172a 50%,#080810 100%)',
    fontFamily: "'Trebuchet MS',sans-serif", color: '#fff', padding: '16px 10px'
  }

  const pillStyle = (active) => ({
    padding: '6px 14px', borderRadius: 20, border: 'none',
    background: active ? '#1e40af' : 'rgba(255,255,255,0.05)',
    color: active ? '#fff' : '#64748b',
    fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5
  })

  if (loading) {
    return (
      <div style={{ ...W, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#64748b', fontSize: 14 }}>Loading leaderboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ ...W, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#ef4444', fontSize: 14 }}>{error}</div>
      </div>
    )
  }

  return (
    <div style={W}>
      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>🏆 GLOBAL LEADERBOARD</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{data.length} warrior{data.length !== 1 ? 's' : ''} registered</div>
        </div>

        {/* Sort pills */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setSortBy('bestRank')} style={pillStyle(sortBy === 'bestRank')}>Best Rank</button>
          <button onClick={() => setSortBy('careerMoney')} style={pillStyle(sortBy === 'careerMoney')}>Career $</button>
          <button onClick={() => setSortBy('totalTitles')} style={pillStyle(sortBy === 'totalTitles')}>Titles</button>
        </div>

        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', color: '#475569', fontSize: 13, marginTop: 40 }}>
            No players have synced yet. Be the first!
          </div>
        )}

        {sorted.map((p, i) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: i === 0 ? 'rgba(250,204,21,0.06)' : i === 1 ? 'rgba(192,192,192,0.04)' : i === 2 ? 'rgba(205,127,50,0.04)' : 'rgba(255,255,255,0.02)',
            border: '1px solid ' + (i === 0 ? 'rgba(250,204,21,0.15)' : i === 1 ? 'rgba(192,192,192,0.1)' : i === 2 ? 'rgba(205,127,50,0.1)' : 'rgba(255,255,255,0.04)'),
            borderRadius: 10, padding: '10px 12px', marginBottom: 6
          }}>
            {/* Rank */}
            <div style={{ width: 28, textAlign: 'center', fontSize: 14, fontWeight: 900, color: i === 0 ? '#facc15' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#475569' }}>
              {i + 1}
            </div>

            {/* Avatar + Name */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>{p.avatar || '⚔️'}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.playerName}</span>
              </div>
              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                S{p.seasonsPlayed || 1} • Best Rank #{p.bestRank || '—'} • {fmt(p.careerMoney)}
              </div>
            </div>

            {/* Stats */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#facc15' }}>
                {sortBy === 'bestRank' ? '#' + (p.bestRank || '—') : sortBy === 'careerMoney' ? fmt(p.careerMoney) : (p.totalTitles || 0) + ' 🏆'}
              </div>
              <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>
                {p.totalTitles || 0} titles • {p.gsTitles || 0} GS
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
