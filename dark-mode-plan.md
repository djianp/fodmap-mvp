# Dark Mode — Plan

> Status: **proposed, not implemented**. Companion to [`i18n-plan.md`](./i18n-plan.md). Captured here so we can decide later whether to ship it.

## Context

Every color in the app is a hex literal hard-coded in inline JSX styles. There are no CSS variables and no theming layer. The "parchment paper" aesthetic (warm cream `#f5f0e6`, deep brown `#1f1a14`, chunky black `0 2px 0` drop shadows) is signature and pervasive — but that means the same `#1f1a14` appears 198 times across 14 files, which is exactly the surface area a dark-mode refactor has to flip.

Inventory snapshot (from a deep search through `src/`):
- ~600 color references across 14 files; 100% inline literals
- ~10 distinct **theme colors** that need to flip in dark mode (text, backgrounds, borders, muted text, drop-shadow brown, dim-overlay rgba)
- ~10 distinct **accent palette colors** that should stay (verdict pills green/amber/red, "À tester" salmon, "Livraison" lavender, brand orange `#e67f52`, error rust `#c9543e`)
- Hottest files: `restos.jsx` (91 refs), `suggestions.jsx` (63), `resto-forms.jsx` (63), `aliments.jsx` (42), `ui.jsx` (32)

Decision: ship in **two PRs** so a regression-prone refactor doesn't ride alongside the new dark palette.

---

## PR A — CSS variables refactor (no visual change)

### Goal
Move every theme-colored inline literal to a CSS variable. Light mode is the current palette; dark mode doesn't exist yet. App should look pixel-identical when this PR ships.

### Variable definitions in `src/index.css`
Define tokens at `:root`:
```css
:root {
  /* Surfaces */
  --bg-page:        #e5ddce;  /* outer body */
  --bg-app:         #f5f0e6;  /* phone-frame inner */
  --bg-card:        #fff;     /* card / input */
  --bg-soft:        #e9d7b6;  /* sand badges, photo placeholders */
  --bg-comment:     #f5e3b8;  /* yellow comment / notes box */
  --bg-disabled:    #d9c3a0;  /* disabled button bg */
  --bg-input-ro:    #eee6d3;  /* read-only input (settings address) */
  --bg-banner:      #fff3d6;  /* recalc banner */

  /* Text */
  --text-primary:   #1f1a14;
  --text-on-dark:   #f5f0e6;
  --text-muted:     #7a6b55;
  --text-hint:      #a39a8d;
  --text-on-comment:#2d1e0f;

  /* Borders & shadows */
  --border:         #1f1a14;
  --border-soft:    rgba(31,26,20,0.18);
  --border-divider: rgba(31,26,20,0.12);
  --shadow:         #1f1a14;
  --overlay:        rgba(31,26,20,0.55);

  /* Accents — light mode keeps current values; dark mode may tweak brightness */
  --accent-orange:  #e67f52;
  --accent-error:   #c9543e;
  --pill-green:     #b8d398;
  --pill-amber:     #f5c887;
  --pill-red:       #f0a390;   /* also used for "À tester" salmon */
  --pill-lavender:  #c8b5d4;   /* "Livraison" */

  /* Map fallback decoration */
  --map-stroke:     #c4a878;
  --map-water:      #a8b4c4;
}
```

### Refactor pattern
Every inline style that uses a hex color references the matching variable:
```jsx
// before
style={{ background: '#fff', border: '1.5px solid #1f1a14', boxShadow: '0 2px 0 #1f1a14' }}

// after
style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border)', boxShadow: '0 2px 0 var(--shadow)' }}
```

Keep accent literals in tile fallback palettes (`foods-meta.js#TILES`) and Google Map marker icons untouched in this PR — both can map to vars in PR B if desired.

### Files touched (in order of impact)
- `src/index.css` — variable definitions, update existing `body` / `.phone` rules to use vars
- `src/screens/restos.jsx` — 91 swaps
- `src/screens/suggestions.jsx` — 63 swaps
- `src/screens/resto-forms.jsx` — 63 swaps
- `src/screens/aliments.jsx` — 42 swaps
- `src/components/ui.jsx` — 32 swaps
- `src/screens/suggestion-forms.jsx` — 25 swaps
- `src/screens/login.jsx` — 16 swaps
- `src/screens/aliment-forms.jsx` — 14 swaps
- `src/components/google-map.jsx` — 11 swaps (marker icon strokes; safe to var-ize)
- `src/components/place-autocomplete.jsx` — 8 swaps
- `src/screens/settings.jsx` — 6 swaps
- `src/App.jsx` — 6 swaps
- `src/lib/foods-meta.js` — leave the `TILES` palette alone (decorative, fine in both modes)

### Verification (PR A)
- `npm run build` passes
- App looks **pixel-identical** to current (compare one screen at a time on the preview deploy)
- DevTools → Computed styles → confirm color values are unchanged
- No `prefers-color-scheme` / no toggle yet — pure refactor

---

## PR B — Dark theme + Settings toggle

### Goal
Add a dark palette overlay, a 3-state toggle in the Settings modal (Light / Dark / Système), and persist the choice in `user_settings` so it syncs across devices like office/home addresses do.

### Schema migration (one line, run in Supabase SQL Editor)
```sql
ALTER TABLE user_settings
  ADD COLUMN theme text NOT NULL DEFAULT 'system'
  CHECK (theme IN ('light', 'dark', 'system'));
```
Update README schema block.

### Dark palette — extend `src/index.css`
Both an explicit `[data-theme="dark"]` selector (manual choice) and a `prefers-color-scheme` media query (system mode) write into the same vars.

Suggested values (warm dark, not pure black, to keep the cozy feel):
```css
[data-theme="dark"] {
  --bg-page:        #0f0d0a;
  --bg-app:         #1c1916;
  --bg-card:        #2a2620;
  --bg-soft:        #3d342a;
  --bg-comment:     #3a3120;
  --bg-disabled:    #4a3f33;
  --bg-input-ro:    #2a2620;
  --bg-banner:      #3a2f18;

  --text-primary:   #f5f0e6;
  --text-on-dark:   #1f1a14;        /* button label on a dark-pill */
  --text-muted:     #a39482;
  --text-hint:      #80766a;
  --text-on-comment:#e8dfca;

  --border:         #f5f0e6;        /* light borders on dark surfaces */
  --border-soft:    rgba(245,240,230,0.18);
  --border-divider: rgba(245,240,230,0.12);
  --shadow:         #f5f0e6;        /* cream "chunky" shadow on dark bg */
  --overlay:        rgba(0,0,0,0.65);

  /* Accents — slightly brighter for legibility on dark surfaces */
  --pill-green:     #9bc679;
  --pill-amber:     #f0bc6a;
  --pill-red:       #ec8a72;
  --pill-lavender:  #b59dc9;
  --accent-orange:  #f3956b;
  --accent-error:   #e0664f;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) { /* same overrides as [data-theme="dark"] */ }
}
```

The "system" choice resolves at runtime: if `theme === 'system'`, leave `<html>` without `data-theme` and let the media query take over. If `theme === 'light'` or `'dark'`, set `data-theme` explicitly and the media query is skipped via the `:not([data-theme])` selector.

### Wire-up
- **`src/lib/user-settings.js`** — extend the loaded/saved/exposed state with `theme`. On `loadSettings()`, after the row is read, set the `data-theme` attribute on `document.documentElement` (or remove it for `'system'`). Same on `saveSettings()`.
- **`src/screens/settings.jsx`** — add a new Field "Thème" with three pill buttons (Système / Clair / Sombre) above or below the existing language picker (if shipped). Tap → calls `save({ ..., theme: 'dark' })`.
- **`src/App.jsx`** — no change; `loadSettings()` already runs on auth.

### Visual touch-ups in dark mode
A few signature pieces need a quick second look once the palette flips — none are blockers, but plan to verify:
- **BlobLogo** — orange on dark looks fine in spot-check, but may need a slightly different orange hue for contrast.
- **Drop shadows** — `0 2px 0 var(--shadow)` becomes a cream shadow on dark surfaces. The "chunky" aesthetic survives but reads more like a glow than a hard line. Acceptable.
- **Comment / notes yellow box** — `#f5e3b8` becomes `#3a3120`; the markdown body text inside needs to stay readable.
- **Modal overlay** `rgba(0,0,0,0.65)` — slightly stronger than light-mode 0.55 to keep the "lift" feel.
- **Inputs** — the autocomplete dropdown inherits `--bg-card` and `--border-soft`; verify the hover/focus states aren't invisible.
- **Map markers** — the salmon-circle "delivery" marker still pops on Google's default light map. If you ever switch to a dark map style, the marker will need a paler border. Out of scope.

### Critical files (PR B)
- `src/index.css` (extended)
- `src/lib/user-settings.js` (theme state + DOM-attribute side effect)
- `src/screens/settings.jsx` (theme picker)
- `README.md` (schema block)

### Verification (PR B)
- `npm run build` passes
- Toggle Light → Dark in Settings → entire UI flips palette without a reload
- Toggle to Système → palette follows OS preference; flipping the OS theme updates the app live
- Refresh page → setting persists
- Open on a second device with the same login → theme matches
- All five accent pills (green/amber/red/lavender/salmon) remain readable on dark surfaces
- Modifier / Supprimer buttons in modals have enough contrast to read against the new dark card

---

## Rough effort estimate
- **PR A** (CSS vars refactor): ~half a day. Mostly mechanical search/replace, but every screen needs a visual diff against the production preview.
- **PR B** (dark palette + toggle): ~half a day. Palette tuning is the real cost; the wiring is small.

## Open / non-goals
- The `TILES[]` palette in `foods-meta.js` (used for monogram tile fallbacks) stays as-is — they're already a mix of light/dark colors and the existing brightness-aware text-color logic in `Thumb` already handles legibility.
- Photos uploaded by the user (food / suggestion hero images) keep their natural colors in dark mode — no inversion or filter applied.
- The `e67f52` brand orange in the BlobLogo is treated as a brand color, not a theme color. May darken slightly in PR B but stays "orange".
- We don't try to pre-render different color schemes during SSR — the app is client-rendered only, so a brief light flash on first load could appear if the user is in dark mode and we apply the attribute *after* the first paint. If that's noticeable, the fix is to inline a tiny script in `index.html` that reads localStorage and sets `data-theme` synchronously before React mounts. Defer until needed.
