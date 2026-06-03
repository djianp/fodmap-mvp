import { useEffect, useRef, useState } from 'react'
import { BlobLogo, Markdown } from '../components/ui.jsx'
import { useSubmitShortcut } from '../components/use-submit-shortcut.js'
import { useNotes, addNote, updateNote, deleteNote } from '../lib/user-data.js'

const iconBtnStyle = {
  width: 32, height: 32, borderRadius: 999, border: '2px solid var(--ink)',
  background: 'var(--bg-card)', boxShadow: '0 2px 0 var(--ink)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit', fontSize: 16, lineHeight: 1, color: 'var(--ink)', padding: 0,
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid var(--ink)',
  background: 'var(--bg-card)', fontSize: 14, color: 'var(--ink)', fontFamily: 'inherit',
  boxShadow: '0 2px 0 var(--ink)', outline: 'none', boxSizing: 'border-box',
}

const sectionLabelStyle = {
  display: 'block', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase',
  fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6,
}

// First ~2 lines of a note, with markdown punctuation stripped, for the card subtitle.
function previewOf(content) {
  return (content || '').replace(/[#>*_-]/g, ' ').replace(/\s+/g, ' ').trim()
}

function NoteCard({ note, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer',
      background: 'var(--bg-card)', border: '2px solid var(--ink)', borderRadius: 18,
      padding: 12, marginBottom: 14, boxShadow: '0 4px 0 var(--ink)',
      display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'inherit',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14, flexShrink: 0, background: 'var(--bg-comment)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="var(--ink)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5.5 3h8L19 8.5V20a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <path d="M13 3v6h6" />
          <path d="M8 13h7" />
          <path d="M8 16.5h7" />
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px', lineHeight: 1.2, color: 'var(--ink)' }}>{note.title}</div>
        <div style={{
          fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginTop: 3, lineHeight: 1.35,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{previewOf(note.content)}</div>
      </div>
    </button>
  )
}

// View markdown / edit (title + content) / create. The primary action is always "save"
// (bound to Cmd/Ctrl+Enter); "Supprimer" is a separate type="button" guarded by window.confirm.
function NoteModal({ note, onSave, onDelete, onClose }) {
  const isNew = !note
  const scrollRef = useRef(null)
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(isNew)
  const [title, setTitle] = useState(note?.title || '')
  const [content, setContent] = useState(note?.content || '')
  const [busy, setBusy] = useState(false)

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

  const canSave = !!title.trim() && !busy
  const save = async () => {
    if (!canSave) return
    setBusy(true)
    try {
      await onSave({ title: title.trim(), content })
      if (isNew) onClose()
      else setEditing(false)
    } catch (err) {
      window.alert('Impossible d’enregistrer : ' + (err.message || err))
    } finally {
      setBusy(false)
    }
  }
  const remove = async () => {
    if (!window.confirm(`Supprimer la note « ${note.title} » ?`)) return
    setBusy(true)
    try {
      await onDelete()
      onClose()
    } catch (err) {
      setBusy(false)
      window.alert('Impossible de supprimer : ' + (err.message || err))
    }
  }
  useSubmitShortcut(save, editing && canSave)

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
          <div style={{
            fontWeight: 700, fontSize: 18, letterSpacing: '-0.4px', minWidth: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {editing ? (isNew ? 'Nouvelle note' : 'Modifier la note') : note.title}
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {!editing && (
              <button onClick={() => { setTitle(note.title); setContent(note.content); setEditing(true) }} aria-label="Modifier" title="Modifier" style={iconBtnStyle}>
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
              <label style={sectionLabelStyle}>Titre</label>
              <input value={title} onChange={e => setTitle(e.target.value)} autoFocus={isNew}
                placeholder="Ex. : Le gras" style={{ ...inputStyle, marginBottom: 14 }} />
              <label style={sectionLabelStyle}>Contenu</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={14}
                placeholder="Écrivez votre note en markdown…"
                style={{ ...inputStyle, resize: 'vertical', minHeight: 260 }} />
              <div style={{ fontSize: 10, color: 'var(--text-hint)', marginTop: 4 }}>
                Markdown supporté — titres, listes, **gras**, tableaux, &gt; citation.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
                {!isNew && (
                  <button type="button" onClick={remove} disabled={busy} style={{
                    marginRight: 'auto', background: 'none', border: 'none', color: 'var(--accent-error)',
                    fontSize: 12, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', textDecoration: 'underline', padding: 0,
                  }}>Supprimer</button>
                )}
                <button type="button" onClick={isNew ? onClose : () => setEditing(false)} style={{
                  marginLeft: isNew ? 'auto' : 0, padding: '10px 16px', borderRadius: 999,
                  border: '1.5px solid var(--ink)', background: 'var(--bg-card)', color: 'var(--ink)',
                  fontSize: 13, fontWeight: 600, boxShadow: '0 2px 0 var(--ink)', cursor: 'pointer', fontFamily: 'inherit',
                }}>Annuler</button>
                <button type="button" onClick={save} disabled={!canSave} style={{
                  padding: '10px 18px', borderRadius: 999, border: '2px solid var(--ink)',
                  background: canSave ? 'var(--ink)' : 'var(--bg-disabled)',
                  color: canSave ? 'var(--paper)' : 'var(--text-muted)',
                  fontSize: 13, fontWeight: 700, boxShadow: canSave ? '0 3px 0 var(--ink)' : 'none',
                  cursor: canSave ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                }}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.4 }}>
              <Markdown>{note.content}</Markdown>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  )
}

export function MVPNotesScreen() {
  const { notes, loading, error, refresh } = useNotes()
  const [openId, setOpenId] = useState(null) // note id | 'new' | null

  const openNote = openId && openId !== 'new' ? notes.find(n => n.id === openId) : null

  const handleSave = async ({ title, content }) => {
    if (openId === 'new') await addNote({ title, content })
    else await updateNote(openId, { title, content })
    await refresh()
  }
  const handleDelete = async () => {
    await deleteNote(openId)
    await refresh()
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <BlobLogo size={30} />
        <div style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.6px' }}>Notes</div>
        <button onClick={() => setOpenId('new')} style={{
          marginLeft: 'auto', padding: '6px 12px', borderRadius: 999,
          background: 'var(--ink)', color: 'var(--paper)', border: '2px solid var(--ink)',
          boxShadow: '0 2px 0 var(--ink)', fontSize: 11, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4, letterSpacing: 0.3,
        }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Note
        </button>
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 18 }}>
        Vos fiches et mémos sur le régime
      </div>

      {error && (
        <div style={{ padding: '10px 12px', background: 'var(--pill-red)', border: '1.5px solid var(--ink)',
          borderRadius: 10, fontSize: 12, color: 'var(--ink)', marginBottom: 14 }}>
          Impossible de charger les notes : {error.message || String(error)}
        </div>
      )}

      {notes.map(n => (
        <NoteCard key={n.id} note={n} onClick={() => setOpenId(n.id)} />
      ))}

      {!loading && !error && notes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
          Aucune note pour le moment. Touchez « + Note » pour en créer une.
        </div>
      )}

      {openId !== null && (
        <NoteModal
          note={openNote}
          onSave={handleSave}
          onDelete={openNote ? handleDelete : null}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  )
}
