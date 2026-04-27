import { useEffect, useRef, useState } from 'react'
import { loadMaps, getOfficeLatLng, getHomeLatLng } from '../lib/google-maps.js'

const HOME_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='#1f1a14' stroke='#f5f0e6' stroke-width='2'/><path d='M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z' fill='#f5f0e6' transform='translate(8 8)'/></svg>`
const OFFICE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><circle cx='20' cy='20' r='18' fill='#1f1a14' stroke='#f5f0e6' stroke-width='2'/><path d='M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H2v15h20V6zm-9-2h2v2h-2V4z' fill='#f5f0e6' transform='translate(8 8)'/></svg>`

function anchorIcon(svg) {
  return {
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(40, 40),
    anchor: new google.maps.Point(20, 20),
  }
}

export function GoogleMap({ restos, location, onPinClick, fallback: Fallback }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function setup() {
      try {
        if (!mapRef.current) {
          await loadMaps()
          if (cancelled || mapRef.current) return
          mapRef.current = new google.maps.Map(containerRef.current, {
            zoom: 13,
            center: { lat: 48.8566, lng: 2.3522 },
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
          })
        }
        if (cancelled) return
        await refreshMarkers()
      } catch (err) {
        if (!cancelled) setError(err)
      }
    }

    async function refreshMarkers() {
      markersRef.current.forEach(m => m.setMap(null))
      markersRef.current = []
      const bounds = new google.maps.LatLngBounds()

      // Office or home anchor marker (icon: briefcase or house)
      try {
        const anchorLatLng = location === 'domicile'
          ? await getHomeLatLng()
          : await getOfficeLatLng()
        if (cancelled) return
        const anchorMarker = new google.maps.Marker({
          position: anchorLatLng,
          map: mapRef.current,
          title: location === 'domicile' ? 'Domicile' : 'Bureau',
          icon: anchorIcon(location === 'domicile' ? HOME_SVG : OFFICE_SVG),
          zIndex: 100,
        })
        markersRef.current.push(anchorMarker)
        bounds.extend(anchorLatLng)
      } catch {
        // Anchor lookup failed; carry on without it
      }

      // Resto markers (default red pin, click → onPinClick)
      restos.forEach(r => {
        if (r.lat == null || r.lng == null) return
        const pos = { lat: Number(r.lat), lng: Number(r.lng) }
        const marker = new google.maps.Marker({
          position: pos,
          map: mapRef.current,
          title: r.nom,
        })
        marker.addListener('click', () => onPinClick && onPinClick(r))
        markersRef.current.push(marker)
        bounds.extend(pos)
      })

      if (markersRef.current.length > 0) {
        mapRef.current.fitBounds(bounds, 50)
      }
    }

    setup()
    return () => { cancelled = true }
  }, [restos, location, onPinClick])

  if (error && Fallback) {
    return <Fallback restos={restos} location={location} onPinClick={onPinClick} />
  }

  return (
    <div ref={containerRef} style={{
      height: 520, width: '100%',
      border: '2px solid #1f1a14', borderRadius: 18,
      overflow: 'hidden', boxShadow: '0 4px 0 #1f1a14',
      background: '#e9d7b6',
    }} />
  )
}
