import { useMemo, useState } from 'react'
import { BlobLogo, Chip, FoodRow } from '../components/ui.jsx'
import { FOODS } from '../data/foods.js'
import { CATEGORIES, search } from '../lib/foods-meta.js'

const verdictOrder = { green: 0, amber: 1, red: 2 }

export function MVPAlimentsScreen({ moment, setMoment }) {
  const [q, setQ] = useState('')
  const [catFilter, setCatFilter] = useState('Tous')

  const filtered = useMemo(() => {
    let list = q ? search(q) : FOODS
    if (catFilter !== 'Tous') list = list.filter(f => f.cat === catFilter)
    return list
  }, [q, catFilter])

  const groups = {}
  filtered.forEach(f => { (groups[f.cat] ||= []).push(f) })
  Object.keys(groups).forEach(k => {
    groups[k].sort((a, b) => verdictOrder[a[moment]] - verdictOrder[b[moment]])
  })
  const orderedCats = CATEGORIES.filter(c => groups[c] && groups[c].length)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <BlobLogo size={30} />
        <div style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.6px' }}>Aliments</div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#fff', border: '2px solid #1f1a14', borderRadius: 14,
        padding: '10px 14px', marginBottom: 12, boxShadow: '0 3px 0 #1f1a14',
      }}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#1f1a14" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Rechercher un aliment…"
          style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: 'inherit', fontSize: 14, color: '#1f1a14' }}
        />
        {q && <button onClick={() => setQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7a6b55', fontSize: 18, padding: 0 }}>×</button>}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <Chip label="Midi" on={moment === 'midi'} onClick={() => setMoment('midi')} />
        <Chip label="Soir" on={moment === 'soir'} onClick={() => setMoment('soir')} />
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {['Tous', ...CATEGORIES].map(c =>
          <Chip key={c} label={c} on={catFilter === c} onClick={() => setCatFilter(c)} />
        )}
      </div>

      {orderedCats.map(cat => (
        <div key={cat} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase',
            fontWeight: 700, color: '#7a6b55', marginBottom: 8 }}>{cat} · {groups[cat].length}</div>
          {groups[cat].map(f => <FoodRow key={f.id} food={f} moment={moment} onClick={() => {}} />)}
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7a6b55' }}>
          Aucun aliment trouvé.
        </div>
      )}
    </>
  )
}
