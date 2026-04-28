# Next features

Features and improvements that have been discussed, scoped, or deferred — captured here so future-you (or future-Claude) can pick them up cold without re-deriving the context.

Items are tiered by *readiness to build*, not importance. Pick whatever fits the moment.

---

## Summary

| Feature | Tier | Effort | Comment |
| --- | --- | --- | --- |
| LLM chat for Aliments | 1 — Major | ~1d | Aliments CRUD already shipped (Supabase `foods` table, `useFoods`, `AlimentForm`). Only the Vercel function + Anthropic call + diet-config remain. |
| Optimize food photo sizes | 2 — Quick win | <1h | `saumon.png` (875 KB) + `riz-noir.png` (1 MB) render at 48–96px. >99% of bytes wasted per page load. |
| Add `.env.example` | 2 — Quick win | ~5min | Needed for second-device clones. Lists required env-var keys without secrets. |
| Fix `user-data.js` lint warnings | 2 — Quick win | ~30min | Pre-existing 2 errors. Hides any new lint regressions in the noise. |
| Mobile-keyboard handling for modals | 2 — Quick win | ~30min | iOS Safari papercut. Replace `100vh` with `100dvh` so the keyboard doesn't cover the form. |
| "À pied" text on walking pill | 3 — Polish | ~5min | Live with icon-only first; switch only if "12 min" alone feels ambiguous after real use. |
| Decorative desktop background | 3 — Polish | ~1h | The 430px column floats in empty cream on desktop. Pure CSS — texture, illustration, or hero image. |
| Multi-column desktop resto list | 3 — Polish | ~1d | Defer until you have >10 restos and the single column actually feels cramped. |
| Resto card thumbnail photos | 3 — Polish | ~½d | Skipped in Maps v1. Google Places photo URLs rotate — needs proxy/cache strategy. |
| Multi-turn LLM chat | 4 — v2 | ~1d | Only after v1 chat ships and verdict quality is verified. |
| Settings UI for diet constraints | 4 — v2 | ~1–2d | Currently `diet-config.js` will be code-only; this surfaces it for editing in-app. |
| Rename `4. untitled folder` → `4. fodmap` | 5 — Operational | ~10min | Pure rename. Git/GitHub/Vercel/Supabase are all path-independent; only Claude memory dir needs a parallel rename. |

---

## Tier 1 — Major features (scoped, ready to build)

### LLM chat for Aliments

**Goal**: in the `+ Aliment` form (or a "Demander à l'IA" button), the user types a question ("is quinoa ok for my diet at midi/soir?"). An LLM returns structured fields (verdicts, FODMAP rationale, contrainte, category) that pre-fill the form. User reviews + saves via the existing flow.

**Status**: Aliments CRUD already shipped — the `foods` table, `useFoods()`, `AlimentForm` modal, and edit/delete flow are all in production. **Only the LLM piece remains: ~1 day of work.**

**What's already in place** (from the Aliments CRUD ship):
- `foods` Supabase table with RLS, CHECK constraints on `cat` / `midi` / `soir`, ready to receive new rows.
- `useFoods()` hook + `addFood()` / `updateFood()` / `deleteFood()` in `src/lib/user-data.js`.
- `AlimentForm` modal at `src/screens/aliment-forms.jsx` — pre-filling its state from an external source (e.g., LLM response) is straightforward.
- All necessary form fields with appropriate input types and validation.

**What's left to build**:

1. **`api/food-verdict.js`** (Vercel Serverless Function, ~80 lines):
   - Verify Supabase JWT (read `Authorization: Bearer <jwt>`, call `supabase.auth.getUser(jwt)` server-side, return 401 if absent).
   - Per-user rate limit (in-memory `Map`, ~10/min) — runaway-loop insurance.
   - Cache: short-circuit if a food with this name already exists in the user's `foods` table (return that row instead of calling the LLM).
   - Call Claude Haiku 4.5 via `@anthropic-ai/sdk` with **forced tool-use** (`tool_choice: { type: "tool", name: "record_verdict" }`) and an `input_schema` mirroring the food fields.
   - Return JSON.

2. **`src/lib/diet-config.js`** — your FODMAP/SIBO constraints, the verdict rubric (green/amber/red thresholds), and a system-prompt builder. One file to retune the LLM's calibration.

3. **UI hook in `AlimentForm`**: a "Demander à l'IA" button that opens a small textarea, hits `/api/food-verdict`, and pre-fills the form fields with the response. User reviews and clicks "Ajouter" / "Sauver" through the existing flow.

4. **`ANTHROPIC_API_KEY`** env var (server-side only — no `VITE_` prefix; never inline into the bundle). Set in `.env.local` for local dev and in Vercel project settings for production.

5. **`package.json`** — add `@anthropic-ai/sdk`.

6. **Local dev**: switch from `npm run dev` to `vercel dev` so the `api/` directory is served alongside the Vite app. Vite SPAs auto-detect a top-level `api/` directory in Vercel's runtime.

**Critical gotchas**:

1. **Auth gating is non-negotiable.** Without verifying the Supabase JWT in the Vercel Function, the endpoint becomes an open Anthropic proxy that anyone scraping the network tab can use to burn your credits.
2. **Per-user rate limit** (~10/min) — cheap insurance against a runaway loop in dev.
3. **Don't include few-shot examples** in the system prompt — token-bloat anti-pattern that biases the LLM toward surface-form mimicry. A tight rubric (FODMAP thresholds + SIBO triggers + green/amber/red definitions) outperforms 5-food few-shots.
4. **Don't stream the response.** A 2-3s response that the user wants to see in full before saving doesn't benefit from streaming; SSE through Vercel adds non-trivial complexity.
5. **Mobile keyboard inside the modal** — already a known issue across forms. The 100dvh tweak in Tier 2 (Quick wins) addresses this once and applies to every modal.

**Verification**:

1. `curl -X POST localhost:3000/api/food-verdict` without a JWT → returns 401.
2. End-to-end on `vercel dev`: open Aliments, click "Demander à l'IA", ask "quinoa", verdict appears in 2-3s, form fields populate, save, appears in list under "Féculents".
3. Ask "quinoa" again → instant response (cache hit, 0 tokens).
4. Real iPhone: keyboard opens cleanly, response visible, Save button reachable.

---

## Tier 2 — Quick wins (low effort, high value)

### Optimize food photo file sizes

`src/assets/food/saumon.png` is **875 KB**, `riz-noir.png` is **1 MB**. They render at 48–96px in the UI — over 99% of the bytes are wasted on every page load, paid by mobile users on cellular.

**Fix** (one-liner): `cd src/assets/food && sips -Z 200 *.png` — resizes both to 200px max dimension, output ~25 KB each. Or wire up `vite-plugin-image-optimizer` for automated build-time optimization.

### Add `.env.example`

`.env.local` is gitignored (good — secrets don't leak). But cloning the repo on a new device means manually re-typing the env-var keys, with no record of which keys are needed.

**Fix**: commit `.env.example` listing required vars without values:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_GOOGLE_MAPS_API_KEY=
```

Plus a one-liner in `README.md`: "Copy `.env.example` to `.env.local` and fill in the values from Supabase + Google Cloud."

### Fix pre-existing lint warnings in `user-data.js`

ESLint flags `src/lib/user-data.js:87` ("Calling setState synchronously within an effect can trigger cascading renders"). Pre-dates the Google Maps work; currently 2 errors on `npm run lint`. Works in practice — the lint rule is conservative — but the noise hides any *new* lint issues that creep in.

**Fix**: refactor `useRestos`'s load-on-mount pattern to debounce or guard the setState call. Or suppress the warning at the line level if you've reviewed the behavior.

### Mobile-keyboard handling for modals

Symptom: inside any modal form (existing `+ Resto`, future `+ Aliment`), typing on iOS Safari can cause the keyboard to cover the bottom of the form — the Submit button gets hidden.

Cause: `position: fixed` modals sized in `100vh` don't account for the keyboard. iOS Safari's *visual viewport* shrinks; the *layout viewport* doesn't.

**Fix**: replace `100vh` with `100dvh` (dynamic viewport height). Or use `window.visualViewport.height` in JS for finer control. Files: `src/screens/resto-forms.jsx` (the `FormShell` styles around line 72-77).

---

## Tier 3 — Polish (optional, design judgment required)

### "À pied" text on the walking pill

Currently the pill shows "🚶 12 min" (icon + minutes only). The original design discussion offered **Option B**: "🚶 12 min à pied" — more explicit about the unit.

Trade-off: 5 chars wider; might wrap on narrow screens. Decide based on a few weeks of real use — if "12 min" is unambiguous you'll know.

### Decorative desktop background

On desktop, the 430px column floats in a sea of cream (`#e5ddce`). Functional but feels under-designed.

Options: a subtle texture, a food illustration, or a hero photo behind the column. Pure CSS — no JS changes. File: `src/index.css` (where `body` background is defined).

### Multi-column desktop resto list

At ≥768px viewport, switch the resto list from a single 430px column to a CSS grid (`grid-template-columns: repeat(auto-fill, minmax(360px, 1fr))`).

Bigger lift: tab bar would need to move to a sidebar, the modal's positioning math changes, the Restos screen's layout becomes responsive. Probably wait until you have >10 restos and the single column actually feels cramped.

### Resto card thumbnail photos (from Google Places)

Skipped in the Google Maps integration v1. Each Google Place response can return a `photo_reference` (or `name` field in the new API).

**Implementation sketch**: add a `photo_reference text` column to `restos`. Render via Google Places Photo endpoint (URL constructed client-side with the API key). Watch out: photo URLs rotate periodically — re-fetch on cache miss, or proxy through a Vercel Function that caches.

---

## Tier 4 — v2 follow-ups (after main features are validated)

### Multi-turn LLM chat

Once the v1 single-shot Aliments chat is shipped and the verdict quality is verified, allow follow-up questions ("but can I have it with eggs?", "what if I split the portion?").

Adds: chat-history state, message bubbles, conversation context passed to the API. ~1 extra day on top of v1.

### Settings UI for diet constraints

v1 ships with constraints hardcoded in `src/lib/diet-config.js`. v2: a settings screen (new tab, or kebab menu in the header) to edit the avoid-list, FODMAP rubric, custom triggers.

Schema: new `user_diet_config` table or a single JSON column on a `user_prefs` table.

---

## Tier 5 — Pending operational task

### Rename `4. untitled folder` → `4. fodmap`

You planned this earlier and deferred. Steps:

1. Quit Claude Code + dev server.
2. `mv "/Users/.../3. Projects/4. untitled folder" "/Users/.../3. Projects/4. fodmap"`
3. `mv "/Users/pierredjian/.claude/projects/-Users-...-4--untitled-folder" "/Users/pierredjian/.claude/projects/-Users-...-4--fodmap"` (preserves Claude memory; encoded path rule: every `/`, ` `, and `.` becomes a `-`).
4. Update `CLAUDE.md`'s reference to "the parent `untitled folder/`" so the legacy-files note stays accurate.
5. Reopen Claude Code in the new path.

What doesn't need touching: git repo, GitHub, Vercel, Supabase, `.env.local` — all are path-independent.

---

## Cross-references (already documented elsewhere)

These are **risks to be aware of**, not action items. Listed here so this roadmap is the single index — full details in `FOR PIERRE.md` under "Things to be careful about, going forward":

- **Custom domain → Supabase redirect URL allowlist** — adding a new domain breaks magic-link auth until you add it to the Supabase dashboard's Authentication → URL Configuration.
- **Supabase free tier auto-pauses** after 7 days of inactivity → first visit takes ~10s. Fix: Pro tier ($25/mo) or daily health-check ping from a cron service.
- **Force-pushed history surprises other clones** — irrelevant for solo work, but worth knowing if you ever clone on a second device. Recovery: `git fetch && git reset --hard origin/main`.

---

## How to use this roadmap

- **Pick by tier**: Tier 1 if you have a few days, Tier 2 for an idle hour, Tier 3 when you want to polish, Tier 4 only after the relevant v1 has shipped.
- **Update as you go**: when something is done, delete its section. When something new is decided, add it. The doc is a living to-do, not a contract.
- **The ****`~/.claude/plans/mellow-leaping-pixel.md`**** plan file** has the deepest LLM-chat scoping — but it's machine-local and might be cleaned up. The Tier 1 section above is intentionally self-contained so the roadmap survives any cleanup.
