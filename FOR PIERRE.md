# FOR PIERRE — How this got built, what's in it, what to remember

This document is a cheat-sheet for **future you** (and present you, when you come back to this code in three months and forget how it works). It's written like a tour guide, not a manual. Read it once now, skim it later when something breaks.

---

## What you actually built

A two-tab mobile-first app called **fodmap-mvp**:

- **Aliments** — searchable list of ~40 foods, filterable by category and meal-of-day, color-coded green/amber/red for SIBO compatibility.
- **Restos** — your personal directory of Paris restaurants you've vetted, each with the meals you've ordered, what to ask the waiter to modify, and your half-star ratings out of 5.

It runs at **https://fodmap-mvp.vercel.app**, accessible from any web-connected device. You log in with a magic link sent to your email. Your data — the custom restos you add, the meals, the ratings — lives in a Postgres database in Paris and follows you to every device. There are no usernames, no passwords, no apps to install. It's a website that feels like an app.

This sentence is shorter than a venti latte order at Starbucks, and it took us a few hours to build. That's not "code is easy"; it's "we made all the right small decisions so it never spiraled into being hard."

---

## The 30-second architecture

Three components, sitting in three places on the internet:

```
   YOUR PHONE                    VERCEL                       SUPABASE
       (Safari)        ←→     (CDN at Paris edge)       ←→    (Postgres in Paris)
                                                              + Auth (magic links)
                                                              + RLS (per-user rows)
```

When you open `fodmap-mvp.vercel.app` on your phone:

1. **Vercel** ships you an `index.html` (715 bytes), a CSS bundle (1 KB), and a JS bundle (~120 KB gzipped). All served via HTTP/2 from a server in Paris, ~10ms away from your phone.
2. The JS bundle boots. It's a **React app** that renders inside a phone-frame mockup. Before doing anything else, it asks **Supabase**: "do I have a session?" If no, it shows the **Login screen**. If yes, it queries the database.
3. **Supabase** handles two jobs: it issues short-lived JWTs (proof-of-identity tokens) when you click a magic link, and it serves data through a Postgres-backed REST API that respects per-row authorization rules.
4. Every database query the app makes (`SELECT * FROM restos`, `INSERT INTO meals`, etc.) carries your JWT. Supabase reads the JWT, extracts your user ID, and uses it to filter what you can see and write. **Other users querying the same tables can't see your rows, ever.**

That's the whole system. There's no server you maintain. There's no API code you wrote. The "backend" is just a Postgres database with policies that say "users see their own rows."

---

## The codebase, room by room

The project lives in `fodmap/`. Every file fits in your head.

### The entry hallway

- **`index.html`** — bare bones. A `<div id="root">`, a `<link>` to Google Fonts (Bricolage Grotesque), and a `<script type="module">` pointing at `src/main.jsx`. That's it. No other tags, no inline scripts. Vite generates a heavily-optimized version of this for production.

- **`src/main.jsx`** — three lines that mount React onto the `<div id="root">`. This is the cradle.

- **`src/App.jsx`** — the **router**, even though we don't use a routing library. It checks Supabase for a session, and either:
  - Shows `<Login />` if you're logged out, or
  - Shows `<AppShell />` (the phone frame, status bar, sign-out button, current screen, and tab bar) if you're logged in.

  React Router would be over-engineering for two tabs that aren't even URL-routed. We use plain `useState` for which tab is active.

### The data layer (`src/lib/`)

- **`supabase.js`** — the Supabase client. Six lines that read environment variables and call `createClient(url, key)`. Every other file imports `supabase` from here. This is your single, shared, always-authenticated handle to the backend.

- **`user-data.js`** — *the most interesting file in the project*. It's where the magic-link reality meets the application logic.

  - `useRestos()` is a **React hook**. When a screen calls it, the hook fetches all restos and embedded meals from Supabase, derives a list of unique proteins, returns `{ restos, loading, error, proteines, refresh }`, and re-fetches whenever something changes.
  - `addResto()`, `addMeal()` are async functions. They look up your current user via `supabase.auth.getUser()`, then `INSERT` into the database. RLS guarantees they can only succeed if the inserted row's `user_id` matches your JWT's `sub` claim.
  - `seedRestos()` is a one-shot routine that inserts the 8 base Paris restaurants for new users. It runs the first time `useRestos` finds an empty table.

- **`foods-meta.js`** — pure utilities for the Aliments screen: photo URL lookup, deterministic fallback colors (`tileFor`), category list, search function. No state, no I/O — just helpers that work on the static `FOODS` array from `src/data/foods.js`.

### The static data (`src/data/`)

- **`foods.js`** — ~40 hand-coded food entries. Each one is `{ id, nom, cat, midi, soir, note, fodmap, contrainte, tags }`. Lives in code because it never changes per-user; everyone gets the same 40 foods.
- **`restos.js`** — the 8 Paris restos that get seeded into Supabase the first time you log in. After seeding, this file is essentially decorative — you can edit it but it won't change anything that's already in the database. Updates would only affect *new* users (and you only have one user: yourself).

### The presentation layer (`src/components/`, `src/screens/`)

- **`components/ui.jsx`** — small, dumb, reusable pieces: `Thumb` (the round food icon), `Verdict` (the green/amber/red pill), `Chip` (the filter pill), `FoodRow`, `BlobLogo`, `IconBtn`, `StatusBar`. None of them touch Supabase or know about user data. They just render based on props.

- **`screens/aliments.jsx`** — the food browser. Takes `FOODS`, applies search + category filter, groups by category, sorts by verdict within each group. Uses only `useState` and `useMemo`.

- **`screens/restos.jsx`** — the restaurant browser. This is the most complex screen. It calls `useRestos()`, then layers four filters (location, takeaway, protéine, view-mode), then renders either a list of `RestoCard` components or a schematic `MapView` with clickable pins. Tapping a pin opens a `RestoModal`. There are also "+ Resto" and "+ plat" buttons that open modal forms.

- **`screens/resto-forms.jsx`** — the two add-things forms (`AddRestoForm`, `AddMealForm`), plus the shared `FormShell` (modal chrome) and `StarInput` (the half-star rating input). Forms call `addResto`/`addMeal` from `user-data.js`, which talks to Supabase.

- **`screens/login.jsx`** — the email-input → "check your mail" flow. Two states. ~70 lines.

That's it. **Twelve source files**, ~1,500 total lines.

---

## The technology choices, and why

We picked things deliberately. Here's the rationale for each.

### Why Vite + React, not Next.js / Create React App / Astro

- **Vite is the fastest dev experience in 2026.** Open `npm run dev`, hit save on a JSX file, the change appears in the browser in <50ms. No bundler watch step. It uses native browser ESM in development, which is why startup is ~800ms instead of the 10-20s you'd get from webpack or older CRA.
- **No Next.js because we don't need server-side rendering.** This app has no SEO concerns (it's gated behind login), no public pages, no rendering-on-demand. Every byte goes from CDN to browser as static files. SSR would add complexity we'd never use.
- **React 19 because that's what `npm create vite` shipped today.** React 18 → 19 is a near-drop-in upgrade for our usage. The version pin happened naturally because we let the scaffold pick.

If you ever want to add proper routing (separate URLs for Aliments vs Restos vs a future Profile page), drop in `react-router` as a six-line change. If you want server-side data fetching for SEO, you'd migrate to Next or Remix — but that day isn't today.

### Why Supabase, not Firebase / a custom Express + Postgres / a Cloudflare Workers KV

Three things tipped Supabase:

1. **It's Postgres, not NoSQL.** Restos and meals have a clean parent/child relationship (`meals.resto_id → restos.id`). In Postgres, that's a foreign key with `on delete cascade` — three tokens. In Firestore (Firebase's NoSQL), you'd either nest meals as documents under restos (denormalization, hard to query across) or maintain manual references with no integrity guarantees. SQL is the right shape for relational data, and your data is relational.
2. **Auth + DB + RLS in one box.** A custom Express server would need: auth middleware, JWT verification, route handlers for restos and meals, an ORM, deployment infrastructure, monitoring. Supabase replaces all of that with a Postgres database that already authenticates and authorizes. **The amount of code you didn't have to write is the value.**
3. **The free tier is preposterously generous for a single-user app.** 500 MB database, 50K monthly active users, 2 GB egress. You'll use ~0.1% of any of those.

The real cost of Supabase (and Firebase) is that you're tied to their identity and authorization model. If you ever want self-hosted Postgres, Supabase's open-source mode is migratable. Firebase is more locked-in. But you won't think about this for years.

### Why Vercel, not Netlify / Cloudflare Pages / GitHub Pages

- **Vercel auto-detected Vite** without any config, set up the GitHub integration, and gave you a free `*.vercel.app` URL with HTTPS. That's the entire onboarding.
- **Atomic rollback** — every push creates a new immutable deploy. If `git push` ships a bug, you click "promote to production" on the previous deploy and instantly roll back. No `git revert`. That's a real safety net.
- **Preview deploys for branches** — every PR gets its own URL. We didn't use this yet, but it's free safety once you have it.

Netlify and Cloudflare Pages would do all of this fine too. The choice was largely "Vercel has marginally better DX for Vite specifically." Don't overthink hosting choices for static sites.

### Why magic-link auth, not email/password / Google OAuth / passkeys

- **Magic links are the lowest-friction passwordless flow.** Type your email, click the link in your inbox, you're in. No password to forget, manage, leak. No Google account required. No second device to register a passkey from.
- For a single-user app where the only person logging in is you, this is ideal.
- **For a multi-user app**, magic links scale fine but Google OAuth becomes nicer (faster, no inbox round-trip). You're free to add Google later — Supabase supports stacking auth methods.

---

## The bugs we ran into, and why each one matters

Every bug has a generalizable lesson. Don't memorize the bugs; memorize the lessons.

### Bug 1: The React hooks rule violation in `RestoModal`

Original prototype:

```jsx
function RestoModal({ resto, onClose }) {
  if (!resto) return null;            // early return
  React.useEffect(() => { ... }, []); // hook AFTER conditional return
}
```

This violates the [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks): hooks must be called in the same order on every render. When `resto` flips from object to null, the hook count changes from 1 to 0, and React's internal book-keeping panics. React 18 was lenient; React 19 in StrictMode trips on this aggressively.

**The fix:**

```jsx
function RestoModal({ resto, onClose }) {
  useEffect(() => {
    if (!resto) return;  // gate inside the effect, not before it
    // ...
  }, [resto, onClose]);
  if (!resto) return null;  // early return AFTER all hooks
}
```

> **Lesson:** *"My code worked"* and *"my code is correct"* are different. The prototype "worked" because React 18 silently accepted the violation. Real correctness shows up only when the framework gets stricter, when StrictMode is enabled, or when production minification rearranges things in unexpected ways. **Always put hooks at the top, before any conditional logic.**

### Bug 2: Postgres `numeric` columns return as strings

When the app fetched restos from Supabase, ratings came back like `"4.50"` (string), not `4.5` (number). PostgREST does this on purpose — `numeric` in Postgres is arbitrary-precision, and JSON numbers aren't, so converting would lose precision. The string `"4.50"` is exact; the number `4.5` is "close enough."

The bug: `list.sort((a, b) => b.rating - a.rating)` silently produced `NaN` ordering — JavaScript's `-` operator coerces strings to numbers but only after both sides agree. Restos rendered in random order.

**The fix:** explicit `Number(...)` coercion at the boundary where data enters the UI:

```jsx
list.sort((a, b) => Number(b.rating) - Number(a.rating))
{Number(r.rating).toFixed(1)}
<Stars value={Number(r.rating)} />
```

> **Lesson:** **JSON has fewer types than your database.** When you go from Postgres to JSON to JavaScript, things change shape: dates become strings, decimals become strings, NULLs become `null`s. Coerce at the boundary, not deep inside your code. The "boundary" here is anywhere data enters from the network.

### Bug 3: Vercel deploy blocked by author email mismatch

I committed with `djianp@gmail.com` (your handle, which I incorrectly assumed was your email). Vercel's deploy security required the commit author email to match a verified email on a GitHub account. The deploy blocked with: *"The deployment was blocked because the commit email djianp@gmail.com could not be matched to a GitHub account."*

Embarrassingly, I'd been making the same mistake for *three previous commits* before this. Those previous commits deployed (Vercel had been more lenient for the Hobby plan or had recently flipped a setting). Then suddenly this one didn't, and I dismissed the warning as cosmetic. It wasn't.

**The fix:** push one new commit with the right email (`pierre.djian@gmail.com`), then later rewrite history with `git filter-branch` to backfill all the wrong-email commits.

> **Lesson 1:** **Read error messages literally.** When something says "deployment was blocked because X", the deployment was blocked, and X is the reason. I argued that X *couldn't* be the reason because it had been fine before. Sometimes platforms change behavior; sometimes the same bug becomes fatal under new circumstances.
>
> **Lesson 2:** **Don't guess at user identity.** Don't assume someone's email from their username, full name, GitHub bio, or anything else. Ask. I now have it saved in long-term memory for this project, but the right move would have been "what email do you want on commits?" up front.

### Bug 4: Vercel's bot challenge mid-polling

I wrote a polling loop:
```bash
until ! curl -s "$URL" | grep -q "$old_hash"; do sleep 5; done
```

It checked every 5 seconds whether the new bundle was live. After ~37 requests in 3 minutes, Vercel's anti-DDoS mitigation flagged me. The "Security Checkpoint" challenge page started serving instead of the actual app. The polling loop *did* exit — but because the response was now a challenge page that didn't contain the old hash either. False positive.

**The fix:** stop polling, switch to checking GitHub's commit-status API instead (`gh api .../statuses`). Real browsers (your phone) were unaffected throughout.

> **Lesson:** **Don't hammer production from a script.** Real users don't make 12 requests per minute from the same IP with curl's User-Agent — that pattern is exactly what bot mitigation is built to flag. Use the host's status API where one exists. If you must poll, use exponential backoff (1s, 2s, 4s, 8s, ...) so you trigger fewer alarms when something takes longer than expected.

### Bug 5: README merge conflict during the rebase

When I tried to push my first commit, GitHub rejected it because the remote had a "Initial commit" with an auto-generated `README.md`. My commit also had a `README.md` (the Vite scaffold's React+Vite boilerplate). When I rebased to merge, both sides had added a `README.md` with different content → "add/add" merge conflict.

**The fix:** `git checkout --ours README.md` during the rebase. The gotcha: during a rebase, "ours" means *the base branch*, not your local commits. (Outside a rebase, "ours" means your branch.) Counter-intuitive.

> **Lesson:** **Git rebase reverses some pronouns.** During a rebase you're replaying *your* commits onto *theirs*, so during conflict resolution, "theirs" means the commit being applied and "ours" means the existing base. Memorize this once; it'll save you minutes of confusion every time you rebase.

### Bug 6: The `.vite/` directory snuck into the working tree

After `npm run dev` ran, a directory called `.vite/` appeared at the project root. It's Vite v8's dependency pre-bundle cache (where it caches the esbuild-compiled version of React/ReactDOM). Vite v7 stored this under `node_modules/.vite/`, which was already in `.gitignore` via the `node_modules` line. Vite v8 moved it to `.vite/` at the project root — and the auto-generated `.gitignore` template hadn't caught up.

**The fix:** add `.vite` to `.gitignore`. One line, one commit.

> **Lesson:** **`?? <thing>` in `git status --short` is a quiet lie.** "Untracked" doesn't mean "harmless to ignore" — it means "git doesn't know about this yet, but the next `git add .` would commit it." Inspect untracked entries before bulk-adding. Better: keep your `.gitignore` ahead of your tooling by checking what your tools generate after first run.

### Bug 7: Async-everywhere data shape change

The biggest internal restructure of the project: in the prototype, `getMergedRestos()` was a synchronous function that returned an array. Used like:

```jsx
const allRestos = useMemo(() => getMergedRestos(), [refreshTick]);
```

When we moved to Supabase, `getMergedRestos()` had to become async (network call). But `useMemo` can't `await`. So the entire data-loading shape had to change to a hook with internal state:

```jsx
const { restos, loading, error, proteines, refresh } = useRestos();
```

Every screen that used `getMergedRestos` needed to be updated. Every form that called `addResto`/`addMeal` had to `await` instead.

> **Lesson:** **Async is contagious.** When a single function becomes async, every caller becomes async. Every caller of those callers might need a loading state. Plan the spread when you change the synchronization model. The plan-mode document explicitly flagged this as the highest-risk part of Phase C — and that's exactly where most of the diff lived.

---

## How a good engineer thinks (the meta-lessons)

These aren't bug-specific. They're patterns that came up over and over.

### Phase by phase, never all at once

We moved through four phases:

1. **Phase A**: Migrate the prototype to Vite + React. Result: identical-looking app, but on a real bundler.
2. **Phase B**: Push to GitHub, deploy to Vercel. Result: a live URL on the internet.
3. **Phase C**: Add Supabase (DB + auth + sync). Result: cross-device data.
4. **Phase D**: Polish. Optional. We haven't done it.

Each phase produced something **demoable in isolation**. After Phase B, you had a working live URL. If Phase C had failed catastrophically, you could revert and still have a working live URL with localStorage. **Each phase is reversible.**

This is the opposite of how a lot of beginners work, which is "build everything, then deploy at the end." When the end-of-project deploy fails, you don't know whether the bug is in the auth, the data layer, the build config, the hosting, or the database. With phased deploys, every phase catches its own bugs.

### Reversibility > speed

The whole reason to use `git push --force-with-lease` instead of `--force`: same speed, fewer ways to lose data. We backed up commits with a tag (`pre-email-rewrite`) before doing destructive history rewrites. We never edited global git config — all identity threading happened per-command. **The cost of these safeties is near-zero. The cost of not having them when you need them is "lost work, bad mood for an afternoon."**

### Trust but verify, especially yourself

After force-pushing the rewritten history, I verified that the **tree hash** of the new HEAD matched the **tree hash** of the old HEAD. That's not a vibe check — it's a cryptographic guarantee that the files are byte-identical, only the metadata changed. If they hadn't matched, something had gone wrong and I'd have noticed *before* anyone tried to redeploy.

> **The principle**: don't end an operation with "I think it worked." End it with "I verified it worked, and here's the evidence." A 5-second verification step prevents 5-hour debug sessions.

### The cost of clarification < the cost of guessing

When you said "make this MVP a live web app available from any web connected device," I asked two clarifying questions before writing any code: do you want cross-device data sync, and do you want to migrate to a real bundler. Both answers changed the implementation substantially. If I'd guessed wrong on sync (built it without Supabase), we'd have shipped, you'd have used the app on your phone, and a week later realized your laptop showed different data and we'd have had to retrofit auth onto a working app. **That's harder than building auth in once.**

Whenever you're about to make a decision that's expensive to undo, ask. The cost of asking is 10 seconds and a tiny amount of friction. The cost of being wrong is hours.

### Memory and conventions

I added a "user identity for git commits" memory after we discovered the email mistake. Future Claude Code sessions in this project will know to use `pierre.djian@gmail.com` without asking. **Conventions don't have to be in your head — they can be in the project.** A short file in `memory/` or `CLAUDE.md` captures decisions you'd otherwise forget and re-litigate.

If you have other working conventions you want enforced (e.g., "always run lint before committing", "commits should be in English"), saving them as memory or CLAUDE.md lines makes them stick across sessions.

---

## Things to be careful about, going forward

Some sharp edges that didn't bite us yet, but could:

### The food photos are huge

`saumon.png` is 875 KB. `riz-noir.png` is 1 MB. They render at 48-96 pixels in the UI. **>99% of the bytes are wasted on every page load.** Phone users on cellular pay for that wastage in time and data. Fix: `sips -Z 200 *.png` (one-liner, ~25 KB output) or install `vite-plugin-image-optimizer` for an automated build step.

### The 8 seed restos are coupled to one user

If you ever invite a friend to use the app, they'd log in and `useRestos` would call `seedRestos()` to give them the same 8 base Paris restos. That's fine for the friend. But if you ever change the seed (add a 9th, edit one), existing users won't get the change. The seed is a **one-shot first-login gift**, not a synchronized canonical list.

For a multi-user app, you'd separate "your restos" from "shared/featured restos that are read-only and curated." That's not the app you're building. If you ever want to, the schema would need a new table.

### The redirect URL allowlist is fragile

If you set up a custom domain (e.g., `fodmap.djian.fr`), magic-link auth will *fail* on it until you add the new domain to Supabase's redirect URL allowlist. This is the single most common gotcha. Symptom: "I clicked the link in my email and nothing happened." Fix: Supabase dashboard → Authentication → URL Configuration → add the new domain.

### Force-pushed history surprises other clones

You only have one clone of this repo (your laptop). If you ever clone it on another machine (or a co-worker does, hypothetically), they'll have the *old* SHAs. A `git pull` will show divergence. Recovery: `git fetch && git reset --hard origin/main` on the affected clone. **This is why force-pushes to shared branches are taboo on team repos** — but for solo projects, it's fine.

### `.env.local` is on this machine only

If you ever clone this repo on another laptop, it won't have the Supabase URL or publishable key, because `.env.local` is git-ignored. The app will crash at startup with "Missing VITE_SUPABASE_URL." Fix: copy the file by hand to the new machine, or add a tiny `.env.example` (committed) that lists the required keys without values, so future-you remembers what to set.

### Supabase free tier limits

The free tier auto-pauses your project after **7 days of inactivity**. If you don't open the app for a week, the next visit will take ~10 seconds while Supabase wakes the database up. Fix later by either upgrading to Pro ($25/mo) or hitting a tiny health-check endpoint daily via a cron-like service. Not urgent until you actually go a week without using the app.

---

## A short glossary, because the jargon is half the difficulty

**SPA** — Single-Page App. The browser loads one HTML file plus a JS bundle, and JavaScript renders all subsequent UI without full page reloads. Our app is one.

**SSR** — Server-Side Rendering. The server pre-renders HTML for each request. We don't do this. Next.js does. We don't need it.

**HMR** — Hot Module Replacement. When you save a file in dev, only the changed module reloads in the browser, preserving state. Saves ~3 seconds vs full reload.

**JWT** — JSON Web Token. A signed proof-of-identity blob. Supabase issues these when you log in. Every database request includes the JWT, which the server reads to authorize you.

**RLS** — Row-Level Security. A Postgres feature: per-row policies decide who can read/write each row. We use it to make `auth.uid() = user_id` the rule for every table. The result: each user sees only their own data, with database-level enforcement.

**ESM** — ECMAScript Modules. The official JavaScript module system (`import`/`export`). Vite uses native ESM in development.

**HTTP/2** — A network protocol that multiplexes many requests over one TCP connection. Faster than HTTP/1.1 for sites with many small assets. Vercel uses it by default.

**HSTS** — HTTP Strict Transport Security. A response header that tells browsers "always use HTTPS for this domain, never HTTP." Vercel sets this by default.

**CDN** — Content Delivery Network. Servers in many cities that cache your static files near your users. Vercel's CDN serves your bundle from the Paris edge to your phone in Paris in ~10ms.

**RLS policy** — see RLS above. A SQL `CREATE POLICY` statement. Ours: `for all using (auth.uid() = user_id) with check (auth.uid() = user_id)` — meaning "users can read their own rows" *and* "users can only write rows they own."

---

## When you come back to this project

In three months you'll forget half of this. Don't try to memorize. Instead:

1. **Read this file again.** It's faster than re-deriving the architecture.
2. **`npm run dev`** to start the local dev server. Visit `http://localhost:5173`.
3. **`git log --oneline`** to remind yourself of the recent changes.
4. **Open `src/App.jsx`** to see the entry point. The mental model: App → either Login or AppShell → AppShell renders one of two screens → screens use `useRestos()` for data and the components in `ui.jsx` for rendering.
5. **Open the Supabase dashboard** to inspect the database directly. The `Table Editor` shows your `restos` and `meals` rows. You can edit/delete from there if the UI doesn't yet support it.
6. **Note on the directory name**: it's `fodmap/`, even though early in development it was briefly called `sibo/`. The GitHub repo, Vercel project, and login-screen branding all settled on FODMAP, so the directory was renamed to match. If you see "SIBO" inside `src/data/foods.js`, that's the disease name being referenced in food descriptions — leave those alone.

You built a real app. It's small, it's solid, and it covers a specific problem you actually have. That's the best kind of software to build.
