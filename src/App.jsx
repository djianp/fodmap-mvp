import { useEffect, useState } from 'react'
import { MVPAlimentsScreen } from './screens/aliments.jsx'
import { MVPRestosScreen } from './screens/restos.jsx'
import { Login } from './screens/login.jsx'
import { SettingsModal } from './screens/settings.jsx'
import { supabase } from './lib/supabase.js'
import { loadSettings } from './lib/user-settings.js'

function MVPTabBar({ current, onChange }) {
  const tabs = [
    { id: 'aliments', label: 'Aliments', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="22" height="22">
        <path d="M12 21c-4 0-8-3-8-8 0-2 1-3 2.5-3 1 0 1.5 1 3.5 1s2.5-1 3.5-1 2.5-1 4.5 1c1 1 2 2 2 4 0 5-4 6-8 6z"/>
        <path d="M12 8c0-2 1-4 3-5"/>
      </svg>
    )},
    { id: 'restos', label: 'Restos', icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="22" height="22">
        <path d="M4 3v7a3 3 0 0 0 3 3m-3-10v18m6-18v7a3 3 0 0 1-3 3M15 3c-1.5 0-3 2-3 6s1.5 4 3 4m0-10v18"/>
      </svg>
    )},
  ]
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430, height: 76,
      background: '#fff', borderTop: '2px solid #1f1a14',
      display: 'flex', padding: '10px 14px 18px', gap: 4, zIndex: 20,
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1, background: current === t.id ? '#f5e3b8' : 'transparent',
          border: 'none', color: current === t.id ? '#1f1a14' : '#7a6b55',
          fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          padding: '6px 0', borderRadius: 12, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  )
}

function FooterLinks({ onSettings }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      padding: '32px 0 8px',
    }}>
      <button onClick={onSettings} style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'transparent', border: 'none',
        color: '#7a6b55', fontSize: 13, fontWeight: 600,
        cursor: 'pointer', padding: '8px 12px',
        fontFamily: 'inherit',
      }}>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        Paramètres
      </button>
      <button
        onClick={() => supabase.auth.signOut()}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'transparent', border: 'none',
          color: '#7a6b55', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', padding: '8px 12px',
          fontFamily: 'inherit',
        }}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Se déconnecter
      </button>
    </div>
  )
}

function AppShell() {
  const initialTab = (() => {
    try { return localStorage.getItem('mvp_tab') || 'aliments' }
    catch { return 'aliments' }
  })()
  const [tab, setTab] = useState(initialTab)
  const [moment, setMoment] = useState('midi')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    try { localStorage.setItem('mvp_tab', tab) } catch {}
  }, [tab])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [tab])

  return (
    <div className="phone">
      <div className="scroll">
        {tab === 'aliments' && <MVPAlimentsScreen moment={moment} setMoment={setMoment} />}
        {tab === 'restos' && <MVPRestosScreen />}
        <FooterLinks onSettings={() => setShowSettings(true)} />
      </div>
      <MVPTabBar current={tab} onChange={setTab} />
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoadingSession(false)
      if (data.session) loadSettings()
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s) loadSettings()
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (loadingSession) {
    // Avoid flashing the login screen while we resolve the cached session
    return <div className="phone" />
  }

  if (!session) return <Login />
  return <AppShell />
}
