import { useEffect, useRef, useState } from 'react'
import { FormShell, Field, inputStyle } from './resto-forms.jsx'
import { addSuggestion, updateSuggestion, deleteSuggestion } from '../lib/user-data.js'
import { uploadSuggestionPhoto, deleteSuggestionPhoto } from '../lib/storage.js'
import { OCCASIONS, CONTEXTS } from '../lib/suggestions-meta.js'

function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value || 0
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[1,2,3,4,5].map(i => {
        const fillPct = Math.max(0, Math.min(1, shown - (i - 1))) >= 1 ? 100
                      : Math.max(0, Math.min(1, shown - (i - 1))) >= 0.5 ? 50 : 0
        return (
          <div key={i} style={{ position: 'relative', width: 30, height: 32 }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, lineHeight: 1, color: 'var(--bg-disabled)', pointerEvents: 'none' }}>★</div>
            {fillPct > 0 && (
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${fillPct}%`, pointerEvents: 'none' }}>
                <div style={{ width: 30, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, lineHeight: 1, color: 'var(--accent-orange)' }}>★</div>
              </div>
            )}
            <button type="button" onClick={() => onChange(i - 0.5)}
              onMouseEnter={() => setHover(i - 0.5)} onMouseLeave={() => setHover(0)}
              aria-label={`${i - 0.5} étoiles`}
              style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%',
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }} />
            <button type="button" onClick={() => onChange(i)}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
              aria-label={`${i} étoiles`}
              style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%',
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }} />
          </div>
        )
      })}
      {value ? (
        <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{value}/5</span>
          <button type="button" onClick={() => onChange(null)} aria-label="Retirer la note" style={{
            width: 20, height: 20, borderRadius: 999,
            border: '1.5px solid var(--text-muted)', background: 'var(--bg-card)',
            color: 'var(--text-muted)', fontSize: 12, lineHeight: 1, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            padding: 0, fontFamily: 'inherit',
          }}>×</button>
        </span>
      ) : null}
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

function MultiChips({ options, value, onToggle }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map(o => {
        const on = value.includes(o.v)
        return (
          <button key={o.v} type="button" onClick={() => onToggle(o.v)} style={{
            padding: '7px 12px', borderRadius: 999,
            border: '1.5px solid var(--ink)',
            background: on ? 'var(--ink)' : 'var(--bg-card)',
            color: on ? 'var(--paper)' : 'var(--ink)',
            fontSize: 12, fontWeight: 500,
            boxShadow: on ? 'none' : '0 2px 0 var(--ink)',
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'inline-flex', alignItems: 'center', gap: 6, lineHeight: 1,
          }}>
            <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1 }}>{o.icon}</span>
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function SuggestionForm({ suggestion, onClose, onSaved }) {
  const isEdit = !!suggestion
  const [form, setForm] = useState({
    nom: suggestion?.nom || '',
    occasions: suggestion?.occasions || [],
    contexts: suggestion?.contexts || [],
    rating: suggestion?.rating ?? null,
    infos_cles: suggestion?.infos_cles || '',
    comment: suggestion?.comment || '',
    recette: suggestion?.recette || '',
    to_try: !!suggestion?.to_try,
  })
  const [pendingFile, setPendingFile] = useState(null)
  const [cleared, setCleared] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  const update = (k, v) => setForm(s => ({ ...s, [k]: v }))
  const toggle = (k, v) => setForm(s => ({
    ...s,
    [k]: s[k].includes(v) ? s[k].filter(x => x !== v) : [...s[k], v],
  }))
  const valid = form.nom.trim()
  const existingPhoto = !cleared && suggestion?.photo_url

  const submit = async () => {
    if (!valid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const basePayload = {
        nom: form.nom.trim(),
        occasions: form.occasions,
        contexts: form.contexts,
        rating: form.rating ? parseFloat(form.rating) : null,
        infos_cles: form.infos_cles.trim() || null,
        comment: form.comment.trim() || null,
        recette: form.recette.trim() || null,
        to_try: form.to_try,
      }
      let saved = isEdit
        ? await updateSuggestion(suggestion.id, basePayload)
        : await addSuggestion(basePayload)

      const wantClear = isEdit && cleared && suggestion.photo_url
      if (wantClear) {
        await deleteSuggestionPhoto(suggestion.photo_url).catch(() => {})
        saved = await updateSuggestion(saved.id, { ...basePayload, photo_url: null })
      }
      if (pendingFile) {
        if (suggestion?.photo_url && !wantClear) {
          await deleteSuggestionPhoto(suggestion.photo_url).catch(() => {})
        }
        const url = await uploadSuggestionPhoto(saved.id, pendingFile)
        saved = await updateSuggestion(saved.id, { ...basePayload, photo_url: url })
      }
      onSaved(saved)
    } catch (err) {
      setError(err.message || "Erreur d'enregistrement")
      setSubmitting(false)
    }
  }

  const onDelete = async () => {
    if (!isEdit || deleting) return
    if (!window.confirm(`Supprimer « ${suggestion.nom} » ?`)) return
    setDeleting(true)
    setError(null)
    try {
      if (suggestion.photo_url) await deleteSuggestionPhoto(suggestion.photo_url).catch(() => {})
      await deleteSuggestion(suggestion.id)
      onSaved()
    } catch (err) {
      setError(err.message || 'Erreur de suppression')
      setDeleting(false)
    }
  }

  return (
    <FormShell
      title={isEdit ? `Modifier · ${suggestion.nom}` : 'Nouvelle suggestion'}
      onClose={onClose}
      onSubmit={submit}
      submitLabel={submitting ? 'Enregistrement…' : (isEdit ? 'Sauver' : 'Ajouter')}
      disabled={!valid || submitting}
      error={error}
    >
      <Field label="Nom *">
        <input value={form.nom} onChange={e => update('nom', e.target.value)} style={inputStyle} autoFocus={!isEdit} placeholder="Ex: Yaourt grec + myrtilles" />
      </Field>
      <Field label="Photo" hint="Optionnel — affichée sur la carte.">
        <PhotoPicker
          existingUrl={existingPhoto}
          file={pendingFile}
          onPick={(f) => { setPendingFile(f); setCleared(false) }}
          onClear={() => { setPendingFile(null); setCleared(true) }}
        />
      </Field>
      <Field label="Moment du repas" hint="Plusieurs choix possibles.">
        <MultiChips options={OCCASIONS} value={form.occasions} onToggle={(v) => toggle('occasions', v)} />
      </Field>
      <Field label="Contexte" hint="Plusieurs choix possibles.">
        <MultiChips options={CONTEXTS} value={form.contexts} onToggle={(v) => toggle('contexts', v)} />
      </Field>
      <Field label="Note" hint={form.rating ? null : "Optionnel — laisser vide pour ne pas noter"}>
        <StarInput value={form.rating} onChange={v => update('rating', v)} />
      </Field>
      <Field label="Statut">
        <button type="button" onClick={() => update('to_try', !form.to_try)} style={{
          padding: '8px 14px', borderRadius: 999,
          border: '1.5px solid var(--ink)',
          background: form.to_try ? 'var(--pill-red)' : 'var(--bg-card)',
          color: 'var(--ink)', fontSize: 12, fontWeight: 600,
          boxShadow: form.to_try ? '0 2px 0 var(--ink)' : 'none',
          cursor: 'pointer', fontFamily: 'inherit',
          display: 'inline-flex', alignItems: 'center', gap: 6, lineHeight: 1,
        }}>
          <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1 }}>🧪</span>
          À tester
        </button>
      </Field>
      <Field label="Infos clés" hint="Affiché sur la carte. Court — un détail rapide à retenir.">
        <input value={form.infos_cles} onChange={e => update('infos_cles', e.target.value)} style={inputStyle}
          placeholder="Ex: Rapide, sans cuisson" />
      </Field>
      <Field label="Commentaire" hint="Observations, ressentis.">
        <textarea value={form.comment} onChange={e => update('comment', e.target.value)} rows={4}
          style={{...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: 90}}
          placeholder="Ex: Servir tiède avec un filet de miel" />
      </Field>
      <Field label="Recette" hint="Optionnel — markdown accepté (listes, tableaux…).">
        <textarea value={form.recette} onChange={e => update('recette', e.target.value)} rows={4}
          style={{...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: 90}}
          placeholder="Étapes de préparation, ingrédients…" />
      </Field>
      {isEdit && (
        <button type="button" onClick={onDelete} disabled={deleting} style={{
          width: '100%', marginTop: 6,
          padding: '10px 16px', borderRadius: 999,
          background: 'var(--bg-card)', color: 'var(--accent-error)',
          border: '2px solid var(--accent-error)', boxShadow: deleting ? 'none' : '0 3px 0 var(--accent-error)',
          fontSize: 13, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        }}>{deleting ? 'Suppression…' : 'Supprimer cette suggestion'}</button>
      )}
    </FormShell>
  )
}
