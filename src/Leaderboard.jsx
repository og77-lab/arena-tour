import { useState, useEffect } from 'react'
import { getLeaderboard } from './firebase'

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

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
  const [sortBy, setSortBy] = useState('bestRank')

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
    minHeight: 'calc(100vh - 48px)',
    background: '#f8fafc',
    fontFamily: FONT, color: '#0f172a', padding: '20px 12px'
  }

  const pillStyle = (active) => ({
    padding: '8px 16px', borderRadius: 20, border: '1px solid ' + (active ? '#1e40af' : '#e5e7eb'),
    background: active ? '#1e40af' : '#ffffff',
    color: active ? '#fff' : '#64748b',
    fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5
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
        <div style={{ color: '#dc2626', fontSize: 14 }}>{error}</div>
      </div>
    )
  }

  return (
    <div style={W}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 1, color: '#1e40af' }}>🏆 GLOBAL LEADERBOARD</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{data.length} warrior{data.length !== 1 ? 's' : ''} registered</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 18 }}>
          <button onClick={() => setSortBy('bestRank')} style={pillStyle(sortBy === 'bestRank')}>Best Rank</button>
          <button onClick={() => setSortBy('careerMoney')} style={pillStyle(sortBy === 'careerMoney')}>Career $</button>
          <button onClick={() => setSortBy('totalTitles')} style={pillStyle(sortBy === 'totalTitles')}>Titles</button>
        </div>

        {sorted.length === 0 && (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14, marginTop: 40 }}>
            No players have synced yet. Be the first!
          </div>
        )}

        {sorted.map((p, i) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#ffffff',
            border: '1px solid ' + (i === 0 ? '#f59e0b' : i === 1 ? '#cbd5e1' : i === 2 ? '#cd7f32' : '#e5e7eb'),
            borderLeft: '3px solid ' + (i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : '#e5e7eb'),
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            borderRadius: 10, padding: '12px 14px', marginBottom: 8
          }}>
            <div style={{ width: 28, textAlign: 'center', fontSize: 15, fontWeight: 900, color: i === 0 ? '#f59e0b' : i === 1 ? '#64748b' : i === 2 ? '#cd7f32' : '#94a3b8' }}>
              {i + 1}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>{p.avatar || '⚔️'}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.playerName}</span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                S{p.seasonsPlayed || 1} • Best Rank #{p.bestRank || '—'} • {fmt(p.careerMoney)}
              </div>
            </div>

            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1e40af' }}>
                {sortBy === 'bestRank' ? '#' + (p.bestRank || '—') : sortBy === 'careerMoney' ? fmt(p.careerMoney) : (p.totalTitles || 0) + ' 🏆'}
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                {p.totalTitles || 0} titles • {p.gsTitles || 0} GS
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
