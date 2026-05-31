// Static definitions for the FODMAP reintroduction protocols shown in the Tests tab.
// These are read-only app content (like FOODS) — they are NEVER written to Supabase.
// Only the user's per-test-day comfort level + note persist (table `reintro_logs`).
//
// Each protocol runs over 5 days: test (100 g) · recovery · test (150 g) · recovery ·
// test (200 g). `image` is a slug under /aliments/<slug>.jpg (foods-meta PHOTOS); foods
// with no asset fall back to a monogram tile. `id` is a STABLE slug — never rename one in
// place, or a user's logged rows would orphan (protocol_id has no DB foreign key).

export const REINTRO_PROTOCOLS = [
  {
    id: 'patate-douce-mannitol',
    foodName: 'Patate douce',
    fodmapFamily: 'Test Mannitol',
    image: 'patate-douce',
    days: [
      { day: 1, type: 'test', doseGrams: 100 },
      { day: 2, type: 'recovery' },
      { day: 3, type: 'test', doseGrams: 150 },
      { day: 4, type: 'recovery' },
      { day: 5, type: 'test', doseGrams: 200 },
    ],
    recipe: [
      { order: 1, text: 'Laver la patate douce.' },
      { order: 2, text: 'Couper en cubes réguliers d’environ 2 cm.' },
      { order: 3, text: 'Cuire à la vapeur ou à l’eau jusqu’à tendreté.' },
      { order: 4, text: 'Égoutter soigneusement.' },
      { order: 5, text: 'Peser la portion cuite cible : 100 / 150 / 200 g selon le jour.' },
      { order: 6, text: 'Consommer nature ou avec un repas neutre déjà validé.' },
    ],
    recipeTip: 'Tester de préférence le midi, à distance d’autres aliments à risque.',
  },
  {
    id: 'oignon-fructanes',
    foodName: 'Oignon',
    fodmapFamily: 'Test Fructanes',
    image: 'oignon',
    days: [
      { day: 1, type: 'test', doseGrams: 100 },
      { day: 2, type: 'recovery' },
      { day: 3, type: 'test', doseGrams: 150 },
      { day: 4, type: 'recovery' },
      { day: 5, type: 'test', doseGrams: 200 },
    ],
    recipe: [
      { order: 1, text: 'Éplucher l’oignon et l’émincer finement.' },
      { order: 2, text: 'Cuire doucement à la poêle avec un peu d’huile d’olive, sans trop colorer.' },
      { order: 3, text: 'Laisser tiédir.' },
      { order: 4, text: 'Peser la portion cuite cible : 100 / 150 / 200 g selon le jour.' },
      { order: 5, text: 'Incorporer à un repas neutre déjà validé.' },
    ],
    recipeTip: 'L’oignon cru est plus agressif : pour ce test, le cuire doucement.',
  },
  {
    id: 'pain-levain-fructanes',
    foodName: 'Pain au levain',
    fodmapFamily: 'Test Fructanes',
    image: 'pain-epeautre',
    days: [
      { day: 1, type: 'test', doseGrams: 100 },
      { day: 2, type: 'recovery' },
      { day: 3, type: 'test', doseGrams: 150 },
      { day: 4, type: 'recovery' },
      { day: 5, type: 'test', doseGrams: 200 },
    ],
    recipe: [
      { order: 1, text: 'Choisir un vrai pain au levain (fermentation longue).' },
      { order: 2, text: 'Couper des tranches régulières.' },
      { order: 3, text: 'Peser la portion cible : 100 / 150 / 200 g selon le jour.' },
      { order: 4, text: 'Consommer nature ou très légèrement toasté.' },
      { order: 5, text: 'Éviter beurre et garnitures à risque pour isoler le test.' },
    ],
    recipeTip: 'La fermentation longue du levain réduit les fructanes : la tolérance peut être meilleure qu’avec un pain industriel.',
  },
  {
    id: 'mangue-fructose',
    foodName: 'Mangue',
    fodmapFamily: 'Test Fructose',
    image: 'mangue',
    days: [
      { day: 1, type: 'test', doseGrams: 100 },
      { day: 2, type: 'recovery' },
      { day: 3, type: 'test', doseGrams: 150 },
      { day: 4, type: 'recovery' },
      { day: 5, type: 'test', doseGrams: 200 },
    ],
    recipe: [
      { order: 1, text: 'Choisir une mangue mûre.' },
      { order: 2, text: 'Éplucher et retirer le noyau.' },
      { order: 3, text: 'Couper en cubes réguliers.' },
      { order: 4, text: 'Peser la portion cible : 100 / 150 / 200 g selon le jour.' },
      { order: 5, text: 'Consommer nature, à distance d’autres fruits.' },
    ],
    recipeTip: 'La mangue est riche en fructose : un test positif oriente vers une sensibilité au fructose en excès.',
  },
]

// Default preparation/recipe as editable markdown: the numbered steps, then the tip as a
// blockquote. Used until the user saves their own override (table `reintro_recipes`).
export function defaultRecipeMarkdown(protocol) {
  const steps = protocol.recipe.map(s => `${s.order}. ${s.text}`).join('\n')
  return protocol.recipeTip ? `${steps}\n\n> 💡 ${protocol.recipeTip}` : steps
}

// Example same-family foods per protocol — the starting point for the "same family" card.
// Editable by the user (persisted in reintro_category_notes); these are only the defaults.
const RELATED_FOODS = {
  'patate-douce-mannitol': ['Champignons', 'Chou-fleur', 'Céleri', 'Pois mange-tout', 'Pastèque'],
  'oignon-fructanes': ['Ail', 'Échalote', 'Blé (pain, pâtes)', 'Artichaut', 'Asperge'],
  'pain-levain-fructanes': ['Seigle', 'Orge', 'Blé complet', 'Couscous', 'Biscottes'],
  'mangue-fructose': ['Miel', 'Pomme', 'Poire', 'Pastèque', 'Cerise'],
}

// Default markdown for the "same family" card: a short intro + a bullet list of foods that
// usually become safe once this test is tolerated. Used until the user saves an override.
export function defaultCategoryMarkdown(protocol) {
  const family = protocol.fodmapFamily.replace(/^Test\s+/i, '').toLowerCase()
  const list = (RELATED_FOODS[protocol.id] || []).map(f => `- ${f}`).join('\n')
  return `Une fois ce test bien toléré, vous tolérez probablement les autres aliments riches en **${family}**, par exemple :\n\n${list}\n\n> Ajoutez ou retirez des aliments selon votre tolérance.`
}

// Comfort levels logged on test days, ordered from best to worst tolerance.
export const COMFORT_LEVELS = [
  { v: 'very_good', label: 'Très bien' },
  { v: 'slightly_bothered', label: 'Un peu gêné' },
  { v: 'moderately_bothered', label: 'Modérément gêné' },
  { v: 'very_bothered', label: 'Très gêné' },
]

// The three days that carry a dose + a comfort log (1, 3, 5). Days 2 and 4 are recovery.
export const TEST_DAYS = [1, 3, 5]
