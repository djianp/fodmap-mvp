import { FOODS } from '../data/foods.js'
import saumonImg from '../assets/food/saumon.png'
import rizNoirImg from '../assets/food/riz-noir.png'

// Local + curated Unsplash photos for the foods we have art for.
// Foods without an entry fall back to the monogram tile in <Thumb>.
export const PHOTOS = {
  "saumon": saumonImg,
  "truite": saumonImg,
  "riz-noir": rizNoirImg,
  "brocoli": "https://images.unsplash.com/photo-1583663848850-46af132dc08e?w=300&h=300&fit=crop&crop=center&auto=format&q=80",
  "mangue": "https://images.unsplash.com/photo-1591073113125-e46713c829ed?w=300&h=300&fit=crop&crop=center&auto=format&q=80",
  "carotte-puree": "https://images.unsplash.com/photo-1582515073490-39981397c445?w=300&h=300&fit=crop&crop=center&auto=format&q=80",
  "carotte-crue": "https://images.unsplash.com/photo-1582515073490-39981397c445?w=300&h=300&fit=crop&crop=center&auto=format&q=80",
  "myrtilles": "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=300&h=300&fit=crop&crop=center&auto=format&q=80",
  "framboises": "https://images.unsplash.com/photo-1577003833619-76bbd7f82948?w=300&h=300&fit=crop&crop=center&auto=format&q=80",
  "ananas": "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=300&h=300&fit=crop&crop=center&auto=format&q=80",
  "poulet": "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=300&h=300&fit=crop&crop=center&auto=format&q=80",
  "banane-verte": "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=300&h=300&fit=crop&crop=center&auto=format&q=80",
  "banane-mure": "https://images.unsplash.com/photo-1543218024-57a70143c369?w=300&h=300&fit=crop&crop=center&auto=format&q=80",
  "citron": "https://images.unsplash.com/photo-1582476473220-3b26a2a5a51f?w=300&h=300&fit=crop&crop=center&auto=format&q=80",
  "gingembre": "https://images.unsplash.com/photo-1573414405630-72b9b0e67ce2?w=300&h=300&fit=crop&crop=center&auto=format&q=80",
  "huile-olive": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&h=300&fit=crop&crop=center&auto=format&q=80",
}

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
  const parts = [f.cat]
  if (f.note) parts.push(f.note)
  return parts.join(" · ")
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
