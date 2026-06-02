import { useEffect, useRef, useState } from 'react'
import { FormShell, Field, inputStyle } from './resto-forms.jsx'
import { addReintroProtocol, updateReintroProtocol } from '../lib/user-data.js'
import { uploadReintroPhoto, deleteReintroPhoto } from '../lib/storage.js'

function slugify(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

// Local photo picker — same shape as the one in suggestion-forms.jsx / aliment-forms.jsx.
function PhotoPicker({ existingUrl, file, onPick, onClear }) {
  const inputRef = useRef(null)
  const [previewFromFile, setPreviewFromFile] = useState(null)

  useEffect(() => {
    if (!file) { setPreviewFromFile(null); return }
    const url = URL.createObjectURL(file)
    setPreviewFromFile(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const visiblePreview = previewFromFile || existingUrl
  const triggerPick = () => inputRef.current?.click()
  const onChange = (e) => {
    const f = e.target.files?.[0]
    if (f) onPick(f)
    e.target.value = ''
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" onChange={onChange} style={{ display: 'none' }} />
      {visiblePreview ? (
        <div style={{ position: 'relative', borderRadius: 12, border: '1.5px solid var(--ink)', overflow: 'hidden', boxShadow: '0 2px 0 var(--ink)' }}>
          <div role="img" aria-label="Aperçu de la photo" style={{
            height: 160, width: '100%',
            backgroundImage: `url("${visiblePreview}")`, backgroundSize: 'cover', backgroundPosition: 'center',
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

function DoseInput({ label, value, onChange, placeholder }) {
  return (
    <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</span>
      <input value={value} onChange={e => onChange(e.target.value)} style={inputStyle} placeholder={placeholder} />
    </label>
  )
}

export function TestForm({ protocol, onClose, onSaved }) {
  const isEdit = !!protocol
  const [foodName, setFoodName] = useState(protocol?.foodName || '')
  const [family, setFamily] = useState(protocol?.fodmapFamily || '')
  const [doseDay1, setDoseDay1] = useState(protocol?.doseDay1 || '')
  const [doseDay3, setDoseDay3] = useState(protocol?.doseDay3 || '')
  const [doseDay5, setDoseDay5] = useState(protocol?.doseDay5 || '')
  const [pendingFile, setPendingFile] = useState(null)
  const [cleared, setCleared] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const valid = foodName.trim()
  const existingPhoto = !cleared && protocol?.photoUrl

  const submit = async () => {
    if (!valid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      let saved
      if (isEdit) {
        saved = await updateReintroProtocol(protocol.id, {
          food_name: foodName.trim(),
          fodmap_family: family.trim() || null,
          dose_day_1: doseDay1.trim() || null,
          dose_day_3: doseDay3.trim() || null,
          dose_day_5: doseDay5.trim() || null,
        })
      } else {
        const id = `${slugify(foodName) || 'test'}-${Math.random().toString(36).slice(2, 8)}`
        saved = await addReintroProtocol({
          id,
          foodName: foodName.trim(),
          fodmapFamily: family.trim(),
          doseDay1: doseDay1.trim(),
          doseDay3: doseDay3.trim(),
          doseDay5: doseDay5.trim(),
        })
      }

      const wantClear = isEdit && cleared && protocol.photoUrl
      if (wantClear) {
        await deleteReintroPhoto(protocol.photoUrl).catch(() => {})
        saved = await updateReintroProtocol(saved.id, { photo_url: null })
      }
      if (pendingFile) {
        if (protocol?.photoUrl && !wantClear) await deleteReintroPhoto(protocol.photoUrl).catch(() => {})
        const url = await uploadReintroPhoto(saved.id, pendingFile)
        saved = await updateReintroProtocol(saved.id, { photo_url: url })
      }
      onSaved(saved)
    } catch (err) {
      setError(err.message || "Erreur d’enregistrement")
      setSubmitting(false)
    }
  }

  return (
    <FormShell title={isEdit ? `Modifier · ${protocol.foodName}` : 'Nouveau test'}
      onClose={onClose} onSubmit={submit}
      submitLabel={submitting ? 'Enregistrement…' : (isEdit ? 'Sauver' : 'Ajouter')}
      disabled={!valid || submitting} error={error}>
      <Field label="Aliment *">
        <input value={foodName} onChange={e => setFoodName(e.target.value)} style={inputStyle} autoFocus={!isEdit} placeholder="Ex: Yaourt nature" />
      </Field>
      <Field label="Type de test" hint="La famille FODMAP testée — affichée sous le nom.">
        <input value={family} onChange={e => setFamily(e.target.value)} style={inputStyle} placeholder="Ex: Test Lactose" />
      </Field>
      <Field label="Doses des jours de test" hint="Laisser vide pour utiliser la dose standard. Texte libre — ex : « un quart d’avocat ».">
        <div style={{ display: 'flex', gap: 8 }}>
          <DoseInput label="Jour 1" value={doseDay1} onChange={setDoseDay1} placeholder="100 g" />
          <DoseInput label="Jour 3" value={doseDay3} onChange={setDoseDay3} placeholder="150 g" />
          <DoseInput label="Jour 5" value={doseDay5} onChange={setDoseDay5} placeholder="200 g" />
        </div>
      </Field>
      <Field label="Photo" hint="Optionnel — sinon une pastille avec l’initiale est utilisée.">
        <PhotoPicker
          existingUrl={existingPhoto}
          file={pendingFile}
          onPick={(f) => { setPendingFile(f); setCleared(false) }}
          onClear={() => { setPendingFile(null); setCleared(true) }}
        />
      </Field>
      {!isEdit && (
        <div style={{ fontSize: 11, color: 'var(--text-hint)', lineHeight: 1.4 }}>
          Le test suivra le protocole standard en 5 jours. La recette et les aliments associés
          pourront être renseignés ensuite, depuis la fiche du test.
        </div>
      )}
    </FormShell>
  )
}
