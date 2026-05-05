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
            background: 'none', border: 'none', color: '#7a6b55',
            cursor: 'pointer', padding: 0, fontFamily: 'inherit',
          }}>Annuler</button>
        )}
      </div>
    )
  }

  return (
    <div style={{
      padding: 12, border: '1.5px solid #1f1a14', borderRadius: 10,
      background: '#fff', boxShadow: '0 2px 0 #1f1a14',
    }}>
      <div style={{ fontSize: 13, color: '#1f1a14', lineHeight: 1.4 }}>{value.address}</div>
      <button type="button" onClick={() => setEditing(true)} style={{
        marginTop: 8, fontSize: 11, fontWeight: 600,
        background: 'none', border: 'none', color: '#e67f52',
        cursor: 'pointer', padding: 0, textDecoration: 'underline',
        fontFamily: 'inherit',
      }}>Changer</button>
    </div>
  )
}

export function SettingsModal({ onClose }) {
  const { office, home, save } = useSettings()
  const [draftOffice, setDraftOffice] = useState(office)
  const [draftHome, setDraftHome] = useState(home)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const dirty =
    draftOffice.address !== office.address ||
    draftHome.address !== home.address

  const submit = async () => {
    if (!dirty || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await save({ office: draftOffice, home: draftHome })
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
      <Field label="Bureau" hint="Adresse utilisée pour le filtre « Bureau » et les temps de marche.">
        <AddressPicker value={draftOffice} onChange={setDraftOffice} />
      </Field>
      <Field label="Domicile" hint="Adresse utilisée pour le filtre « Domicile » et les temps de marche.">
        <AddressPicker value={draftHome} onChange={setDraftHome} />
      </Field>
      <div style={{ fontSize: 11, color: '#7a6b55', lineHeight: 1.5, marginTop: 4 }}>
        À l'enregistrement, les temps de marche de tous les restaurants seront recalculés en arrière-plan.
      </div>
    </FormShell>
  )
}
