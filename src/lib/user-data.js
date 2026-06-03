import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './supabase.js'
import { RESTOS, PROTEINES } from '../data/restos.js'
import { FOODS } from '../data/foods.js'
import { REINTRO_PROTOCOLS } from '../data/reintro.js'
import { NOTES } from '../data/notes.js'

async function fetchRestos() {
  const { data, error } = await supabase
    .from('restos')
    .select('*, meals(*)')
    .order('rating', { ascending: false })
  if (error) throw error
  return data || []
}

async function seedRestos(userId) {
  // Bulk-insert the seed restaurants
  const restosPayload = RESTOS.map(r => ({
    user_id: userId,
    nom: r.nom,
    adresse: r.adresse,
    phone: r.phone,
    place_id: r.place_id,
    lat: r.lat,
    lng: r.lng,
    walk_min_bureau: r.walk_min_bureau,
    walk_min_domicile: r.walk_min_domicile,
    drive_min_bureau: r.drive_min_bureau ?? null,
    drive_min_domicile: r.drive_min_domicile ?? null,
    rating: r.rating,
    status: r.status || 'dinein',
  }))
  const { data: insertedRestos, error } = await supabase
    .from('restos')
    .insert(restosPayload)
    .select()
  if (error) throw error

  // Match inserted rows back to source meals via (nom, adresse) — order-independent
  const restosByKey = new Map(
    insertedRestos.map(r => [`${r.nom}|${r.adresse}`, r])
  )
  const mealsPayload = []
  RESTOS.forEach(sourceResto => {
    const inserted = restosByKey.get(`${sourceResto.nom}|${sourceResto.adresse}`)
    if (!inserted) return
    sourceResto.meals.forEach(m => {
      mealsPayload.push({
        user_id: userId,
        resto_id: inserted.id,
        nom: m.nom,
        proteine: m.proteine,
        rating: m.rating,
        comment: m.comment || '',
      })
    })
  })
  if (mealsPayload.length > 0) {
    const { error: mealsErr } = await supabase.from('meals').insert(mealsPayload)
    if (mealsErr) throw mealsErr
  }
}

export function useRestos() {
  const [restos, setRestos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const seededRef = useRef(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      let data = await fetchRestos()

      // First time the user logs in, their tables are empty — seed once
      if (data.length === 0 && !seededRef.current) {
        seededRef.current = true
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await seedRestos(user.id)
          data = await fetchRestos()
        }
      }

      setRestos(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async data load: setState after fetch
    load()
  }, [load])

  useEffect(() => {
    const handler = () => load()
    window.addEventListener('restos-refresh', handler)
    return () => window.removeEventListener('restos-refresh', handler)
  }, [load])

  const proteines = useMemo(() => {
    const set = new Set(PROTEINES.filter(p => p !== 'Toutes'))
    restos.forEach(r => (r.meals || []).forEach(m => m.proteine && set.add(m.proteine)))
    return ['Toutes', ...Array.from(set)]
  }, [restos])

  return { restos, loading, error, proteines, refresh: load }
}

export async function addResto(resto) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { data, error } = await supabase
    .from('restos')
    .insert({
      user_id: user.id,
      nom: resto.nom,
      adresse: resto.adresse,
      phone: resto.phone || '',
      place_id: resto.place_id,
      lat: resto.lat,
      lng: resto.lng,
      walk_min_bureau: resto.walk_min_bureau ?? null,
      walk_min_domicile: resto.walk_min_domicile ?? null,
      drive_min_bureau: resto.drive_min_bureau ?? null,
      drive_min_domicile: resto.drive_min_domicile ?? null,
      rating: resto.rating,
      status: resto.status || 'dinein',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateResto(id, resto) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { error } = await supabase.from('restos')
    .update({
      nom: resto.nom,
      phone: resto.phone || '',
      rating: resto.rating,
      status: resto.status || 'dinein',
    })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}

export async function deleteResto(id) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { error } = await supabase.from('restos')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}

export async function addMeal(restoId, meal) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { error } = await supabase.from('meals').insert({
    resto_id: restoId,
    user_id: user.id,
    nom: meal.nom,
    proteine: meal.proteine,
    rating: meal.rating,
    comment: meal.comment || '',
  })
  if (error) throw error
}

export async function updateMeal(id, meal) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { error } = await supabase.from('meals')
    .update({
      nom: meal.nom,
      proteine: meal.proteine,
      rating: meal.rating,
      comment: meal.comment || '',
    })
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}

export async function deleteMeal(id) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { error } = await supabase.from('meals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}

// ──────────── Foods ────────────

async function fetchFoods() {
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .order('cat')
  if (error) throw error
  return data || []
}

async function seedFoods(userId) {
  const payload = FOODS.map(f => ({
    id: f.id,
    user_id: userId,
    nom: f.nom,
    cat: f.cat,
    midi: f.midi,
    soir: f.soir,
    note: f.note || null,
    fodmap: f.fodmap || null,
    contrainte: f.contrainte || null,
    details: null,
    tags: f.tags || [],
  }))
  const { error } = await supabase.from('foods').insert(payload)
  if (error) throw error
}

export function useFoods() {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const seededRef = useRef(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      let data = await fetchFoods()
      if (data.length === 0 && !seededRef.current) {
        seededRef.current = true
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await seedFoods(user.id)
          data = await fetchFoods()
        }
      }
      setFoods(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load]) // eslint-disable-line react-hooks/set-state-in-effect -- async data load: setState after fetch

  return { foods, loading, error, refresh: load }
}

function slugify(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export async function addFood(food) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const id = food.id || slugify(food.nom)
  const { data, error } = await supabase.from('foods').insert({
    id,
    user_id: user.id,
    nom: food.nom,
    cat: food.cat,
    midi: food.midi,
    soir: food.soir,
    note: food.note || null,
    fodmap: food.fodmap || null,
    contrainte: food.contrainte || null,
    details: food.details || null,
    recette: food.recette || null,
    photo_url: food.photo_url || null,
    tags: food.tags || [],
  }).select().single()
  if (error) throw error
  return data
}

export async function updateFood(id, food) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const update = {
    nom: food.nom,
    cat: food.cat,
    midi: food.midi,
    soir: food.soir,
    note: food.note || null,
    fodmap: food.fodmap || null,
    contrainte: food.contrainte || null,
    details: food.details || null,
    recette: food.recette || null,
    tags: food.tags || [],
    updated_at: new Date().toISOString(),
  }
  if (Object.prototype.hasOwnProperty.call(food, 'photo_url')) {
    update.photo_url = food.photo_url
  }
  const { data, error } = await supabase.from('foods')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteFood(id) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { error } = await supabase.from('foods')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}

// ──────────── Suggestions ────────────

async function fetchSuggestions() {
  const { data, error } = await supabase
    .from('suggestions')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export function useSuggestions() {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setSuggestions(await fetchSuggestions())
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load]) // eslint-disable-line react-hooks/set-state-in-effect -- async data load: setState after fetch

  return { suggestions, loading, error, refresh: load }
}

export async function addSuggestion(suggestion) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { data, error } = await supabase.from('suggestions').insert({
    user_id: user.id,
    nom: suggestion.nom,
    occasions: suggestion.occasions || [],
    contexts: suggestion.contexts || [],
    rating: suggestion.rating ?? null,
    infos_cles: suggestion.infos_cles || null,
    comment: suggestion.comment || null,
    recette: suggestion.recette || null,
    photo_url: suggestion.photo_url || null,
    to_try: !!suggestion.to_try,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateSuggestion(id, suggestion) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const update = {
    nom: suggestion.nom,
    occasions: suggestion.occasions || [],
    contexts: suggestion.contexts || [],
    rating: suggestion.rating ?? null,
    infos_cles: suggestion.infos_cles || null,
    comment: suggestion.comment || null,
    recette: suggestion.recette || null,
    to_try: !!suggestion.to_try,
    updated_at: new Date().toISOString(),
  }
  if (Object.prototype.hasOwnProperty.call(suggestion, 'photo_url')) {
    update.photo_url = suggestion.photo_url
  }
  const { data, error } = await supabase.from('suggestions')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSuggestion(id) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { error } = await supabase.from('suggestions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}

// ──────────── Reintro logs ────────────
// Protocol DEFINITIONS are static app content (src/data/reintro.js) and are never
// written to Supabase — so there is no seed branch here, unlike useFoods/useRestos.
// Only the user's per-test-day comfort level + note persist. currentDay / completed
// are DERIVED in the UI from these rows (first test day with no comfort_level = current).

async function fetchReintroLogs() {
  const { data, error } = await supabase
    .from('reintro_logs')
    .select('*')
    .order('protocol_id')
    .order('day')
  if (error) throw error
  return data || []
}

export function useReintroLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setLogs(await fetchReintroLogs())
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load]) // eslint-disable-line react-hooks/set-state-in-effect -- async data load: setState after fetch

  return { logs, loading, error, refresh: load }
}

export async function upsertReintroLog({ protocolId, day, comfortLevel, note }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { data, error } = await supabase.from('reintro_logs')
    .upsert({
      user_id: user.id,
      protocol_id: protocolId,
      day,
      comfort_level: comfortLevel ?? null,
      note: note || null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteReintroLog({ protocolId, day }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { error } = await supabase.from('reintro_logs')
    .delete()
    .eq('user_id', user.id)
    .eq('protocol_id', protocolId)
    .eq('day', day)
  if (error) throw error
}

// ──────────── Reintro recipes ────────────
// Per-user override of a protocol's preparation text (markdown). Absent = use the static
// default from src/data/reintro.js. One row per (user, protocol); deleting reverts to default.

async function fetchReintroRecipes() {
  const { data, error } = await supabase
    .from('reintro_recipes')
    .select('*')
    .order('protocol_id')
  if (error) throw error
  return data || []
}

export function useReintroRecipes() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setRecipes(await fetchReintroRecipes())
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load]) // eslint-disable-line react-hooks/set-state-in-effect -- async data load: setState after fetch

  return { recipes, loading, error, refresh: load }
}

export async function upsertReintroRecipe({ protocolId, recipe }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { data, error } = await supabase.from('reintro_recipes')
    .upsert({
      user_id: user.id,
      protocol_id: protocolId,
      recipe,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteReintroRecipe({ protocolId }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { error } = await supabase.from('reintro_recipes')
    .delete()
    .eq('user_id', user.id)
    .eq('protocol_id', protocolId)
  if (error) throw error
}

// ──────────── Reintro category notes ────────────
// Per-user markdown describing the same-FODMAP-family foods that become safe once a protocol
// is tolerated. Same shape as reintro_recipes (separate table so each field saves/resets
// independently); absent = use the static default from src/data/reintro.js.

async function fetchReintroCategoryNotes() {
  const { data, error } = await supabase
    .from('reintro_category_notes')
    .select('*')
    .order('protocol_id')
  if (error) throw error
  return data || []
}

export function useReintroCategoryNotes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setNotes(await fetchReintroCategoryNotes())
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load]) // eslint-disable-line react-hooks/set-state-in-effect -- async data load: setState after fetch

  return { notes, loading, error, refresh: load }
}

export async function upsertReintroCategoryNote({ protocolId, content }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { data, error } = await supabase.from('reintro_category_notes')
    .upsert({
      user_id: user.id,
      protocol_id: protocolId,
      content,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteReintroCategoryNote({ protocolId }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { error } = await supabase.from('reintro_category_notes')
    .delete()
    .eq('user_id', user.id)
    .eq('protocol_id', protocolId)
  if (error) throw error
}

// ──────────── Reintro protocols ────────────
// The reintroduction tests themselves. Seeded with the 4 defaults on first login (like
// foods); users can add/remove their own. `id` is a text slug — seeds reuse their known
// slug so existing logs/recipes/notes (keyed by protocol_id) keep matching.

async function fetchReintroProtocols() {
  const { data, error } = await supabase
    .from('reintro_protocols')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data || []
}

async function seedReintroProtocols(userId) {
  const payload = REINTRO_PROTOCOLS.map(p => ({
    id: p.id,
    user_id: userId,
    food_name: p.foodName,
    fodmap_family: p.fodmapFamily,
    photo_url: p.image ? `/aliments/${p.image}.jpg` : null,
  }))
  const { error } = await supabase.from('reintro_protocols').insert(payload)
  if (error) throw error
}

export function useReintroProtocols() {
  const [protocols, setProtocols] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const seededRef = useRef(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      let data = await fetchReintroProtocols()
      if (data.length === 0 && !seededRef.current) {
        seededRef.current = true
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await seedReintroProtocols(user.id)
          data = await fetchReintroProtocols()
        }
      }
      setProtocols(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load]) // eslint-disable-line react-hooks/set-state-in-effect -- async data load: setState after fetch

  return { protocols, loading, error, refresh: load }
}

export async function addReintroProtocol({ id, foodName, fodmapFamily, doseDay1, doseDay3, doseDay5 }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { data, error } = await supabase.from('reintro_protocols').insert({
    id,
    user_id: user.id,
    food_name: foodName,
    fodmap_family: fodmapFamily || null,
    dose_day_1: doseDay1 || null,
    dose_day_3: doseDay3 || null,
    dose_day_5: doseDay5 || null,
  }).select().single()
  if (error) throw error
  return data
}

export async function updateReintroProtocol(id, fields) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { data, error } = await supabase.from('reintro_protocols')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteReintroProtocol(id) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const uid = user.id
  // No FK on protocol_id, so cascade the test's logs / recipe / notes in app code first.
  await supabase.from('reintro_logs').delete().eq('user_id', uid).eq('protocol_id', id)
  await supabase.from('reintro_recipes').delete().eq('user_id', uid).eq('protocol_id', id)
  await supabase.from('reintro_category_notes').delete().eq('user_id', uid).eq('protocol_id', id)
  const { error } = await supabase.from('reintro_protocols').delete().eq('user_id', uid).eq('id', id)
  if (error) throw error
}

// ──────────── Reintro status (the "Statut actuel" summary) ────────────
// One row per user: a user-curated overview shown above the test list. Three short labels
// (validated / upcoming / avoid FODMAP families) + a free-form markdown detail. Purely
// manual — never derived from the tests — so there is no seed branch.

async function fetchReintroStatus() {
  const { data, error } = await supabase
    .from('reintro_status')
    .select('*')
    .maybeSingle()
  if (error) throw error
  return data || null
}

export function useReintroStatus() {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setStatus(await fetchReintroStatus())
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load]) // eslint-disable-line react-hooks/set-state-in-effect -- async data load: setState after fetch

  return { status, loading, error, refresh: load }
}

export async function upsertReintroStatus({ validated, upcoming, avoid, detail }) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { data, error } = await supabase.from('reintro_status')
    .upsert({
      user_id: user.id,
      validated: validated || null,
      upcoming: upcoming || null,
      avoid: avoid || null,
      detail: detail || null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

// ──────────── Notes ────────────

async function fetchNotes() {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

async function seedNotes(userId) {
  const payload = NOTES.map(n => ({
    user_id: userId,
    title: n.title,
    content: n.content,
  }))
  const { error } = await supabase.from('notes').insert(payload)
  if (error) throw error
}

export function useNotes() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const seededRef = useRef(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      let data = await fetchNotes()
      if (data.length === 0 && !seededRef.current) {
        seededRef.current = true
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await seedNotes(user.id)
          data = await fetchNotes()
        }
      }
      setNotes(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load]) // eslint-disable-line react-hooks/set-state-in-effect -- async data load: setState after fetch

  return { notes, loading, error, refresh: load }
}

export async function addNote(note) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { data, error } = await supabase.from('notes').insert({
    user_id: user.id,
    title: note.title,
    content: note.content || '',
  }).select().single()
  if (error) throw error
  return data
}

export async function updateNote(id, note) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { data, error } = await supabase.from('notes')
    .update({
      title: note.title,
      content: note.content || '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteNote(id) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { error } = await supabase.from('notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
  if (error) throw error
}
