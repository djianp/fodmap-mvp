# Next features

Features and improvements that have been discussed, scoped, or deferred — captured here so future-you (or future-Claude) can pick them up cold without re-deriving the context.

Items are tiered by *readiness to build*, not importance. Pick whatever fits the moment.

---

## Summary

| Feature | Tier | Effort | Comment |
| --- | --- | --- | --- |
| LLM chat for Aliments | 1 — Major | ~3d (v1) / ~1d (v0) | Biggest scope. v0 chat-only ships first to validate verdict quality before persistence work. |
| Optimize food photo sizes | 2 — Quick win | <1h | `saumon.png` (875 KB) + `riz-noir.png` (1 MB) render at 48–96px. >99% of bytes wasted per page load. |
| Add `.env.example` | 2 — Quick win | ~5min | Needed for second-device clones. Lists required env-var keys without secrets. |
| Fix `user-data.js` lint warnings | 2 — Quick win | ~30min | Pre-existing 2 errors. Hides any new lint regressions in the noise. |
| Mobile-keyboard handling for modals | 2 — Quick win | ~30min | iOS Safari papercut. Replace `100vh` with `100dvh` so the keyboard doesn't cover the form. |
| "À pied" text on walking pill | 3 — Polish | ~5min | Live with icon-only first; switch only if "12 min" alone feels ambiguous after real use. |
| Decorative desktop background | 3 — Polish | ~1h | The 430px column floats in empty cream on desktop. Pure CSS — texture, illustration, or hero image. |
| Multi-column desktop resto list | 3 — Polish | ~1d | Defer until you have >10 restos and the single column actually feels cramped. |
| Resto card thumbnail photos | 3 — Polish | ~½d | Skipped in Maps v1. Google Places photo URLs rotate — needs proxy/cache strategy. |
| Multi-turn LLM chat | 4 — v2 | ~1d | Only after v1 chat ships and verdict quality is verified. |
| Edit LLM verdicts after save | 4 — v2 | ~½d | Fix-up flow for when the LLM gets a verdict wrong. |
| Settings UI for diet constraints | 4 — v2 | ~1–2d | Currently `diet-config.js` is code-only; this surfaces it for editing in-app. |
| Rename `4. untitled folder` → `4. fodmap` | 5 — Operational | ~10min | Pure rename. Git/GitHub/Vercel/Supabase are all path-independent; only Claude memory dir needs a parallel rename. |

---

## Tier 1 — Major features (scoped, ready to build)

### LLM chat for Aliments

**Goal**: a `+ Aliment` button on the Aliments tab opens a modal. User types a question ("is quinoa ok for my diet at midi/soir?"). An LLM returns a structured verdict (green/amber/red per meal-time + rationale + category). User confirms → result is saved to the Aliments tab so it shows up next to the curated 39 base foods.

**Status**: Scoped via brainstorm, not built. ~3 days of focused work, similar scale to the Google Maps integration.

**Architecture**:

```
React app  ──►  Vercel Function (/api/food-verdict)  ──►  Anthropic Claude
   │                       (auth-gated)                          │
   │                                                              │
   ▼                                                              ▼
Supabase JWT                                       Forced tool-use returns JSON
   │                                                              │
   └─────────────► Save to Supabase user_foods table ◄─────────────┘
```

- **LLM**: Claude Haiku 4.5 via `@anthropic-ai/sdk`. ~$0.002 per query. Free credit covers years of use.
- **API endpoint**: new Vercel Function at `api/food-verdict.js`. Vite SPAs auto-detect a top-level `api/` directory; no Next.js needed. Local dev: `vercel dev` (replaces `npm run dev`).
- **Forced structured output**: `tool_choice: { type: "tool", name: "record_verdict" }` with `input_schema` mirroring the existing `foods.js` shape. The LLM is constrained to fill the schema, not return free-text.
- **Storage**: hybrid. Keep `src/data/foods.js` as the curated 39-food base. Add a Supabase `user_foods` table for chat-derived entries. A new `useFoods()` hook merges `[...FOODS, ...userFoods]` — sort/group/search code in `aliments.jsx` reads the merged list unchanged.
- **UX**: modal-based, single-shot (not streaming, not multi-turn). Reuses the existing `FormShell` pattern from `src/screens/resto-forms.jsx`.

**Schema migration** (Supabase SQL Editor):

```sql
CREATE TABLE public.user_foods (
  id text PRIMARY KEY,                                                 -- kebab-case slug of nom
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nom text NOT NULL,
  cat text NOT NULL CHECK (cat IN ('Féculents','Protéines','Légumes','Fruits','Condiments')),
  midi text NOT NULL CHECK (midi IN ('green','amber','red')),
  soir text NOT NULL CHECK (soir IN ('green','amber','red')),
  note text,
  fodmap text,
  contrainte text,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX user_foods_user_nom ON user_foods (user_id, lower(nom));
CREATE INDEX user_foods_user_id ON user_foods (user_id);
ALTER TABLE user_foods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner rw user_foods" ON user_foods
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

The `CHECK` constraints are load-bearing — `aliments.jsx` groups by the 5 `CATEGORIES` and silently drops anything else. The `UNIQUE` on `(user_id, lower(nom))` dedupes case-insensitively at the DB level.

**Files to create**:
- `api/food-verdict.js` — verifies the Supabase JWT, normalizes-and-caches the food name (short-circuits if already in `FOODS` or `user_foods`), calls Claude with system prompt + `record_verdict` tool, returns JSON. ~80 lines.
- `src/lib/diet-config.js` — constants describing the user's FODMAP/SIBO constraints + verdict rubric. Edit this one file to retune the LLM's calibration.
- `src/lib/user-foods.js` — `useFoods()` hook (merges static + remote), `addUserFood()` insert helper.
- `src/screens/aliment-form.jsx` — modal using `FormShell`. Textarea question → "Demander" → preview verdict + rationale + structured fields → "Sauver" or "Modifier la question".

**Files to modify**:
- `src/screens/aliments.jsx` — swap `import { FOODS }` for `useFoods()`. Add `+ Aliment` button next to the search input.
- `package.json` — add `@anthropic-ai/sdk`.
- `.env.local` + Vercel env vars — add `ANTHROPIC_API_KEY` **server-side only**. No `VITE_` prefix; never inline into the bundle.
- `README.md`, `CLAUDE.md` — schema and env-var docs.

**Critical gotchas (do not repeat these mistakes)**:

1. **Auth-gating is non-negotiable.** Without verifying the Supabase JWT in the Vercel Function, the endpoint is an open Anthropic proxy that anyone scraping the network tab can use to burn your credits. Read `Authorization: Bearer <jwt>`, call `supabase.auth.getUser(jwt)` server-side, return 401 if absent.
2. **Per-user rate limit** (in-memory `Map` keyed by `user_id`, ~10/min) — cheap insurance against a runaway loop.
3. **Don't copy ****`useRestos`****'s seed pattern** into `useFoods`. The static 39 foods always make the merged list non-empty, so a count-gated seed would never fire. Just skip seeding entirely; the static set is the seed.
4. **Mobile keyboard inside the modal** is the most likely UX papercut. Use `min-height: 100dvh` (not `100vh`) on the modal. iOS Safari's visual viewport shrinks under the keyboard; `dvh` accounts for it, `vh` doesn't.
5. **Don't include few-shot examples** in the system prompt — token-bloat anti-pattern that biases toward surface-form mimicry. A tight rubric (FODMAP thresholds + SIBO triggers + green/amber/red definitions) outperforms 5-food few-shots.
6. **Don't stream the response.** A 2-3s response that the user wants to see in full before saving doesn't benefit from streaming, and SSE through Vercel adds non-trivial complexity.

**v0 reduction (\~1 day)**: skip the `user_foods` table entirely. Render the LLM response inline as ephemeral one-shot — no save, no Supabase changes. Validates LLM verdict quality + the modal flow before committing to persistence. Layer on persistence as v1 if quality holds.

**Verification**:

1. `curl -X POST localhost:3000/api/food-verdict` without a JWT → returns 401.
2. Try inserting a row with `cat = 'Boissons'` directly in Supabase → CHECK constraint rejects it.
3. End-to-end on `vercel dev`: open Aliments tab, click `+ Aliment`, ask "quinoa", verdict appears in 2-3s, save, the entry shows in the list grouped under "Féculents".
4. Ask "quinoa" again → instant response (cache hit, 0 tokens consumed).
5. Real iPhone: keyboard opens cleanly, response visible above the keyboard, Save button reachable without scrolling weirdness.

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

### Edit LLM verdicts after save

Currently the LLM verdict is one-shot. If it's wrong, you'd have to delete and re-add. v2: an "Edit" button on user-added Aliments cards opens a modal with the current verdict pre-filled.

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
