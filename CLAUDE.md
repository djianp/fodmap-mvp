# CLAUDE.md

Conventions and gotchas for Claude sessions in this project. Concise on purpose — Claude loads this on every session start.

## What this project is

`fodmap-mvp` — a single-user mobile-first web app for managing a low-FODMAP / SIBO-friendly diet. Three tabs: **Aliments** (food reference), **Restos** (restaurant directory with per-meal notes, walking + driving times), and **Suggestions** (meal/snack ideas tagged by occasion + context). Plus a Settings modal (Paramètres link in the footer) for the user's bureau/domicile addresses. UI is in French (impersonal / infinitive phrasing).

Live at `https://fodmap-mvp.vercel.app`. Public GitHub repo at `github.com/djianp/fodmap-mvp`.

## Stack

- **Frontend**: Vite + React 19, plain ES modules, no router (tab state via `useState` + `localStorage`).
- **Backend**: Supabase (Postgres + Auth + Row-Level Security). The publishable key + URL go in client env vars; secret key is never used.
- **Hosting**: Vercel, auto-deploys on push to `main`.

For deeper architecture and rationale, read `FOR PIERRE.md`. For setup commands and the SQL schema, read `README.md`. Don't duplicate them here.

## Commands

| | |
|---|---|
| `npm run dev` | Vite dev server on `localhost:5173` (HMR) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |

## Git conventions

- **Commit author email MUST be `pierre.djian@gmail.com`** with name "Pierre Djian". Vercel rejects deploys whose commit author can't be matched to a verified GitHub account, and `djianp@gmail.com` (a tempting guess based on the GitHub handle) is *not* a verified email — it will block deploys.
- **Never run `git config --global`**. Thread the identity into individual commands instead: `git -c user.name="Pierre Djian" -c user.email="pierre.djian@gmail.com" commit -m "..."`. The user has multiple repos with different identities; touching the global config has cross-repo blast radius.
- **`main` is the production branch**. Every push triggers a Vercel build and auto-promotes on success.
- **Never force-push to `main` without explicit user authorization.** History rewrites need a tagged backup (`git tag pre-rewrite`) and `--force-with-lease`, not `--force`.
- Use `gh` (already authenticated as `djianp`) for GitHub API calls; prefer it over scraping.

## Code conventions

- **ES modules everywhere.** No `window.*` globals — that pattern existed in the pre-Vite prototype and is fully removed.
- **Default export only for `App.jsx`**; everything else uses named exports. The Vite scaffold convention.
- **Rules of Hooks: call hooks before any conditional `return`.** React 19 in StrictMode trips on the violation; React 18 was lenient. Specifically: in modal components like `RestoModal`, gate the *body* of `useEffect` on a prop, don't gate the hook call itself.
- **Postgres `numeric` arrives as JSON strings.** PostgREST preserves precision by serializing as strings (`"4.50"`, not `4.5`). Coerce with `Number()` at the UI boundary, especially before arithmetic (`b.rating - a.rating` would silently NaN otherwise).
- **No comments unless the *why* is non-obvious.** Repo style is to let names carry meaning.

## Data layer

- **`src/lib/user-data.js` is the only file that calls Supabase for restos/meals/foods/suggestions.** Everything else imports from it.
- React hooks (each returns `{ items, loading, error, refresh }` plus extras):
  - `useRestos()` → adds `proteines` (derived list)
  - `useFoods()`
  - `useSuggestions()`
- Imperative helpers (all `async`, all rely on RLS — they resolve `auth.uid()` from the session and let Postgres enforce authorization):
  - Restos: `addResto`, `updateResto`, `deleteResto`
  - Meals: `addMeal`, `updateMeal`, `deleteMeal`
  - Foods: `addFood`, `updateFood`, `deleteFood`
  - Suggestions: `addSuggestion`, `updateSuggestion`, `deleteSuggestion`
- **Settings live in `src/lib/user-settings.js`** (separate module — pub-sub state, not a hook of `user-data`). `loadSettings()` reads the row on auth, `saveSettings({office, home})` writes and triggers a background `recalcAllRouteTimes()` that fans out walking + driving Distance Matrix calls in batches of 25 destinations and patches each resto's `walk_min_*` / `drive_min_*` columns.
- **Photos live in Supabase Storage**, helpers in `src/lib/storage.js`: `uploadFoodPhoto` / `deleteFoodPhoto` and `uploadSuggestionPhoto` / `deleteSuggestionPhoto`. Uploads go to `<user_id>/<entity_id>.<ext>` in the matching bucket; the public URL gets a `?v=<timestamp>` cache-buster so updates show immediately.
- **First-login seed**: on a new user's first visit, both `useRestos` and `useFoods` auto-seed when their respective tables are empty. `seedRestos()` and `seedFoods()` each runs at most once per user, gated by `data.length === 0`. Suggestions are not seeded.
- **Schema changes go through Supabase's SQL Editor**, not via repo-tracked migrations. Update `README.md`'s schema block when you change anything so the project stays reproducible.

## Environment variables

Required client-side env vars (both `VITE_`-prefixed so Vite exposes them in the bundle):

- `VITE_SUPABASE_URL` — `https://<project-ref>.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase's "publishable" key (formerly called `anon`)
- `VITE_GOOGLE_MAPS_API_KEY` — Google Cloud key for **Maps JavaScript API**, **Places API (New)**, and **Distance Matrix API**. Must be HTTP-referrer-restricted to `localhost:5173/*`, `fodmap-mvp.vercel.app/*`, and `*.vercel.app/*` (preview deploys), and API-restricted to those three services.

Locally: `.env.local` at the project root (gitignored via `*.local`). In production: Vercel **Project Settings → Environment Variables**, set on Production + Preview + Development.

`.env.local` is *machine-local*. Cloning the repo on a new device requires manually copying it.

## Things not to do

- **Don't commit `.env.local`**, ever. Verify with `git check-ignore .env.local` before staging.
- **Don't use Supabase's `secret` key** anywhere in this project. The publishable key + RLS is the entire security model.
- **Don't curl-poll `fodmap-mvp.vercel.app`** in tight loops. Vercel's bot mitigation will challenge you, and the response will look like the site changed (it didn't). Use `gh api repos/djianp/fodmap-mvp/commits/<sha>/statuses` to check deploy state instead.
- **Don't add `react-router`** unless explicitly asked. Tabs are intentionally non-routed — the state lives in memory and `localStorage`. Adding URL routing would mean updating bookmarks, share links, the auth-redirect flow, etc.
- **Don't add documentation files (`*.md`, `README.md` updates) unless asked.** Exception: this `CLAUDE.md` and `FOR PIERRE.md` exist by user request.
- **Don't pre-emptively delete the legacy prototype files** in the parent `untitled folder/` (`assets/`, `data/`, `mvp/`, `v2/`, `index.html`). They're unused but kept as a reference snapshot. Wait for explicit cleanup authorization.

## Google Maps integration

- **One API key, three services**: Maps JavaScript (the map view), Places API New (`AutocompleteSuggestion` for the address pickers + `Place.searchByText` for geocoding), Distance Matrix (walking *and* driving times).
- **`src/lib/google-maps.js`** is the single point of contact for the SDK — uses `setOptions()` + `importLibrary()` from `@googlemaps/js-api-loader` v2+ (the legacy `Loader` class is gone). A module-level `loadPromise` is hoisted so the map and autocomplete share one SDK fetch.
- **Office/home addresses** live in the `user_settings` Supabase table per user. `src/lib/places-config.js` only exports `DEFAULT_OFFICE_ADDRESS` / `DEFAULT_HOME_ADDRESS` as fallbacks for users with no settings row yet. `getOfficeLatLng()` / `getHomeLatLng()` cache geocodes by address so they auto-invalidate when the user saves new addresses.
- **`getRouteTimes(destination)`** returns walking + driving minutes from both anchors in one call (parallel Distance Matrix queries). `getRouteTimesBatch(office, home, destinations)` is the same shape but batched up to 25 destinations — used by the background recalc when settings change.
- **List + map filter cutoff**: 30-minute trip from the active anchor. Walking time for `dinein` / `takeaway` / `totry` restos; driving time for `delivery` restos. The Carte view applies the same filter.
- **Don't reintroduce `PlaceAutocompleteElement`.** Google's web component goes full-screen on mobile when the user types and overflows the visual viewport on iOS Chrome. We replaced it with a custom `<input>` + in-flow dropdown built on `AutocompleteSuggestion` (`src/components/place-autocomplete.jsx`) — fits inside our modals, no full-screen takeover.

## iOS keyboard + form modals

- **All form modals (FormShell) use `useVisualViewport()`** to size the overlay to the *visible* viewport, and **switch from bottom-anchored to top-anchored** when the keyboard is detected (visual viewport >100 px shorter than layout viewport). Without this, focused inputs scroll above the visible area on iOS and you have to scroll up to see what you're typing.
- The viewport meta in `index.html` includes `interactive-widget=resizes-content` so newer browsers natively shrink the layout viewport when the keyboard opens.

## CSS gotcha — overflow-x clips Y too

`overflow-x: auto` on a chip row clips drop shadows on the Y axis as a side effect — any `overflow` value other than `visible` clips on both axes. Reserve `padding-bottom` inside the scroll container so the chunky `0 2px 0` shadows have room. The shared `.chips-scroll` class in `src/index.css` already does this.

## Markdown rendering

- `src/components/ui.jsx` exports a small `<Markdown>` wrapper around `react-markdown` with custom renderers tuned to the parchment look (compact margins, salmon-orange links, tinted inline code, dashed-rule blockquote). Used wherever user-typed long-form text is shown: aliment notes (`food.details`), meal comments, suggestion `infos_cles` on the card and `commentaire` in the detail modal.

## Cross-references

- `README.md` — public-facing overview, setup steps, full SQL schema for the Supabase tables.
- `FOR PIERRE.md` — narrative deep-dive: bugs encountered, lessons, technology rationale, glossary. Useful when you need *why* not *what*.
