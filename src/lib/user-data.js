import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './supabase.js'
import { RESTOS, PROTEINES } from '../data/restos.js'

async function fetchRestos() {
  const { data, error } = await supabase
    .from('restos')
    .select('*, meals(*)')
    .order('rating', { ascending: false })
  if (error) throw error
  return data || []
}

async function seedRestos(userId) {
  // Bulk-insert the 8 seed restaurants
  const restosPayload = RESTOS.map(r => ({
    user_id: userId,
    nom: r.nom,
    adresse: r.adresse,
    phone: r.phone,
    distance_bureau: r.distance_bureau,
    distance_domicile: r.distance_domicile,
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
      distance_bureau: resto.distance_bureau || 0,
      distance_domicile: resto.distance_domicile || 0,
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
