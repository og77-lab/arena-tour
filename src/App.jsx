import { useState, useEffect } from 'react'
import Arena from './ArenaGame'
import LoginScreen from './LoginScreen'
import { onAuthChange, logoutUser } from './firebase'
import Splash, { splashSeen } from './components/Splash'

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

function App() {
  const [user, setUser] = useState(undefined)
  const [guest, setGuest] = useState(false)
  const [splashDone, setSplashDone] = useState(splashSeen)

  useEffect(() => {
    return onAuthChange((u) => {
      setUser(u || null)
      if (u) setGuest(false)
    })
  }, [])

  /* Auth resolves underneath while the opening video plays */
  if (!splashDone) {
    return <Splash onDone={() => setSplashDone(true)} />
  }

  if (user === undefined) {
    return (
      <div style={{ minHeight: 'calc(100dvh / var(--z, 1))', background: '#fff8e7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1c1917', fontFamily: FONT }}>
        <div style={{ textAlign: 'center' }}>
          <img src="/icon-192.png" alt="" width="72" height="72" style={{ borderRadius: 16, marginBottom: 8 }} />
          <div style={{ fontSize: 14, color: '#57534e', fontWeight: 700 }}>Saddling the roosters…</div>
        </div>
      </div>
    )
  }

  if (!user && !guest) {
    return <LoginScreen onGuest={() => setGuest(true)} />
  }

  /* No top bar: sign-in, account and the global leaderboard live in the game's More tab, so the whole screen is the game */
  return (
    <Arena
      userId={user ? user.uid : undefined}
      account={user ? { email: user.email, onLogout: () => logoutUser() } : { guest: true, onSignIn: () => setGuest(false) }}
    />
  )
}

export default App
