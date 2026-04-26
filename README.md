# fodmap-mvp

A personal mobile-first web app for managing a low-FODMAP / SIBO-friendly diet:
a curated food reference and a directory of approved Paris restaurants with per-meal notes that ask the right questions of the waiter.

**Live:** [fodmap-mvp.vercel.app](https://fodmap-mvp.vercel.app) — passwordless magic-link login.

> Single-user app. The Supabase database holds one user's data; the auth allowlist is configured for that one email. New sign-ups create separate, isolated accounts via Row-Level Security but won't see existing data.

UI is in French.

---

## Features

**Aliments tab** — searchable list of ~40 foods, filterable by category and meal-of-day (`midi` / `soir`), color-coded green / amber / red for SIBO compatibility.

**Restos tab** — personal directory of restaurants you've vetted:
- Name, half-star rating, address, distance from `bureau` / `domicile`, click-to-call (`tel:` link).
- Per-meal entries: name, protein category, half-star rating, free-text comment ("ask for sauce on the side, no garlic").
- Filter by location, takeaway, and protein.
- Toggle between list view and a schematic map view with clickable pins.
- Add restaurants and meals via in-app forms; persisted to Supabase, synced across devices.

---

## Tech stack

- **Frontend** — Vite + React 19, plain ES modules, no router (tab state in memory + localStorage)
- **Backend** — Supabase (Postgres + Auth + Row-Level Security)
- **Hosting** — Vercel, auto-deploy on push to `main`
- **Fonts** — Bricolage Grotesque (Google Fonts)

---

## Local development

```bash
git clone https://github.com/djianp/fodmap-mvp.git
cd fodmap-mvp
npm install
```

Create `.env.local` at the project root with your Supabase credentials:

```bash
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<your-key>
```

Both values come from Supabase: project dashboard → **Project Settings → API → Publishable and secret API keys**. Use the **publishable** key, not the secret key.

Run the dev server:

```bash
npm run dev
```

Open `http://localhost:5173`.

For local magic-link login to work, `http://localhost:5173/**` must be on the Supabase redirect URL allowlist (see [Database setup](#database-setup) below).

---

## npm scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite dev server with HMR on port 5173 |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

---

## Project structure

```
fodmap/
├── index.html              Entry HTML (mounts <App>)
├── package.json
├── vite.config.js
├── public/                 Static assets served as-is at /
└── src/
    ├── main.jsx            React root, StrictMode + createRoot
    ├── App.jsx             Auth gate (Login vs AppShell) + tab nav
    ├── index.css           Phone-frame layout + globals
    ├── assets/food/        Bundled food photos
    ├── components/
    │   └── ui.jsx          Shared UI primitives (Chip, Verdict, FoodRow…)
    ├── data/
    │   ├── foods.js        ~40 foods (static, never user-mutated)
    │   └── restos.js       8 seed restaurants used as first-login data
    ├── lib/
    │   ├── supabase.js     Supabase client (reads VITE_* env vars)
    │   ├── user-data.js    useRestos() hook + addResto / addMeal / seed
    │   └── foods-meta.js   Photo URL map, categories, search helpers
    └── screens/
        ├── login.jsx       Magic-link login
        ├── aliments.jsx    Foods tab
        ├── restos.jsx      Restaurants tab (cards + map + modals)
        └── resto-forms.jsx Add-resto + add-meal modal forms
```

---

## Database setup

If you ever rebuild from scratch on a new Supabase project, run this in the SQL Editor:

```sql
create table public.restos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nom text not null,
  adresse text not null,
  phone text default '',
  distance_bureau numeric default 0,
  distance_domicile numeric default 0,
  rating numeric not null check (rating >= 0 and rating <= 5),
  takeaway boolean not null default false,
  created_at timestamptz default now()
);

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  resto_id uuid references public.restos(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  nom text not null,
  proteine text not null,
  rating numeric not null check (rating >= 0 and rating <= 5),
  comment text default '',
  created_at timestamptz default now()
);

create index idx_restos_user_id on public.restos(user_id);
create index idx_meals_resto_id on public.meals(resto_id);
create index idx_meals_user_id on public.meals(user_id);

alter table public.restos enable row level security;
create policy "owner rw restos" on public.restos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.meals enable row level security;
create policy "owner rw meals" on public.meals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Then configure auth URLs at **Authentication → URL Configuration**:

- **Site URL** — the production URL (e.g. `https://fodmap-mvp.vercel.app`)
- **Redirect URLs** — both production and dev:
  - `http://localhost:5173/**`
  - `https://fodmap-mvp.vercel.app/**`

On a new user's first login, the 8 restaurants from `src/data/restos.js` are bulk-inserted into their account by the `seedRestos()` routine in `src/lib/user-data.js`.

---

## Deployment

Vercel auto-deploys on every push to `main`. No CI config in the repo — Vercel detects Vite from `package.json` and runs `npm run build` itself.

Environment variables required in Vercel **Project Settings → Environment Variables**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Set both for **Production**, **Preview**, and **Development** environments.

After adding the production URL to Supabase's redirect allowlist, magic-link login works on the live site.

---

## Notes for future-me

See [`FOR PIERRE.md`](./FOR%20PIERRE.md) for a longer narrative write-up: why the project is structured this way, the bugs hit during development, and the lessons.

For one-line architecture: **GitHub stores it. Vercel serves it. Supabase remembers it.**
