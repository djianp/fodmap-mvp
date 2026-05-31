# FOR PIERRE — How this got built, what's in it, what to remember

This document is a cheat-sheet for **future you** (and present you, when you come back to this code in three months and forget how it works). It's written like a tour guide, not a manual. Read it once now, skim it later when something breaks.

---

## What you actually built

A four-tab mobile-first app called **fodmap-mvp**:

- **Aliments** — searchable, editable list of foods (39 to start, growing — you can add, edit, and delete), filterable by category and meal-of-day, color-coded green/amber/red for SIBO compatibility. Each food has a detail modal with FODMAP rationale, contrainte (max quantity etc.), markdown-rendered personal notes, and an optional hero photo you upload yourself.
- **Restos** — your personal directory of Paris restaurants you've vetted, each with the meals you've ordered, what to ask the waiter to modify, and your half-star ratings out of 5. Restos are tagged with one of four statuses: `dinein`, `takeaway`, `totry`, `delivery`. The first three are filtered by walking time; `delivery` by drive time.
- **Suggestions** — a small list of meal/snack ideas tagged by occasion (Petit-déj / Déj / Snack / Dîner) and context (Maison / Bureau / Resto), with multi-select chip filters. Optional photo, half-star rating, "À tester" pill, and a markdown comment field.
- **Tests** — a FODMAP reintroduction tracker. Each test is a food you run over a fixed 5-day protocol (J1 100 g · J2 recovery · J3 150 g · J4 recovery · J5 200 g); on the three test days you log a digestive-comfort level (four faces, green→red) and an optional note. The list shows each food's photo and three comfort "spots"; the detail view has a 5-day stepper, an editable **recipe** and an editable **"Aliments associés"** list (same-family foods that become safe once tolerated), each markdown with a seed default. You add / edit / delete your own tests (with photo upload); the 4 starter tests are seeded on first login and removable.

Plus a **Settings** screen behind a "Paramètres" link in the footer where you set your bureau and domicile addresses (used for walking + driving time calculations on the Restos tab). Saved settings sync across devices.

It runs at **https://fodmap-mvp.vercel.app**, accessible from any web-connected device. You log in with a magic link sent to your email. Your data lives in a Postgres database in Paris and follows you to every device. Photos you upload sit in Supabase Storage. There are no usernames, no passwords, no apps to install. It's a website that feels like an app.

---

## The 30-second architecture

Three components, sitting in three places on the internet:

```
   YOUR PHONE                    VERCEL                       SUPABASE
       (Safari)        ←→     (CDN at Paris edge)       ←→    (Postgres in Paris)
                                                              + Auth (magic links)
                                                              + RLS (per-user rows)
                                                              + Storage (photos)
```

When you open `fodmap-mvp.vercel.app` on your phone:

1. **Vercel** ships you an `index.html` (~750 bytes), a CSS bundle (~0.5 KB), and a JS bundle (~115 KB gzipped — a bit larger than the original because of `react-markdown`). All served via HTTP/2 from a server in Paris, ~10 ms away from your phone.
2. The JS bundle boots. It's a **React 19 app** that renders as a mobile-first column. Before doing anything else, it asks **Supabase** about the session. If logged in, it loads your settings (so the office/home addresses are ready), then mounts the active tab.
3. **Supabase** does four jobs: auth (magic links → JWTs), Postgres for relational data with RLS, Storage for photos with bucket-level RLS, and a few embedded predicates (`auth.uid() = user_id`) that keep tenants isolated.
4. Every database / storage call carries your JWT. RLS reads it, extracts your user id, and filters reads + writes accordingly. **Other users querying the same tables can't see your rows or your photos, ever.**

That's the whole system. There's no server you maintain, no API code you wrote, no file-server beyond Supabase Storage.

---

## The codebase, room by room

The project lives in `fodmap-mvp/`. **26 source files**, ~5,300 total lines of JS/JSX.

### The entry hallway

- **`index.html`** — bare bones. A `<div id="root">`, a Google-Fonts `<link>`, and a viewport meta with `interactive-widget=resizes-content` (helps Chrome resize the layout viewport when the keyboard opens — see "iOS keyboard" in the bugs section).
- **`src/main.jsx`** — three lines that mount React onto `<div id="root">`.
- **`src/App.jsx`** — the **router-without-a-router**. Checks Supabase for a session; either shows `<Login />` or `<AppShell />`. `AppShell` holds the active tab id (`aliments` / `restos` / `suggestions`), persists it to `localStorage`, mounts the matching screen, and renders the bottom tab bar plus the Paramètres + Se déconnecter footer. Settings open as an overlay modal from the same shell.

### The data layer (`src/lib/`)

- **`supabase.js`** — six lines that read env vars and call `createClient(url, key)`. Every other module imports `supabase` from here.
- **`user-data.js`** — the most interesting file. Hosts the React hooks (`useRestos`, `useFoods`, `useSuggestions`, plus the Tests-tab hooks `useReintroProtocols` / `useReintroLogs` / `useReintroRecipes` / `useReintroCategoryNotes`) and the imperative CRUD helpers (`addResto` / `updateResto` / `deleteResto`, `addMeal` / `updateMeal` / `deleteMeal`, `addFood` / `updateFood` / `deleteFood`, `addSuggestion` / `updateSuggestion` / `deleteSuggestion`, the reintro helpers `addReintroProtocol` / `updateReintroProtocol` / `deleteReintroProtocol` plus the per-test `upsert*` / `delete*` for logs / recipes / category-notes, and `seedRestos` / `seedFoods` / `seedReintroProtocols` for first-login). Also: `useRestos` listens for a `restos-refresh` window event so the background walking-time recalc can poke the UI to re-fetch after it finishes.
- **`user-settings.js`** — pub-sub-style module (no Context) holding `{office, home, recalcing}` for the active user. `loadSettings()` reads the `user_settings` row on auth; `saveSettings()` writes both addresses, then kicks off `recalcAllRouteTimes()` in the background which fans out Distance Matrix calls in batches of 25 destinations and patches each resto's `walk_min_*` and `drive_min_*` columns. The Restos screen subscribes via `useSettings()` and shows a "Recalcul des temps de trajet en cours…" pill while the work is running.
- **`google-maps.js`** — single point of contact for the Google SDK. `loadMaps()` lazy-loads the bundle once (shared `loadPromise`). `getRouteTimes(destination)` and `getRouteTimesBatch(office, home, destinations)` fire walking + driving Distance Matrix calls in parallel and return all four `walk_min_*` / `drive_min_*` numbers per destination. `getOfficeLatLng()` / `getHomeLatLng()` cache geocodes by address so the cache invalidates the moment you save a new address.
- **`places-config.js`** — exports `DEFAULT_OFFICE_ADDRESS` and `DEFAULT_HOME_ADDRESS`, used as fallbacks when a user has no row in `user_settings` yet.
- **`storage.js`** — Supabase Storage helpers: `uploadFoodPhoto` / `deleteFoodPhoto`, `uploadSuggestionPhoto` / `deleteSuggestionPhoto`, and `uploadReintroPhoto` / `deleteReintroPhoto`. All three pairs share a small internal `uploadPhoto` / `deletePhoto` core. Public URLs come back with a `?v=<timestamp>` cache-buster so updated photos refresh immediately on the client.
- **`foods-meta.js`** — the static / curated lookups for the Aliments screen: `PHOTOS` (built-in URLs / Unsplash), `PHOTOS_DETAIL` (higher-res hero variants), category list, fallback monogram-tile colors (`tileFor`), verdict-text map.
- **`suggestions-meta.js`** — the option arrays (`OCCASIONS`, `CONTEXTS`) plus label lookups, shared between the Suggestions screen and form.

### The static data (`src/data/`)

- **`foods.js`** — the curated seed foods (~40 entries), bulk-inserted into the `foods` table the first time you log in. Decorative once seeded — edits inside the running app go to Supabase, not back here.
- **`restos.js`** — the seed Paris restos (Bistrot Paul-Bert) with full Google `place_id` / lat / lng / walking minutes. Same one-shot-then-frozen pattern.
- **`reintro.js`** — the 4 seed reintroduction tests, the shared 5-day schedule (`STANDARD_DAYS`), and the default recipe / associated-foods markdown (keyed by protocol id). Unlike foods/restos, those defaults *stay* in code (resolved by id) — only the protocol row and the user's overrides live in Supabase.

### The presentation layer (`src/components/`, `src/screens/`)

- **`components/ui.jsx`** — small, dumb pieces. `BlobLogo` (orange blob, accepts optional children — used for the 💡 in the Suggestions header), `Thumb` (round food icon — prefers `food.photo_url` over the static `PHOTOS` map), `Verdict` (green/amber/red pill), `Chip` (filter pill, accepts an `icon` prop for emoji prefixes), `FoodRow`, `IconBtn`, and the **`Markdown`** component (a thin react-markdown wrapper with custom renderers tuned to the parchment look — used in aliment notes and meal/suggestion comments).
- **`components/google-map.jsx`** — the real Google Map. Lazy-loads the SDK, places one marker per resto. Subscribes to `useSettings()` so the office/home anchor pin updates instantly when addresses change. Delivery restos render as a salmon circle marker (instead of the default red drop-pin) so they're readable at a glance vs walked-to places.
- **`components/place-autocomplete.jsx`** — a **custom** address autocomplete on top of Google's lower-level `AutocompleteSuggestion` API. We replaced Google's `PlaceAutocompleteElement` web component because its mobile expanded mode took over the whole viewport on iOS Chrome and broke layout — see the bugs section. Renders our own `<input>` + in-flow dropdown.
- **`screens/aliments.jsx`** — the food browser. `useFoods()`, search, category filter, grouped sort (verdict → numeric note desc → alphabetical). The detail modal (`AlimentDetailModal`) shows a hero image (240 px when present, scrollable so it can move out of the way for long notes), title, category line, midi/soir verdict pills, FODMAP, Contrainte, Notes (markdown-rendered), Modifier + Supprimer buttons. **Scroll past ~80 px and the modal expands to fill the viewport** for a more comfortable reading experience.
- **`screens/aliment-forms.jsx`** — `AlimentForm`, polymorphic for add vs edit. Photo picker uploads to the `food-photos` bucket; storage path is `<user_id>/<food_id>.<ext>` (upsert). All other fields the same as before, with markdown-encouraged hint text on the Notes field.
- **`screens/restos.jsx`** — the most complex screen. `useRestos()` + `useSettings()`. Layered filters: location anchor (Bureau / Domicile), status (Tous / À emporter / Sur place / Livraison / À tester), protein dropdown (alphabetical, emoji-prefixed, hides empty options, shows result counts in parentheses), search, and view-mode (Liste / Carte). The list groups À-tester restos under their own section header at the bottom when status is "Tous". The card has a travel pill that switches between a walking icon + walk-minutes (default) and a car icon + drive-minutes (delivery restos), plus a status pill (green "À emporter", lavender "Livraison", salmon "À tester") and tap-to-edit on the top section.
- **`screens/resto-forms.jsx`** — `AddRestoForm` (Places-Autocomplete-driven, eagerly fetches walk + drive times in parallel), `EditRestoForm` (text inputs only, no place re-pick), `MealForm` (polymorphic: tap a meal row in a card to edit; rating optional with × clear button), and the shared `FormShell` / `Field` / `inputStyle`. **`FormShell` uses the VisualViewport API** to keep the modal fitting above the iOS keyboard (and switches from bottom-anchored to top-anchored when a keyboard is detected).
- **`screens/suggestions.jsx`** — the third tab. Search, two horizontally scrollable multi-select chip rows (occasions + contexts), card list. Each card is a tap-to-edit button with round photo, title, categories joined `·`-separated, half-stars, optional markdown comment in a 💬 bubble, and a salmon "À tester" pill when `to_try` is set.
- **`screens/suggestion-forms.jsx`** — `SuggestionForm` with photo picker (uploads to `suggestion-photos`), multi-select chip toggles, StarInput, "À tester" toggle, comment textarea, Supprimer.
- **`screens/tests.jsx`** — the Tests tab. `useReintroProtocols` + the three override/log hooks. A list of protocol cards (food photo + three comfort `ComfortFace` spots) → tap into a detail view with a 5-day stepper, an active-day card, a 4-option comfort logger, an optional note, and two cards ("Préparation & recette" + "Aliments associés") that each open a generic **`EditableSheet`** (markdown in view mode, textarea in edit mode, "Réinitialiser" to drop the override back to the seed default). A pencil in the header opens the edit form; "Supprimer ce test" deletes it (cascading the test's logs/recipe/notes/photo).
- **`screens/tests-forms.jsx`** — `TestForm`, polymorphic add vs edit (like the other forms), capturing food name + FODMAP family + an uploaded photo (`reintro-photos` bucket); its own copy of `PhotoPicker`.
- **`screens/settings.jsx`** — the settings modal. Two `PlaceAutocomplete` inputs for bureau and domicile. Save writes to `user_settings` and triggers the background route-time recalc.
- **`screens/login.jsx`** — magic-link email flow, two states. Copy is impersonal/infinitive across the app (no "tu" forms).

That's it. **Twenty-six source files**, ~5,300 total lines.

---

## The schema, in one place

Postgres tables (run from `README.md` if you ever rebuild from scratch):

| Table | Purpose | Notable columns |
|---|---|---|
| `restos` | Restaurants you've vetted | `place_id`, `lat`/`lng`, `walk_min_bureau`, `walk_min_domicile`, `drive_min_bureau`, `drive_min_domicile`, `rating`, `status` (`dinein` \| `takeaway` \| `totry` \| `delivery`) |
| `meals` | Meals you've ordered | `resto_id`, `proteine`, `rating` (nullable), `comment` |
| `foods` | The aliment list | `cat`, `midi`/`soir` verdicts, `note`, `fodmap`, `contrainte`, `details` (markdown-friendly), `photo_url` |
| `suggestions` | Meal/snack ideas | `occasions[]`, `contexts[]`, `rating`, `comment`, `photo_url`, `to_try` |
| `user_settings` | Per-user preferences | `office_address` / `office_lat` / `office_lng`, `home_address` / `home_lat` / `home_lng` |
| `reintro_protocols` | The reintroduction tests | `id` (text slug, shared key), `food_name`, `fodmap_family`, `photo_url` |
| `reintro_logs` | Per-test-day comfort log | `protocol_id`, `day` (1/3/5), `comfort_level`, `note` |
| `reintro_recipes` | Per-test recipe override (markdown) | `protocol_id`, `recipe` |
| `reintro_category_notes` | Per-test "associated foods" override (markdown) | `protocol_id`, `content` |

Storage buckets:

| Bucket | Holds | RLS shape |
|---|---|---|
| `food-photos` | User-uploaded photos for `foods.photo_url` | Public read, owner-only write/update/delete (path prefix = `<user_id>/`) |
| `suggestion-photos` | User-uploaded photos for `suggestions.photo_url` | Same shape |
| `reintro-photos` | User-uploaded photos for `reintro_protocols.photo_url` | Same shape |

Every table is RLS-scoped: `auth.uid() = user_id` for read and write. Storage objects are similarly gated by their first folder being the user's id.

---

## The technology choices, and why

We picked things deliberately. Here's the rationale for each.

### Why Vite + React, not Next.js / Create React App / Astro

- **Vite is the fastest dev experience.** Save → reload in <50 ms. No bundler watch step. Native browser ESM in development, bundled output in production.
- **No Next.js because there's no SEO concern.** App is gated behind login. Every byte goes from CDN to browser as static files. SSR would add complexity we'd never use.
- **React 19** because that's what `npm create vite` shipped. Mostly drop-in vs 18, but stricter — caught a Rules-of-Hooks violation we'd have shipped silently in 18 (see bugs).

### Why Supabase

Three things:

1. **It's Postgres, not NoSQL.** The data is relational (restos → meals, users → everything). SQL is the right shape.
2. **Auth + DB + Storage + RLS in one box.** No Express server to maintain, no JWT middleware to write, no S3 bucket policy to think about.
3. **Free tier handles everything we throw at it.** 500 MB DB, 50K MAU, 1 GB Storage. Single-user app uses ~0.1 % of any of those.

### Why Vercel

Code-to-URL in one step. Auto-deploys on push to `main`, atomic rollouts, free HTTPS via Let's Encrypt, a CDN edge in Paris, every old deploy alive forever for one-click rollback. Zero config beyond connecting the Git repo.

### Why Google Maps + Places (vs Mapbox / Leaflet / Apple MapKit)

- **One key for three services**: Maps JavaScript (the map view), Places API New (autocomplete suggestions for the address pickers), Distance Matrix (walking + driving times).
- **`place_id` is a stable identifier** that deep-links to the Google Maps app on iOS/Android. The travel pill on each resto card is just an `<a>` wrapping the place_id.
- **Distance Matrix gives realistic times** through actual streets, not Haversine straight-lines.
- **$200/mo free credit** covers thousands of map loads and autocomplete sessions.

### Why `react-markdown`

The personal notes on aliments and the comments on meals + suggestions are user-authored free-form text where formatting matters (bold for emphasis, lists for tips, links to recipes). Hand-rolling a tiny markdown parser would have been ~50 lines of fragile regex; `react-markdown` is a well-maintained, sandboxed (no raw HTML by default) renderer with a tree-shakeable footprint of ~30 KB gzipped. We render it via the small shared `<Markdown>` component in `ui.jsx`, with custom renderers tuned to the parchment look.

### Why custom autocomplete (not `PlaceAutocompleteElement`)

Google's official web component opens a full-screen "expanded" mode on mobile when the user types a character. On iOS Chrome, that overlay was rendering above the visible viewport — the input scrolled out of sight as soon as the user typed. We rebuilt the picker on top of Google's lower-level `AutocompleteSuggestion` API: regular `<input>` + an in-flow custom dropdown with debounced fetch. Same callback shape, no full-screen takeover, fits inside our modals.

### Why the language stays French + impersonal

All UI copy is in French because the user is the user. Phrasing was converted from "tu"-form imperatives to infinitives (`Cherche` → `Chercher`, `Clique` → `Cliquer`) and impersonal constructions (`Tu recevras…` → `Un lien à usage unique sera envoyé.`) so the register stays consistent and the strings stay translatable later. There's a fully-specified bilingual UI plan in `i18n-plan.md` (proposed, not implemented).

---

## The bugs we ran into, and why each one matters

Every bug has a generalisable lesson. Don't memorise the bugs; memorise the lessons.

### Bug 1: The React hooks rule violation in `RestoModal`

The original prototype had an early return (`if (!resto) return null`) before the hook. React 19's StrictMode tripped on it. Fix: gate the *body* of `useEffect`, not the hook call. **Lesson: "my code worked" and "my code is correct" are different. Always put hooks at the top, before any conditional return.**

### Bug 2: Postgres `numeric` columns return as strings

Ratings came back as `"4.50"` rather than `4.5` because PostgREST preserves precision by serialising as JSON strings. `b.rating - a.rating` silently produced `NaN` — restos rendered in random order. Fix: `Number(...)` coercion at the boundary. **Lesson: JSON has fewer types than your database. Coerce at the boundary, not deep inside.**

### Bug 3: Vercel deploy blocked by author email mismatch

I used `djianp@gmail.com` (your handle), Vercel required a verified email match. Fix: thread `pierre.djian@gmail.com` per-command via `git -c user.email=…`. **Lesson: read error messages literally. Don't guess at user identity.**

### Bug 4: Vercel's bot challenge mid-polling

A `curl`-loop hammered the deploy URL, tripped Vercel's anti-DDoS challenge. Fix: switch to `gh api .../statuses` or the GitHub MCP tools. **Lesson: don't hammer production from a script. Use the host's status API.**

### Bug 5: Async-everywhere data shape change (Phase C)

Moving from local-only data to Supabase made `getMergedRestos` async, which forced every caller into a hook + loading state. **Lesson: async is contagious. When a single function becomes async, every caller becomes async. Plan the spread when you change the synchronisation model.**

### Bug 6: `overflow-x: auto` clips the Y axis too

When we made the category filter row horizontally scrollable, the chunky drop-shadow under each pill got cut off. CSS spec: any `overflow` value other than `visible` clips on *both* axes. Fix: bake `padding-bottom` into the scroll container so the shadow has room to breathe. **Lesson: CSS overflow is an axis-pair, not an axis. Always reserve space for shadows / glows when you turn on scrolling on either axis.**

### Bug 7: iOS keyboard + fixed-position modals

The form modals are `position: fixed` and bottom-anchored. On iOS the keyboard pushed the focused input above the visible area — the user had to scroll up to see what they were typing. Fix layered:

1. Add `interactive-widget=resizes-content` to the viewport meta so newer browsers natively shrink the layout viewport when the keyboard opens.
2. Track `window.visualViewport` and size the modal overlay to it (`top: vv.offsetTop, height: vv.height`).
3. **Switch the modal to top-anchored when the keyboard is detected** (visual viewport >100 px shorter than layout viewport). With the form pinned to the top of the visible area, iOS doesn't have to auto-scroll the input into view.

**Lesson: the visual viewport is not the layout viewport, and `position: fixed` sticks to the latter. Always go through `window.visualViewport` if you care about staying within the keyboard-cropped area.**

### Bug 8: Google's `PlaceAutocompleteElement` full-screen takeover

When the user typed a character, Google's modern web component flipped to a full-screen "expanded" mode that took over the whole viewport — bypassing our modal entirely. On iOS Chrome it rendered the input above the visible area, with no way to fix it from outside. Fix: drop the web component and rebuild the picker on `AutocompleteSuggestion` (a regular `<input>` + a custom dropdown rendered in-flow inside our modal).

**Lesson: third-party "turnkey UI" components own their entire interaction model — you can't fix what you can't override. When a vendor's UX collides with yours, drop down to their lower-level data API and render your own UI.**

### Bug 9: Smart quotes turned `'` into `‘`/`’` and broke the build

While adding the Tests forms, six straight `'` string delimiters came out as typographic `‘…’` (U+2018 / U+2019). The parser died with `Invalid Character '‘'` — but the edit "succeeded"; only `npm run build` (and ESLint) surfaced it. Fix: a tiny `node` script that straightened the curly quotes on the affected lines *by char-code*, so the fix itself couldn't re-introduce them. **Lesson: build (or at least lint) before every commit — a clean-looking edit can hide an invisible non-ASCII character. And when the fix involves the exact character that's broken, apply it programmatically by code-point rather than retyping it.**

---

## How a good engineer thinks (the meta-lessons)

These aren't bug-specific. They're patterns that came up over and over.

### Phase by phase, never all at once

Every feature in this thread shipped as its own merged PR. Each PR had a "schema migration (already applied)" block, the app code change, an updated README schema, and a test plan. Each PR was small enough to read in one sitting and reversible if you wanted to roll it back. **The opposite of "build everything, then deploy at the end."**

### Schema first, code second

Every feature that needed a new column or table started with a SQL block we ran in the Supabase SQL Editor *before* opening a PR — schema lives in `README.md` as the canonical reproducible source. The code only goes in once the column exists. This avoids deploying app code that reads or writes a column the database doesn't yet have.

### Reversibility > speed

`git push --force-with-lease`, never `--force`. Test with builds before commit. Open one feature per PR so a single revert can undo a single thing. **The cost of these safeties is near-zero. The cost of not having them when you need them is "lost work, bad mood for an afternoon."**

### Trust but verify, especially yourself

After every merge, the Vercel commit-status check goes green before we move on. Photos go up to a *user-prefixed path*; storage RLS makes the prefix the security boundary. After PR #6 (the `takeaway` → `status` migration), the existing `restos` rows kept their old data via the migration's `UPDATE … CASE`, not by hoping the column rename "just worked."

### The cost of clarification < the cost of guessing

Every schema change in this thread was paused on the user's "ping me when SQL is run" handshake. Every ambiguous design (manual translation vs LLM auto-translate, one PR vs split, etc.) was an `AskUserQuestion` away from a wrong implementation. **Whenever you're about to make a decision that's expensive to undo, ask. Cost: 10 seconds. Benefit: not refactoring tomorrow.**

---

## Things to be careful about, going forward

Some sharp edges that didn't bite us yet, but could:

### The bundle is heavier than it was

JS gzipped is ~115 KB now (was ~85 KB before this thread). Most of the growth is `react-markdown` + remark plugins. If the bundle ever feels slow on cold load, the first lever is lazy-loading `<Markdown>` (only used inside open modals) via `React.lazy` + `Suspense`. The second lever is dropping unused remark / rehype helpers.

### Photos can balloon Supabase Storage quota

Each iPhone photo is ~5 MB. The free tier gives you 1 GB; that's ~200 photos before you hit the limit. Today neither bucket has client-side resize before upload. If you start adding photos seriously, add a `<canvas>`-based downscale step in `storage.js#uploadPhoto` (max 1600 px on the long edge, JPEG q=0.8 — would knock ~5 MB to ~300 KB).

### `i18n-plan.md` is a future spec, not a feature

The bilingual UI work has a fully-detailed plan in `i18n-plan.md` at the repo root. If you decide to ship it, that file describes the schema migrations (one column on `user_settings`, JSONB columns on the three content tables), the Supabase Edge Function for Claude-API-backed auto-translation, and the UI integration points. It's deliberately a separate file (rather than buried here) so you can hand it off or skim it as a one-off.

### The custom autocomplete depends on `AutocompleteSuggestion`

If Google ever deprecates the lower-level Places API the way they're nudging everyone toward `PlaceAutocompleteElement`, the picker breaks. Fallback: rebuild against another provider (Mapbox geocoder + a custom dropdown) — same callback shape, swap the data source.

### The seeds are still one-shot first-login gifts

`seedRestos()`, `seedFoods()`, and `seedReintroProtocols()` only run when the corresponding table is empty for the active user. If you edit `src/data/foods.js` (or the seed tests in `src/data/reintro.js`) after first login, *you* won't see the change — only a brand-new user would. For a multi-user app you'd separate user data from curated/featured data; for this single-user app, edit through the in-app forms instead.

### The reintro recipe / associated defaults live in code, keyed by protocol id

The Tests tab keeps the *protocol row* and the user's *overrides* in Supabase, but the **default** recipe + associated-foods text stays in `src/data/reintro.js`, resolved by the protocol's slug id. Consequences: (1) renaming a test in-app keeps its seed defaults (the id doesn't change); (2) if you ever rename a seed's slug in `reintro.js`, its existing logs / recipes / notes orphan — they key on the old slug, so **never rename a slug in place**; (3) a user-added test has no seed entry, so its cards start from an editable placeholder. The 5-day schedule is likewise a code constant (`STANDARD_DAYS`), not a column.

### Settings recalc burns Distance Matrix calls

Saving a new bureau or domicile address triggers `recalcAllRouteTimes()`, which fires *two* Distance Matrix calls (walking + driving) for every batch of 25 restos. With ~5 restos that's negligible, but if you ever cross a few hundred you'll want a `since` cursor on the recalc so it only re-fetches restos with missing or stale times.

### The redirect URL allowlist is fragile

Same as before: if you set up a custom domain, magic-link auth fails until you add the new domain to Supabase's redirect URL allowlist. Symptom: "I clicked the link in my email and nothing happened." Fix: Supabase dashboard → Authentication → URL Configuration.

### Force-pushed history surprises other clones

Single-user repo, fine. Multi-clone, do `git fetch && git reset --hard origin/main` after a force-push.

### `.env.local` is on this machine only

If you clone the repo on another laptop, the app crashes at startup with "Missing VITE_SUPABASE_URL" because `.env.local` is git-ignored. Copy it by hand. (We could ship a committed `.env.example` listing the required keys without values; haven't yet.)

### Supabase free tier limits

Auto-pauses after 7 days of inactivity. First request after a long break takes ~10 s while the database wakes up. Upgrade to Pro ($25/mo) or hit a tiny health-check endpoint daily if it ever bites.

---

## A short glossary, because the jargon is half the difficulty

**SPA** — Single-Page App. The browser loads one HTML + a JS bundle, JavaScript renders all subsequent UI without full page reloads. Our app is one.

**SSR** — Server-Side Rendering. The server pre-renders HTML for each request. We don't do this. Next.js does. We don't need it.

**HMR** — Hot Module Replacement. When you save a file in dev, only the changed module reloads, preserving state.

**JWT** — JSON Web Token. A signed proof-of-identity blob. Supabase issues these when you log in. Every database / storage call includes the JWT.

**RLS** — Row-Level Security. A Postgres feature: per-row policies decide who can read/write each row. We use `auth.uid() = user_id` as the rule for every table. Each user sees only their own data, with database-level enforcement.

**Visual viewport** — the area of the browser actually visible to the user, *minus* the keyboard / browser UI. Distinct from the layout viewport, which is the size your CSS sees. `window.visualViewport` is the JS handle to it. Critical for fixed-position modals on mobile.

**ESM** — ECMAScript Modules. The official JavaScript module system (`import` / `export`).

**HTTP/2** — Multiplexes many requests over one TCP connection. Vercel uses it by default.

**HSTS** — HTTP Strict Transport Security. A response header that tells browsers "always use HTTPS for this domain." Vercel sets this by default.

**CDN** — Content Delivery Network. Servers in many cities that cache your static files near your users. Vercel's serves your bundle from the Paris edge to a Paris phone in ~10 ms.

**Bucket / Object (Supabase Storage)** — buckets are the top-level container; objects are the files inside. RLS policies on `storage.objects` decide who can read/write.

---

## When you come back to this project

In three months you'll forget half of this. Don't try to memorise. Instead:

1. **Read this file again.** It's faster than re-deriving the architecture.
2. **`npm run dev`** to start the local dev server. Visit `http://localhost:5173`.
3. **`git log --oneline`** to remind yourself of the recent changes.
4. **Open `src/App.jsx`** to see the entry point. Mental model: App → either Login or AppShell → AppShell renders one of three screens (`aliments`, `restos`, `suggestions`) plus an optional Settings overlay → screens use `useFoods` / `useRestos` / `useSuggestions` / `useSettings` for data and the components in `ui.jsx` for rendering.
5. **Open the Supabase dashboard** to inspect the database directly. The `Table Editor` shows your `restos`, `meals`, `foods`, `suggestions`, `user_settings` rows. The `Storage` panel shows your `food-photos` and `suggestion-photos` buckets. You can edit/delete from there if the UI doesn't yet support what you need.
6. **`README.md`** has the full reproducible SQL schema. **`CLAUDE.md`** has session-start conventions. **`i18n-plan.md`** is the next-feature spec for bilingual UI if you want it.

You built a real app. It's small, it's solid, and it covers a specific problem you actually have. That's the best kind of software to build.
