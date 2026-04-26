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
        <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.2, color: "#1f1a14", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{food.nom}</div>
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

export function StatusBar() {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "14px 28px 0", fontSize: 14, fontWeight: 600,
      position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
      color: "#1f1a14", fontFamily: "'Bricolage Grotesque', sans-serif",
    }}>
      <span>9:41</span>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        <svg width="16" height="10" viewBox="0 0 16 10"><path d="M1 7h2v2H1zM5 5h2v4H5zM9 3h2v6H9zM13 1h2v8h-2z" fill="currentColor"/></svg>
        <svg width="22" height="10" viewBox="0 0 22 10"><rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke="currentColor" fill="none"/><rect x="2" y="2" width="15" height="6" rx="1" fill="currentColor"/></svg>
      </div>
    </div>
  )
}
