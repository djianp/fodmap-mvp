import { PHOTOS, tileFor, VERDICT_TEXT, metaFor, initialFor } from '../lib/foods-meta.js'

export function Thumb({ food, size = 48 }) {
  const url = PHOTOS[food.id]
  const tile = tileFor(food.id)
  const style = {
    width: size, height: size,
    borderRadius: 999,
    border: "2px solid #1f1a14",
    boxShadow: `0 ${Math.max(2, Math.round(size/24))}px 0 #1f1a14`,
    flexShrink: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundColor: tile,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: Math.round(size * 0.4),
    color: ["#3d4a5c","#2d2420","#704e3a"].includes(tile) ? "#f5f0e6" : "#1f1a14",
    overflow: "hidden",
  }
  if (url) style.backgroundImage = `url("${url}")`
  return (
    <div style={style}>
      {!url && initialFor(food)}
    </div>
  )
}

export function Verdict({ value, size = "sm" }) {
  const txt = VERDICT_TEXT[value]
  const bg = { green: "#b8d398", amber: "#f5c887", red: "#f0a390" }[value]
  const pad = size === "lg" ? "7px 14px" : "5px 10px"
  const fs = size === "lg" ? 11 : 10
  return (
    <span style={{
      background: bg, fontSize: fs, fontWeight: 700, letterSpacing: 1,
      padding: pad, border: "1.5px solid #1f1a14", borderRadius: 999,
      boxShadow: "0 2px 0 #1f1a14", color: "#1f1a14", whiteSpace: "nowrap",
      fontFamily: "'Bricolage Grotesque', sans-serif",
      textTransform: "uppercase",
    }}>{txt}</span>
  )
}

export function Chip({ label, on, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 14px", borderRadius: 999,
      border: "1.5px solid #1f1a14",
      background: on ? "#1f1a14" : "#fff",
      color: on ? "#f5f0e6" : "#1f1a14",
      fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
      boxShadow: on ? "none" : "0 2px 0 #1f1a14",
      cursor: "pointer", fontFamily: "inherit",
    }}>{label}</button>
  )
}

export function FoodRow({ food, moment = "soir", onClick }) {
  const verdict = food[moment]
  return (
    <button onClick={onClick} style={{
      width: "100%", textAlign: "left", cursor: "pointer",
      background: "#fff", border: "2px solid #1f1a14", borderRadius: 16,
      padding: "8px 12px 8px 8px", marginBottom: 8,
      display: "flex", alignItems: "center", gap: 12,
      boxShadow: "0 3px 0 #1f1a14", fontFamily: "inherit",
    }}>
      <Thumb food={food} size={48} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.2, color: "#1f1a14", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0 }}>{food.nom}</div>
          {food.details && (
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#7a6b55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-label="Notes personnelles">
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="11" x2="12" y2="16" />
              <circle cx="12" cy="8" r="0.5" fill="#7a6b55" />
            </svg>
          )}
        </div>
        {food.contrainte && (
          <div style={{ fontSize: 11, color: "#7a6b55", fontStyle: "italic", marginTop: 2, lineHeight: 1.3 }}>{food.contrainte}</div>
        )}
        <div style={{ fontSize: 11, color: "#7a6b55", fontWeight: 500, marginTop: 2 }}>{metaFor(food)}</div>
      </div>
      <Verdict value={verdict} />
    </button>
  )
}

export function SectionHeader({ title, action, onAction }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10, marginTop: 4 }}>
      <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.4px" }}>{title}</div>
      {action && (
        <button onClick={onAction} style={{ background: "none", border: "none", cursor: "pointer",
          fontSize: 11, fontWeight: 600, color: "#e67f52", fontFamily: "inherit" }}>
          {action} →
        </button>
      )}
    </div>
  )
}

export function BlobLogo({ size = 32 }) {
  return (
    <div style={{
      width: size, height: size, background: "#e67f52",
      borderRadius: "42% 58% 60% 40% / 45% 45% 55% 55%",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#f5f0e6", fontWeight: 700, fontSize: size * 0.47,
      transform: "rotate(-8deg)", flexShrink: 0,
    }}>g</div>
  )
}

export function IconBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 36, height: 36, borderRadius: 999, background: "#fff",
      border: "1.5px solid #1f1a14", boxShadow: "0 2px 0 #1f1a14",
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", padding: 0, flexShrink: 0,
    }}>{children}</button>
  )
}

