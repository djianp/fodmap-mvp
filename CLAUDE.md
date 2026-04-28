# CLAUDE.md

Conventions and gotchas for Claude sessions in this project. Concise on purpose — Claude loads this on every session start.

## What this project is

`fodmap-mvp` — a single-user mobile-first web app for managing a low-FODMAP / SIBO-friendly diet. Two tabs: **Aliments** (food reference) and **Restos** (restaurant directory with per-meal notes). UI is in French.

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

- **`src/lib/user-data.js` is the only file that calls Supabase for restos/meals/foods.** Everything else imports from it.
- `useRestos()` and `useFoods()` are the React hooks for reading data. `useRestos` returns `{ restos, loading, error, proteines, refresh }`; `useFoods` returns `{ foods, loading, error, refresh }`.
- `addResto()`, `addMeal()`, `addFood()`, `updateFood()`, `deleteFood()` are `async` functions that resolve `auth.uid()` from the active session and rely on RLS for authorization.
- **First-login seed**: on a new user's first visit, both `useRestos` and `useFoods` auto-seed when their respective tables are empty. `seedRestos()` inserts the entries from `src/data/restos.js` (with full Google Places metadata so the map works immediately); `seedFoods()` inserts the entries from `src/data/foods.js` (the curated 39 foods). Each runs at most once per user, gated by `data.length === 0`.
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

- **One API key, three services**: Maps JavaScript (the map view), Places API New (autocomplete in the `+ Resto` form), Distance Matrix (walking time bureau/domicile).
- **`src/lib/google-maps.js`** is the single point of contact for the SDK — uses `setOptions()` + `importLibrary()` from `@googlemaps/js-api-loader` v2+ (the legacy `Loader` class is gone). A module-level `loadPromise` is hoisted so the map and autocomplete share one SDK fetch.
- **Office/home addresses** are constants in `src/lib/places-config.js`. They're runtime-geocoded once per session via Places `searchByText` (`getOfficeLatLng()` / `getHomeLatLng()`), cached at module scope.
- **Map filtering**: the `Carte` view only shows restos within 30 walking minutes of the active anchor (Bureau or Domicile). The list view shows everything.

## Cross-references

- `README.md` — public-facing overview, setup steps, full SQL schema for the Supabase tables.
- `FOR PIERRE.md` — narrative deep-dive: bugs encountered, lessons, technology rationale, glossary. Useful when you need *why* not *what*.
