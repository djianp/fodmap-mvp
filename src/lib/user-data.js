import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './supabase.js'
import { RESTOS, PROTEINES } from '../data/restos.js'
import { FOODS } from '../data/foods.js'

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
    rating: r.rating,
    takeaway: r.takeaway,
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
    load()
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
      rating: resto.rating,
      takeaway: !!resto.takeaway,
    })
    .select()
    .single()
  if (error) throw error
  return data
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

  useEffect(() => { load() }, [load])

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
    tags: food.tags || [],
  }).select().single()
  if (error) throw error
  return data
}

export async function updateFood(id, food) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')
  const { data, error } = await supabase.from('foods')
    .update({
      nom: food.nom,
      cat: food.cat,
      midi: food.midi,
      soir: food.soir,
      note: food.note || null,
      fodmap: food.fodmap || null,
      contrainte: food.contrainte || null,
      details: food.details || null,
      tags: food.tags || [],
      updated_at: new Date().toISOString(),
    })
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
