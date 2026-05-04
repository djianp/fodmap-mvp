import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import { getOffice, getHome } from './user-settings.js'

let loadPromise = null

export function loadMaps() {
  if (loadPromise) return loadPromise
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return Promise.reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY'))
  }
  setOptions({ key: apiKey, v: 'weekly' })
  loadPromise = Promise.all([
    importLibrary('maps'),
    importLibrary('places'),
    importLibrary('marker'),
  ]).then(([maps, places, marker]) => ({ maps, places, marker }))
  return loadPromise
}

export async function getWalkTimes(destination) {
  await loadMaps()
  const office = getOffice()
  const home = getHome()
  const service = new google.maps.DistanceMatrixService()
  const response = await service.getDistanceMatrix({
    origins: [office.address, home.address],
    destinations: [destination],
    travelMode: google.maps.TravelMode.WALKING,
    unitSystem: google.maps.UnitSystem.METRIC,
  })
  const [bureauRow, domicileRow] = response.rows
  const bureauEl = bureauRow.elements[0]
  const domicileEl = domicileRow.elements[0]
  if (bureauEl.status !== 'OK' || domicileEl.status !== 'OK') {
    throw new Error(`Distance Matrix non-OK: bureau=${bureauEl.status}, domicile=${domicileEl.status}`)
  }
  return {
    walk_min_bureau: Math.round(bureauEl.duration.value / 60),
    walk_min_domicile: Math.round(domicileEl.duration.value / 60),
  }
}

export async function getWalkTimesBatch(office, home, destinations) {
  await loadMaps()
  const service = new google.maps.DistanceMatrixService()
  const response = await service.getDistanceMatrix({
    origins: [office.address, home.address],
    destinations,
    travelMode: google.maps.TravelMode.WALKING,
    unitSystem: google.maps.UnitSystem.METRIC,
  })
  const [bureauRow, domicileRow] = response.rows
  return destinations.map((_, i) => {
    const b = bureauRow.elements[i]
    const d = domicileRow.elements[i]
    if (b.status !== 'OK' || d.status !== 'OK') return null
    return {
      walk_min_bureau: Math.round(b.duration.value / 60),
      walk_min_domicile: Math.round(d.duration.value / 60),
    }
  })
}

export function placeUrlFor(placeId, query) {
  const q = encodeURIComponent(query || 'restaurant')
  if (placeId) {
    return `https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=${placeId}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

let officeCache = null
let homeCache = null

async function geocodeViaPlaces(address) {
  const { places } = await loadMaps()
  const { places: matches } = await places.Place.searchByText({
    textQuery: address,
    fields: ['location'],
    maxResultCount: 1,
  })
  const loc = matches?.[0]?.location
  if (!loc) throw new Error(`No geocode for: ${address}`)
  return { lat: loc.lat(), lng: loc.lng() }
}

export async function getOfficeLatLng() {
  const stored = getOffice()
  if (officeCache && officeCache.address === stored.address) return officeCache.latlng
  if (stored.lat != null && stored.lng != null) {
    officeCache = { address: stored.address, latlng: { lat: stored.lat, lng: stored.lng } }
    return officeCache.latlng
  }
  const latlng = await geocodeViaPlaces(stored.address)
  officeCache = { address: stored.address, latlng }
  return latlng
}

export async function getHomeLatLng() {
  const stored = getHome()
  if (homeCache && homeCache.address === stored.address) return homeCache.latlng
  if (stored.lat != null && stored.lng != null) {
    homeCache = { address: stored.address, latlng: { lat: stored.lat, lng: stored.lng } }
    return homeCache.latlng
  }
  const latlng = await geocodeViaPlaces(stored.address)
  homeCache = { address: stored.address, latlng }
  return latlng
}
