import { useState, useEffect } from 'react'
import Arena from './ArenaGame'
import LoginScreen from './LoginScreen'
import Leaderboard from './Leaderboard'
import { onAuthChange, logoutUser } from './firebase'

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

function App() {
  const [user, setUser] = useState(undefined)
  const [guest, setGuest] = useState(false)
  const [view, setView] = useState('game')

  useEffect(() => {
    return onAuthChange((u) => {
      setUser(u || null)
      if (u) setGuest(false)
    })
  }, [])

  if (user === undefined) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontFamily: FONT }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚔️</div>
          <div style={{ fontSize: 14, color: '#64748b' }}>Loading...</div>
        </div>
      </div>
    )
  }

  if (!user && !guest) {
    return <LoginScreen onGuest={() => setGuest(true)} />
  }

  if (guest && !user) {
    return (
      <div>
        <div style={{
          position: 'sticky', top: 0, zIndex: 999,
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 14px', fontFamily: FONT
        }}>
          <span style={{ color: '#64748b', fontSize: 12 }}>Playing as Guest (local save only)</span>
          <button
            onClick={() => setGuest(false)}
            style={{
              background: '#1e40af', color: '#fff', border: 'none',
              padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
        </div>
        <Arena />
      </div>
    )
  }

  return (
    <div>
      <div style={{
        position: 'sticky', top: 0, zIndex: 999,
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px', fontFamily: FONT
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setView('game')}
            style={{
              background: view === 'game' ? '#1e40af' : 'transparent',
              color: view === 'game' ? '#fff' : '#475569',
              border: '1px solid ' + (view === 'game' ? '#1e40af' : '#e5e7eb'),
              padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', letterSpacing: 0.5
            }}
          >
            ⚔️ Game
          </button>
          <button
            onClick={() => setView('leaderboard')}
            style={{
              background: view === 'leaderboard' ? '#1e40af' : 'transparent',
              color: view === 'leaderboard' ? '#fff' : '#475569',
              border: '1px solid ' + (view === 'leaderboard' ? '#1e40af' : '#e5e7eb'),
              padding: '6px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', letterSpacing: 0.5
            }}
          >
            🏆 Leaderboard
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#64748b', fontSize: 12 }}>{user.email}</span>
          <button
            onClick={() => logoutUser()}
            style={{
              background: 'transparent', color: '#dc2626', border: '1px solid #fecaca',
              padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {view === 'game' && <Arena userId={user.uid} />}
      {view === 'leaderboard' && <Leaderboard />}
    </div>
  )
}

export default App
