import { useState } from 'react'
import { FormShell, Field } from './resto-forms.jsx'
import { PlaceAutocomplete } from '../components/place-autocomplete.jsx'
import { useSettings } from '../lib/user-settings.js'

function AddressPicker({ value, onChange }) {
  const [editing, setEditing] = useState(false)

  if (editing || !value?.address) {
    return (
      <div>
        <PlaceAutocomplete onPlaceSelected={(p) => {
          onChange({ address: p.adresse, lat: p.lat, lng: p.lng })
          setEditing(false)
        }} />
        {value?.address && (
          <button type="button" onClick={() => setEditing(false)} style={{
            marginTop: 8, fontSize: 11, fontWeight: 600,
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', padding: 0, fontFamily: 'inherit',
          }}>Annuler</button>
        )}
      </div>
    )
  }

  return (
    <div style={{
      padding: 12, border: '1.5px solid var(--ink)', borderRadius: 10,
      background: 'var(--bg-card)', boxShadow: '0 2px 0 var(--ink)',
    }}>
      <div style={{ fontSize: 13, color: 'var(--ink)', lineHeight: 1.4 }}>{value.address}</div>
      <button type="button" onClick={() => setEditing(true)} style={{
        marginTop: 8, fontSize: 11, fontWeight: 600,
        background: 'none', border: 'none', color: 'var(--accent-orange)',
        cursor: 'pointer', padding: 0, textDecoration: 'underline',
        fontFamily: 'inherit',
      }}>Changer</button>
    </div>
  )
}

const THEME_OPTIONS = [
  { v: 'system', label: 'Système' },
  { v: 'light',  label: 'Clair' },
  { v: 'dark',   label: 'Sombre' },
]

function ThemePicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {THEME_OPTIONS.map(o => {
        const on = value === o.v
        return (
          <button key={o.v} type="button" onClick={() => onChange(o.v)} style={{
            flex: 1, padding: '8px 10px', borderRadius: 999,
            border: '1.5px solid var(--ink)',
            background: on ? 'var(--ink)' : 'var(--bg-card)',
            color: on ? 'var(--paper)' : 'var(--ink)',
            boxShadow: on ? '0 2px 0 var(--ink)' : 'none',
            fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>{o.label}</button>
        )
      })}
    </div>
  )
}

export function SettingsModal({ onClose }) {
  const { office, home, theme, save } = useSettings()
  const [draftOffice, setDraftOffice] = useState(office)
  const [draftHome, setDraftHome] = useState(home)
  const [draftTheme, setDraftTheme] = useState(theme || 'system')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const dirty =
    draftOffice.address !== office.address ||
    draftHome.address !== home.address ||
    draftTheme !== theme

  const submit = async () => {
    if (!dirty || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await save({ office: draftOffice, home: draftHome, theme: draftTheme })
      onClose()
    } catch (err) {
      setError(err.message || "Erreur d'enregistrement")
      setSubmitting(false)
    }
  }

  return (
    <FormShell title="Paramètres" onClose={onClose} onSubmit={submit}
      submitLabel={submitting ? 'Enregistrement…' : 'Sauvegarder'}
      disabled={!dirty || submitting} error={error}>
      <Field label="Thème" hint="Système suit la préférence de l'appareil.">
        <ThemePicker value={draftTheme} onChange={setDraftTheme} />
      </Field>
      <Field label="Bureau" hint="Adresse utilisée pour le filtre « Bureau » et les temps de trajet.">
        <AddressPicker value={draftOffice} onChange={setDraftOffice} />
      </Field>
      <Field label="Domicile" hint="Adresse utilisée pour le filtre « Domicile » et les temps de trajet.">
        <AddressPicker value={draftHome} onChange={setDraftHome} />
      </Field>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 4 }}>
        À l'enregistrement d'une nouvelle adresse, les temps de trajet de tous les restaurants seront recalculés en arrière-plan.
      </div>
    </FormShell>
  )
}
