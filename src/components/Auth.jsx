import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('login') // login | forgot | reset

  useEffect(() => {
    if (window.location.hash.includes('type=recovery')) {
      setMode('reset')
    }
  }, [])

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('מייל או סיסמה שגויים')
    setLoading(false)
  }

  async function handleForgot(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) setError('שליחת המייל נכשלה, נסה שוב')
    else setMessage('נשלח מייל עם קישור לקביעת סיסמה חדשה')
    setLoading(false)
  }

  async function handleReset(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setError('עדכון הסיסמה נכשל, נסה לבקש קישור חדש')
    else {
      window.location.hash = ''
      setMode('login')
      setMessage('הסיסמה עודכנה, אפשר להתחבר')
    }
    setLoading(false)
  }

  if (mode === 'reset') {
    return (
      <div className="auth-screen">
        <h1>🛒 רשימת קניות</h1>
        <div className="auth-card">
          {error && <div className="auth-error">{error}</div>}
          <form onSubmit={handleReset}>
            <input
              type="password"
              placeholder="סיסמה חדשה"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
            <button className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'שומר...' : 'שמירת סיסמה חדשה'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (mode === 'forgot') {
    return (
      <div className="auth-screen">
        <h1>🛒 רשימת קניות</h1>
        <div className="auth-card">
          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-message">{message}</div>}
          <form onSubmit={handleForgot}>
            <input
              type="email"
              placeholder="אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'שולח...' : 'שליחת קישור לאיפוס סיסמה'}
            </button>
          </form>
          <button className="auth-link" onClick={() => { setMode('login'); setError(''); setMessage('') }}>
            חזרה להתחברות
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-screen">
      <h1>🛒 רשימת קניות</h1>
      <div className="auth-card">
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="auth-message">{message}</div>}
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="אימייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'מתחבר...' : 'התחברות'}
          </button>
        </form>
        <button className="auth-link" onClick={() => { setMode('forgot'); setError(''); setMessage('') }}>
          שכחת סיסמה?
        </button>
      </div>
    </div>
  )
}
