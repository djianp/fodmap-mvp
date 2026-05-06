# Bilingual UI (FR/EN) — Plan

> Status: **proposed, not implemented**. Captured here so we can decide later whether to ship it.

## Context

The app's UI is fully French today, with ~80 hardcoded user-facing strings across 7 `.jsx` files plus 7 user-content text columns (food names, FODMAP rationale, meal comments, etc.) stored in Supabase as French text. The ask: let the user pick the UI language (FR/EN) on the Settings page, and have all user content available in both languages so the chosen language displays everywhere.

Decisions confirmed during planning:
- **Translation source**: LLM auto-translate via Claude API (Supabase Edge Function proxy), with a manual-override link to tweak the result
- **Scope**: ship in two PRs — UI i18n first, then user content

This document describes both PRs end-to-end. PR A is the immediate deliverable; PR B is the follow-up.

---

## PR A — UI i18n with FR/EN toggle

### Goal
Replace every hardcoded user-facing French string in the source with a `t(key)` lookup; add a Settings toggle so the user can pick the UI language; persist the choice in Supabase so it syncs across devices.

### Schema migration (one-line, user runs in Supabase SQL Editor)
```sql
ALTER TABLE user_settings
  ADD COLUMN language text NOT NULL DEFAULT 'fr'
  CHECK (language IN ('fr', 'en'));
```
Then update the README schema block.

### New file: `src/lib/i18n.js`
A tiny in-house i18n module — no library deps, matches the project's minimalist style (`places-config.js` / `user-settings.js` precedent).

```js
const STRINGS = {
  fr: { 'aliments.tab': 'Aliments', 'aliments.search': 'Rechercher un aliment…', /* ~80 keys */ },
  en: { 'aliments.tab': 'Foods',    'aliments.search': 'Search food…',          /* ~80 keys */ },
}

let _lang = 'fr'
const subscribers = new Set()
export function getLang() { return _lang }
export function setLang(l) { _lang = l; subscribers.forEach(fn => fn()) }
export function t(key, params) {
  const s = STRINGS[_lang]?.[key] ?? STRINGS.fr[key] ?? key
  return params ? s.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? '') : s
}
export function useT() {
  const [, force] = useState(0)
  useEffect(() => { const fn = () => force(x => x + 1); subscribers.add(fn); return () => subscribers.delete(fn) }, [])
  return t
}
```

Mirror `user-settings.js`'s pub/sub pattern so `useT()` re-renders any consumer when the language changes.

### Wire-up
- **`src/lib/user-settings.js`** — add `language` to the loaded/saved/exposed state. On `loadSettings()` success, call `setLang(data.language)`. `saveSettings()` accepts a language too.
- **`src/App.jsx`** — call `loadSettings()` on auth (already done); the language sync is automatic via `setLang()`.
- **`src/screens/settings.jsx`** — add a third Field with two pills (FR / EN) above the address fields. Saving calls `save()` with the new language, which writes to Supabase and triggers `setLang()`.

### Replace hardcoded strings
Walk the inventory and replace each one with `t('key')`. Approximate distribution by file:
- `src/screens/aliments.jsx` — ~17 strings (modal headers, chips, search, empty state, confirm dialog)
- `src/screens/aliment-forms.jsx` — ~22 strings (labels, hints, placeholders, verdict picker)
- `src/screens/restos.jsx` — ~21 strings (chips, view toggle, status text, status pills, recalc banner)
- `src/screens/resto-forms.jsx` — ~25 strings (3 forms: AddResto, EditResto, MealForm) + StarInput aria-labels
- `src/screens/settings.jsx` — ~6 strings
- `src/screens/login.jsx` — ~7 strings
- `src/App.jsx` — 4 strings (tab labels, footer links)
- `src/components/ui.jsx` — 1 (info icon aria-label)
- `src/components/place-autocomplete.jsx` — 1 (default placeholder)

Templates handled via the `params` form: `t('restos.count', { n: filtered.length })` → `"{n} approuvés · triés par note"` / `"{n} approved · sorted by rating"`.

Category enum values stay French in the database (`'Féculents'`, `'Protéines'`, etc.). Display via a `t('cat.feculents')` lookup. Same for verdict labels and resto status.

### Critical files (PR A)
- `src/lib/i18n.js` (new)
- `src/lib/user-settings.js` (extended)
- `src/screens/settings.jsx` (language picker)
- `src/App.jsx` (4 strings)
- `src/screens/aliments.jsx`, `aliment-forms.jsx`, `restos.jsx`, `resto-forms.jsx`, `login.jsx` (string replacement)
- `src/components/ui.jsx`, `place-autocomplete.jsx` (string replacement)
- `README.md` (schema block)

### Verification (PR A)
- `npm run build` passes
- Toggle FR ↔ EN in Settings → entire UI flips language without a reload
- Refresh page → setting persists
- Open on a second device with the same login → language matches
- All ~80 strings have a translation (no raw keys leaking through)

---

## PR B — Bilingual user content (LLM auto-translate)

### Goal
For each translatable field on `foods` / `restos` / `meals`, store both languages. On save, the missing-language version is filled by Claude. The user can override via a small "Modifier la version EN" link.

### Schema migration
Add a `translations` JSONB column to each table. Single column per table keeps the schema flexible and avoids 7 new typed columns:

```sql
ALTER TABLE foods ADD COLUMN translations jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE restos ADD COLUMN translations jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE meals ADD COLUMN translations jsonb NOT NULL DEFAULT '{}'::jsonb;
```

Per-row shape:
```json
{
  "fr": { "nom": "Saumon", "fodmap": "Riche en oméga-3...", "contrainte": null, "details": null },
  "en": { "nom": "Salmon", "fodmap": "Rich in omega-3...", "contrainte": null, "details": null }
}
```

Keeping the existing top-level columns (`nom`, `fodmap`, etc.) — they become the canonical "original-language" version. The JSONB stores translations only. Reads merge: prefer `translations[active_lang]`, fall back to top-level columns.

Translatable fields per table (the ones that go inside `translations`):
- `foods`: `nom`, `fodmap`, `contrainte`, `details`
- `restos`: `nom`
- `meals`: `nom`, `proteine`, `comment`

### New: Supabase Edge Function `translate`
A tiny Deno function that proxies to the Claude API. Avoids exposing the Anthropic key in the client bundle.

- Endpoint: `POST /functions/v1/translate`
- Input: `{ texts: string[], source: 'fr', target: 'en' }`
- Output: `{ translations: string[] }`
- Implementation: single `messages.create` call to `claude-haiku-4-5` (cheapest, fast enough) with a prompt like *"Translate each item from {source} to {target}, preserving formatting. Return JSON array."* — using prompt caching for the system prompt. Cost: ~$0.0001 per translation; <$0.10 for the whole dataset.
- Auth: validates Supabase JWT; rate-limits per `auth.uid()`.

User adds `ANTHROPIC_API_KEY` to the function's environment in the Supabase dashboard.

### Translation helpers in `src/lib/translations.js`
```js
export async function translateBatch(rowsByTable) { /* calls the edge function */ }
export function translatedView(row, lang) { /* merges row + translations[lang] */ }
```

### Save-flow integration
- `addFood` / `updateFood` / `addResto` / `updateResto` / `addMeal` / `updateMeal` (all in `src/lib/user-data.js`):
  - After the upsert, if any translatable field changed and the other-language version is missing, call the edge function in the background (fire-and-forget) and patch `translations` once it returns.
  - Same lazy-load pattern as the walking-time recalc in `user-settings.js`.

### Backfill on first-run
On first load after PR B ships, kick off a background job to translate every row that has empty `translations`. Show a single subtle "Traduction en arrière-plan…" pill on whichever screen is open, similar to the existing recalc banner.

### Display
- `useFoods` / `useRestos` apply `translatedView(row, lang)` per row before returning. Components stay unchanged.
- Forms show a single input per field by default. A "Modifier la version EN" link below each translatable field expands a second input pre-filled with the current translation. Editing it persists to `translations.en` directly, no API call.

### Critical files (PR B)
- `supabase/functions/translate/index.ts` (new — committed; user deploys via `supabase functions deploy translate`)
- `src/lib/translations.js` (new)
- `src/lib/user-data.js` (save-flow integration + view merge)
- `src/screens/aliment-forms.jsx`, `resto-forms.jsx` (manual-override UI)
- `README.md` (schema block + edge function setup)

### Verification (PR B)
- After SQL run + edge function deploy, save a new food in FR → EN translation appears in DB within ~2 s, displays when UI is in EN
- Tap "Modifier la version EN" on an existing food → second input shows the translation, editable, saves on blur
- Backfill banner appears on first load, disappears once all rows are translated
- Switch UI language → all food/meal/resto strings flip
- Edge function rejects a request without a valid Supabase JWT
- `npm run build` passes

---

## Open / non-goals
- Addresses (`restos.adresse`, `user_settings.*_address`) — not translated, language-neutral.
- The `tags` text array (used today for filters and `seedRestos` / `seedFoods`) — kept FR-only for now; UI labels for tag chips can pick up `t()` separately if/when tag chips become user-facing again.
- No user-pluralization logic (e.g. "1 approuvé" vs "2 approuvés") — current copy already uses unit-agnostic phrasing.
- The login screen renders before `loadSettings()` resolves the language → it falls back to FR. Acceptable since logged-out users haven't set a preference yet; can be revisited if needed.

---

## Rough effort estimate
- **PR A**: ~80 string replacements + new i18n module + Settings UI + 1-line SQL migration. ~half a day of work end-to-end.
- **PR B**: schema migration + Edge Function + translation helpers + form override UI + backfill. ~1 day end-to-end, plus deploying the Edge Function and adding `ANTHROPIC_API_KEY` to Supabase.
