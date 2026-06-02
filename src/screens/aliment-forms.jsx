import { useEffect, useRef, useState } from 'react'
import { FormShell, Field, inputStyle } from './resto-forms.jsx'
import { addFood, updateFood } from '../lib/user-data.js'
import { uploadFoodPhoto, deleteFoodPhoto } from '../lib/storage.js'
import { CATEGORIES, PHOTOS_DETAIL, PHOTOS } from '../lib/foods-meta.js'

const VERDICT_OPTIONS = [
  { v: 'green', label: 'OK', bg: 'var(--pill-green)' },
  { v: 'amber', label: 'LIMITE', bg: 'var(--pill-amber)' },
  { v: 'red', label: 'NON', bg: 'var(--pill-red)' },
]

function VerdictPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {VERDICT_OPTIONS.map(o => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          style={{
            flex: 1, padding: '8px 10px', borderRadius: 999,
            border: '1.5px solid var(--ink)',
            background: value === o.v ? o.bg : 'var(--bg-card)',
            boxShadow: value === o.v ? '0 2px 0 var(--ink)' : 'none',
            fontSize: 11, fontWeight: 600, color: 'var(--ink)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function PhotoPicker({ existingUrl, file, onPick, onClear }) {
  const inputRef = useRef(null)
  const [previewFromFile, setPreviewFromFile] = useState(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- object-URL preview lifecycle (create + revoke)
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
        <div style={{
          position: 'relative',
          borderRadius: 12, border: '1.5px solid var(--ink)', overflow: 'hidden',
          boxShadow: '0 2px 0 var(--ink)',
        }}>
          <div role="img" aria-label="Aperçu de la photo" style={{
            height: 160, width: '100%',
            backgroundImage: `url("${visiblePreview}")`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }} />
          <div style={{ display: 'flex', gap: 6, padding: 8, background: 'var(--bg-card)' }}>
            <button type="button" onClick={triggerPick} style={{
              flex: 1, padding: '8px 12px', borderRadius: 999,
              border: '1.5px solid var(--ink)', background: 'var(--bg-card)', color: 'var(--ink)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>Changer</button>
            <button type="button" onClick={onClear} style={{
              padding: '8px 12px', borderRadius: 999,
              border: '1.5px solid var(--accent-error)', background: 'var(--bg-card)', color: 'var(--accent-error)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>Retirer</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={triggerPick} style={{
          width: '100%', padding: '14px 16px', borderRadius: 12,
          border: '1.5px dashed var(--ink)', background: 'var(--bg-card)', color: 'var(--text-muted)',
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <span aria-hidden="true">📷</span> Choisir une photo
        </button>
      )}
    </div>
  )
}

export function AlimentForm({ food, onClose, onSaved }) {
  const isEdit = !!food
  const [form, setForm] = useState({
    nom: food?.nom || '',
    cat: food?.cat || 'Féculents',
    midi: food?.midi || 'green',
    soir: food?.soir || 'green',
    note: food?.note || '',
    fodmap: food?.fodmap || '',
    contrainte: food?.contrainte || '',
    details: food?.details || '',
    recette: food?.recette || '',
  })
  // Photo state. existingUrl is what's already saved (food.photo_url); pendingFile is a newly-picked
  // File the user hasn't saved yet. cleared means the user tapped "Retirer" — applied on save.
  const [pendingFile, setPendingFile] = useState(null)
  const [cleared, setCleared] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const update = (k, v) => setForm(s => ({ ...s, [k]: v }))
  const valid = form.nom.trim() && form.cat && form.midi && form.soir
  const existingPhoto = !cleared && food?.photo_url
  const existingHero = existingPhoto || PHOTOS_DETAIL[food?.id] || PHOTOS[food?.id] || null

  const submit = async () => {
    if (!valid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const basePayload = {
        nom: form.nom.trim(),
        cat: form.cat,
        midi: form.midi,
        soir: form.soir,
        note: form.note.trim() || null,
        fodmap: form.fodmap.trim() || null,
        contrainte: form.contrainte.trim() || null,
        details: form.details.trim() || null,
        recette: form.recette.trim() || null,
        tags: food?.tags || [],
      }
      // Save text fields first so we have a stable id for the photo path
      let saved = isEdit
        ? await updateFood(food.id, basePayload)
        : await addFood(basePayload)

      const wantClear = isEdit && cleared && food.photo_url
      if (wantClear) {
        await deleteFoodPhoto(food.photo_url).catch(() => {})
        saved = await updateFood(saved.id, { ...basePayload, photo_url: null })
      }
      if (pendingFile) {
        if (food?.photo_url && !wantClear) {
          await deleteFoodPhoto(food.photo_url).catch(() => {})
        }
        const url = await uploadFoodPhoto(saved.id, pendingFile)
        saved = await updateFood(saved.id, { ...basePayload, photo_url: url })
      }
      onSaved(saved)
    } catch (err) {
      setError(err.message || "Erreur d'enregistrement")
      setSubmitting(false)
    }
  }

  return (
    <FormShell
      title={isEdit ? `Modifier · ${food.nom}` : 'Nouvel aliment'}
      onClose={onClose}
      onSubmit={submit}
      submitLabel={submitting ? 'Enregistrement…' : (isEdit ? 'Sauver' : 'Ajouter')}
      disabled={!valid || submitting}
      error={error}
    >
      <Field label="Nom *">
        <input value={form.nom} onChange={e => update('nom', e.target.value)} style={inputStyle} autoFocus={!isEdit} placeholder="Ex: Quinoa" />
      </Field>
      <Field label="Photo" hint="Optionnel — affichée en haut de la fiche.">
        <PhotoPicker
          existingUrl={existingHero}
          file={pendingFile}
          onPick={(f) => { setPendingFile(f); setCleared(false) }}
          onClear={() => { setPendingFile(null); setCleared(true) }}
        />
      </Field>
      <Field label="Catégorie *">
        <select value={form.cat} onChange={e => update('cat', e.target.value)}
          style={{...inputStyle, appearance: 'none', paddingRight: 36,
            backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%231f1a14' stroke-width='1.5' fill='none'/></svg>\")",
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Verdict midi *">
        <VerdictPicker value={form.midi} onChange={v => update('midi', v)} />
      </Field>
      <Field label="Verdict soir *">
        <VerdictPicker value={form.soir} onChange={v => update('soir', v)} />
      </Field>
      <Field label="Note" hint="Score subjectif, ex: 8/10">
        <input value={form.note} onChange={e => update('note', e.target.value)} style={inputStyle} placeholder="8/10" />
      </Field>
      <Field label="Rationale FODMAP" hint="Pourquoi c'est OK ou pas">
        <textarea value={form.fodmap} onChange={e => update('fodmap', e.target.value)} rows={3}
          style={{...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: 70}}
          placeholder="Ex: Faible en fructose, riche en fibres solubles…" />
      </Field>
      <Field label="Contrainte" hint="Limite de portion ou avertissement">
        <input value={form.contrainte} onChange={e => update('contrainte', e.target.value)} style={inputStyle} placeholder="Ex: Max 75g" />
      </Field>
      <Field label="Notes personnelles" hint="Observations, ressentis. Affiche l'icône ⓘ sur la liste.">
        <textarea value={form.details} onChange={e => update('details', e.target.value)} rows={4}
          style={{...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: 90}}
          placeholder="Ex: Bien toléré le matin avec œufs, à éviter le soir…" />
      </Field>
      <Field label="Recette" hint="Optionnel — markdown accepté (listes, tableaux…).">
        <textarea value={form.recette} onChange={e => update('recette', e.target.value)} rows={4}
          style={{...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: 90}}
          placeholder="Étapes de préparation, ingrédients…" />
      </Field>
    </FormShell>
  )
}
