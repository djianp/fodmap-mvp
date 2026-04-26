import { useEffect, useState } from 'react'
import { addResto, addMeal } from '../lib/user-data.js'

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
        fontWeight: 700, color: '#7a6b55', marginBottom: 6 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 10, color: '#a39a8d', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1.5px solid #1f1a14', background: '#fff',
  fontSize: 14, color: '#1f1a14', fontFamily: 'inherit',
  boxShadow: '0 2px 0 #1f1a14', outline: 'none', boxSizing: 'border-box',
}

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
              fontSize: 28, lineHeight: 1, color: '#d9c3a0', pointerEvents: 'none' }}>★</div>
            {fillPct > 0 && (
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${fillPct}%`,
                pointerEvents: 'none' }}>
                <div style={{ width: 30, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, lineHeight: 1, color: '#e67f52' }}>★</div>
              </div>
            )}
            <button type="button"
              onClick={() => onChange(i - 0.5)}
              onMouseEnter={() => setHover(i - 0.5)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${i - 0.5} étoiles`}
              style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%',
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }} />
            <button type="button"
              onClick={() => onChange(i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${i} étoiles`}
              style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%',
                background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }} />
          </div>
        )
      })}
      <span style={{ marginLeft: 8, fontSize: 12, color: '#7a6b55', fontWeight: 600 }}>
        {value ? `${value}/5` : ''}
      </span>
    </div>
  )
}

function FormShell({ title, onClose, onSubmit, submitLabel, disabled, error, children }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 40,
      background: 'rgba(31,26,20,0.55)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '40px 14px 90px',
    }}>
      <form onSubmit={e => { e.preventDefault(); onSubmit() }}
        onClick={e => e.stopPropagation()} style={{
          width: '100%', maxHeight: '100%', overflowY: 'auto',
          background: '#f5f0e6', borderRadius: 22, border: '2px solid #1f1a14',
          boxShadow: '0 8px 0 #1f1a14', position: 'relative',
          animation: 'slideUp 0.22s ease-out',
        }}>
        <div style={{
          padding: '16px 18px 14px', borderBottom: '2px dashed rgba(31,26,20,0.18)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.4px' }}>{title}</div>
          <button type="button" onClick={onClose} aria-label="Fermer" style={{
            width: 32, height: 32, borderRadius: 999, border: '2px solid #1f1a14',
            background: '#fff', boxShadow: '0 2px 0 #1f1a14', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'inherit', fontSize: 16, lineHeight: 1, color: '#1f1a14',
          }}>×</button>
        </div>
        <div style={{ padding: '16px 18px' }}>
          {children}
          {error && (
            <div style={{ padding: '10px 12px', background: '#f0a390',
              border: '1.5px solid #1f1a14', borderRadius: 10, fontSize: 12,
              color: '#1f1a14', marginTop: 8 }}>
              {error}
            </div>
          )}
        </div>
        <div style={{
          padding: '12px 18px 18px', borderTop: '2px dashed rgba(31,26,20,0.18)',
          display: 'flex', gap: 8, justifyContent: 'flex-end',
        }}>
          <button type="button" onClick={onClose} style={{
            padding: '10px 16px', borderRadius: 999, border: '1.5px solid #1f1a14',
            background: '#fff', color: '#1f1a14', fontSize: 13, fontWeight: 600,
            boxShadow: '0 2px 0 #1f1a14', cursor: 'pointer', fontFamily: 'inherit',
          }}>Annuler</button>
          <button type="submit" disabled={disabled} style={{
            padding: '10px 18px', borderRadius: 999, border: '2px solid #1f1a14',
            background: disabled ? '#d9c3a0' : '#1f1a14',
            color: disabled ? '#7a6b55' : '#f5f0e6',
            fontSize: 13, fontWeight: 700, boxShadow: disabled ? 'none' : '0 3px 0 #1f1a14',
            cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}>{submitLabel}</button>
        </div>
      </form>
    </div>
  )
}

export function AddRestoForm({ onClose, onSaved }) {
  const [form, setForm] = useState({
    nom: '', adresse: '', phone: '',
    distance_bureau: '', distance_domicile: '',
    rating: 4, takeaway: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const update = (k, v) => setForm(s => ({ ...s, [k]: v }))
  const valid = form.nom.trim() && form.adresse.trim() && form.rating

  const submit = async () => {
    if (!valid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const saved = await addResto({
        nom: form.nom.trim(),
        adresse: form.adresse.trim(),
        phone: form.phone.trim() || '',
        distance_bureau: parseFloat(form.distance_bureau) || 0,
        distance_domicile: parseFloat(form.distance_domicile) || 0,
        rating: parseFloat(form.rating),
        takeaway: !!form.takeaway,
      })
      onSaved(saved)
    } catch (err) {
      setError(err.message || 'Erreur d’enregistrement')
      setSubmitting(false)
    }
  }

  return (
    <FormShell title="Nouveau restaurant" onClose={onClose} onSubmit={submit}
      submitLabel={submitting ? 'Enregistrement…' : 'Ajouter'}
      disabled={!valid || submitting} error={error}>
      <Field label="Nom *">
        <input value={form.nom} onChange={e => update('nom', e.target.value)}
          placeholder="Ex. Le Petit Marguery" style={inputStyle} autoFocus />
      </Field>
      <Field label="Adresse *">
        <input value={form.adresse} onChange={e => update('adresse', e.target.value)}
          placeholder="Ex. 9 bd de Port-Royal, 75013" style={inputStyle} />
      </Field>
      <Field label="Téléphone" hint="Pour le bouton « Appeler »">
        <input value={form.phone} onChange={e => update('phone', e.target.value)}
          placeholder="+33 1 43 XX XX XX" style={inputStyle} type="tel" />
      </Field>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <Field label="Distance bureau (km)">
            <input value={form.distance_bureau} onChange={e => update('distance_bureau', e.target.value)}
              type="number" step="0.1" min="0" placeholder="1.2" style={inputStyle} />
          </Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label="Distance domicile (km)">
            <input value={form.distance_domicile} onChange={e => update('distance_domicile', e.target.value)}
              type="number" step="0.1" min="0" placeholder="0.8" style={inputStyle} />
          </Field>
        </div>
      </div>
      <Field label="Note générale *">
        <StarInput value={form.rating} onChange={v => update('rating', v)} />
      </Field>
      <Field label="Options">
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          padding: '10px 12px', border: '1.5px solid #1f1a14', borderRadius: 10,
          background: form.takeaway ? '#b8d398' : '#fff',
          boxShadow: '0 2px 0 #1f1a14' }}>
          <input type="checkbox" checked={form.takeaway}
            onChange={e => update('takeaway', e.target.checked)}
            style={{ width: 18, height: 18, accentColor: '#1f1a14', margin: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Propose de la vente à emporter</span>
        </label>
      </Field>
    </FormShell>
  )
}

export function AddMealForm({ resto, proteines, onClose, onSaved }) {
  const existingProteines = (proteines || []).filter(p => p !== 'Toutes')
  const [form, setForm] = useState({
    nom: '', proteine: '', proteine_custom: '',
    rating: 4, comment: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const update = (k, v) => setForm(s => ({ ...s, [k]: v }))
  const proteineValue = form.proteine === '__new' ? form.proteine_custom.trim() : form.proteine
  const valid = form.nom.trim() && proteineValue && form.rating

  const submit = async () => {
    if (!valid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await addMeal(resto.id, {
        nom: form.nom.trim(),
        proteine: proteineValue,
        rating: parseFloat(form.rating),
        comment: form.comment.trim(),
      })
      onSaved()
    } catch (err) {
      setError(err.message || 'Erreur d’enregistrement')
      setSubmitting(false)
    }
  }

  return (
    <FormShell title={`Nouveau plat · ${resto.nom}`} onClose={onClose} onSubmit={submit}
      submitLabel={submitting ? 'Enregistrement…' : 'Ajouter'}
      disabled={!valid || submitting} error={error}>
      <Field label="Nom du plat *" hint="Terminer par le prix entre parenthèses, ex. (22€)">
        <input value={form.nom} onChange={e => update('nom', e.target.value)}
          placeholder="Ex. Dorade grillée, riz blanc (24€)" style={inputStyle} autoFocus />
      </Field>
      <Field label="Protéine *">
        <select value={form.proteine} onChange={e => update('proteine', e.target.value)}
          style={{...inputStyle, appearance: 'none', paddingRight: 36,
            backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%231f1a14' stroke-width='1.5' fill='none'/></svg>\")",
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}>
          <option value="">— Choisir —</option>
          {existingProteines.map(p => <option key={p} value={p}>{p}</option>)}
          <option value="__new">+ Autre (saisir)</option>
        </select>
        {form.proteine === '__new' && (
          <input value={form.proteine_custom}
            onChange={e => update('proteine_custom', e.target.value)}
            placeholder="Ex. dorade, cabillaud, tofu…"
            style={{ ...inputStyle, marginTop: 8 }} />
        )}
      </Field>
      <Field label="Note *">
        <StarInput value={form.rating} onChange={v => update('rating', v)} />
      </Field>
      <Field label="Commentaire" hint="Ce qu'il faut demander, ce qu'il faut éviter, etc.">
        <textarea value={form.comment} onChange={e => update('comment', e.target.value)}
          placeholder="Ex. sauce à part, sans ail, bien cuit"
          rows={3} style={{ ...inputStyle, resize: 'vertical', minHeight: 72, fontFamily: 'inherit' }} />
      </Field>
    </FormShell>
  )
}
