import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { BlobLogo, Markdown } from '../components/ui.jsx'
import { tileFor, initialFor } from '../lib/foods-meta.js'
import { COMFORT_LEVELS, TEST_DAYS, STANDARD_DAYS, defaultRecipeMarkdown, defaultCategoryMarkdown } from '../data/reintro.js'
import {
  useReintroProtocols, deleteReintroProtocol,
  useReintroLogs, upsertReintroLog, deleteReintroLog,
  useReintroRecipes, upsertReintroRecipe, deleteReintroRecipe,
  useReintroCategoryNotes, upsertReintroCategoryNote, deleteReintroCategoryNote,
  useReintroStatus, upsertReintroStatus,
} from '../lib/user-data.js'
import { deleteReintroPhoto } from '../lib/storage.js'
import { TestForm } from './tests-forms.jsx'

const keyFor = (protocolId, day) => `${protocolId}|${day}`

// Display label for the "same family" card — change freely (it's the only place it's set).
const CATEGORY_TITLE = 'Aliments associés'

const iconBtnStyle = {
  width: 32, height: 32, borderRadius: 999, border: '2px solid var(--ink)',
  background: 'var(--bg-card)', boxShadow: '0 2px 0 var(--ink)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit', fontSize: 16, lineHeight: 1, color: 'var(--ink)', padding: 0,
}

const rowCardStyle = {
  width: '100%', textAlign: 'left', cursor: 'pointer',
  background: 'var(--bg-card)', border: '2px solid var(--ink)', borderRadius: 16,
  padding: '12px 14px', boxShadow: '0 3px 0 var(--ink)',
  display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit',
}

const statusInputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--ink)',
  background: 'var(--bg-card)', fontSize: 14, color: 'var(--ink)', fontFamily: 'inherit',
  boxShadow: '0 2px 0 var(--ink)', outline: 'none', boxSizing: 'border-box',
}

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
  const url = protocol.photoUrl
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
      ...base, background: tileFor(protocol.id),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: Math.round(size * 0.4), color: 'var(--ink)',
    }}>{initialFor({ nom: protocol.foodName })}</div>
  )
}

function ProtocolMeta() {
  return (
    <div style={{ marginTop: 4, color: 'var(--text-hint)', fontSize: 11, fontWeight: 500 }}>
      – Protocole en 5 jours –
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
      <ProtocolImage protocol={protocol} size={72} radius={16} />
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

function ProtocolList({ protocols, logsByKey, onSelect, onAdd, status, onOpenStatus }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <BlobLogo size={30} />
        <div style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.6px' }}>Mes tests</div>
        <button onClick={onAdd} style={{
          marginLeft: 'auto', padding: '6px 12px', borderRadius: 999,
          background: 'var(--ink)', color: 'var(--paper)', border: '2px solid var(--ink)',
          boxShadow: '0 2px 0 var(--ink)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4, letterSpacing: 0.3,
        }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Test
        </button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>
        Aperçu de vos réintroductions en cours
      </div>
      <StatusCard status={status} onClick={onOpenStatus} />
      {protocols.map(p => (
        <ProtocolCard key={p.id} protocol={p} logsByKey={logsByKey} onClick={() => onSelect(p.id)} />
      ))}
      {protocols.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
          Aucun test pour le moment. Touchez « + Test » pour en créer un.
        </div>
      )}
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
          const sub = isTest ? `Test ${d.doseLabel}` : 'Récupération'

          let node
          if (isTest && log?.comfort_level) {
            node = <ComfortFace level={log.comfort_level} size={30} />
          } else if (!isTest && done) {
            node = (
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 22, height: 22, borderRadius: 999,
                background: 'var(--bg-soft)', border: '1.5px solid var(--border-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

function SheetMeta({ foodName, chip }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{foodName}</span>
      {chip && (
        <span style={{
          padding: '4px 10px', borderRadius: 999, background: 'var(--bg-comment)',
          border: '1.5px solid var(--ink)', fontSize: 11, fontWeight: 700,
          color: 'var(--text-on-comment)', whiteSpace: 'nowrap',
        }}>{chip}</span>
      )}
    </div>
  )
}

// Generic bottom-sheet for a per-protocol markdown field (recipe, same-family foods, …):
// renders <Markdown> in view mode and a textarea in edit mode, with Enregistrer / Annuler
// and Réinitialiser (revert to the seed default).
function EditableSheet({ title, meta, content, isCustom, onSave, onReset, onClose }) {
  const scrollRef = useRef(null)
  const [expanded, setExpanded] = useState(false)
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      if (el.scrollTop > 80) setExpanded(true)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(content)
  const [busy, setBusy] = useState(false)

  const save = async () => { setBusy(true); await onSave(draft); setBusy(false); setEditing(false) }
  const reset = async () => { setBusy(true); await onReset(); setBusy(false); setEditing(false) }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 30, background: 'var(--overlay)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: expanded ? 0 : '40px 14px 90px',
      transition: 'padding 0.3s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: expanded ? 'none' : 430,
        height: expanded ? '100%' : undefined,
        maxHeight: '100%',
        background: 'var(--paper)',
        borderRadius: expanded ? 0 : 22,
        border: expanded ? 'none' : '2px solid var(--ink)',
        boxShadow: expanded ? 'none' : '0 8px 0 var(--ink)',
        position: 'relative', animation: 'slideUp 0.22s ease-out',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'max-width 0.3s ease, border-radius 0.3s ease, height 0.3s ease',
      }}>
        <div style={{
          padding: '16px 18px 14px', borderBottom: '2px dashed var(--border-soft)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
          flexShrink: 0,
        }}>
          <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.4px' }}>{title}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!editing && (
              <button onClick={() => { setDraft(content); setEditing(true) }} aria-label="Modifier" title="Modifier" style={iconBtnStyle}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                </svg>
              </button>
            )}
            <button onClick={onClose} aria-label="Fermer" style={iconBtnStyle}>×</button>
          </div>
        </div>
        <div ref={scrollRef} style={{ padding: '16px 18px 20px', overflowY: 'auto', flex: 1, minHeight: 0, overscrollBehavior: 'contain' }}>
          {meta}
          {editing ? (
            <>
              <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={10} autoFocus style={{
                width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--ink)',
                background: 'var(--bg-card)', fontSize: 14, color: 'var(--ink)', fontFamily: 'inherit',
                boxShadow: '0 2px 0 var(--ink)', outline: 'none', boxSizing: 'border-box',
                resize: 'vertical', minHeight: 200,
              }} />
              <div style={{ fontSize: 10, color: 'var(--text-hint)', marginTop: 4 }}>
                Markdown supporté — listes, **gras**, &gt; citation.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
                {isCustom && (
                  <button type="button" onClick={reset} disabled={busy} style={{
                    marginRight: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)',
                    fontSize: 12, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', textDecoration: 'underline', padding: 0,
                  }}>Réinitialiser</button>
                )}
                <button type="button" onClick={() => setEditing(false)} style={{
                  marginLeft: isCustom ? 0 : 'auto', padding: '10px 16px', borderRadius: 999,
                  border: '1.5px solid var(--ink)', background: 'var(--bg-card)', color: 'var(--ink)',
                  fontSize: 13, fontWeight: 600, boxShadow: '0 2px 0 var(--ink)', cursor: 'pointer', fontFamily: 'inherit',
                }}>Annuler</button>
                <button type="button" onClick={save} disabled={busy} style={{
                  padding: '10px 18px', borderRadius: 999, border: '2px solid var(--ink)',
                  background: busy ? 'var(--bg-disabled)' : 'var(--ink)',
                  color: busy ? 'var(--text-muted)' : 'var(--paper)',
                  fontSize: 13, fontWeight: 700, boxShadow: busy ? 'none' : '0 3px 0 var(--ink)',
                  cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                }}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.4 }}>
                <Markdown>{content}</Markdown>
              </div>
              {isCustom && (
                <div style={{ fontSize: 10, color: 'var(--text-hint)', fontStyle: 'italic', marginTop: 12 }}>
                  Personnalisé
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  )
}

// Remounted (via key={selectedDay}) when the focused day changes, so the draft
// re-initializes from `initial` without a setState-in-effect. Saves on blur.
// Height auto-grows to fit content — no manual resize handle.
function NoteEditor({ initial, onSave }) {
  const [draft, setDraft] = useState(initial)
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [draft])
  return (
    <textarea
      ref={ref}
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
        resize: 'none', minHeight: 72, overflow: 'hidden',
      }}
    />
  )
}

function ProtocolDetail({ protocol, logsByKey, customRecipe, customCategory, onBack, onEdit, onSaveComfort, onSaveNote, onSaveRecipe, onResetRecipe, onSaveCategory, onResetCategory, onDelete }) {
  const currentDay = useMemo(
    () => TEST_DAYS.find(d => !logsByKey[keyFor(protocol.id, d)]?.comfort_level) ?? 5,
    [protocol.id, logsByKey],
  )
  const [selectedDay, setSelectedDay] = useState(currentDay)
  const [sheet, setSheet] = useState(null) // 'recipe' | 'category' | null

  const selectedLog = logsByKey[keyFor(protocol.id, selectedDay)]
  const dose = protocol.days.find(d => d.day === selectedDay)?.doseLabel
  const selectedComfort = selectedLog?.comfort_level || null
  const effectiveRecipe = customRecipe ?? defaultRecipeMarkdown(protocol)
  const isCustomRecipe = customRecipe != null
  const effectiveCategory = customCategory ?? defaultCategoryMarkdown(protocol)
  const isCustomCategory = customCategory != null

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={onBack} aria-label="Retour" style={{
          width: 36, height: 36, borderRadius: 999, border: '1.5px solid var(--ink)',
          background: 'var(--bg-card)', boxShadow: '0 2px 0 var(--ink)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontFamily: 'inherit',
        }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--ink)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button onClick={() => onEdit(protocol)} aria-label="Modifier le test" title="Modifier" style={{
          width: 36, height: 36, borderRadius: 999, border: '1.5px solid var(--ink)',
          background: 'var(--bg-card)', boxShadow: '0 2px 0 var(--ink)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontFamily: 'inherit',
        }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
          </svg>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <ProtocolImage protocol={protocol} size={84} radius={18} />
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
            ? `${dose} · ${COMFORT_LEVELS.find(c => c.v === selectedComfort)?.label}`
            : `Aujourd’hui, testez ${dose} de ${protocol.foodName.toLowerCase()}.`}
        </div>
      </div>

      <button onClick={() => setSheet('recipe')} style={{ ...rowCardStyle, marginBottom: 10 }}>
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

      <button onClick={() => setSheet('category')} style={{ ...rowCardStyle, marginBottom: 22 }}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <line x1="9" y1="6" x2="20" y2="6" />
          <line x1="9" y1="12" x2="20" y2="12" />
          <line x1="9" y1="18" x2="20" y2="18" />
          <circle cx="4.5" cy="6" r="1.1" fill="var(--ink)" stroke="none" />
          <circle cx="4.5" cy="12" r="1.1" fill="var(--ink)" stroke="none" />
          <circle cx="4.5" cy="18" r="1.1" fill="var(--ink)" stroke="none" />
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{CATEGORY_TITLE}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>Une fois ce test bien toléré</div>
        </div>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--text-muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>Comment vous sentez-vous aujourd’hui ?</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, marginBottom: 12 }}>
        En lien avec votre test de {dose}.
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

      <span style={{ display: 'block', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>Notes (optionnel)</span>
      <NoteEditor
        key={selectedDay}
        initial={selectedLog?.note || ''}
        onSave={text => onSaveNote(protocol.id, selectedDay, text)}
      />

      <button onClick={() => onDelete(protocol)} style={{
        width: '100%', marginTop: 28, padding: '10px 16px', borderRadius: 999,
        background: 'var(--bg-card)', color: 'var(--accent-error)',
        border: '2px solid var(--accent-error)', boxShadow: '0 3px 0 var(--accent-error)',
        fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      }}>Supprimer ce test</button>

      {sheet === 'recipe' && (
        <EditableSheet
          title="Recette détaillée"
          meta={<SheetMeta foodName={protocol.foodName} chip={dose != null ? `Dose cible : ${dose}` : null} />}
          content={effectiveRecipe}
          isCustom={isCustomRecipe}
          onSave={text => onSaveRecipe(protocol.id, text)}
          onReset={() => onResetRecipe(protocol.id)}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'category' && (
        <EditableSheet
          title={CATEGORY_TITLE}
          meta={<SheetMeta foodName={protocol.foodName} chip={protocol.fodmapFamily?.replace(/^Test\s+/i, '')} />}
          content={effectiveCategory}
          isCustom={isCustomCategory}
          onSave={text => onSaveCategory(protocol.id, text)}
          onReset={() => onResetCategory(protocol.id)}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  )
}

// ──────────── Statut actuel (overall summary) ────────────
// A user-curated overview above the test list. The three rows mirror the three short
// fields; tapping opens StatusModal with those fields + a free-form markdown detail.
const STATUS_ROWS = [
  { key: 'validated', label: 'Validé',   color: '#5f9e40' },
  { key: 'upcoming',  label: 'Next',     color: '#e2a431' },
  { key: 'avoid',     label: 'À éviter', color: '#c0492f' },
]

function StatusDot({ color }) {
  return <span style={{
    width: 14, height: 14, borderRadius: 999, background: color,
    flexShrink: 0, display: 'inline-block',
  }} />
}

function StatusCard({ status, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
      background: 'var(--status-card)', border: '2px solid var(--border-soft)', borderRadius: 24,
      padding: '16px 18px 16px 10px', boxShadow: '0 4px 16px rgba(31,26,20,0.10)', marginBottom: 18,
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{
        width: 76, height: 76, borderRadius: 999, flexShrink: 0, background: 'var(--status-disc)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg viewBox="0 0 24 24" width="57" height="57" fill="none" stroke="var(--ink)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4.8" y="4.8" width="14.4" height="16.4" rx="2.4" />
          <rect x="9" y="2.8" width="6" height="3.6" rx="1.3" />
          <path d="M7.8 10.1l1.1 1.1 2-2.3" />
          <line x1="12.7" y1="10" x2="16.2" y2="10" />
          <path d="M7.8 14.7l1.1 1.1 2-2.3" />
          <line x1="12.7" y1="14.6" x2="16.2" y2="14.6" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px', marginBottom: 2, color: 'var(--ink)' }}>Statut actuel</div>
        {STATUS_ROWS.map((r, i) => (
          <div key={r.key} style={{
            display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, minWidth: 0, padding: '7px 0',
            borderTop: i === 0 ? 'none' : '1px solid var(--border-divider)',
          }}>
            <StatusDot color={r.color} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
              <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.label}</span>
              <span style={{ color: status?.[r.key] ? 'var(--ink)' : 'var(--text-hint)' }}>{' : '}{status?.[r.key] || '—'}</span>
            </span>
          </div>
        ))}
      </div>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--text-muted)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
        <path d="M9 6l6 6-6 6" />
      </svg>
    </button>
  )
}

// Bottom-sheet for the summary: the three short fields + a free-form markdown detail.
// Mirrors EditableSheet's chrome (esc to close, body lock, fullscreen-on-scroll).
function StatusModal({ status, onSave, onClose }) {
  const scrollRef = useRef(null)
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const fromStatus = () => ({
    validated: status?.validated || '', upcoming: status?.upcoming || '',
    avoid: status?.avoid || '', detail: status?.detail || '',
  })
  const [draft, setDraft] = useState(fromStatus)

  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => { if (el.scrollTop > 80) setExpanded(true) }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  const startEdit = () => { setDraft(fromStatus()); setEditing(true) }
  const save = async () => {
    setBusy(true)
    await onSave({
      validated: draft.validated.trim(), upcoming: draft.upcoming.trim(),
      avoid: draft.avoid.trim(), detail: draft.detail.trim(),
    })
    setBusy(false)
    setEditing(false)
  }
  const hasDetail = !!(status?.detail && status.detail.trim())

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 30, background: 'var(--overlay)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: expanded ? 0 : '40px 14px 90px', transition: 'padding 0.3s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: expanded ? 'none' : 430,
        height: expanded ? '100%' : undefined, maxHeight: '100%',
        background: 'var(--paper)', borderRadius: expanded ? 0 : 22,
        border: expanded ? 'none' : '2px solid var(--ink)',
        boxShadow: expanded ? 'none' : '0 8px 0 var(--ink)',
        position: 'relative', animation: 'slideUp 0.22s ease-out', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'max-width 0.3s ease, border-radius 0.3s ease, height 0.3s ease',
      }}>
        <div style={{
          padding: '16px 18px 14px', borderBottom: '2px dashed var(--border-soft)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexShrink: 0,
        }}>
          <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.4px' }}>Statut actuel</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {!editing && (
              <button onClick={startEdit} aria-label="Modifier" title="Modifier" style={iconBtnStyle}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                </svg>
              </button>
            )}
            <button onClick={onClose} aria-label="Fermer" style={iconBtnStyle}>×</button>
          </div>
        </div>
        <div ref={scrollRef} style={{ padding: '16px 18px 20px', overflowY: 'auto', flex: 1, minHeight: 0, overscrollBehavior: 'contain' }}>
          {editing ? (
            <>
              {STATUS_ROWS.map(r => (
                <div key={r.key} style={{ marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                    <StatusDot color={r.color} />{r.label}
                  </label>
                  <input value={draft[r.key]} onChange={e => setDraft(d => ({ ...d, [r.key]: e.target.value }))}
                    placeholder="Ex. : Polyols, GOS" style={statusInputStyle} />
                </div>
              ))}
              <label style={{ display: 'block', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>Détails</label>
              <textarea value={draft.detail} onChange={e => setDraft(d => ({ ...d, detail: e.target.value }))} rows={12}
                style={{ ...statusInputStyle, resize: 'vertical', minHeight: 220 }} />
              <div style={{ fontSize: 10, color: 'var(--text-hint)', marginTop: 4 }}>
                Markdown supporté — titres, listes, **gras**, tableaux, &gt; citation.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
                <button type="button" onClick={() => setEditing(false)} style={{
                  marginLeft: 'auto', padding: '10px 16px', borderRadius: 999, border: '1.5px solid var(--ink)',
                  background: 'var(--bg-card)', color: 'var(--ink)', fontSize: 13, fontWeight: 600,
                  boxShadow: '0 2px 0 var(--ink)', cursor: 'pointer', fontFamily: 'inherit',
                }}>Annuler</button>
                <button type="button" onClick={save} disabled={busy} style={{
                  padding: '10px 18px', borderRadius: 999, border: '2px solid var(--ink)',
                  background: busy ? 'var(--bg-disabled)' : 'var(--ink)', color: busy ? 'var(--text-muted)' : 'var(--paper)',
                  fontSize: 13, fontWeight: 700, boxShadow: busy ? 'none' : '0 3px 0 var(--ink)',
                  cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                }}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 4 }}>
                {STATUS_ROWS.map(r => (
                  <div key={r.key} style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                    <span style={{ position: 'relative', top: 3 }}><StatusDot color={r.color} /></span>
                    <div style={{ fontSize: 13, lineHeight: 1.35 }}>
                      <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{r.label}</span>
                      <span style={{ color: status?.[r.key] ? 'var(--text-on-comment)' : 'var(--text-hint)' }}>{' : '}{status?.[r.key] || 'Non renseigné'}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '2px dashed var(--border-soft)', marginTop: 10, paddingTop: 14 }}>
                {hasDetail ? (
                  <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.4 }}>
                    <Markdown>{status.detail}</Markdown>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-hint)', fontStyle: 'italic' }}>
                    Touchez le crayon pour ajouter un récapitulatif détaillé.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  )
}

// ──────────── Screen ────────────
export function MVPTestsScreen() {
  const { protocols: protocolRows, loading: protocolsLoading, error: protocolsError, refresh: refreshProtocols } = useReintroProtocols()
  const { logs, loading, error, refresh } = useReintroLogs()
  const { recipes, refresh: refreshRecipes } = useReintroRecipes()
  const { notes: categoryNotes, refresh: refreshCategory } = useReintroCategoryNotes()
  const { status: statusRow, refresh: refreshStatus } = useReintroStatus()
  const [selectedId, setSelectedId] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  // Optimistic edits layered over the server data: key -> value, or null = locally deleted/reset.
  // Kept separate from the fetched rows so the merged views are DERIVED (useMemo), never copied via an effect.
  const [overrides, setOverrides] = useState({})
  const [recipeOverrides, setRecipeOverrides] = useState({})
  const [categoryOverrides, setCategoryOverrides] = useState({})
  const [statusOverride, setStatusOverride] = useState(null)
  const [showStatus, setShowStatus] = useState(false)
  const status = statusOverride ?? statusRow

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

  // protocol_id -> custom recipe markdown (server override + optimistic edits). Undefined = use default.
  const recipeByProtocol = useMemo(() => {
    const m = {}
    for (const r of recipes) if (r.recipe != null) m[r.protocol_id] = r.recipe
    for (const [k, v] of Object.entries(recipeOverrides)) {
      if (v === null) delete m[k]
      else m[k] = v
    }
    return m
  }, [recipes, recipeOverrides])

  // protocol_id -> custom "same family" markdown (server override + optimistic edits).
  const categoryByProtocol = useMemo(() => {
    const m = {}
    for (const r of categoryNotes) if (r.content != null) m[r.protocol_id] = r.content
    for (const [k, v] of Object.entries(categoryOverrides)) {
      if (v === null) delete m[k]
      else m[k] = v
    }
    return m
  }, [categoryNotes, categoryOverrides])

  // DB rows -> the shape the UI components expect. The 5-day schedule is the shared constant;
  // each test day's dose label falls back to the standard "100/150/200 g" when the user
  // hasn't overridden it (e.g. "un quart d'avocat" instead of "100 g").
  const protocols = useMemo(() => protocolRows.map(r => {
    const overrides = { 1: r.dose_day_1, 3: r.dose_day_3, 5: r.dose_day_5 }
    return {
      id: r.id,
      foodName: r.food_name,
      fodmapFamily: r.fodmap_family,
      photoUrl: r.photo_url,
      doseDay1: r.dose_day_1,
      doseDay3: r.dose_day_3,
      doseDay5: r.dose_day_5,
      days: STANDARD_DAYS.map(d => d.type === 'test'
        ? { ...d, doseLabel: overrides[d.day] || `${d.doseGrams} g` }
        : d),
    }
  }), [protocolRows])

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

  const resetRecipe = async (protocolId) => {
    setRecipeOverrides(o => ({ ...o, [protocolId]: null })) // back to the seed default
    try {
      await deleteReintroRecipe({ protocolId })
    } catch (err) {
      window.alert('Impossible de réinitialiser la recette : ' + (err.message || err))
      setRecipeOverrides(o => { const n = { ...o }; delete n[protocolId]; return n })
      refreshRecipes()
    }
  }

  const saveRecipe = async (protocolId, text) => {
    if (!text.trim()) return resetRecipe(protocolId) // empty = revert to default
    setRecipeOverrides(o => ({ ...o, [protocolId]: text }))
    try {
      await upsertReintroRecipe({ protocolId, recipe: text })
    } catch (err) {
      window.alert('Impossible d’enregistrer la recette : ' + (err.message || err))
      setRecipeOverrides(o => { const n = { ...o }; delete n[protocolId]; return n })
      refreshRecipes()
    }
  }

  const resetCategory = async (protocolId) => {
    setCategoryOverrides(o => ({ ...o, [protocolId]: null }))
    try {
      await deleteReintroCategoryNote({ protocolId })
    } catch (err) {
      window.alert('Impossible de réinitialiser : ' + (err.message || err))
      setCategoryOverrides(o => { const n = { ...o }; delete n[protocolId]; return n })
      refreshCategory()
    }
  }

  const saveCategory = async (protocolId, text) => {
    if (!text.trim()) return resetCategory(protocolId)
    setCategoryOverrides(o => ({ ...o, [protocolId]: text }))
    try {
      await upsertReintroCategoryNote({ protocolId, content: text })
    } catch (err) {
      window.alert('Impossible d’enregistrer : ' + (err.message || err))
      setCategoryOverrides(o => { const n = { ...o }; delete n[protocolId]; return n })
      refreshCategory()
    }
  }

  const saveStatus = async (fields) => {
    setStatusOverride(fields) // optimistic
    try {
      setStatusOverride(await upsertReintroStatus(fields)) // settle on the saved row
    } catch (err) {
      window.alert('Impossible d’enregistrer le statut : ' + (err.message || err))
      setStatusOverride(null)
      refreshStatus()
    }
  }

  const deleteProtocol = async (protocol) => {
    if (!window.confirm(`Supprimer le test « ${protocol.foodName} » et toutes ses données ?`)) return
    try {
      if (protocol.photoUrl) await deleteReintroPhoto(protocol.photoUrl).catch(() => {})
      await deleteReintroProtocol(protocol.id)
      setSelectedId(null)
      setShowEdit(false)
      refreshProtocols(); refresh(); refreshRecipes(); refreshCategory()
    } catch (err) {
      window.alert('Impossible de supprimer : ' + (err.message || err))
    }
  }

  if (loading || protocolsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
        Chargement des tests…
      </div>
    )
  }

  const selected = protocols.find(p => p.id === selectedId)
  if (selected) {
    return (
      <>
        <ProtocolDetail
          key={selected.id}
          protocol={selected}
          logsByKey={logsByKey}
          customRecipe={recipeByProtocol[selected.id]}
          customCategory={categoryByProtocol[selected.id]}
          onBack={() => { setSelectedId(null); setShowEdit(false) }}
          onEdit={() => setShowEdit(true)}
          onSaveComfort={saveComfort}
          onSaveNote={saveNote}
          onSaveRecipe={saveRecipe}
          onResetRecipe={resetRecipe}
          onSaveCategory={saveCategory}
          onResetCategory={resetCategory}
          onDelete={deleteProtocol}
        />
        {showEdit && (
          <TestForm
            protocol={selected}
            onClose={() => setShowEdit(false)}
            onSaved={() => { setShowEdit(false); refreshProtocols() }}
          />
        )}
      </>
    )
  }

  // A load failure (e.g. a table doesn't exist yet) still shows the list with whatever
  // loaded, plus a hint banner.
  return (
    <>
      {(error || protocolsError) && (
        <div style={{
          padding: '10px 14px', background: 'var(--pill-red)', border: '1.5px solid var(--ink)',
          borderRadius: 10, fontSize: 12, color: 'var(--ink)', marginBottom: 14, boxShadow: '0 2px 0 var(--ink)',
        }}>
          Impossible de charger vos tests. Vérifiez que les tables Supabase (reintro_protocols, reintro_logs…) existent.
        </div>
      )}
      <ProtocolList protocols={protocols} logsByKey={logsByKey} onSelect={setSelectedId} onAdd={() => setShowAdd(true)}
        status={status} onOpenStatus={() => setShowStatus(true)} />
      {showStatus && (
        <StatusModal status={status} onSave={saveStatus} onClose={() => setShowStatus(false)} />
      )}
      {showAdd && (
        <TestForm
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); refreshProtocols() }}
        />
      )}
    </>
  )
}
