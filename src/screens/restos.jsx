import { useEffect, useMemo, useState } from 'react'
import { BlobLogo, Chip } from '../components/ui.jsx'
import { GoogleMap } from '../components/google-map.jsx'
import { useRestos } from '../lib/user-data.js'
import { placeUrlFor } from '../lib/google-maps.js'
import { AddRestoForm, MealForm } from './resto-forms.jsx'

function Stars({ value, size = 11 }) {
  const stars = []
  for (let i = 0; i < 5; i++) {
    const fill = Math.max(0, Math.min(1, value - i))
    stars.push(
      <span key={i} style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
        <span style={{ position: 'absolute', inset: 0, color: '#d9c3a0' }}>★</span>
        <span style={{ position: 'absolute', inset: 0, color: '#e67f52', overflow: 'hidden', width: `${fill * 100}%` }}>★</span>
      </span>
    )
  }
  return <span style={{ display: 'inline-flex', gap: 1, fontSize: size, lineHeight: 1 }}>{stars}</span>
}

function Select({ value, options, onChange }) {
  return (
    <div style={{ position: 'relative', display: 'block' }}>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
        width: '100%',
        padding: '8px 32px 8px 14px', borderRadius: 999,
        border: '1.5px solid #1f1a14', background: '#fff',
        fontSize: 12, fontWeight: 500, color: '#1f1a14',
        boxShadow: '0 2px 0 #1f1a14', cursor: 'pointer', fontFamily: 'inherit',
      }}>
        {options.map(o => <option key={o} value={o}>{o === 'Toutes' ? 'Toutes les protéines' : o}</option>)}
      </select>
      <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-55%)',
        pointerEvents: 'none', fontSize: 10, color: '#1f1a14' }}>▾</span>
    </div>
  )
}

function RestoCard({ r, location, onAddMeal, onEditMeal }) {
  const walkMin = location === 'bureau' ? r.walk_min_bureau : r.walk_min_domicile
  const mapsUrl = placeUrlFor(r.place_id, `${r.nom} ${r.adresse}`)
  return (
    <div style={{
      background: '#fff', border: '2px solid #1f1a14', borderRadius: 18,
      marginBottom: 14, boxShadow: '0 4px 0 #1f1a14', overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 14px 12px', borderBottom: '1.5px dashed rgba(31,26,20,0.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px', lineHeight: 1.2 }}>{r.nom}</div>
            <div style={{ fontSize: 11, color: '#7a6b55', marginTop: 3 }}>{r.adresse}</div>
          </div>
          {r.rating != null && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1f1a14', letterSpacing: '-0.2px' }}>{Number(r.rating).toFixed(1)}</div>
              <Stars value={Number(r.rating)} size={10} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" style={{
            padding: '4px 9px', borderRadius: 999,
            background: '#e9d7b6', border: '1.5px solid #1f1a14',
            fontSize: 10, fontWeight: 600, color: '#2d1e0f', whiteSpace: 'nowrap',
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
              <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z"/>
            </svg>
            {walkMin != null ? `${walkMin} min` : '—'}
          </a>
          {r.status === 'takeaway' && <span style={{ padding: '4px 9px', borderRadius: 999,
            background: '#b8d398', border: '1.5px solid #1f1a14',
            fontSize: 10, fontWeight: 600, color: '#1f1a14', whiteSpace: 'nowrap' }}>
            À emporter
          </span>}
          {r.status === 'totry' && <span style={{ padding: '4px 9px', borderRadius: 999,
            background: '#f0a390', border: '1.5px solid #1f1a14',
            fontSize: 10, fontWeight: 600, color: '#1f1a14', whiteSpace: 'nowrap' }}>
            À tester
          </span>}
          {r.phone && (
            <a href={`tel:${r.phone}`} style={{
              marginLeft: 'auto', padding: '6px 12px',
              background: '#1f1a14', color: '#f5f0e6', textDecoration: 'none',
              borderRadius: 999, fontSize: 11, fontWeight: 600,
              border: '1.5px solid #1f1a14', display: 'inline-flex', alignItems: 'center', gap: 5,
              whiteSpace: 'nowrap',
            }}>
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Appeler
            </a>
          )}
          {onAddMeal && (
            <button onClick={() => onAddMeal(r)} aria-label="Ajouter un plat" title="Ajouter un plat" style={{
              padding: 0, width: 28, height: 28,
              background: '#fff', color: '#1f1a14',
              borderRadius: 999, fontSize: 16, fontWeight: 700, lineHeight: 1,
              border: '1.5px solid #1f1a14', boxShadow: '0 2px 0 #1f1a14',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              marginLeft: r.phone ? 0 : 'auto',
            }}>+</button>
          )}
        </div>
      </div>

      <div style={{ padding: '10px 14px 14px' }}>
        {(r.meals || []).map((m) => {
          const clickable = !!(onEditMeal && m.id)
          return (
            <div
              key={m.id || m.nom}
              onClick={clickable ? () => onEditMeal(m) : undefined}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEditMeal(m) } } : undefined}
              style={{
                padding: '10px 0',
                borderBottom: '1px dashed rgba(31,26,20,0.12)',
                cursor: clickable ? 'pointer' : 'default',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1f1a14', lineHeight: 1.3 }}>
                    {m.nom}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <Stars value={Number(m.rating)} size={10} />
                    <span style={{ fontSize: 10, color: '#7a6b55', fontWeight: 600 }}>{Number(m.rating).toFixed(1)}</span>
                  </div>
                </div>
              </div>
              {m.comment && (
                <div style={{
                  marginTop: 8, padding: '8px 10px', background: '#f5e3b8',
                  border: '1.5px solid #1f1a14', borderRadius: 10,
                  fontSize: 11, color: '#2d1e0f', lineHeight: 1.4, fontStyle: 'italic',
                }}>💬 {m.comment}</div>
              )}
            </div>
          )
        })}
        {(!r.meals || r.meals.length === 0) && (
          <div style={{ padding: '10px 0', fontSize: 11, color: '#a39a8d', fontStyle: 'italic' }}>
            Aucun plat noté pour ce resto.
          </div>
        )}
      </div>
    </div>
  )
}

function MapView({ restos, location, onPinClick }) {
  const positioned = restos.map((r, i) => {
    const seedChar = (r.id || r.nom || 'x').charCodeAt(1) || 17
    const hash = seedChar * 17
    const x = 15 + ((hash * 3.1) % 70)
    const y = 12 + ((hash * 1.7 + i * 11) % 76)
    return { ...r, x, y }
  })
  return (
    <div style={{
      position: 'relative', background: '#e9d7b6',
      border: '2px solid #1f1a14', borderRadius: 18,
      height: 520, overflow: 'hidden', boxShadow: '0 4px 0 #1f1a14',
    }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <pattern id="grid" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M 14 0 L 0 0 0 14" fill="none" stroke="#c4a878" strokeWidth="0.3"/>
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)"/>
        <path d="M0,38 Q50,30 100,45" stroke="#c4a878" strokeWidth="1.4" fill="none"/>
        <path d="M30,0 Q35,50 45,100" stroke="#c4a878" strokeWidth="1.4" fill="none"/>
        <path d="M70,0 L75,100" stroke="#c4a878" strokeWidth="1.2" fill="none"/>
        <circle cx="50" cy="60" r="6" fill="#a8b4c4" opacity="0.4"/>
      </svg>
      <div style={{
        position: 'absolute', left: '50%', top: '58%', transform: 'translate(-50%, -50%)',
        width: 18, height: 18, borderRadius: 999, background: '#e67f52',
        border: '2.5px solid #1f1a14', boxShadow: '0 0 0 6px rgba(230,127,82,0.25)',
      }} />
      <div style={{
        position: 'absolute', left: '50%', top: 'calc(58% + 14px)', transform: 'translateX(-50%)',
        fontSize: 10, fontWeight: 700, padding: '2px 8px', background: '#1f1a14', color: '#f5f0e6',
        borderRadius: 999, letterSpacing: 0.5,
      }}>{location === 'bureau' ? 'Bureau' : 'Domicile'}</div>

      {positioned.map(r => (
        <button key={r.id} onClick={() => onPinClick && onPinClick(r)} style={{
          position: 'absolute', left: `${r.x}%`, top: `${r.y}%`,
          transform: 'translate(-50%, -100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <div style={{
            background: '#fff', border: '2px solid #1f1a14', borderRadius: 12,
            padding: '3px 7px', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap',
            boxShadow: '0 2px 0 #1f1a14', marginBottom: 2, color: '#1f1a14',
          }}>{r.nom.length > 14 ? r.nom.slice(0, 13) + '…' : r.nom}</div>
          <div style={{
            width: 14, height: 14, borderRadius: '50% 50% 50% 0',
            background: '#f5c887', border: '2px solid #1f1a14',
            transform: 'rotate(-45deg)', boxShadow: '0 1.5px 0 #1f1a14',
          }} />
        </button>
      ))}
    </div>
  )
}

function RestoModal({ resto, location, onClose, onAddMeal, onEditMeal }) {
  useEffect(() => {
    if (!resto) return
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose, resto])
  if (!resto) return null
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 30,
      background: 'rgba(31,26,20,0.55)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '40px 14px 90px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 430, maxHeight: '100%', overflowY: 'auto',
        background: '#f5f0e6', borderRadius: 22, border: '2px solid #1f1a14',
        boxShadow: '0 8px 0 #1f1a14',
        position: 'relative',
        animation: 'slideUp 0.22s ease-out',
      }}>
        <button onClick={onClose} aria-label="Fermer" style={{
          position: 'absolute', top: 10, right: 10, zIndex: 2,
          width: 32, height: 32, borderRadius: 999, border: '2px solid #1f1a14',
          background: '#fff', boxShadow: '0 2px 0 #1f1a14', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'inherit', fontSize: 16, lineHeight: 1, color: '#1f1a14',
        }}>×</button>
        <div style={{ padding: 8 }}>
          <RestoCard r={resto} location={location} onAddMeal={onAddMeal} onEditMeal={onEditMeal} />
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  )
}

export function MVPRestosScreen() {
  const { restos, loading, error, proteines, refresh } = useRestos()
  const [location, setLocation] = useState('bureau')
  const [status, setStatus] = useState('all')
  const [proteine, setProteine] = useState('Toutes')
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [showAddResto, setShowAddResto] = useState(false)
  const [addMealFor, setAddMealFor] = useState(null)
  const [editingMeal, setEditingMeal] = useState(null)
  const [q, setQ] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const filtered = useMemo(() => {
    let list = restos.slice()
    if (status !== 'all') list = list.filter(r => r.status === status)
    if (proteine !== 'Toutes') {
      list = list
        .map(r => ({ ...r, meals: (r.meals || []).filter(m => m.proteine === proteine) }))
        .filter(r => r.meals.length > 0)
    }
    list = list.filter(r => {
      const w = location === 'bureau' ? r.walk_min_bureau : r.walk_min_domicile
      return w != null && w <= 30
    })
    if (q.trim()) {
      const norm = s => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
      const nq = norm(q.trim())
      list = list.filter(r => norm(r.nom).includes(nq))
    }
    list.sort((a, b) => {
      const ra = a.rating == null ? -1 : Number(a.rating)
      const rb = b.rating == null ? -1 : Number(b.rating)
      if (rb !== ra) return rb - ra
      return a.nom.localeCompare(b.nom, 'fr')
    })
    return list
  }, [status, proteine, location, q, restos])

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <BlobLogo size={30} />
        <div style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.6px' }}>Restos</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <button
            onClick={() => {
              const next = !searchOpen
              setSearchOpen(next)
              if (!next) setQ('')
            }}
            aria-label="Rechercher"
            title="Rechercher un resto"
            style={{
              width: 32, height: 32, borderRadius: 999,
              background: searchOpen ? '#1f1a14' : '#fff',
              color: searchOpen ? '#f5f0e6' : '#1f1a14',
              border: '1.5px solid #1f1a14', boxShadow: '0 2px 0 #1f1a14',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0, fontFamily: 'inherit',
            }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
          </button>
          <div style={{ display: 'flex', gap: 4,
            background: '#fff', border: '1.5px solid #1f1a14', borderRadius: 999,
            boxShadow: '0 2px 0 #1f1a14', padding: 3 }}>
            {[['list', 'Liste'], ['map', 'Carte']].map(([v, lbl]) =>
              <button key={v} onClick={() => setView(v)} style={{
                padding: '4px 12px', borderRadius: 999, border: 'none',
                background: view === v ? '#1f1a14' : 'transparent',
                color: view === v ? '#f5f0e6' : '#1f1a14',
                fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>{lbl}</button>
            )}
          </div>
        </div>
      </div>
      {searchOpen && (
        <input
          autoFocus
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Rechercher un resto…"
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 10,
            border: '1.5px solid #1f1a14', background: '#fff',
            fontSize: 14, color: '#1f1a14', fontFamily: 'inherit',
            boxShadow: '0 2px 0 #1f1a14', outline: 'none', boxSizing: 'border-box',
            marginBottom: 10,
          }}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: '#7a6b55' }}>
          {loading ? 'Chargement…' : `${filtered.length} approuvés · triés par note`}
        </div>
        <button onClick={() => setShowAddResto(true)} disabled={loading} style={{
          padding: '6px 12px', borderRadius: 999,
          background: loading ? '#d9c3a0' : '#1f1a14',
          color: loading ? '#7a6b55' : '#f5f0e6',
          border: '2px solid #1f1a14', boxShadow: loading ? 'none' : '0 2px 0 #1f1a14',
          fontSize: 11, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          display: 'inline-flex', alignItems: 'center', gap: 4, letterSpacing: 0.3,
        }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Resto
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <Chip label="Bureau" icon="🏢" on={location === 'bureau'} onClick={() => setLocation('bureau')} />
        <Chip label="Domicile" icon="🏠" on={location === 'domicile'} onClick={() => setLocation('domicile')} />
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip label="Tous" on={status === 'all'} onClick={() => setStatus('all')} />
        <Chip label="À emporter" icon="🥡" on={status === 'takeaway'} onClick={() => setStatus('takeaway')} />
        <Chip label="Sur place" icon="🍽️" on={status === 'dinein'} onClick={() => setStatus('dinein')} />
        <Chip label="À tester" icon="🧪" on={status === 'totry'} onClick={() => setStatus('totry')} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
          fontWeight: 700, color: '#7a6b55' }}>Protéine</span>
        <div style={{ flex: 1 }}>
          <Select value={proteine} options={proteines} onChange={setProteine} />
        </div>
      </div>

      {error && (
        <div style={{ padding: 14, background: '#f0a390', border: '2px solid #1f1a14',
          borderRadius: 12, fontSize: 12, color: '#1f1a14', marginBottom: 14 }}>
          Erreur de chargement : {error.message || String(error)}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#7a6b55', fontSize: 13 }}>
          Chargement des restos…
        </div>
      ) : view === 'map' ? (
        <GoogleMap restos={filtered} location={location} onPinClick={setSelected} fallback={MapView} />
      ) : (
        <>
          {filtered.map(r => <RestoCard key={r.id} r={r} location={location} onAddMeal={setAddMealFor} onEditMeal={setEditingMeal} />)}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7a6b55' }}>
              Aucun resto trouvé avec ces filtres.
            </div>
          )}
        </>
      )}
      <RestoModal resto={selected ? filtered.find(r => r.id === selected.id) || selected : null}
        location={location} onClose={() => setSelected(null)}
        onAddMeal={(r) => { setSelected(null); setAddMealFor(r) }}
        onEditMeal={(m) => { setSelected(null); setEditingMeal(m) }} />
      {showAddResto && (
        <AddRestoForm
          onClose={() => setShowAddResto(false)}
          onSaved={() => { setShowAddResto(false); refresh() }}
        />
      )}
      {addMealFor && (
        <MealForm
          resto={addMealFor}
          proteines={proteines}
          onClose={() => setAddMealFor(null)}
          onSaved={() => { setAddMealFor(null); refresh() }}
        />
      )}
      {editingMeal && (
        <MealForm
          meal={editingMeal}
          proteines={proteines}
          onClose={() => setEditingMeal(null)}
          onSaved={() => { setEditingMeal(null); refresh() }}
        />
      )}
    </>
  )
}
