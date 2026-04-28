import { useState } from 'react'
import { FormShell, Field, inputStyle } from './resto-forms.jsx'
import { addFood, updateFood } from '../lib/user-data.js'
import { CATEGORIES } from '../lib/foods-meta.js'

const VERDICT_OPTIONS = [
  { v: 'green', label: 'OK', bg: '#b8d398' },
  { v: 'amber', label: 'LIMITE', bg: '#f5c887' },
  { v: 'red', label: 'NON', bg: '#f0a390' },
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
            border: '1.5px solid #1f1a14',
            background: value === o.v ? o.bg : '#fff',
            boxShadow: value === o.v ? '0 2px 0 #1f1a14' : 'none',
            fontSize: 11, fontWeight: 600, color: '#1f1a14',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {o.label}
        </button>
      ))}
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
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const update = (k, v) => setForm(s => ({ ...s, [k]: v }))
  const valid = form.nom.trim() && form.cat && form.midi && form.soir

  const submit = async () => {
    if (!valid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        nom: form.nom.trim(),
        cat: form.cat,
        midi: form.midi,
        soir: form.soir,
        note: form.note.trim() || null,
        fodmap: form.fodmap.trim() || null,
        contrainte: form.contrainte.trim() || null,
        details: form.details.trim() || null,
        tags: food?.tags || [],
      }
      const saved = isEdit
        ? await updateFood(food.id, payload)
        : await addFood(payload)
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
        <input value={form.nom} onChange={e => update('nom', e.target.value)} style={inputStyle} autoFocus={!isEdit} placeholder="Ex. Quinoa" />
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
      <Field label="Note" hint="Score subjectif, ex. 8/10">
        <input value={form.note} onChange={e => update('note', e.target.value)} style={inputStyle} placeholder="8/10" />
      </Field>
      <Field label="Rationale FODMAP" hint="Pourquoi c'est OK ou pas">
        <textarea value={form.fodmap} onChange={e => update('fodmap', e.target.value)} rows={3}
          style={{...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: 70}}
          placeholder="Ex. Faible en fructose, riche en fibres solubles…" />
      </Field>
      <Field label="Contrainte" hint="Limite de portion ou avertissement">
        <input value={form.contrainte} onChange={e => update('contrainte', e.target.value)} style={inputStyle} placeholder="Max 75g" />
      </Field>
      <Field label="Notes personnelles" hint="Recettes, observations, ressentis. Affiche l'icône ⓘ sur la liste.">
        <textarea value={form.details} onChange={e => update('details', e.target.value)} rows={4}
          style={{...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: 90}}
          placeholder="Ex. Bien toléré le matin avec œufs, à éviter le soir…" />
      </Field>
    </FormShell>
  )
}
