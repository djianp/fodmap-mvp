import { useEffect, useMemo, useRef, useState } from 'react'
import { BlobLogo, Markdown } from '../components/ui.jsx'
import { useSuggestions, deleteSuggestion } from '../lib/user-data.js'
import { deleteSuggestionPhoto } from '../lib/storage.js'
import { OCCASIONS, CONTEXTS, labelOccasion, labelContext } from '../lib/suggestions-meta.js'
import { SuggestionForm } from './suggestion-forms.jsx'

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

function MultiChip({ option, on, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px', borderRadius: 999,
      border: '1.5px solid #1f1a14',
      background: on ? '#1f1a14' : '#fff',
      color: on ? '#f5f0e6' : '#1f1a14',
      fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
      boxShadow: on ? 'none' : '0 2px 0 #1f1a14',
      cursor: 'pointer', fontFamily: 'inherit',
      display: 'inline-flex', alignItems: 'center', gap: 6, lineHeight: 1,
    }}>
      <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1 }}>{option.icon}</span>
      {option.label}
    </button>
  )
}

function SuggestionCard({ s, onClick }) {
  const cats = [...s.occasions.map(labelOccasion), ...s.contexts.map(labelContext)]
  return (
    <button onClick={() => onClick(s)} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer',
      background: '#fff', border: '2px solid #1f1a14', borderRadius: 18,
      padding: 12, marginBottom: 12,
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 4px 0 #1f1a14', fontFamily: 'inherit',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 999, flexShrink: 0,
        border: '2px solid #1f1a14', boxShadow: '0 3px 0 #1f1a14',
        background: s.photo_url ? `#e9d7b6 url("${s.photo_url}") center/cover no-repeat` : '#e9d7b6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, color: '#7a6b55', overflow: 'hidden',
      }}>{!s.photo_url && (s.nom || '?').trim().charAt(0).toUpperCase()}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#1f1a14', lineHeight: 1.2, letterSpacing: '-0.2px' }}>
              {s.nom}
            </div>
            {cats.length > 0 && (
              <div style={{ fontSize: 11, color: '#7a6b55', marginTop: 4 }}>
                {cats.join(' · ')}
              </div>
            )}
            {s.rating != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <Stars value={Number(s.rating)} size={11} />
                <span style={{ fontSize: 11, color: '#7a6b55', fontWeight: 600 }}>{Number(s.rating).toFixed(1)}</span>
              </div>
            )}
          </div>
          {s.to_try && (
            <span style={{
              padding: '6px 10px', borderRadius: 999,
              background: '#f0a390', border: '1.5px solid #1f1a14',
              fontSize: 11, fontWeight: 600, color: '#1f1a14', whiteSpace: 'nowrap', flexShrink: 0,
            }}>À tester</span>
          )}
        </div>
        {s.infos_cles && (
          <div style={{
            marginTop: 8, padding: '6px 10px', background: '#f5e3b8',
            border: '1.5px solid #1f1a14', borderRadius: 10,
            fontSize: 11, color: '#2d1e0f', lineHeight: 1.4,
            display: 'flex', gap: 6, alignItems: 'flex-start',
          }}>
            <span aria-hidden="true">💬</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Markdown>{s.infos_cles}</Markdown>
            </div>
          </div>
        )}
      </div>
    </button>
  )
}

function SuggestionDetailModal({ suggestion, onClose, onEdit, onDelete }) {
  const scrollRef = useRef(null)
  const [expanded, setExpanded] = useState(false)
  useEffect(() => {
    if (!suggestion) return
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose, suggestion])
  useEffect(() => {
    if (!suggestion) { setExpanded(false); return }
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      if (el.scrollTop > 80) setExpanded(true)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [suggestion])
  if (!suggestion) return null
  const photoUrl = suggestion.photo_url
  const cats = [
    ...(suggestion.occasions || []).map(labelOccasion),
    ...(suggestion.contexts || []).map(labelContext),
  ]
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 30,
      background: 'rgba(31,26,20,0.55)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: expanded ? 0 : '40px 14px 90px',
      transition: 'padding 0.3s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: expanded ? 'none' : 430,
        height: expanded ? '100%' : undefined,
        maxHeight: '100%',
        background: '#f5f0e6',
        borderRadius: expanded ? 0 : 22,
        border: expanded ? 'none' : '2px solid #1f1a14',
        boxShadow: expanded ? 'none' : '0 8px 0 #1f1a14',
        position: 'relative',
        animation: 'slideUp 0.22s ease-out',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transition: 'max-width 0.3s ease, border-radius 0.3s ease, height 0.3s ease',
      }}>
        <button onClick={onClose} aria-label="Fermer" style={{
          position: 'absolute', top: 10, right: 10, zIndex: 2,
          width: 32, height: 32, borderRadius: 999, border: '2px solid #1f1a14',
          background: '#fff', boxShadow: '0 2px 0 #1f1a14', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'inherit', fontSize: 16, lineHeight: 1, color: '#1f1a14',
        }}>×</button>

        <div ref={scrollRef} style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {photoUrl && (
            <div role="img" aria-label={suggestion.nom} style={{
              height: 240, flexShrink: 0,
              backgroundImage: `url("${photoUrl}")`,
              backgroundSize: 'cover', backgroundPosition: 'center',
            }} />
          )}

          <div style={{ padding: 18 }}>
            <div style={{ marginBottom: 14, paddingRight: 36 }}>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.5px' }}>{suggestion.nom}</div>
              {cats.length > 0 && (
                <div style={{ fontSize: 12, color: '#7a6b55', marginTop: 4 }}>
                  {cats.join(' · ')}
                </div>
              )}
            </div>

            {(suggestion.rating != null || suggestion.to_try) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                {suggestion.rating != null && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Stars value={Number(suggestion.rating)} size={14} />
                    <span style={{ fontSize: 13, color: '#7a6b55', fontWeight: 600 }}>{Number(suggestion.rating).toFixed(1)}</span>
                  </div>
                )}
                {suggestion.to_try && (
                  <span style={{
                    padding: '5px 10px', borderRadius: 999,
                    background: '#f0a390', border: '1.5px solid #1f1a14',
                    fontSize: 11, fontWeight: 600, color: '#1f1a14', whiteSpace: 'nowrap',
                  }}>À tester</span>
                )}
              </div>
            )}

            {suggestion.infos_cles && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#7a6b55', textTransform: 'uppercase', marginBottom: 4 }}>Infos clés</div>
                <div style={{ fontSize: 15, color: '#1f1a14', lineHeight: 1.45 }}>
                  <Markdown>{suggestion.infos_cles}</Markdown>
                </div>
              </div>
            )}

            {suggestion.comment && (
              <div style={{ marginBottom: 12, padding: '10px 12px', background: '#f5e3b8', border: '1.5px solid #1f1a14', borderRadius: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: '#7a6b55', textTransform: 'uppercase', marginBottom: 4 }}>Commentaire</div>
                <div style={{ fontSize: 15, color: '#1f1a14', lineHeight: 1.45 }}>
                  <Markdown>{suggestion.comment}</Markdown>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={onEdit} style={{
                flex: 1,
                padding: '10px 16px', borderRadius: 999,
                background: '#1f1a14', color: '#f5f0e6',
                border: '2px solid #1f1a14', boxShadow: '0 3px 0 #1f1a14',
                fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>Modifier</button>
              <button onClick={() => onDelete(suggestion)} style={{
                padding: '10px 16px', borderRadius: 999,
                background: '#fff', color: '#c9543e',
                border: '2px solid #c9543e', boxShadow: '0 3px 0 #c9543e',
                fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>Supprimer</button>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  )
}

export function MVPSuggestionsScreen() {
  const { suggestions, loading, error, refresh } = useSuggestions()
  const [q, setQ] = useState('')
  const [occasions, setOccasions] = useState([])
  const [contexts, setContexts] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState(null)
  const [editing, setEditing] = useState(null)

  const toggle = (setter, list, v) =>
    setter(list.includes(v) ? list.filter(x => x !== v) : [...list, v])

  const filtered = useMemo(() => {
    let list = suggestions.slice()
    if (q.trim()) {
      const norm = s => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
      const nq = norm(q.trim())
      list = list.filter(s => norm(s.nom).includes(nq))
    }
    if (occasions.length) {
      list = list.filter(s => (s.occasions || []).some(o => occasions.includes(o)))
    }
    if (contexts.length) {
      list = list.filter(s => (s.contexts || []).some(c => contexts.includes(c)))
    }
    return list
  }, [q, occasions, contexts, suggestions])

  const selectedLatest = selected ? suggestions.find(s => s.id === selected.id) || selected : null

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <BlobLogo size={30}>💡</BlobLogo>
        <div style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.6px' }}>Suggestions</div>
        <button onClick={() => setShowAdd(true)} disabled={loading} style={{
          marginLeft: 'auto',
          padding: '6px 12px', borderRadius: 999,
          background: loading ? '#d9c3a0' : '#1f1a14',
          color: loading ? '#7a6b55' : '#f5f0e6',
          border: '2px solid #1f1a14', boxShadow: loading ? 'none' : '0 2px 0 #1f1a14',
          fontSize: 11, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          display: 'inline-flex', alignItems: 'center', gap: 4, letterSpacing: 0.3,
        }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Suggestion
        </button>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#fff', border: '2px solid #1f1a14', borderRadius: 14,
        padding: '10px 14px', marginBottom: 12, boxShadow: '0 3px 0 #1f1a14',
      }}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#1f1a14" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Rechercher une suggestion…"
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'inherit', fontSize: 14, color: '#1f1a14' }}
        />
        {q && <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a6b55', fontSize: 18, padding: 0 }}>×</button>}
      </div>

      <div className="chips-scroll" style={{ marginBottom: 8 }}>
        {OCCASIONS.map(o => (
          <MultiChip key={o.v} option={o} on={occasions.includes(o.v)} onClick={() => toggle(setOccasions, occasions, o.v)} />
        ))}
      </div>
      <div className="chips-scroll" style={{ marginBottom: 18 }}>
        {CONTEXTS.map(c => (
          <MultiChip key={c.v} option={c} on={contexts.includes(c.v)} onClick={() => toggle(setContexts, contexts, c.v)} />
        ))}
      </div>

      {error && (
        <div style={{ padding: 14, background: '#f0a390', border: '2px solid #1f1a14',
          borderRadius: 12, fontSize: 12, color: '#1f1a14', marginBottom: 14 }}>
          Erreur de chargement : {error.message || String(error)}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#7a6b55', fontSize: 13 }}>
          Chargement des suggestions…
        </div>
      ) : (
        <>
          {filtered.map(s => <SuggestionCard key={s.id} s={s} onClick={setSelected} />)}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7a6b55' }}>
              Aucune suggestion trouvée.
            </div>
          )}
        </>
      )}

      <SuggestionDetailModal
        suggestion={selectedLatest}
        onClose={() => setSelected(null)}
        onEdit={() => { setEditing(selectedLatest); setSelected(null) }}
        onDelete={async (s) => {
          if (!window.confirm(`Supprimer « ${s.nom} » ?`)) return
          try {
            if (s.photo_url) await deleteSuggestionPhoto(s.photo_url).catch(() => {})
            await deleteSuggestion(s.id)
            setSelected(null)
            refresh()
          } catch (err) {
            window.alert(err.message || String(err))
          }
        }}
      />

      {showAdd && (
        <SuggestionForm
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); refresh() }}
        />
      )}
      {editing && (
        <SuggestionForm
          suggestion={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh() }}
        />
      )}
    </>
  )
}
