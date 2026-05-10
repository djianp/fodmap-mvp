export const OCCASIONS = [
  { v: 'petit_dej', label: 'Petit-déj', icon: '🍳' },
  { v: 'dej',       label: 'Déj',       icon: '☀️' },
  { v: 'snack',     label: 'Snack',     icon: '🍪' },
  { v: 'diner',     label: 'Dîner',     icon: '🌙' },
]

export const CONTEXTS = [
  { v: 'maison', label: 'Maison', icon: '🏠' },
  { v: 'bureau', label: 'Bureau', icon: '🏢' },
  { v: 'resto',  label: 'Resto',  icon: '🍽️' },
]

const OCCASION_LABELS = Object.fromEntries(OCCASIONS.map(o => [o.v, o.label]))
const CONTEXT_LABELS = Object.fromEntries(CONTEXTS.map(c => [c.v, c.label]))

export function labelOccasion(v) { return OCCASION_LABELS[v] || v }
export function labelContext(v) { return CONTEXT_LABELS[v] || v }
