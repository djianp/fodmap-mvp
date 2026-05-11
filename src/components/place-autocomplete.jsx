import { useEffect, useRef, useState } from 'react'
import { loadMaps } from '../lib/google-maps.js'

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1.5px solid var(--ink)', background: 'var(--bg-card)',
  fontSize: 14, color: 'var(--ink)', fontFamily: 'inherit',
  boxShadow: '0 2px 0 var(--ink)', outline: 'none', boxSizing: 'border-box',
}

export function PlaceAutocomplete({ onPlaceSelected, placeholder = 'Chercher une adresse' }) {
  const [query, setQuery] = useState('')
  const [predictions, setPredictions] = useState([])
  const [open, setOpen] = useState(false)
  const handlerRef = useRef(onPlaceSelected)
  const tokenRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => { handlerRef.current = onPlaceSelected })

  useEffect(() => {
    if (!query.trim()) {
      setPredictions([])
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      try {
        const { places } = await loadMaps()
        if (cancelled) return
        if (!tokenRef.current) {
          tokenRef.current = new places.AutocompleteSessionToken()
        }
        const result = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query,
          sessionToken: tokenRef.current,
        })
        if (cancelled) return
        setPredictions(result.suggestions || [])
      } catch (err) {
        console.warn('Autocomplete error:', err)
        if (!cancelled) setPredictions([])
      }
    }, 250)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [query])

  useEffect(() => {
    const onDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('touchstart', onDocClick)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('touchstart', onDocClick)
    }
  }, [])

  const onSelect = async (suggestion) => {
    try {
      const place = suggestion.placePrediction.toPlace()
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'nationalPhoneNumber', 'id', 'location'],
      })
      handlerRef.current({
        place_id: place.id,
        nom: place.displayName,
        adresse: place.formattedAddress,
        phone: place.nationalPhoneNumber || '',
        lat: place.location.lat(),
        lng: place.location.lng(),
      })
      tokenRef.current = null
      setQuery('')
      setPredictions([])
      setOpen(false)
    } catch (err) {
      console.error('Place fetch error:', err)
    }
  }

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        style={inputStyle}
      />
      {open && predictions.length > 0 && (
        <div style={{
          marginTop: 6,
          background: 'var(--bg-card)', border: '1.5px solid var(--ink)', borderRadius: 10,
          boxShadow: '0 3px 0 var(--ink)',
          maxHeight: 260, overflowY: 'auto',
        }}>
          {predictions.map((s, i) => {
            const main = s.placePrediction?.mainText?.text || ''
            const secondary = s.placePrediction?.secondaryText?.text || ''
            return (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onSelect(s) }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '10px 12px',
                  border: 'none',
                  borderBottom: i < predictions.length - 1 ? '1px solid var(--border-very-soft)' : 'none',
                  background: 'transparent', cursor: 'pointer',
                  fontSize: 13, fontFamily: 'inherit', color: 'var(--ink)',
                }}
              >
                <div style={{ fontWeight: 600 }}>{main}</div>
                {secondary && (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{secondary}</div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
