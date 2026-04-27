import { useEffect, useRef } from 'react'
import { loadMaps } from '../lib/google-maps.js'

export function PlaceAutocomplete({ onPlaceSelected }) {
  const containerRef = useRef(null)
  const handlerRef = useRef(onPlaceSelected)

  useEffect(() => { handlerRef.current = onPlaceSelected })

  useEffect(() => {
    let cancelled = false
    let element = null
    let listener = null

    async function setup() {
      try {
        const { places } = await loadMaps()
        if (cancelled) return
        element = new places.PlaceAutocompleteElement()
        element.style.width = '100%'
        listener = async (event) => {
          const place = event.placePrediction.toPlace()
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
        }
        element.addEventListener('gmp-select', listener)
        containerRef.current.appendChild(element)
      } catch (err) {
        console.error('Failed to mount PlaceAutocomplete:', err)
      }
    }

    setup()
    return () => {
      cancelled = true
      if (element && listener) element.removeEventListener('gmp-select', listener)
      if (element && element.parentNode) element.parentNode.removeChild(element)
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100%' }} />
}
