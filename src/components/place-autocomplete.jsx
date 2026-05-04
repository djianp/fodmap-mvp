import { useEffect, useRef, useState } from 'react'
import { loadMaps } from '../lib/google-maps.js'

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1.5px solid #1f1a14', background: '#fff',
  fontSize: 14, color: '#1f1a14', fontFamily: 'inherit',
  boxShadow: '0 2px 0 #1f1a14', outline: 'none', boxSizing: 'border-box',
}

export function PlaceAutocomplete({ onPlaceSelected, placeholder = 'Cherche une adresse' }) {
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
          background: '#fff', border: '1.5px solid #1f1a14', borderRadius: 10,
          boxShadow: '0 3px 0 #1f1a14',
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
                  borderBottom: i < predictions.length - 1 ? '1px solid #efe6d5' : 'none',
                  background: 'transparent', cursor: 'pointer',
                  fontSize: 13, fontFamily: 'inherit', color: '#1f1a14',
                }}
              >
                <div style={{ fontWeight: 600 }}>{main}</div>
                {secondary && (
                  <div style={{ fontSize: 11, color: '#7a6b55', marginTop: 2 }}>{secondary}</div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
