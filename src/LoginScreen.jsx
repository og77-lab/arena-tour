import { useState } from 'react'
import { registerUser, loginUser } from './firebase'

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

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
    minHeight: '100vh',
    background: '#f8fafc',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: FONT, color: '#0f172a', padding: 20
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 8,
    border: '1px solid #e5e7eb', background: '#ffffff', color: '#0f172a',
    fontSize: 14, outline: 'none', boxSizing: 'border-box'
  }

  return (
    <div style={W}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚔️</div>
          <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 2, color: '#1e40af' }}>ARENA TOUR</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Combat Tournament Career</div>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          borderRadius: 12, padding: 24
        }}>
          <div style={{ display: 'flex', marginBottom: 20, borderRadius: 8, overflow: 'hidden', border: '1px solid #e5e7eb' }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '10px 0', border: 'none', cursor: 'pointer',
                  background: mode === m ? '#1e40af' : 'transparent',
                  color: mode === m ? '#fff' : '#64748b',
                  fontSize: 13, fontWeight: 700, letterSpacing: 0.5,
                  textTransform: 'uppercase'
                }}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle} placeholder="warrior@arena.com" required />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>Password</label>
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
                width: '100%', padding: '14px 0', borderRadius: 8, border: 'none',
                background: loading ? '#e5e7eb' : '#1e40af', color: loading ? '#64748b' : '#ffffff',
                fontSize: 14, fontWeight: 900, cursor: loading ? 'default' : 'pointer',
                letterSpacing: 1, textTransform: 'uppercase'
              }}
            >
              {loading ? '...' : mode === 'login' ? '⚔️ Enter Arena' : '⚔️ Join Arena'}
            </button>
          </form>
        </div>

        <button onClick={onGuest}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 8, border: '1px solid #e5e7eb',
            background: '#ffffff', color: '#475569',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            marginTop: 12, letterSpacing: 0.5
          }}
        >
          Play as Guest (local save only)
        </button>
      </div>
    </div>
  )
}
