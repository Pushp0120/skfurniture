# S KITCHEN POINT

A website for **S KITCHEN POINT**, a modular-kitchen and PVC-furniture workshop
in Bilimora, Gujarat. It's a customer-facing marketing site with a gallery,
reviews, a map/Instagram/WhatsApp presence, an enquiry form, and a single-admin
control panel for managing images and rates.

**Backend: Postgres** (Neon on Vercel) + Express. No Convex, no MongoDB — all
data lives in your own Postgres database, and uploaded images are stored in the
database itself (no external storage service).

## Features

**Public site (`/`)**
- Premium homepage: hero (with admin-added images), services & rates, gallery,
  why-us, stats, process, reviews, FAQ, location and contact.
- **Reviews** — customers can leave a star-rated review; it appears on the site
  after the admin approves it.
- **Google Map** embed of the Bilimora showroom, **Instagram** and **WhatsApp**
  (wa.me deep link) buttons.
- **Enquiry form** — quote requests are stored in the database.

**Admin panel (`/admin`)**
- Single admin login (username + password, session valid 12 hours).
- **Images** — upload photos or add them by URL, and delete them.
- **Rates** — edit each service's name, description and price.
- **Reviews** — approve / unapprove / delete.
- **Enquiries** — view, mark handled, delete.

## Tech stack

- Frontend: Vite + React 19 + TypeScript, React Router v7,
  Tailwind v4 + shadcn/ui + Lucide icons + Framer Motion
- Backend: Express 5 + postgres.js (Neon Postgres on Vercel), Multer for
  uploads; images stored in the database as `bytea`
- Local database: embedded Postgres ([PGlite](https://github.com/electric-sql/pglite))
  — nothing to install or start; data lives in `server/data/pg`

## Project structure

```
api/
  index.js         # Vercel serverless entry (exports the Express app)
server/
  app.js           # Express API: public + admin endpoints, Postgres queries
  index.js         # CLI launcher (local dev / self-hosting)
  preview-server.mjs # Zero-setup preview (embedded Postgres)
  smoke-test.mjs   # End-to-end API test (embedded Postgres, throwaway data)
src/
  lib/api.ts       # Frontend API client (fetch-based useQuery replacement)
  components/      # UI pieces (BrandIcons, ReviewForm, Stars, EnquiryForm, ui/*)
  pages/           # Landing.tsx, Admin.tsx, NotFound.tsx
  main.tsx         # routes
  index.css        # theme tokens
```

## Getting started (zero database setup)

```bash
npm install
npm run dev:all        # API on :3001, Vite on :5173
```

No database steps: without `DATABASE_URL` the API automatically uses an
embedded Postgres (PGlite) stored in `server/data/pg`. The four default
services/rates are seeded on first start. Delete `server/data/pg` for a
factory reset.

## Production

```bash
npm run build       # typecheck + build the SPA into dist/
npm start           # Express serves dist/ and the API on one port (3001)
```

Set these env vars in production:

- `DATABASE_URL` — Postgres connection string (Neon on Vercel — see below)
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — the admin login
- `PORT` — defaults to 3001
- `PUBLIC_API_BASE` — optional; the public origin of the API, used to build
  image URLs when the SPA is hosted on a different domain
- `VITE_API_URL` — build-time; the API base URL when it differs from the SPA origin

## Deploy free on Vercel — with Neon (no external database dashboard)

The API is Vercel-serverless-ready (`api/index.js` exports the Express app;
`vercel.json` builds the SPA and routes `/api/*` to it).

1. Sign in at [vercel.com](https://vercel.com) with GitHub — your repo should
   already be imported.
2. Project → **Storage** tab → **Create Database** → choose **Neon** (Marketplace)
   → the free plan is fine → pick the region closest to your visitors
   (e.g. Mumbai `ap-south-1`). Vercel creates the database and injects
   `DATABASE_URL` into the project automatically — nothing to copy or paste.
3. Project → **Settings → Environment Variables** — add just two:
   - `ADMIN_USERNAME` — your admin username
   - `ADMIN_PASSWORD` — a strong password (do **not** reuse the default
     `admin` / `Admin@123` — it's public in the repo)
4. **Deployments → Redeploy** (env vars only apply to new builds).
   `vercel.json` handles the build and the `/api` routing automatically.
5. Verify: `https://<your-app>.vercel.app/api/health` → `{"ok":true}`, then
   sign in at `/admin`.

Vercel notes: serverless has a ~4.5 MB request limit (admin image uploads are
accepted at 8 MB locally but are effectively ~4 MB on Vercel — compress photos
before uploading), and functions cold-start after inactivity (a 1–2 s first
API call; the page itself is instant from the CDN). The Neon free plan keeps
the database always available; it scales to zero only for the compute, which
wakes automatically.

## Routes

| Path | Description |
| --- | --- |
| `/` | Marketing homepage |
| `/admin` | Admin control panel |

## API overview

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/products` | — | Services & rates (seeded on first run) |
| GET | `/api/gallery` | — | Admin-added images |
| GET | `/api/reviews` | — | Approved reviews |
| POST | `/api/reviews` | — | Submit a review (pending) |
| POST | `/api/enquiries` | — | Submit enquiry |
| GET | `/api/images/:fileId` | — | Serve an uploaded image |
| POST | `/api/admin/login` / `logout` | — | Admin session |
| GET | `/api/admin/stats` | Bearer | Dashboard counters |
| POST/DELETE | `/api/admin/images` | Bearer | Upload / add-by-URL / delete gallery image |
| PATCH | `/api/admin/products/:id` | Bearer | Edit service & rate |
| GET/PATCH/DELETE | `/api/admin/reviews[...]` | Bearer | Moderate reviews |
| GET/PATCH/DELETE | `/api/admin/enquiries[...]` | Bearer | Handle enquiries |

Run the end-to-end API test (uses an embedded Postgres with a throwaway data
dir — no setup):

```bash
node server/smoke-test.mjs
```

## Admin credentials

There is exactly **one** admin account. It is configured with environment
variables (see `.env.example`):


```

Admin sessions are stored in the database and expire after 12 hours.

## Notes

- The database schema is created automatically on first boot — there are no
  migrations to run.
- Data migration: the app previously used Convex and then MongoDB. Data created
  there (reviews, enquiries, gallery images) is not carried over automatically —
  starting fresh with Postgres is expected.
