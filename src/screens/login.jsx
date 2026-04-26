import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { BlobLogo } from '../components/ui.jsx'

export function Login() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('sending')
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) {
      setError(error.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="phone">
      <div className="scroll" style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '72px 32px 100px', gap: 24,
      }}>
          <BlobLogo size={64} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 28, letterSpacing: '-0.8px', marginBottom: 6 }}>FODMAP MVP</div>
            <div style={{ fontSize: 14, color: '#7a6b55' }}>Aliments + restos approuvés</div>
          </div>

          {status === 'sent' ? (
            <div style={{
              background: '#fff', border: '2px solid #1f1a14', borderRadius: 16,
              padding: 20, textAlign: 'center', boxShadow: '0 4px 0 #1f1a14',
              maxWidth: 280,
            }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Check ton mail ✉️</div>
              <div style={{ fontSize: 13, color: '#7a6b55', lineHeight: 1.4 }}>
                Un lien de connexion a été envoyé à <strong>{email}</strong>. Clique dessus pour entrer.
              </div>
              <button onClick={() => { setStatus('idle'); setEmail('') }} style={{
                marginTop: 14, fontSize: 12, fontWeight: 600,
                background: 'none', border: 'none', color: '#e67f52',
                cursor: 'pointer', padding: 0, textDecoration: 'underline',
                fontFamily: 'inherit',
              }}>Utiliser une autre adresse</button>
            </div>
          ) : (
            <form onSubmit={submit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ton@email.fr"
                type="email"
                autoFocus
                required
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12,
                  border: '2px solid #1f1a14', background: '#fff',
                  fontSize: 15, color: '#1f1a14', fontFamily: 'inherit',
                  boxShadow: '0 3px 0 #1f1a14', outline: 'none', boxSizing: 'border-box',
                }}
              />
              <button type="submit" disabled={!email.trim() || status === 'sending'} style={{
                padding: '12px 18px', borderRadius: 999,
                border: '2px solid #1f1a14',
                background: !email.trim() || status === 'sending' ? '#d9c3a0' : '#1f1a14',
                color: !email.trim() || status === 'sending' ? '#7a6b55' : '#f5f0e6',
                fontSize: 14, fontWeight: 700, letterSpacing: 0.3,
                boxShadow: !email.trim() || status === 'sending' ? 'none' : '0 3px 0 #1f1a14',
                cursor: !email.trim() || status === 'sending' ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}>
                {status === 'sending' ? 'Envoi…' : 'Recevoir le lien magique'}
              </button>
              {status === 'error' && (
                <div style={{ fontSize: 12, color: '#c9543e', textAlign: 'center', marginTop: 4 }}>
                  {error}
                </div>
              )}
            </form>
          )}

          <div style={{ fontSize: 11, color: '#a39a8d', textAlign: 'center', lineHeight: 1.5, marginTop: 12 }}>
            Tu recevras un lien à usage unique.<br />Pas de mot de passe à retenir.
          </div>
      </div>
    </div>
  )
}
