// Phase A: localStorage-backed persistence (kept verbatim from prototype).
// Phase C will replace this with Supabase calls — keep the public API stable
// so the screen components don't change shape until then.

import { RESTOS, PROTEINES } from '../data/restos.js'

const RESTOS_KEY = 'sibo_user_restos_v1'
const MEALS_KEY = 'sibo_user_meals_v1'

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (e) {
    return fallback
  }
}

function writeJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch (e) {}
}

function genId(prefix) {
  return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)
}

export function getMergedRestos() {
  const userRestos = readJSON(RESTOS_KEY, [])
  const extraMealsByResto = readJSON(MEALS_KEY, {})
  const all = [...RESTOS, ...userRestos]
  return all.map(r => {
    const extras = extraMealsByResto[r.id] || []
    return { ...r, meals: [...r.meals, ...extras] }
  })
}

export function addResto(resto) {
  const userRestos = readJSON(RESTOS_KEY, [])
  const newResto = {
    id: genId('ur'),
    meals: [],
    ...resto,
  }
  userRestos.push(newResto)
  writeJSON(RESTOS_KEY, userRestos)
  return newResto
}

export function addMeal(restoId, meal) {
  const mealsByResto = readJSON(MEALS_KEY, {})
  if (!mealsByResto[restoId]) mealsByResto[restoId] = []
  mealsByResto[restoId].push({ ...meal })
  writeJSON(MEALS_KEY, mealsByResto)
}

export function getAllProteines() {
  const userRestos = readJSON(RESTOS_KEY, [])
  const mealsByResto = readJSON(MEALS_KEY, {})
  const set = new Set(PROTEINES.filter(p => p !== 'Toutes'))
  userRestos.forEach(r => r.meals && r.meals.forEach(m => m.proteine && set.add(m.proteine)))
  Object.values(mealsByResto).forEach(list => list.forEach(m => m.proteine && set.add(m.proteine)))
  return ['Toutes', ...Array.from(set)]
}
