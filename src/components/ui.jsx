import { PHOTOS, tileFor, VERDICT_TEXT, metaFor, initialFor } from '../lib/foods-meta.js'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const MARKDOWN_COMPONENTS = {
  p: ({ children }) => <p style={{ margin: '4px 0' }}>{children}</p>,
  ul: ({ children }) => <ul style={{ margin: '4px 0', paddingLeft: 20 }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin: '4px 0', paddingLeft: 20 }}>{children}</ol>,
  li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
  h1: ({ children }) => <h1 style={{ fontSize: 15, fontWeight: 700, margin: '8px 0 4px' }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ fontSize: 14, fontWeight: 700, margin: '8px 0 4px' }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: 13, fontWeight: 700, margin: '6px 0 3px' }}>{children}</h3>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-orange)', textDecoration: 'underline' }}>{children}</a>,
  code: ({ children }) => <code style={{ background: 'rgba(31,26,20,0.08)', padding: '1px 4px', borderRadius: 4, fontSize: '0.95em' }}>{children}</code>,
  blockquote: ({ children }) => <blockquote style={{ margin: '4px 0', paddingLeft: 10, borderLeft: '3px solid rgba(31,26,20,0.25)', color: 'var(--text-muted)' }}>{children}</blockquote>,
  hr: () => <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid var(--border-soft)' }} />,
  table: ({ children }) => (
    <div style={{ overflowX: 'auto', overscrollBehavior: 'contain', margin: '8px 0' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.95em' }}>{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th style={{ textAlign: 'left', padding: '5px 8px', borderBottom: '2px solid var(--ink)', fontWeight: 700, whiteSpace: 'nowrap' }}>{children}</th>
  ),
  td: ({ children }) => (
    <td style={{ padding: '5px 8px', borderBottom: '1px solid var(--border-divider)', verticalAlign: 'top' }}>{children}</td>
  ),
}

export function Markdown({ children }) {
  if (!children) return null
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>{children}</ReactMarkdown>
}

export function Thumb({ food, size = 48 }) {
  const url = food.photo_url || PHOTOS[food.id]
  const tile = tileFor(food.id)
  const style = {
    width: size, height: size,
    borderRadius: 999,
    border: "2px solid var(--ink)",
    boxShadow: `0 ${Math.max(2, Math.round(size/24))}px 0 var(--ink)`,
    flexShrink: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundColor: tile,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: Math.round(size * 0.4),
    color: ["#3d4a5c","#2d2420","#704e3a"].includes(tile) ? "var(--paper)" : "var(--ink)",
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
  const bg = { green: "var(--pill-green)", amber: "var(--pill-amber)", red: "var(--pill-red)" }[value]
  const pad = size === "lg" ? "7px 14px" : "5px 10px"
  const fs = size === "lg" ? 11 : 10
  return (
    <span style={{
      background: bg, fontSize: fs, fontWeight: 700, letterSpacing: 1,
      padding: pad, border: "1.5px solid var(--ink)", borderRadius: 999,
      boxShadow: "0 2px 0 var(--ink)", color: "var(--ink)", whiteSpace: "nowrap",
      fontFamily: "'Bricolage Grotesque', sans-serif",
      textTransform: "uppercase",
    }}>{txt}</span>
  )
}

export function Chip({ label, icon, on, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 14px", borderRadius: 999,
      border: "1.5px solid var(--ink)",
      background: on ? "var(--ink)" : "var(--bg-card)",
      color: on ? "var(--paper)" : "var(--ink)",
      fontSize: 12, fontWeight: 500, whiteSpace: "nowrap",
      boxShadow: on ? "none" : "0 2px 0 var(--ink)",
      cursor: "pointer", fontFamily: "inherit",
      display: "inline-flex", alignItems: "center", gap: 6, lineHeight: 1,
    }}>
      {icon && <span style={{ fontSize: 14, lineHeight: 1 }} aria-hidden="true">{icon}</span>}
      {label}
    </button>
  )
}

export function FoodRow({ food, moment = "soir", onClick }) {
  const verdict = food[moment]
  return (
    <button onClick={onClick} style={{
      width: "100%", textAlign: "left", cursor: "pointer",
      background: "var(--bg-card)", border: "2px solid var(--ink)", borderRadius: 16,
      padding: "8px 12px 8px 8px", marginBottom: 8,
      display: "flex", alignItems: "center", gap: 12,
      boxShadow: "0 3px 0 var(--ink)", fontFamily: "inherit",
    }}>
      <Thumb food={food} size={48} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.2, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1, minWidth: 0 }}>{food.nom}</div>
          {food.details && (
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-label="Notes personnelles">
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="11" x2="12" y2="16" />
              <circle cx="12" cy="8" r="0.5" fill="var(--text-muted)" />
            </svg>
          )}
        </div>
        {food.contrainte && (
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic", marginTop: 2, lineHeight: 1.3 }}>{food.contrainte}</div>
        )}
        {metaFor(food) && (
          <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, marginTop: 2 }}>{metaFor(food)}</div>
        )}
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
          fontSize: 11, fontWeight: 600, color: "var(--accent-orange)", fontFamily: "inherit" }}>
          {action} →
        </button>
      )}
    </div>
  )
}

export function BlobLogo({ size = 32, children = 'g' }) {
  return (
    <div style={{
      width: size, height: size, background: "var(--accent-orange)",
      borderRadius: "42% 58% 60% 40% / 45% 45% 55% 55%",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "var(--paper)", fontWeight: 700, fontSize: size * 0.47,
      transform: "rotate(-8deg)", flexShrink: 0,
    }}>{children}</div>
  )
}

export function IconBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 36, height: 36, borderRadius: 999, background: "var(--bg-card)",
      border: "1.5px solid var(--ink)", boxShadow: "0 2px 0 var(--ink)",
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", padding: 0, flexShrink: 0,
    }}>{children}</button>
  )
}

