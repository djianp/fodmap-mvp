import { useEffect, useRef, useState } from 'react'
import { FormShell, Field, inputStyle } from './resto-forms.jsx'
import { addReintroProtocol, updateReintroProtocol } from '../lib/user-data.js'
import { uploadReintroPhoto } from '../lib/storage.js'

function slugify(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

// Local photo picker — same shape as the one in suggestion-forms.jsx / aliment-forms.jsx.
function PhotoPicker({ file, onPick, onClear }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    if (!file) { setPreview(null); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const triggerPick = () => inputRef.current?.click()
  const onChange = (e) => {
    const f = e.target.files?.[0]
    if (f) onPick(f)
    e.target.value = ''
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" onChange={onChange} style={{ display: 'none' }} />
      {preview ? (
        <div style={{ position: 'relative', borderRadius: 12, border: '1.5px solid var(--ink)', overflow: 'hidden', boxShadow: '0 2px 0 var(--ink)' }}>
          <div role="img" aria-label="Aperçu de la photo" style={{
            height: 160, width: '100%',
            backgroundImage: `url("${preview}")`, backgroundSize: 'cover', backgroundPosition: 'center',
          }} />
          <div style={{ display: 'flex', gap: 6, padding: 8, background: 'var(--bg-card)' }}>
            <button type="button" onClick={triggerPick} style={{
              flex: 1, padding: '8px 12px', borderRadius: 999, border: '1.5px solid var(--ink)',
              background: 'var(--bg-card)', color: 'var(--ink)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>Changer</button>
            <button type="button" onClick={onClear} style={{
              padding: '8px 12px', borderRadius: 999, border: '1.5px solid var(--accent-error)',
              background: 'var(--bg-card)', color: 'var(--accent-error)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>Retirer</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={triggerPick} style={{
          width: '100%', padding: '14px 16px', borderRadius: 12, border: '1.5px dashed var(--ink)',
          background: 'var(--bg-card)', color: 'var(--text-muted)', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span aria-hidden="true">📷</span> Choisir une photo
        </button>
      )}
    </div>
  )
}

export function AddTestForm({ onClose, onSaved }) {
  const [foodName, setFoodName] = useState('')
  const [family, setFamily] = useState('')
  const [pendingFile, setPendingFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const valid = foodName.trim()

  const submit = async () => {
    if (!valid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const id = `${slugify(foodName) || 'test'}-${Math.random().toString(36).slice(2, 8)}`
      let saved = await addReintroProtocol({ id, foodName: foodName.trim(), fodmapFamily: family.trim() })
      if (pendingFile) {
        const url = await uploadReintroPhoto(saved.id, pendingFile)
        saved = await updateReintroProtocol(saved.id, { photo_url: url })
      }
      onSaved(saved)
    } catch (err) {
      setError(err.message || "Erreur d'enregistrement")
      setSubmitting(false)
    }
  }

  return (
    <FormShell title="Nouveau test" onClose={onClose} onSubmit={submit}
      submitLabel={submitting ? 'Enregistrement…' : 'Ajouter'} disabled={!valid || submitting} error={error}>
      <Field label="Aliment *">
        <input value={foodName} onChange={e => setFoodName(e.target.value)} style={inputStyle} autoFocus placeholder="Ex: Yaourt nature" />
      </Field>
      <Field label="Type de test" hint="La famille FODMAP testée — affichée sous le nom.">
        <input value={family} onChange={e => setFamily(e.target.value)} style={inputStyle} placeholder="Ex: Test Lactose" />
      </Field>
      <Field label="Photo" hint="Optionnel — sinon une pastille avec l’initiale est utilisée.">
        <PhotoPicker file={pendingFile} onPick={setPendingFile} onClear={() => setPendingFile(null)} />
      </Field>
      <div style={{ fontSize: 11, color: 'var(--text-hint)', lineHeight: 1.4 }}>
        Le test suivra le protocole standard en 5 jours (100 / 150 / 200 g). La recette et les
        aliments associés pourront être renseignés ensuite, depuis la fiche du test.
      </div>
    </FormShell>
  )
}
