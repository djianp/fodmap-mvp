import { useEffect, useMemo, useState } from 'react'
import { BlobLogo, Chip, Markdown } from '../components/ui.jsx'
import { GoogleMap } from '../components/google-map.jsx'
import { useRestos } from '../lib/user-data.js'
import { useSettings } from '../lib/user-settings.js'
import { placeUrlFor } from '../lib/google-maps.js'
import { AddRestoForm, EditRestoForm, MealForm } from './resto-forms.jsx'

const PROTEIN_EMOJIS = {
  poulet: '🍗',
  saumon: '🐟', 'saumon cuit': '🐟', 'saumon fume': '🐟',
  truite: '🐟', bar: '🐟', cabillaud: '🐟', dorade: '🐟', thon: '🐟',
  lieu: '🐟', merlu: '🐟', sole: '🐟', maquereau: '🐟', sardine: '🐟', sardines: '🐟',
  poke: '🍣', sushi: '🍣', sashimi: '🍣',
  crevette: '🍤', crevettes: '🍤', gambas: '🍤', langoustine: '🍤', homard: '🦞',
  oeuf: '🥚', oeufs: '🥚',
  boeuf: '🥩', agneau: '🥩', veau: '🥩', steak: '🥩',
  porc: '🥓', jambon: '🥓', bacon: '🥓', lard: '🥓',
  canard: '🦆',
  lapin: '🐰',
  tofu: '🧆', seitan: '🧆', tempeh: '🧆',
  lentilles: '🌱', 'pois chiches': '🌱', haricots: '🌱',
}

function emojiForProteine(p) {
  const n = (p || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').trim()
  if (PROTEIN_EMOJIS[n]) return PROTEIN_EMOJIS[n]
  if (/saumon|truite|cabillaud|dorade|\bbar\b|thon|sole|merlu|lieu|poisson|maquereau|sardine/.test(n)) return '🐟'
  if (/poulet|volaille|chicken/.test(n)) return '🍗'
  if (/canard|duck/.test(n)) return '🦆'
  if (/oeuf|egg/.test(n)) return '🥚'
  if (/boeuf|beef|agneau|veau|viande|steak/.test(n)) return '🥩'
  if (/porc|jambon|bacon|lard/.test(n)) return '🥓'
  if (/crevett|gambas|langoust/.test(n)) return '🍤'
  if (/sushi|maki|sashimi|poke/.test(n)) return '🍣'
  if (/tofu|seitan|tempeh|legumineuse|lentill|pois|haricot|fève/.test(n)) return '🧆'
  return '🍽️'
}

function Stars({ value, size = 11 }) {
  const stars = []
  for (let i = 0; i < 5; i++) {
    const fill = Math.max(0, Math.min(1, value - i))
    stars.push(
      <span key={i} style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
        <span style={{ position: 'absolute', inset: 0, color: 'var(--bg-disabled)' }}>★</span>
        <span style={{ position: 'absolute', inset: 0, color: 'var(--accent-orange)', overflow: 'hidden', width: `${fill * 100}%` }}>★</span>
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
        border: '1.5px solid var(--ink)', background: 'var(--bg-card)',
        fontSize: 12, fontWeight: 500, color: 'var(--ink)',
        boxShadow: '0 2px 0 var(--ink)', cursor: 'pointer', fontFamily: 'inherit',
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-55%)',
        pointerEvents: 'none', fontSize: 10, color: 'var(--ink)' }}>▾</span>
    </div>
  )
}

function RestoCard({ r, location, onAddMeal, onEditMeal, onEditResto }) {
  const isDelivery = r.status === 'delivery'
  const walkMin = location === 'bureau' ? r.walk_min_bureau : r.walk_min_domicile
  const driveMin = location === 'bureau' ? r.drive_min_bureau : r.drive_min_domicile
  const travelMin = isDelivery ? driveMin : walkMin
  const mapsUrl = placeUrlFor(r.place_id, `${r.nom} ${r.adresse}`)
  const onTopClick = onEditResto ? () => onEditResto(r) : undefined
  return (
    <div style={{
      background: 'var(--bg-card)', border: '2px solid var(--ink)', borderRadius: 18,
      marginBottom: 14, boxShadow: '0 4px 0 var(--ink)', overflow: 'hidden',
    }}>
      <div
        onClick={onTopClick}
        role={onTopClick ? 'button' : undefined}
        tabIndex={onTopClick ? 0 : undefined}
        onKeyDown={onTopClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTopClick() } } : undefined}
        style={{
          padding: '14px 14px 12px',
          borderBottom: '1.5px dashed var(--border-soft)',
          cursor: onTopClick ? 'pointer' : 'default',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px', lineHeight: 1.2 }}>{r.nom}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{r.adresse}</div>
          </div>
          {r.rating != null && (
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', letterSpacing: '-0.2px' }}>{Number(r.rating).toFixed(1)}</div>
              <Stars value={Number(r.rating)} size={10} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{
            padding: '4px 9px', borderRadius: 999,
            background: 'var(--bg-soft)', border: '1.5px solid var(--ink)',
            fontSize: 10, fontWeight: 600, color: 'var(--text-on-comment)', whiteSpace: 'nowrap',
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            {isDelivery ? (
              <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
                <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z"/>
              </svg>
            )}
            {travelMin != null ? `${travelMin} min` : '—'}
          </a>
          {r.status === 'takeaway' && <span style={{ padding: '4px 9px', borderRadius: 999,
            background: 'var(--pill-green)', border: '1.5px solid var(--ink)',
            fontSize: 10, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
            À emporter
          </span>}
          {r.status === 'delivery' && <span style={{ padding: '4px 9px', borderRadius: 999,
            background: 'var(--pill-lavender)', border: '1.5px solid var(--ink)',
            fontSize: 10, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
            Livraison
          </span>}
          {r.status === 'totry' && <span style={{ padding: '4px 9px', borderRadius: 999,
            background: 'var(--pill-red)', border: '1.5px solid var(--ink)',
            fontSize: 10, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>
            À tester
          </span>}
          {r.phone && (
            <a href={`tel:${r.phone}`} onClick={e => e.stopPropagation()} style={{
              marginLeft: 'auto', padding: '6px 12px',
              background: 'var(--ink)', color: 'var(--paper)', textDecoration: 'none',
              borderRadius: 999, fontSize: 11, fontWeight: 600,
              border: '1.5px solid var(--ink)', display: 'inline-flex', alignItems: 'center', gap: 5,
              whiteSpace: 'nowrap',
            }}>
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              Appeler
            </a>
          )}
          {onAddMeal && (
            <button onClick={(e) => { e.stopPropagation(); onAddMeal(r) }} aria-label="Ajouter un plat" title="Ajouter un plat" style={{
              padding: 0, width: 28, height: 28,
              background: 'var(--bg-card)', color: 'var(--ink)',
              borderRadius: 999, fontSize: 16, fontWeight: 700, lineHeight: 1,
              border: '1.5px solid var(--ink)', boxShadow: '0 2px 0 var(--ink)',
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
                borderBottom: '1px dashed var(--border-divider)',
                cursor: clickable ? 'pointer' : 'default',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)', lineHeight: 1.3 }}>
                    {m.nom}
                  </div>
                  {m.rating != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <Stars value={Number(m.rating)} size={10} />
                      <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{Number(m.rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>
              </div>
              {m.comment && (
                <div style={{
                  marginTop: 8, padding: '8px 10px', background: 'var(--bg-comment)',
                  border: '1.5px solid var(--ink)', borderRadius: 10,
                  fontSize: 11, color: 'var(--text-on-comment)', lineHeight: 1.4,
                  display: 'flex', gap: 6, alignItems: 'flex-start',
                }}>
                  <span aria-hidden="true">💬</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Markdown>{m.comment}</Markdown>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {(!r.meals || r.meals.length === 0) && (
          <div style={{ padding: '10px 0', fontSize: 11, color: 'var(--text-hint)', fontStyle: 'italic' }}>
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
      position: 'relative', background: 'var(--bg-soft)',
      border: '2px solid var(--ink)', borderRadius: 18,
      height: 520, overflow: 'hidden', boxShadow: '0 4px 0 var(--ink)',
    }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <pattern id="grid" width="14" height="14" patternUnits="userSpaceOnUse">
            <path d="M 14 0 L 0 0 0 14" fill="none" stroke="var(--map-stroke)" strokeWidth="0.3"/>
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#grid)"/>
        <path d="M0,38 Q50,30 100,45" stroke="var(--map-stroke)" strokeWidth="1.4" fill="none"/>
        <path d="M30,0 Q35,50 45,100" stroke="var(--map-stroke)" strokeWidth="1.4" fill="none"/>
        <path d="M70,0 L75,100" stroke="var(--map-stroke)" strokeWidth="1.2" fill="none"/>
        <circle cx="50" cy="60" r="6" fill="var(--map-water)" opacity="0.4"/>
      </svg>
      <div style={{
        position: 'absolute', left: '50%', top: '58%', transform: 'translate(-50%, -50%)',
        width: 18, height: 18, borderRadius: 999, background: 'var(--accent-orange)',
        border: '2.5px solid var(--ink)', boxShadow: '0 0 0 6px rgba(230,127,82,0.25)',
      }} />
      <div style={{
        position: 'absolute', left: '50%', top: 'calc(58% + 14px)', transform: 'translateX(-50%)',
        fontSize: 10, fontWeight: 700, padding: '2px 8px', background: 'var(--ink)', color: 'var(--paper)',
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
            background: 'var(--bg-card)', border: '2px solid var(--ink)', borderRadius: 12,
            padding: '3px 7px', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap',
            boxShadow: '0 2px 0 var(--ink)', marginBottom: 2, color: 'var(--ink)',
          }}>{r.nom.length > 14 ? r.nom.slice(0, 13) + '…' : r.nom}</div>
          <div style={{
            width: 14, height: 14, borderRadius: '50% 50% 50% 0',
            background: r.status === 'totry' ? 'var(--pill-red)' : 'var(--pill-amber)',
            border: '2px solid var(--ink)',
            transform: 'rotate(-45deg)', boxShadow: '0 1.5px 0 var(--ink)',
          }} />
        </button>
      ))}
    </div>
  )
}

function RestoModal({ resto, location, onClose, onAddMeal, onEditMeal, onEditResto }) {
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
      background: 'var(--overlay)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '40px 14px 90px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 430, maxHeight: '100%', overflowY: 'auto',
        background: 'var(--paper)', borderRadius: 22, border: '2px solid var(--ink)',
        boxShadow: '0 8px 0 var(--ink)',
        position: 'relative',
        animation: 'slideUp 0.22s ease-out',
      }}>
        <button onClick={onClose} aria-label="Fermer" style={{
          position: 'absolute', top: 10, right: 10, zIndex: 2,
          width: 32, height: 32, borderRadius: 999, border: '2px solid var(--ink)',
          background: 'var(--bg-card)', boxShadow: '0 2px 0 var(--ink)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'inherit', fontSize: 16, lineHeight: 1, color: 'var(--ink)',
        }}>×</button>
        <div style={{ padding: 8 }}>
          <RestoCard r={resto} location={location} onAddMeal={onAddMeal} onEditMeal={onEditMeal} onEditResto={onEditResto} />
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  )
}

export function MVPRestosScreen() {
  const { restos, loading, error, proteines, refresh } = useRestos()
  const { recalcing } = useSettings()
  const [location, setLocation] = useState('bureau')
  const [status, setStatus] = useState('all')
  const [proteine, setProteine] = useState('Toutes')
  const [view, setView] = useState('map')
  const [selected, setSelected] = useState(null)
  const [showAddResto, setShowAddResto] = useState(false)
  const [editingResto, setEditingResto] = useState(null)
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
      if (r.status === 'delivery') {
        const d = location === 'bureau' ? r.drive_min_bureau : r.drive_min_domicile
        return d != null && d <= 30
      }
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

  const proteineOptions = useMemo(() => {
    let base = restos.slice()
    if (status !== 'all') base = base.filter(r => r.status === status)
    base = base.filter(r => {
      if (r.status === 'delivery') {
        const d = location === 'bureau' ? r.drive_min_bureau : r.drive_min_domicile
        return d != null && d <= 30
      }
      const w = location === 'bureau' ? r.walk_min_bureau : r.walk_min_domicile
      return w != null && w <= 30
    })
    if (q.trim()) {
      const norm = s => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
      const nq = norm(q.trim())
      base = base.filter(r => norm(r.nom).includes(nq))
    }
    const counts = {}
    base.forEach(r => {
      const seen = new Set()
      ;(r.meals || []).forEach(m => {
        if (m.proteine && !seen.has(m.proteine)) {
          seen.add(m.proteine)
          counts[m.proteine] = (counts[m.proteine] || 0) + 1
        }
      })
    })
    const out = [{ value: 'Toutes', label: `Toutes (${base.length})` }]
    const visible = proteines
      .filter(p => p !== 'Toutes' && (counts[p] > 0 || p === proteine))
      .sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }))
    visible.forEach(p => {
      out.push({ value: p, label: `${emojiForProteine(p)} ${p} (${counts[p] || 0})` })
    })
    return out
  }, [restos, proteines, status, location, q, proteine])

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
              background: searchOpen ? 'var(--ink)' : 'var(--bg-card)',
              color: searchOpen ? 'var(--paper)' : 'var(--ink)',
              border: '1.5px solid var(--ink)', boxShadow: '0 2px 0 var(--ink)',
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
            background: 'var(--bg-card)', border: '1.5px solid var(--ink)', borderRadius: 999,
            boxShadow: '0 2px 0 var(--ink)', padding: 3 }}>
            {[['list', 'Liste'], ['map', 'Carte']].map(([v, lbl]) =>
              <button key={v} onClick={() => setView(v)} style={{
                padding: '4px 12px', borderRadius: 999, border: 'none',
                background: view === v ? 'var(--ink)' : 'transparent',
                color: view === v ? 'var(--paper)' : 'var(--ink)',
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
            border: '1.5px solid var(--ink)', background: 'var(--bg-card)',
            fontSize: 14, color: 'var(--ink)', fontFamily: 'inherit',
            boxShadow: '0 2px 0 var(--ink)', outline: 'none', boxSizing: 'border-box',
            marginBottom: 10,
          }}
        />
      )}
      {recalcing && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--bg-banner)', border: '1.5px solid var(--ink)', borderRadius: 10,
          padding: '8px 12px', marginBottom: 12,
          fontSize: 11, fontWeight: 600, color: 'var(--ink)',
          boxShadow: '0 2px 0 var(--ink)',
        }}>
          <span style={{
            width: 12, height: 12, borderRadius: 999,
            border: '2px solid var(--ink)', borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite',
          }} />
          Recalcul des temps de trajet en cours…
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {loading ? 'Chargement…' : `${filtered.length} approuvés · triés par note`}
        </div>
        <button onClick={() => setShowAddResto(true)} disabled={loading} style={{
          padding: '6px 12px', borderRadius: 999,
          background: loading ? 'var(--bg-disabled)' : 'var(--ink)',
          color: loading ? 'var(--text-muted)' : 'var(--paper)',
          border: '2px solid var(--ink)', boxShadow: loading ? 'none' : '0 2px 0 var(--ink)',
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
      <div className="chips-scroll" style={{ marginBottom: 10 }}>
        <Chip label="Tous" on={status === 'all'} onClick={() => setStatus('all')} />
        <Chip label="À emporter" icon="🥡" on={status === 'takeaway'} onClick={() => setStatus('takeaway')} />
        <Chip label="Sur place" icon="🍽️" on={status === 'dinein'} onClick={() => setStatus('dinein')} />
        <Chip label="Livraison" icon="🚗" on={status === 'delivery'} onClick={() => setStatus('delivery')} />
        <Chip label="À tester" icon="🧪" on={status === 'totry'} onClick={() => setStatus('totry')} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
          fontWeight: 700, color: 'var(--text-muted)' }}>Protéine</span>
        <div style={{ flex: 1 }}>
          <Select value={proteine} options={proteineOptions} onChange={setProteine} />
        </div>
      </div>

      {error && (
        <div style={{ padding: 14, background: 'var(--pill-red)', border: '2px solid var(--ink)',
          borderRadius: 12, fontSize: 12, color: 'var(--ink)', marginBottom: 14 }}>
          Erreur de chargement : {error.message || String(error)}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
          Chargement des restos…
        </div>
      ) : view === 'map' ? (
        <GoogleMap restos={filtered} location={location} onPinClick={setSelected} fallback={MapView} />
      ) : (() => {
        const mainRestos = filtered.filter(r => r.status !== 'totry')
        const toTryRestos = filtered.filter(r => r.status === 'totry')
        const showHeader = mainRestos.length > 0 && toTryRestos.length > 0
        return (
          <>
            {mainRestos.map(r => <RestoCard key={r.id} r={r} location={location} onAddMeal={setAddMealFor} onEditMeal={setEditingMeal} onEditResto={setEditingResto} />)}
            {showHeader && (
              <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase',
                fontWeight: 700, color: 'var(--text-muted)', margin: '20px 0 10px' }}>
                À tester · {toTryRestos.length}
              </div>
            )}
            {toTryRestos.map(r => <RestoCard key={r.id} r={r} location={location} onAddMeal={setAddMealFor} onEditMeal={setEditingMeal} onEditResto={setEditingResto} />)}
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                Aucun resto trouvé avec ces filtres.
              </div>
            )}
          </>
        )
      })()}
      <RestoModal resto={selected ? filtered.find(r => r.id === selected.id) || selected : null}
        location={location} onClose={() => setSelected(null)}
        onAddMeal={(r) => { setSelected(null); setAddMealFor(r) }}
        onEditMeal={(m) => { setSelected(null); setEditingMeal(m) }}
        onEditResto={(r) => { setSelected(null); setEditingResto(r) }} />
      {showAddResto && (
        <AddRestoForm
          onClose={() => setShowAddResto(false)}
          onSaved={() => { setShowAddResto(false); refresh() }}
        />
      )}
      {editingResto && (
        <EditRestoForm
          resto={editingResto}
          onClose={() => setEditingResto(null)}
          onSaved={() => { setEditingResto(null); refresh() }}
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
