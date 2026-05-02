import { FOODS } from '../data/foods.js'

// Food ids that have a liste image at /aliments/<id>.jpg and a hero image at
// /aliments/<id>-detail.jpg. Foods absent from this list fall back to the
// monogram tile in <Thumb>.
const PHOTO_IDS = [
  'ail', 'ananas', 'banane-mure', 'banane-verte', 'bar',
  'beurre-cacahuete', 'brocoli', 'carotte-crue', 'carotte-puree', 'celeri-rave',
  'citron', 'concombre', 'dorade', 'echalote', 'framboises',
  'frites', 'gingembre', 'grenailles', 'haricots-verts', 'huile-olive',
  'kasha', 'ketchup', 'laitue', 'mais', 'mangue',
  'mayonnaise', 'muffins', 'myrtilles', 'oignon', 'pain-de-viande',
  'pain-epeautre', 'pain-epeautre-industriel', 'patate-douce', 'poulet', 'radis',
  'riz-noir', 'sarrasin-blanc', 'sashimi', 'saumon', 'saumon-fume',
  'speculoos', 'tomates-roties', 'truite',
]

export const PHOTOS = Object.fromEntries(
  PHOTO_IDS.map(id => [id, `/aliments/${id}.jpg`])
)

export const PHOTOS_DETAIL = Object.fromEntries(
  PHOTO_IDS.map(id => [id, `/aliments/${id}-detail.jpg`])
)

// Fallback tile colors for the monogram badge.
// Deliberately avoids green/orange/red so the badge never collides with a verdict.
const TILES = [
  "#e9d7b6", "#d9c3a0", "#c4b092", "#e8ccb0", "#b9a990",
  "#c8b5d4", "#a8b4c4", "#3d4a5c", "#2d2420", "#704e3a",
]

export function tileFor(id) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return TILES[Math.abs(h) % TILES.length]
}

export const VERDICT_TEXT = { green: "OK", amber: "LIMITE", red: "NON" }

export function metaFor(f) {
  return f.note || ""
}

export function whyFor(f) {
  const out = [f.fodmap]
  if (f.contrainte) out.push(f.contrainte)
  return out.filter(Boolean).join(" ")
}

export function alternativesFor(f) {
  return FOODS
    .filter(g => g.cat === f.cat && g.id !== f.id && g.soir === "green")
    .slice(0, 3)
}

export function initialFor(f) {
  return (f.nom || "").trim().charAt(0).toUpperCase()
}

export function search(q) {
  q = (q || "").toLowerCase().trim()
  if (!q) return []
  return FOODS.filter(f => f.nom.toLowerCase().includes(q))
}

export const CATEGORIES = ["Féculents", "Protéines", "Légumes", "Fruits", "Condiments"]
