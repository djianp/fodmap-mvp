import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { DEFAULT_OFFICE_ADDRESS, DEFAULT_HOME_ADDRESS } from './places-config.js'
import { getRouteTimesBatch } from './google-maps.js'

let _office = { address: DEFAULT_OFFICE_ADDRESS, lat: null, lng: null }
let _home = { address: DEFAULT_HOME_ADDRESS, lat: null, lng: null }
let _theme = 'system'
let _loaded = false
let _recalcing = false
const subscribers = new Set()

function notify() { subscribers.forEach(fn => fn()) }

export function getOffice() { return _office }
export function getHome() { return _home }
export function getTheme() { return _theme }

function resolveTheme(choice) {
  if (choice === 'light' || choice === 'dark') return choice
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme() {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', resolveTheme(_theme))
}

// Initial apply on module load — respects OS preference until the user's saved
// theme arrives from Supabase.
applyTheme()

// Keep the document attribute in sync if the OS theme flips while the user is
// on the "Système" setting.
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (_theme === 'system') applyTheme()
  })
}

export async function loadSettings() {
  if (_loaded) return
  _loaded = true
  try {
    const { data } = await supabase.from('user_settings').select('*').maybeSingle()
    if (data) {
      if (data.office_address) {
        _office = { address: data.office_address, lat: data.office_lat, lng: data.office_lng }
      }
      if (data.home_address) {
        _home = { address: data.home_address, lat: data.home_lat, lng: data.home_lng }
      }
      if (data.theme) {
        _theme = data.theme
        applyTheme()
      }
      notify()
    }
  } catch (err) {
    console.warn('Failed to load user settings:', err)
  }
}

export async function saveSettings({ office, home, theme }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const nextTheme = theme || _theme
  const { error } = await supabase.from('user_settings').upsert({
    user_id: user.id,
    office_address: office.address,
    office_lat: office.lat,
    office_lng: office.lng,
    home_address: home.address,
    home_lat: home.lat,
    home_lng: home.lng,
    theme: nextTheme,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
  const addressesChanged =
    office.address !== _office.address || home.address !== _home.address
  _office = office
  _home = home
  _theme = nextTheme
  applyTheme()
  notify()

  if (addressesChanged) {
    _recalcing = true
    notify()
    recalcAllRouteTimes(office, home)
      .catch(err => console.warn('Route-time recalc failed:', err))
      .finally(() => { _recalcing = false; notify() })
  }
}

async function recalcAllRouteTimes(office, home) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: restos } = await supabase.from('restos')
    .select('id, lat, lng')
    .eq('user_id', user.id)
    .not('lat', 'is', null)
    .not('lng', 'is', null)
  if (!restos?.length) return

  for (let i = 0; i < restos.length; i += 25) {
    const batch = restos.slice(i, i + 25)
    try {
      const destinations = batch.map(r => ({ lat: Number(r.lat), lng: Number(r.lng) }))
      const times = await getRouteTimesBatch(office, home, destinations)
      for (let j = 0; j < batch.length; j++) {
        const t = times[j]
        if (!t) continue
        await supabase.from('restos')
          .update({
            walk_min_bureau: t.walk_min_bureau,
            walk_min_domicile: t.walk_min_domicile,
            drive_min_bureau: t.drive_min_bureau,
            drive_min_domicile: t.drive_min_domicile,
          })
          .eq('id', batch[j].id)
          .eq('user_id', user.id)
      }
    } catch (err) {
      console.warn('Route-time batch failed:', err)
    }
  }

  window.dispatchEvent(new Event('restos-refresh'))
}

export function useSettings() {
  const [, force] = useState(0)
  useEffect(() => {
    const fn = () => force(x => x + 1)
    subscribers.add(fn)
    return () => { subscribers.delete(fn) }
  }, [])
  return { office: _office, home: _home, theme: _theme, recalcing: _recalcing, save: saveSettings }
}
