import { useState } from 'react'
import { registerUser, loginUser } from './firebase'

const FONT = "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export default function LoginScreen({ onGuest }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        await registerUser(email, password)
      } else {
        await loginUser(email, password)
      }
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use' ? 'Email already registered'
        : err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' ? 'Invalid email or password'
        : err.code === 'auth/user-not-found' ? 'No account with this email'
        : err.code === 'auth/weak-password' ? 'Password must be at least 6 characters'
        : err.code === 'auth/invalid-email' ? 'Invalid email address'
        : err.message || 'Something went wrong'
      setError(msg)
    }
    setLoading(false)
  }

  const W = {
    minHeight: 'calc(100dvh / var(--z, 1))',
    background: 'radial-gradient(120% 70% at 50% 0%, #fff3c4 0%, #fff8e7 55%, #fdf0d0 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: FONT, color: '#1c1917', padding: 20
  }

  const inputStyle = {
    width: '100%', padding: '13px 14px', borderRadius: 12,
    border: '1px solid rgba(63,42,29,0.14)', background: '#fffdf7', color: '#1c1917',
    fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: FONT, fontWeight: 700
  }

  return (
    <div style={W}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <img src="/icon-192.png" alt="" width="84" height="84" style={{ borderRadius: 24, marginBottom: 12, boxShadow: '0 2px 0 rgba(63,42,29,0.25), 0 10px 26px rgba(146,64,14,0.28)' }} />
          <div style={{ fontFamily: "'Fredoka', 'Nunito', sans-serif", fontSize: 14, fontWeight: 600, letterSpacing: 4, color: '#b45309' }}>THE GRAND</div>
          <div style={{ fontFamily: "'Fredoka', 'Nunito', sans-serif", fontSize: 32, fontWeight: 700, color: '#1c1917', lineHeight: 1.05 }}>Granny Rooster Joust</div>
          <div style={{ fontSize: 13.5, color: '#57534e', marginTop: 6, fontWeight: 700 }}>Sign in to save your granny's career in the cloud</div>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid rgba(63,42,29,0.07)',
          boxShadow: '0 1px 2px rgba(63,42,29,0.07), 0 10px 26px rgba(63,42,29,0.10)',
          borderRadius: 20, padding: 22
        }}>
          <div style={{ display: 'flex', marginBottom: 18, borderRadius: 14, padding: 4, background: '#f6eedb', gap: 4 }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer', borderRadius: 10,
                  background: mode === m ? '#ffffff' : 'transparent',
                  boxShadow: mode === m ? '0 1px 2px rgba(63,42,29,0.12), 0 3px 8px rgba(63,42,29,0.08)' : 'none',
                  color: mode === m ? '#1c1917' : '#78716c',
                  fontFamily: "'Fredoka', 'Nunito', sans-serif", fontSize: 15, fontWeight: 600
                }}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12.5, color: '#57534e', fontWeight: 800, marginBottom: 5, display: 'block' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle} placeholder="granny@joust.com" required />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12.5, color: '#57534e', fontWeight: 800, marginBottom: 5, display: 'block' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                style={inputStyle} placeholder="Min 6 characters" required minLength={6} />
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', marginBottom: 14, color: '#dc2626', fontSize: 12 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '15px 0', borderRadius: 14, border: 'none',
                background: loading ? '#e7e5e4' : 'linear-gradient(180deg,#ffd75e 0%,#f5a311 100%)', color: loading ? '#78716c' : '#3f2a1d',
                boxShadow: loading ? 'none' : '0 2px 0 #c97a06, 0 8px 18px rgba(245,158,11,0.32)',
                fontFamily: "'Fredoka', 'Nunito', sans-serif", fontSize: 18, fontWeight: 600, cursor: loading ? 'default' : 'pointer', letterSpacing: 0.3
              }}
            >
              {loading ? '...' : mode === 'login' ? '🐓 Saddle up' : '🐓 Join the joust'}
            </button>
          </form>
        </div>

        <button onClick={onGuest}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 14, border: '1px solid rgba(63,42,29,0.12)',
            background: 'rgba(255,255,255,0.7)', color: '#57534e',
            fontFamily: FONT, fontSize: 14, fontWeight: 800, cursor: 'pointer',
            marginTop: 12
          }}
        >
          Play as Guest (local save only)
        </button>
      </div>
    </div>
  )
}
