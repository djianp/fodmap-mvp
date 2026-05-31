import { useEffect, useMemo, useState } from 'react'
import { BlobLogo } from '../components/ui.jsx'
import { PHOTOS, tileFor, initialFor } from '../lib/foods-meta.js'
import { REINTRO_PROTOCOLS, COMFORT_LEVELS, TEST_DAYS } from '../data/reintro.js'
import { useReintroLogs, upsertReintroLog, deleteReintroLog } from '../lib/user-data.js'

const keyFor = (protocolId, day) => `${protocolId}|${day}`

// ──────────── Comfort face (custom SVG, not OS emoji) ────────────
// Severity reads as increasing darkness: green → amber → orange → red. A null level
// renders a dashed "ghost" placeholder, which native emoji can't do.
const FACE = {
  very_good:           { bg: 'var(--pill-green)',    mouth: 'M8 14.5 Q12 18 16 14.5' },
  slightly_bothered:   { bg: 'var(--pill-amber)',    mouth: 'M8.5 15 H15.5' },
  moderately_bothered: { bg: 'var(--accent-orange)', mouth: 'M8 16 Q12 13 16 16' },
  very_bothered:       { bg: 'var(--accent-error)',  mouth: 'M8 16.5 Q12 12 16 16.5' },
}

function ComfortFace({ level, size = 24 }) {
  if (!level || !FACE[level]) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="none" stroke="var(--border-soft)"
          strokeWidth="1.5" strokeDasharray="2 2.6" />
        <circle cx="8.7" cy="10.5" r="1" fill="var(--text-hint)" />
        <circle cx="15.3" cy="10.5" r="1" fill="var(--text-hint)" />
        <path d="M8.7 15 H15.3" fill="none" stroke="var(--text-hint)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    )
  }
  const f = FACE[level]
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill={f.bg} stroke="var(--ink)" strokeWidth="2" />
      <circle cx="8.7" cy="10.5" r="1.2" fill="var(--ink)" />
      <circle cx="15.3" cy="10.5" r="1.2" fill="var(--ink)" />
      <path d={f.mouth} fill="none" stroke="var(--ink)" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ──────────── Shared bits ────────────
function ProtocolImage({ protocol, size, radius }) {
  const url = PHOTOS[protocol.image]
  const base = {
    width: size, height: size, flexShrink: 0,
    borderRadius: radius, border: '2px solid var(--ink)',
    boxShadow: '0 3px 0 var(--ink)', overflow: 'hidden',
  }
  if (url) {
    return <div style={{ ...base, backgroundImage: `url("${url}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
  }
  return (
    <div style={{
      ...base, background: tileFor(protocol.image),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: Math.round(size * 0.4), color: 'var(--ink)',
    }}>{initialFor({ nom: protocol.foodName })}</div>
  )
}

function ProtocolMeta() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, color: 'var(--text-hint)' }}>
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="11" x2="12" y2="16" />
        <circle cx="12" cy="8" r="0.5" fill="currentColor" />
      </svg>
      <span style={{ fontSize: 11, fontWeight: 500 }}>Protocole en 5 jours</span>
    </div>
  )
}

// ──────────── List view ────────────
function ProtocolCard({ protocol, logsByKey, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer',
      background: 'var(--bg-card)', border: '2px solid var(--ink)', borderRadius: 18,
      padding: 12, marginBottom: 14, boxShadow: '0 4px 0 var(--ink)',
      display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit',
    }}>
      <ProtocolImage protocol={protocol} size={58} radius={14} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px', lineHeight: 1.2, color: 'var(--ink)' }}>{protocol.foodName}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>{protocol.fodmapFamily}</div>
        <ProtocolMeta />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        {TEST_DAYS.map(d => (
          <ComfortFace key={d} level={logsByKey[keyFor(protocol.id, d)]?.comfort_level} size={24} />
        ))}
      </div>
    </button>
  )
}

function ProtocolList({ logsByKey, onSelect }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <BlobLogo size={30} />
        <div style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.6px' }}>Mes tests</div>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>
        Aperçu de vos réintroductions en cours
      </div>
      {REINTRO_PROTOCOLS.map(p => (
        <ProtocolCard key={p.id} protocol={p} logsByKey={logsByKey} onClick={() => onSelect(p.id)} />
      ))}
    </>
  )
}

// ──────────── Detail view ────────────
function Stepper({ protocol, logsByKey, currentDay, selectedDay, onSelectDay }) {
  return (
    <div style={{ position: 'relative', marginBottom: 18 }}>
      <div style={{ position: 'absolute', top: 15, left: '10%', right: '10%', height: 2, background: 'var(--border-divider)' }} />
      <div style={{ display: 'flex' }}>
        {protocol.days.map(d => {
          const log = logsByKey[keyFor(protocol.id, d.day)]
          const isTest = d.type === 'test'
          const isSelected = d.day === selectedDay
          const done = isTest ? !!log?.comfort_level : d.day < currentDay
          const sub = isTest ? `Test ${d.doseGrams} g` : 'Récupération'

          let node
          if (isTest && log?.comfort_level) {
            node = <ComfortFace level={log.comfort_level} size={30} />
          } else if (!isTest && done) {
            node = (
              <div style={circleStyle('var(--pill-green)', 'var(--ink)')}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )
          } else {
            const active = isTest && (isSelected || d.day === currentDay)
            node = (
              <div style={circleStyle(active ? 'var(--bg-comment)' : 'var(--bg-card)', active ? 'var(--ink)' : 'var(--border-soft)')}>
                <span style={{ fontSize: 13, fontWeight: 700, color: active ? 'var(--ink)' : 'var(--text-muted)' }}>{d.day}</span>
              </div>
            )
          }

          const inner = (
            <>
              <div style={{
                width: 30, height: 30, margin: '0 auto',
                borderRadius: 999, position: 'relative',
                boxShadow: isSelected ? '0 0 0 4px var(--bg-comment)' : 'none',
              }}>{node}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink)', marginTop: 7 }}>Jour {d.day}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1, lineHeight: 1.2 }}>{sub}</div>
            </>
          )

          return (
            <div key={d.day} style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
              {isTest ? (
                <button onClick={() => onSelectDay(d.day)} style={{
                  display: 'block', width: '100%', background: 'none', border: 'none',
                  padding: 0, cursor: 'pointer', fontFamily: 'inherit',
                }}>{inner}</button>
              ) : (
                <div>{inner}</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function circleStyle(bg, border) {
  return {
    width: 30, height: 30, borderRadius: 999,
    background: bg, border: `2px solid ${border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
}

function RecipeSheet({ protocol, day, onClose }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  const dose = protocol.days.find(d => d.day === day)?.doseGrams
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 30, background: 'var(--overlay)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '40px 14px 90px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 430, maxHeight: '100%', overflowY: 'auto',
        background: 'var(--paper)', borderRadius: 22, border: '2px solid var(--ink)',
        boxShadow: '0 8px 0 var(--ink)', position: 'relative', animation: 'slideUp 0.22s ease-out',
      }}>
        <div style={{
          padding: '16px 18px 14px', borderBottom: '2px dashed var(--border-soft)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.4px' }}>Recette détaillée</div>
          <button onClick={onClose} aria-label="Fermer" style={{
            width: 32, height: 32, borderRadius: 999, border: '2px solid var(--ink)',
            background: 'var(--bg-card)', boxShadow: '0 2px 0 var(--ink)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'inherit', fontSize: 16, lineHeight: 1, color: 'var(--ink)',
          }}>×</button>
        </div>
        <div style={{ padding: '16px 18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{protocol.foodName}</span>
            {dose != null && (
              <span style={{
                padding: '4px 10px', borderRadius: 999, background: 'var(--bg-comment)',
                border: '1.5px solid var(--ink)', fontSize: 11, fontWeight: 700,
                color: 'var(--text-on-comment)', whiteSpace: 'nowrap',
              }}>Dose cible : {dose} g</span>
            )}
          </div>
          <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {protocol.recipe.map(step => (
              <li key={step.order} style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.4 }}>{step.text}</li>
            ))}
          </ol>
          {protocol.recipeTip && (
            <div style={{
              marginTop: 16, padding: '10px 12px', background: 'var(--bg-comment)',
              border: '1.5px solid var(--ink)', borderRadius: 10,
              fontSize: 12, color: 'var(--text-on-comment)', lineHeight: 1.4,
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <span aria-hidden="true">💡</span>
              <div style={{ flex: 1 }}>{protocol.recipeTip}</div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  )
}

// Remounted (via key={selectedDay}) when the focused day changes, so the draft
// re-initializes from `initial` without a setState-in-effect. Saves on blur.
function NoteEditor({ initial, onSave }) {
  const [draft, setDraft] = useState(initial)
  return (
    <textarea
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => onSave(draft)}
      placeholder="Décrivez vos symptômes, leur intensité et leur durée…"
      rows={3}
      style={{
        width: '100%', padding: '10px 12px', borderRadius: 10,
        border: '1.5px solid var(--ink)', background: 'var(--bg-card)',
        fontSize: 14, color: 'var(--ink)', fontFamily: 'inherit',
        boxShadow: '0 2px 0 var(--ink)', outline: 'none', boxSizing: 'border-box',
        resize: 'vertical', minHeight: 72,
      }}
    />
  )
}

function ProtocolDetail({ protocol, logsByKey, onBack, onSaveComfort, onSaveNote }) {
  const currentDay = useMemo(
    () => TEST_DAYS.find(d => !logsByKey[keyFor(protocol.id, d)]?.comfort_level) ?? 5,
    [protocol.id, logsByKey],
  )
  const [selectedDay, setSelectedDay] = useState(currentDay)
  const [showRecipe, setShowRecipe] = useState(false)

  const selectedLog = logsByKey[keyFor(protocol.id, selectedDay)]
  const dose = protocol.days.find(d => d.day === selectedDay)?.doseGrams
  const selectedComfort = selectedLog?.comfort_level || null

  return (
    <>
      <button onClick={onBack} aria-label="Retour" style={{
        width: 36, height: 36, borderRadius: 999, border: '1.5px solid var(--ink)',
        background: 'var(--bg-card)', boxShadow: '0 2px 0 var(--ink)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16, padding: 0, fontFamily: 'inherit',
      }}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <ProtocolImage protocol={protocol} size={68} radius={16} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 24, letterSpacing: '-0.6px', lineHeight: 1.1 }}>{protocol.foodName}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, marginTop: 3 }}>{protocol.fodmapFamily}</div>
          <ProtocolMeta />
        </div>
      </div>

      <Stepper protocol={protocol} logsByKey={logsByKey} currentDay={currentDay}
        selectedDay={selectedDay} onSelectDay={setSelectedDay} />

      <div style={{
        background: selectedComfort ? 'var(--bg-comment)' : 'var(--pill-green)',
        border: '2px solid var(--ink)', borderRadius: 16,
        padding: '14px 16px', marginBottom: 14, boxShadow: '0 3px 0 var(--ink)',
      }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--ink)', letterSpacing: '-0.3px' }}>
          Jour {selectedDay} — {selectedComfort ? 'Test enregistré' : 'Test en cours'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-on-comment)', marginTop: 4, lineHeight: 1.35 }}>
          {selectedComfort
            ? `${dose} g · ${COMFORT_LEVELS.find(c => c.v === selectedComfort)?.label}`
            : `Aujourd’hui, testez ${dose} g de ${protocol.foodName.toLowerCase()}.`}
        </div>
      </div>

      <button onClick={() => setShowRecipe(true)} style={{
        width: '100%', textAlign: 'left', cursor: 'pointer',
        background: 'var(--bg-card)', border: '2px solid var(--ink)', borderRadius: 16,
        padding: '12px 14px', marginBottom: 22, boxShadow: '0 3px 0 var(--ink)',
        display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit',
      }}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M4 13h16a8 8 0 0 1-16 0z" />
          <line x1="3" y1="21" x2="21" y2="21" />
          <path d="M9 9c0-1.2 1-1.8 1-3" />
          <path d="M13 9c0-1.2 1-1.8 1-3" />
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>Préparation &amp; recette</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Voir la recette détaillée</div>
        </div>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--text-muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>Comment vous sentez-vous aujourd’hui ?</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, marginBottom: 12 }}>
        En lien avec votre test de {dose} g.
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {COMFORT_LEVELS.map(c => {
          const on = selectedComfort === c.v
          return (
            <button key={c.v} onClick={() => onSaveComfort(protocol.id, selectedDay, c.v)} style={{
              flex: 1, padding: '12px 4px 10px', borderRadius: 14,
              border: '1.5px solid var(--ink)',
              background: on ? FACE[c.v].bg : 'var(--bg-card)',
              boxShadow: on ? '0 2px 0 var(--ink)' : 'none',
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            }}>
              <ComfortFace level={c.v} size={30} />
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.15, textAlign: 'center' }}>{c.label}</span>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>Notes (optionnel)</span>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="var(--text-hint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </svg>
      </div>
      <NoteEditor
        key={selectedDay}
        initial={selectedLog?.note || ''}
        onSave={text => onSaveNote(protocol.id, selectedDay, text)}
      />

      {showRecipe && <RecipeSheet protocol={protocol} day={selectedDay} onClose={() => setShowRecipe(false)} />}
    </>
  )
}

// ──────────── Screen ────────────
export function MVPTestsScreen() {
  const { logs, loading, error, refresh } = useReintroLogs()
  const [selectedId, setSelectedId] = useState(null)
  // Optimistic edits layered over the server logs: key -> row, or null = locally deleted.
  // Kept separate from `logs` so the merged view is DERIVED (useMemo), never copied via an effect.
  const [overrides, setOverrides] = useState({})

  useEffect(() => { window.scrollTo(0, 0) }, [selectedId])

  const logsByKey = useMemo(() => {
    const m = {}
    for (const l of logs) m[keyFor(l.protocol_id, l.day)] = l
    for (const [k, v] of Object.entries(overrides)) {
      if (v === null) delete m[k]
      else m[k] = v
    }
    return m
  }, [logs, overrides])

  const saveComfort = async (protocolId, day, level) => {
    const key = keyFor(protocolId, day)
    const note = logsByKey[key]?.note ?? null
    setOverrides(o => ({ ...o, [key]: { protocol_id: protocolId, day, comfort_level: level, note } }))
    try {
      await upsertReintroLog({ protocolId, day, comfortLevel: level, note })
    } catch (err) {
      window.alert('Impossible d’enregistrer : ' + (err.message || err))
      setOverrides(o => { const n = { ...o }; delete n[key]; return n })
      refresh()
    }
  }

  const saveNote = async (protocolId, day, text) => {
    const key = keyFor(protocolId, day)
    const prev = logsByKey[key]
    const trimmed = text.trim()
    if ((prev?.note || '') === trimmed) return // unchanged — skip the write
    const comfort = prev?.comfort_level ?? null
    if (!comfort && !trimmed) {
      setOverrides(o => ({ ...o, [key]: null })) // tombstone — hide any server row
      try { await deleteReintroLog({ protocolId, day }) } catch { refresh() }
      return
    }
    setOverrides(o => ({ ...o, [key]: { protocol_id: protocolId, day, comfort_level: comfort, note: trimmed || null } }))
    try {
      await upsertReintroLog({ protocolId, day, comfortLevel: comfort, note: trimmed })
    } catch (err) {
      window.alert('Impossible d’enregistrer la note : ' + (err.message || err))
      refresh()
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
        Chargement des tests…
      </div>
    )
  }

  const selected = REINTRO_PROTOCOLS.find(p => p.id === selectedId)
  if (selected) {
    return (
      <ProtocolDetail
        key={selected.id}
        protocol={selected}
        logsByKey={logsByKey}
        onBack={() => setSelectedId(null)}
        onSaveComfort={saveComfort}
        onSaveNote={saveNote}
      />
    )
  }

  // Protocol definitions are static, so a logs load-failure (e.g. the reintro_logs table
  // doesn't exist yet) still shows the list — just with ghost faces — plus a hint banner.
  return (
    <>
      {error && (
        <div style={{
          padding: '10px 14px', background: 'var(--pill-red)', border: '1.5px solid var(--ink)',
          borderRadius: 10, fontSize: 12, color: 'var(--ink)', marginBottom: 14, boxShadow: '0 2px 0 var(--ink)',
        }}>
          Impossible de charger vos résultats. Vérifiez que la table « reintro_logs » existe dans Supabase.
        </div>
      )}
      <ProtocolList logsByKey={logsByKey} onSelect={setSelectedId} />
    </>
  )
}
