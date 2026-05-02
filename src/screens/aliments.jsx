import { useEffect, useMemo, useState } from 'react'
import { BlobLogo, Chip, FoodRow, Verdict, Thumb } from '../components/ui.jsx'
import { useFoods, deleteFood } from '../lib/user-data.js'
import { CATEGORIES, PHOTOS, PHOTOS_DETAIL } from '../lib/foods-meta.js'
import { AlimentForm } from './aliment-forms.jsx'

const verdictOrder = { green: 0, amber: 1, red: 2 }
const noteNum = (f) => {
  const n = parseFloat(f.note)
  return Number.isFinite(n) ? n : -Infinity
}
const CATEGORY_ICONS = {
  'Féculents': '🌾',
  'Protéines': '🐟',
  'Légumes': '🥦',
  'Fruits': '🍎',
  'Condiments': '🧂',
}

function AlimentDetailModal({ food, onClose, onEdit, onDelete }) {
  useEffect(() => {
    if (!food) return
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose, food])
  if (!food) return null
  const photoUrl = PHOTOS_DETAIL[food.id] || PHOTOS[food.id]
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 30,
      background: 'rgba(31,26,20,0.55)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '40px 14px 90px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 430, maxHeight: '100%',
        background: '#f5f0e6', borderRadius: 22, border: '2px solid #1f1a14',
        boxShadow: '0 8px 0 #1f1a14',
        position: 'relative',
        animation: 'slideUp 0.22s ease-out',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <button onClick={onClose} aria-label="Fermer" style={{
          position: 'absolute', top: 10, right: 10, zIndex: 2,
          width: 32, height: 32, borderRadius: 999, border: '2px solid #1f1a14',
          background: '#fff', boxShadow: '0 2px 0 #1f1a14', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'inherit', fontSize: 16, lineHeight: 1, color: '#1f1a14',
        }}>×</button>

        {photoUrl && (
          <div role="img" aria-label={food.nom} style={{
            height: 240, flexShrink: 0,
            backgroundImage: `url("${photoUrl}")`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }} />
        )}

        <div style={{ padding: 18, overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {photoUrl ? (
            <div style={{ marginBottom: 14, paddingRight: 36 }}>
              <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.5px' }}>{food.nom}</div>
              <div style={{ fontSize: 12, color: '#7a6b55', marginTop: 4 }}>
                {food.cat}{food.note ? ` · ${food.note}` : ''}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, paddingRight: 36 }}>
              <Thumb food={food} size={48} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.4px' }}>{food.nom}</div>
                <div style={{ fontSize: 11, color: '#7a6b55', marginTop: 2 }}>
                  {food.cat}{food.note ? ` · ${food.note}` : ''}
                </div>
              </div>
            </div>
          )}

        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#7a6b55', textTransform: 'uppercase', marginBottom: 6 }}>Midi</div>
            <Verdict value={food.midi} size="lg" />
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#7a6b55', textTransform: 'uppercase', marginBottom: 6 }}>Soir</div>
            <Verdict value={food.soir} size="lg" />
          </div>
        </div>

        {food.fodmap && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#7a6b55', textTransform: 'uppercase', marginBottom: 4 }}>FODMAP</div>
            <div style={{ fontSize: 13, color: '#1f1a14', lineHeight: 1.45 }}>{food.fodmap}</div>
          </div>
        )}

        {food.contrainte && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#7a6b55', textTransform: 'uppercase', marginBottom: 4 }}>Contrainte</div>
            <div style={{ fontSize: 13, color: '#1f1a14', lineHeight: 1.45, fontWeight: 700 }}>{food.contrainte}</div>
          </div>
        )}

        {food.details && (
          <div style={{ marginBottom: 12, padding: '10px 12px', background: '#f5e3b8', border: '1.5px solid #1f1a14', borderRadius: 10 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: '#7a6b55', textTransform: 'uppercase', marginBottom: 4 }}>Notes personnelles</div>
            <div style={{ fontSize: 13, color: '#1f1a14', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>{food.details}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button onClick={onEdit} style={{
            flex: 1,
            padding: '10px 16px', borderRadius: 999,
            background: '#1f1a14', color: '#f5f0e6',
            border: '2px solid #1f1a14', boxShadow: '0 3px 0 #1f1a14',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>Modifier</button>
          <button onClick={() => onDelete(food)} style={{
            padding: '10px 16px', borderRadius: 999,
            background: '#fff', color: '#c9543e',
            border: '2px solid #c9543e', boxShadow: '0 3px 0 #c9543e',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>Supprimer</button>
        </div>
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  )
}

export function MVPAlimentsScreen({ moment, setMoment }) {
  const { foods, loading, error, refresh } = useFoods()
  const [q, setQ] = useState('')
  const [catFilter, setCatFilter] = useState('Tous')
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [editingFood, setEditingFood] = useState(null)

  const filtered = useMemo(() => {
    let list = foods
    if (q.trim()) {
      const norm = s => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
      const nq = norm(q.trim())
      list = list.filter(f => norm(f.nom).includes(nq))
    }
    if (catFilter !== 'Tous') list = list.filter(f => f.cat === catFilter)
    return list
  }, [q, catFilter, foods])

  const groups = {}
  filtered.forEach(f => { (groups[f.cat] ||= []).push(f) })
  Object.keys(groups).forEach(k => {
    groups[k].sort((a, b) =>
      verdictOrder[a[moment]] - verdictOrder[b[moment]]
      || noteNum(b) - noteNum(a)
      || a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' })
    )
  })
  const orderedCats = CATEGORIES.filter(c => groups[c] && groups[c].length)

  const selectedLatest = selected ? foods.find(f => f.id === selected.id) || selected : null

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <BlobLogo size={30} />
        <div style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.6px' }}>Aliments</div>
        <button onClick={() => setShowAdd(true)} disabled={loading} style={{
          marginLeft: 'auto',
          padding: '6px 12px', borderRadius: 999,
          background: loading ? '#d9c3a0' : '#1f1a14',
          color: loading ? '#7a6b55' : '#f5f0e6',
          border: '2px solid #1f1a14', boxShadow: loading ? 'none' : '0 2px 0 #1f1a14',
          fontSize: 11, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          display: 'inline-flex', alignItems: 'center', gap: 4, letterSpacing: 0.3,
        }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>+</span> Aliment
        </button>
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
        <Chip label="Midi" icon="☀️" on={moment === 'midi'} onClick={() => setMoment('midi')} />
        <Chip label="Soir" icon="🌙" on={moment === 'soir'} onClick={() => setMoment('soir')} />
      </div>

      <div className="chips-scroll" style={{ marginBottom: 18 }}>
        {['Tous', ...CATEGORIES].map(c =>
          <Chip key={c} label={c} icon={CATEGORY_ICONS[c]} on={catFilter === c} onClick={() => setCatFilter(c)} />
        )}
      </div>

      {error && (
        <div style={{ padding: 14, background: '#f0a390', border: '2px solid #1f1a14',
          borderRadius: 12, fontSize: 12, color: '#1f1a14', marginBottom: 14 }}>
          Erreur de chargement : {error.message || String(error)}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#7a6b55', fontSize: 13 }}>
          Chargement des aliments…
        </div>
      ) : (
        orderedCats.map(cat => (
          <div key={cat} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase',
              fontWeight: 700, color: '#7a6b55', marginBottom: 8 }}>
              {CATEGORY_ICONS[cat] && <span style={{ marginRight: 6, letterSpacing: 0 }} aria-hidden="true">{CATEGORY_ICONS[cat]}</span>}
              {cat} · {groups[cat].length}
            </div>
            {groups[cat].map(f => <FoodRow key={f.id} food={f} moment={moment} onClick={() => setSelected(f)} />)}
          </div>
        ))
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7a6b55' }}>
          Aucun aliment trouvé.
        </div>
      )}

      <AlimentDetailModal
        food={selectedLatest}
        onClose={() => setSelected(null)}
        onEdit={() => { setEditingFood(selectedLatest); setSelected(null) }}
        onDelete={async (f) => {
          if (!window.confirm(`Supprimer « ${f.nom} » ?`)) return
          try {
            await deleteFood(f.id)
            setSelected(null)
            refresh()
          } catch (err) {
            window.alert(err.message || String(err))
          }
        }}
      />

      {showAdd && (
        <AlimentForm
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); refresh() }}
        />
      )}

      {editingFood && (
        <AlimentForm
          food={editingFood}
          onClose={() => setEditingFood(null)}
          onSaved={() => { setEditingFood(null); refresh() }}
        />
      )}
    </>
  )
}
