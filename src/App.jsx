import { useState, useEffect } from 'react'
import Arena from './ArenaGame'
import LoginScreen from './LoginScreen'
import Leaderboard from './Leaderboard'
import { onAuthChange, logoutUser } from './firebase'

function App() {
  const [user, setUser] = useState(undefined) // undefined = loading, null = not logged in
  const [guest, setGuest] = useState(false)
  const [view, setView] = useState('game') // 'game' or 'leaderboard'

  useEffect(() => {
    return onAuthChange((u) => {
      setUser(u || null)
      if (u) setGuest(false) // if they log in, exit guest mode
    })
  }, [])

  // Loading state
  if (user === undefined) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#080810 0%,#0f172a 50%,#080810 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: "'Trebuchet MS',sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚔️</div>
          <div style={{ fontSize: 14, color: '#94a3b8' }}>Loading...</div>
        </div>
      </div>
    )
  }

  // Not logged in and not guest — show login
  if (!user && !guest) {
    return <LoginScreen onGuest={() => setGuest(true)} />
  }

  // Guest mode — game only, with a small "Sign In" bar
  if (guest && !user) {
    return (
      <div>
        <div style={{
          position: 'sticky', top: 0, zIndex: 999,
          background: 'rgba(8,8,16,0.95)', borderBottom: '1px solid #1e293b',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 12px', fontFamily: "'Trebuchet MS',sans-serif"
        }}>
          <span style={{ color: '#475569', fontSize: 11 }}>Playing as Guest (local save only)</span>
          <button
            onClick={() => setGuest(false)}
            style={{
              background: '#1e40af', color: '#fff', border: 'none',
              padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700,
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

  // Logged in — show game or leaderboard
  return (
    <div>
      <div style={{
        position: 'sticky', top: 0, zIndex: 999,
        background: 'rgba(8,8,16,0.95)', borderBottom: '1px solid #1e293b',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 12px', fontFamily: "'Trebuchet MS',sans-serif"
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setView('game')}
            style={{
              background: view === 'game' ? '#1e40af' : 'transparent',
              color: view === 'game' ? '#fff' : '#94a3b8',
              border: '1px solid ' + (view === 'game' ? '#1e40af' : '#334155'),
              padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', letterSpacing: 0.5
            }}
          >
            ⚔️ Game
          </button>
          <button
            onClick={() => setView('leaderboard')}
            style={{
              background: view === 'leaderboard' ? '#1e40af' : 'transparent',
              color: view === 'leaderboard' ? '#fff' : '#94a3b8',
              border: '1px solid ' + (view === 'leaderboard' ? '#1e40af' : '#334155'),
              padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', letterSpacing: 0.5
            }}
          >
            🏆 Leaderboard
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#64748b', fontSize: 11 }}>{user.email}</span>
          <button
            onClick={() => logoutUser()}
            style={{
              background: 'transparent', color: '#ef4444', border: '1px solid #7f1d1d',
              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
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
