import { useEffect, useRef, useState } from 'react'
import { StatusBar } from './components/ui.jsx'
import { MVPAlimentsScreen } from './screens/aliments.jsx'
import { MVPRestosScreen } from './screens/restos.jsx'

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
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 76,
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

export default function App() {
  const initialTab = (() => {
    try { return localStorage.getItem('mvp_tab') || 'aliments' }
    catch { return 'aliments' }
  })()
  const [tab, setTab] = useState(initialTab)
  const [moment, setMoment] = useState('midi')
  const scrollRef = useRef(null)

  useEffect(() => {
    try { localStorage.setItem('mvp_tab', tab) } catch {}
  }, [tab])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [tab])

  return (
    <div className="wrap">
      <div className="phone">
        <div className="notch" />
        <StatusBar />
        <div ref={scrollRef} className="scroll">
          {tab === 'aliments' && <MVPAlimentsScreen moment={moment} setMoment={setMoment} />}
          {tab === 'restos' && <MVPRestosScreen />}
        </div>
        <MVPTabBar current={tab} onChange={setTab} />
      </div>
      <div className="caption">MVP · 2 features · Aliments + Restos</div>
    </div>
  )
}
