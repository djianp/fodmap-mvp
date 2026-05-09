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

async function distanceMatrix(origins, destinations, mode) {
  const service = new google.maps.DistanceMatrixService()
  return service.getDistanceMatrix({
    origins,
    destinations,
    travelMode: mode,
    unitSystem: google.maps.UnitSystem.METRIC,
  })
}

function pickMin(el) {
  return el?.status === 'OK' ? Math.round(el.duration.value / 60) : null
}

export async function getRouteTimes(destination) {
  await loadMaps()
  const office = getOffice()
  const home = getHome()
  const origins = [office.address, home.address]
  const dests = [destination]
  const [walking, driving] = await Promise.all([
    distanceMatrix(origins, dests, google.maps.TravelMode.WALKING),
    distanceMatrix(origins, dests, google.maps.TravelMode.DRIVING),
  ])
  return {
    walk_min_bureau: pickMin(walking.rows[0].elements[0]),
    walk_min_domicile: pickMin(walking.rows[1].elements[0]),
    drive_min_bureau: pickMin(driving.rows[0].elements[0]),
    drive_min_domicile: pickMin(driving.rows[1].elements[0]),
  }
}

export async function getRouteTimesBatch(office, home, destinations) {
  await loadMaps()
  const origins = [office.address, home.address]
  const [walking, driving] = await Promise.all([
    distanceMatrix(origins, destinations, google.maps.TravelMode.WALKING),
    distanceMatrix(origins, destinations, google.maps.TravelMode.DRIVING),
  ])
  return destinations.map((_, i) => ({
    walk_min_bureau: pickMin(walking.rows[0].elements[i]),
    walk_min_domicile: pickMin(walking.rows[1].elements[i]),
    drive_min_bureau: pickMin(driving.rows[0].elements[i]),
    drive_min_domicile: pickMin(driving.rows[1].elements[i]),
  }))
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
