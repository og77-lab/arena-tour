import { useState } from 'react'
import { registerUser, loginUser } from './firebase'

export default function LoginScreen() {
  const [mode, setMode] = useState('login') // 'login' or 'register'
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
    background: 'linear-gradient(180deg,#080810 0%,#0f172a 50%,#080810 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Trebuchet MS',sans-serif", color: '#fff', padding: 20
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 8,
    border: '1px solid #334155', background: '#0f172a', color: '#fff',
    fontSize: 14, outline: 'none', boxSizing: 'border-box'
  }

  return (
    <div style={W}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚔️</div>
          <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 2 }}>ARENA TOUR</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Combat Tournament Career</div>
        </div>

        <div style={{
          background: 'rgba(15,23,42,0.8)', border: '1px solid #1e293b',
          borderRadius: 12, padding: 24
        }}>
          <div style={{ display: 'flex', marginBottom: 20, borderRadius: 8, overflow: 'hidden', border: '1px solid #334155' }}>
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
              <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                style={inputStyle} placeholder="warrior@arena.com" required />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                style={inputStyle} placeholder="Min 6 characters" required minLength={6} />
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #7f1d1d', borderRadius: 8, padding: '8px 12px', marginBottom: 14, color: '#ef4444', fontSize: 12 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 8, border: 'none',
                background: loading ? '#334155' : '#facc15', color: '#000',
                fontSize: 14, fontWeight: 900, cursor: loading ? 'default' : 'pointer',
                letterSpacing: 1, textTransform: 'uppercase'
              }}
            >
              {loading ? '...' : mode === 'login' ? '⚔️ Enter Arena' : '⚔️ Join Arena'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
