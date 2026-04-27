import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import { OFFICE_ADDRESS, HOME_ADDRESS } from './places-config.js'

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
  const service = new google.maps.DistanceMatrixService()
  const response = await service.getDistanceMatrix({
    origins: [OFFICE_ADDRESS, HOME_ADDRESS],
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

export function placeUrlFor(placeId, query) {
  const q = encodeURIComponent(query || 'restaurant')
  if (placeId) {
    return `https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=${placeId}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${q}`
}

let officeLatLng = null
let homeLatLng = null

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
  if (!officeLatLng) officeLatLng = await geocodeViaPlaces(OFFICE_ADDRESS)
  return officeLatLng
}

export async function getHomeLatLng() {
  if (!homeLatLng) homeLatLng = await geocodeViaPlaces(HOME_ADDRESS)
  return homeLatLng
}
