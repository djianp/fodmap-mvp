import { useCallback, useEffect, useState } from 'react'
import { addResto, addMeal, updateMeal, deleteMeal, updateResto, deleteResto } from '../lib/user-data.js'
import { getRouteTimes } from '../lib/google-maps.js'
import { PlaceAutocomplete } from '../components/place-autocomplete.jsx'

export function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
        fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 10, color: 'var(--text-hint)', marginTop: 4 }}>{hint}</div>}
    </div>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- shared style constant, intentionally exported alongside the form components
export const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1.5px solid var(--ink)', background: 'var(--bg-card)',
  fontSize: 14, color: 'var(--ink)', fontFamily: 'inherit',
  boxShadow: '0 2px 0 var(--ink)', outline: 'none', boxSizing: 'border-box',
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
              fontSize: 28, lineHeight: 1, color: 'var(--bg-disabled)', pointerEvents: 'none' }}>★</div>
            {fillPct > 0 && (
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', width: `${fillPct}%`,
                pointerEvents: 'none' }}>
                <div style={{ width: 30, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, lineHeight: 1, color: 'var(--accent-orange)' }}>★</div>
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

function useVisualViewport() {
  const [vv, setVv] = useState(() => ({
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    offsetTop: 0,
  }))
  useEffect(() => {
    const vp = window.visualViewport
    if (!vp) return
    const onChange = () => setVv({ height: vp.height, offsetTop: vp.offsetTop })
    vp.addEventListener('resize', onChange)
    vp.addEventListener('scroll', onChange)
    onChange()
    return () => {
      vp.removeEventListener('resize', onChange)
      vp.removeEventListener('scroll', onChange)
    }
  }, [])
  return vv
}

export function FormShell({ title, onClose, onSubmit, submitLabel, disabled, error, children }) {
  const vv = useVisualViewport()
  const layoutHeight = typeof window !== 'undefined' ? window.innerHeight : vv.height
  const keyboardOpen = layoutHeight - vv.height > 100
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  return (
    <div onClick={onClose} style={{
      position: 'fixed', left: 0, width: '100%', zIndex: 40,
      top: vv.offsetTop, height: vv.height,
      background: 'var(--overlay)',
      display: 'flex',
      alignItems: keyboardOpen ? 'flex-start' : 'flex-end',
      justifyContent: 'center',
      padding: keyboardOpen ? '12px 14px 12px' : '40px 14px 90px',
    }}>
      <form onSubmit={e => { e.preventDefault(); onSubmit() }}
        onClick={e => e.stopPropagation()} style={{
          width: '100%', maxWidth: 430, maxHeight: '100%', overflowY: 'auto',
          background: 'var(--paper)', borderRadius: 22, border: '2px solid var(--ink)',
          boxShadow: '0 8px 0 var(--ink)', position: 'relative',
          animation: 'slideUp 0.22s ease-out',
        }}>
        <div style={{
          padding: '16px 18px 14px', borderBottom: '2px dashed var(--border-soft)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.4px' }}>{title}</div>
          <button type="button" onClick={onClose} aria-label="Fermer" style={{
            width: 32, height: 32, borderRadius: 999, border: '2px solid var(--ink)',
            background: 'var(--bg-card)', boxShadow: '0 2px 0 var(--ink)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'inherit', fontSize: 16, lineHeight: 1, color: 'var(--ink)',
          }}>×</button>
        </div>
        <div style={{ padding: '16px 18px' }}>
          {children}
          {error && (
            <div style={{ padding: '10px 12px', background: 'var(--pill-red)',
              border: '1.5px solid var(--ink)', borderRadius: 10, fontSize: 12,
              color: 'var(--ink)', marginTop: 8 }}>
              {error}
            </div>
          )}
        </div>
        <div style={{
          padding: '12px 18px 18px', borderTop: '2px dashed var(--border-soft)',
          display: 'flex', gap: 8, justifyContent: 'flex-end',
        }}>
          <button type="button" onClick={onClose} style={{
            padding: '10px 16px', borderRadius: 999, border: '1.5px solid var(--ink)',
            background: 'var(--bg-card)', color: 'var(--ink)', fontSize: 13, fontWeight: 600,
            boxShadow: '0 2px 0 var(--ink)', cursor: 'pointer', fontFamily: 'inherit',
          }}>Annuler</button>
          <button type="submit" disabled={disabled} style={{
            padding: '10px 18px', borderRadius: 999, border: '2px solid var(--ink)',
            background: disabled ? 'var(--bg-disabled)' : 'var(--ink)',
            color: disabled ? 'var(--text-muted)' : 'var(--paper)',
            fontSize: 13, fontWeight: 700, boxShadow: disabled ? 'none' : '0 3px 0 var(--ink)',
            cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          }}>{submitLabel}</button>
        </div>
      </form>
    </div>
  )
}

export function AddRestoForm({ onClose, onSaved }) {
  const [place, setPlace] = useState(null)
  const [walkTimes, setWalkTimes] = useState(null)
  const [walkLoading, setWalkLoading] = useState(false)
  const [walkError, setWalkError] = useState(null)
  const [rating, setRating] = useState(null)
  const [status, setStatus] = useState('dinein')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const onPlaceSelected = useCallback(async (p) => {
    setPlace(p)
    setWalkLoading(true)
    setWalkError(null)
    try {
      const times = await getRouteTimes({ lat: p.lat, lng: p.lng })
      setWalkTimes(times)
    } catch (err) {
      setWalkError(err.message || String(err))
    } finally {
      setWalkLoading(false)
    }
  }, [])

  const valid = place

  const submit = async () => {
    if (!valid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const saved = await addResto({
        nom: place.nom,
        adresse: place.adresse,
        phone: place.phone || '',
        place_id: place.place_id,
        lat: place.lat,
        lng: place.lng,
        walk_min_bureau: walkTimes?.walk_min_bureau ?? null,
        walk_min_domicile: walkTimes?.walk_min_domicile ?? null,
        drive_min_bureau: walkTimes?.drive_min_bureau ?? null,
        drive_min_domicile: walkTimes?.drive_min_domicile ?? null,
        rating: rating ? parseFloat(rating) : null,
        status,
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
      <Field label="Restaurant *" hint="Chercher un restaurant sur Google Maps">
        {place ? (
          <div style={{
            padding: 12, border: '1.5px solid var(--ink)', borderRadius: 10,
            background: 'var(--bg-card)', boxShadow: '0 2px 0 var(--ink)',
          }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{place.nom}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{place.adresse}</div>
            {place.phone && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{place.phone}</div>
            )}
            <button type="button" onClick={() => {
              setPlace(null); setWalkTimes(null); setWalkError(null)
            }} style={{
              marginTop: 8, fontSize: 11, fontWeight: 600,
              background: 'none', border: 'none', color: 'var(--accent-orange)',
              cursor: 'pointer', padding: 0, textDecoration: 'underline',
              fontFamily: 'inherit',
            }}>Changer de restaurant</button>
          </div>
        ) : (
          <PlaceAutocomplete onPlaceSelected={onPlaceSelected} />
        )}
      </Field>

      {place && (
        <Field label="Temps de marche">
          {walkLoading ? (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Calcul…
            </div>
          ) : walkError ? (
            <div style={{ fontSize: 12, color: 'var(--accent-error)' }}>
              Impossible de calculer : {walkError}
            </div>
          ) : walkTimes ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 10px', borderRadius: 999,
                background: 'var(--bg-soft)', border: '1.5px solid var(--ink)',
                fontSize: 11, fontWeight: 600 }}>
                🚶 {walkTimes.walk_min_bureau ?? '—'} min · bureau
              </span>
              <span style={{ padding: '4px 10px', borderRadius: 999,
                background: 'var(--bg-soft)', border: '1.5px solid var(--ink)',
                fontSize: 11, fontWeight: 600 }}>
                🚶 {walkTimes.walk_min_domicile ?? '—'} min · domicile
              </span>
              <span style={{ padding: '4px 10px', borderRadius: 999,
                background: 'var(--pill-lavender)', border: '1.5px solid var(--ink)',
                fontSize: 11, fontWeight: 600 }}>
                🚗 {walkTimes.drive_min_bureau ?? '—'} min · bureau
              </span>
              <span style={{ padding: '4px 10px', borderRadius: 999,
                background: 'var(--pill-lavender)', border: '1.5px solid var(--ink)',
                fontSize: 11, fontWeight: 600 }}>
                🚗 {walkTimes.drive_min_domicile ?? '—'} min · domicile
              </span>
            </div>
          ) : null}
        </Field>
      )}

      <Field label="Note générale" hint={rating ? null : "Optionnel — laisser vide pour ne pas noter"}>
        <StarInput value={rating} onChange={setRating} />
      </Field>

      <Field label="Statut">
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { v: 'dinein', label: 'Sur place', bg: 'var(--bg-card)' },
            { v: 'takeaway', label: 'À emporter', bg: 'var(--pill-green)' },
            { v: 'delivery', label: 'Livraison', bg: 'var(--pill-lavender)' },
            { v: 'totry', label: 'À tester', bg: 'var(--pill-red)' },
          ].map(o => (
            <button key={o.v} type="button" onClick={() => setStatus(o.v)} style={{
              flex: 1, padding: '8px 10px', borderRadius: 999,
              border: '1.5px solid var(--ink)',
              background: status === o.v ? o.bg : 'var(--bg-card)',
              boxShadow: status === o.v ? '0 2px 0 var(--ink)' : 'none',
              fontSize: 11, fontWeight: 600, color: 'var(--ink)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>{o.label}</button>
          ))}
        </div>
      </Field>
    </FormShell>
  )
}

export function EditRestoForm({ resto, onClose, onSaved }) {
  const [form, setForm] = useState({
    nom: resto.nom || '',
    phone: resto.phone || '',
    rating: resto.rating ?? null,
    status: resto.status || 'dinein',
  })
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const update = (k, v) => setForm(s => ({ ...s, [k]: v }))
  const valid = form.nom.trim()

  const submit = async () => {
    if (!valid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await updateResto(resto.id, {
        nom: form.nom.trim(),
        phone: form.phone.trim(),
        rating: form.rating ? parseFloat(form.rating) : null,
        status: form.status,
      })
      onSaved()
    } catch (err) {
      setError(err.message || 'Erreur d’enregistrement')
      setSubmitting(false)
    }
  }

  const onDelete = async () => {
    if (deleting) return
    if (!window.confirm(`Supprimer « ${resto.nom} » et tous ses plats ?`)) return
    setDeleting(true)
    setError(null)
    try {
      await deleteResto(resto.id)
      onSaved()
    } catch (err) {
      setError(err.message || 'Erreur de suppression')
      setDeleting(false)
    }
  }

  return (
    <FormShell title={`Modifier · ${resto.nom}`} onClose={onClose} onSubmit={submit}
      submitLabel={submitting ? 'Enregistrement…' : 'Sauver'}
      disabled={!valid || submitting} error={error}>
      <Field label="Nom *">
        <input value={form.nom} onChange={e => update('nom', e.target.value)} style={inputStyle} autoFocus />
      </Field>
      <Field label="Adresse" hint="Pour changer l’adresse, supprimez et ré-ajoutez le restaurant.">
        <input value={resto.adresse || ''} disabled style={{ ...inputStyle, color: 'var(--text-muted)', background: 'var(--bg-input-ro)' }} />
      </Field>
      <Field label="Téléphone">
        <input value={form.phone} onChange={e => update('phone', e.target.value)} style={inputStyle} placeholder="+33…" />
      </Field>
      <Field label="Note générale" hint={form.rating ? null : "Optionnel — laisser vide pour ne pas noter"}>
        <StarInput value={form.rating} onChange={v => update('rating', v)} />
      </Field>
      <Field label="Statut">
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { v: 'dinein', label: 'Sur place', bg: 'var(--bg-card)' },
            { v: 'takeaway', label: 'À emporter', bg: 'var(--pill-green)' },
            { v: 'delivery', label: 'Livraison', bg: 'var(--pill-lavender)' },
            { v: 'totry', label: 'À tester', bg: 'var(--pill-red)' },
          ].map(o => (
            <button key={o.v} type="button" onClick={() => update('status', o.v)} style={{
              flex: 1, padding: '8px 10px', borderRadius: 999,
              border: '1.5px solid var(--ink)',
              background: form.status === o.v ? o.bg : 'var(--bg-card)',
              boxShadow: form.status === o.v ? '0 2px 0 var(--ink)' : 'none',
              fontSize: 11, fontWeight: 600, color: 'var(--ink)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>{o.label}</button>
          ))}
        </div>
      </Field>
      <button type="button" onClick={onDelete} disabled={deleting} style={{
        width: '100%', marginTop: 6,
        padding: '10px 16px', borderRadius: 999,
        background: 'var(--bg-card)', color: 'var(--accent-error)',
        border: '2px solid var(--accent-error)', boxShadow: deleting ? 'none' : '0 3px 0 var(--accent-error)',
        fontSize: 13, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
      }}>{deleting ? 'Suppression…' : 'Supprimer ce restaurant'}</button>
    </FormShell>
  )
}

export function MealForm({ resto, meal, proteines, onClose, onSaved }) {
  const isEdit = !!meal
  const existingProteines = (proteines || []).filter(p => p !== 'Toutes')
  const initialProteineKnown = isEdit && existingProteines.includes(meal.proteine)
  const [form, setForm] = useState({
    nom: meal?.nom || '',
    proteine: isEdit ? (initialProteineKnown ? meal.proteine : '__new') : '',
    proteine_custom: isEdit && !initialProteineKnown ? (meal.proteine || '') : '',
    rating: meal?.rating ?? null,
    comment: meal?.comment || '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)
  const update = (k, v) => setForm(s => ({ ...s, [k]: v }))
  const proteineValue = form.proteine === '__new' ? form.proteine_custom.trim() : form.proteine
  const valid = form.nom.trim() && proteineValue

  const submit = async () => {
    if (!valid || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        nom: form.nom.trim(),
        proteine: proteineValue,
        rating: form.rating ? parseFloat(form.rating) : null,
        comment: form.comment.trim(),
      }
      if (isEdit) {
        await updateMeal(meal.id, payload)
      } else {
        await addMeal(resto.id, payload)
      }
      onSaved()
    } catch (err) {
      setError(err.message || 'Erreur d’enregistrement')
      setSubmitting(false)
    }
  }

  const onDelete = async () => {
    if (!isEdit || deleting) return
    if (!window.confirm(`Supprimer « ${meal.nom} » ?`)) return
    setDeleting(true)
    setError(null)
    try {
      await deleteMeal(meal.id)
      onSaved()
    } catch (err) {
      setError(err.message || 'Erreur de suppression')
      setDeleting(false)
    }
  }

  return (
    <FormShell title={isEdit ? `Modifier · ${meal.nom}` : `Nouveau plat · ${resto.nom}`}
      onClose={onClose} onSubmit={submit}
      submitLabel={submitting ? 'Enregistrement…' : (isEdit ? 'Sauver' : 'Ajouter')}
      disabled={!valid || submitting} error={error}>
      <Field label="Nom du plat *" hint="Terminer par le prix entre parenthèses, ex: (22€)">
        <input value={form.nom} onChange={e => update('nom', e.target.value)}
          placeholder="Ex: Dorade grillée, riz blanc (24€)" style={inputStyle} autoFocus={!isEdit} />
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
            placeholder="Ex: dorade, cabillaud, tofu…"
            style={{ ...inputStyle, marginTop: 8 }} />
        )}
      </Field>
      <Field label="Note" hint={form.rating ? null : "Optionnel — laisser vide pour ne pas noter"}>
        <StarInput value={form.rating} onChange={v => update('rating', v)} />
      </Field>
      <Field label="Commentaire" hint="Ce qu'il faut demander, ce qu'il faut éviter, etc.">
        <textarea value={form.comment} onChange={e => update('comment', e.target.value)}
          placeholder="Ex: sauce à part, sans ail, bien cuit"
          rows={3} style={{ ...inputStyle, resize: 'vertical', minHeight: 72, fontFamily: 'inherit' }} />
      </Field>
      {isEdit && (
        <button type="button" onClick={onDelete} disabled={deleting} style={{
          width: '100%', marginTop: 6,
          padding: '10px 16px', borderRadius: 999,
          background: 'var(--bg-card)', color: 'var(--accent-error)',
          border: '2px solid var(--accent-error)', boxShadow: deleting ? 'none' : '0 3px 0 var(--accent-error)',
          fontSize: 13, fontWeight: 700, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        }}>{deleting ? 'Suppression…' : 'Supprimer ce plat'}</button>
      )}
    </FormShell>
  )
}
