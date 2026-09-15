# S K Furniture

A website for **S K Furniture**, a modular-kitchen and PVC-furniture workshop in
Bilimora, Gujarat. It's a customer-facing marketing site with a wishlist,
reviews, a map/Instagram presence, an enquiry form, customer registration, and a
single-admin control panel for managing images and rates.

**Backend: MongoDB** (Mongoose + Express). No Convex — all data lives in your
own MongoDB database, and uploaded images are stored in MongoDB via GridFS.

## Features

**Public site (`/`)**
- Premium homepage: hero (with admin-uploaded images), services & rates, gallery,
  why-us, stats, process, reviews, FAQ, location and contact.
- **Wishlist** — heart button on every service, a nav counter, and a `/wishlist`
  page. Saved in the browser (localStorage).
- **Reviews** — customers can leave a star-rated review; it appears on the site
  after the admin approves it.
- **Google Map** embed of the Bilimora showroom, plus **Instagram** buttons.
- **Enquiry form** — quote requests are stored in MongoDB.

**Customer registration (`/join`)**
- Name / email / phone, then an OTP that is generated **in the browser with
  JavaScript**, verified client-side, and the member is saved to MongoDB.

**Admin panel (`/admin`)**
- Single admin login (username + password, session valid 12 hours).
- **Images** — upload photos (stored in MongoDB via GridFS) and delete them.
- **Rates** — edit each service's name, description and price.
- **Reviews** — approve / unapprove / delete.
- **Enquiries** — view, mark handled, delete.
- **Members** — everyone who registered.

## Tech stack

- Frontend: Vite + React 19 + TypeScript, React Router v7,
  Tailwind v4 + shadcn/ui + Lucide icons + Framer Motion
- Backend: Express 5 + Mongoose 8 (MongoDB), Multer for uploads,
  GridFS for image storage
- Package manager: npm (or bun/pnpm if you prefer)

## Project structure

```
server/
  index.js         # Express API: public + admin endpoints, GridFS uploads
  smoke-test.mjs   # End-to-end API test (in-memory MongoDB)
src/
  lib/api.ts       # Frontend API client (fetch-based useQuery replacement)
  components/      # UI pieces (WishlistButton, ReviewForm, Stars, EnquiryForm, ui/*)
  pages/           # Landing.tsx, Wishlist.tsx, Join.tsx, Admin.tsx, NotFound.tsx
  main.tsx         # routes
  index.css        # theme tokens
```

## Getting started

1. **Start MongoDB** — either locally:

   ```bash
   mongod
   ```

   or create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
   and copy the connection string.

2. **Configure environment** — copy `.env.example` to `.env` and adjust
   (at minimum, change `ADMIN_PASSWORD` before going live):

   ```bash
   cp .env.example .env
   ```

3. **Install & run** (API on :3001, Vite on :5173):

   ```bash
   npm install
   npm run dev:all
   ```

   The Vite dev server proxies `/api/*` to the Express server, so no CORS
   setup is needed in development.

4. Open http://localhost:5173 — the four default services/rates are seeded
   into MongoDB automatically on first start.

## Production

```bash
npm run build       # typecheck + build the SPA into dist/
npm start           # Express serves dist/ and the API on one port (3001)
```

Set these env vars in production:

- `MONGODB_URI` — your MongoDB connection string (Atlas works great)
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — the admin login
- `PORT` — defaults to 3001
- `PUBLIC_API_BASE` — optional; the public origin of the API, used to build
  image URLs when the SPA is hosted on a different domain
- `VITE_API_URL` — build-time; the API base URL when it differs from the SPA origin

## Routes

| Path | Description |
| --- | --- |
| `/` | Marketing homepage |
| `/wishlist` | Saved services (localStorage) |
| `/join` | Customer registration (browser OTP) |
| `/admin` | Admin control panel |

## API overview

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/api/products` | — | Services & rates (seeded on first run) |
| GET | `/api/gallery` | — | Admin-uploaded images |
| GET | `/api/reviews` | — | Approved reviews |
| POST | `/api/reviews` | — | Submit a review (pending) |
| POST | `/api/members` | — | Register (Join page) |
| POST | `/api/enquiries` | — | Submit enquiry |
| GET | `/api/images/:fileId` | — | Serve an uploaded image |
| POST | `/api/admin/login` / `logout` | — | Admin session |
| GET | `/api/admin/stats` | Bearer | Dashboard counters |
| POST/DELETE | `/api/admin/images` | Bearer | Upload / delete gallery image |
| PATCH | `/api/admin/products/:id` | Bearer | Edit service & rate |
| GET/PATCH/DELETE | `/api/admin/reviews[...]` | Bearer | Moderate reviews |
| GET/PATCH/DELETE | `/api/admin/enquiries[...]` | Bearer | Handle enquiries |
| GET | `/api/admin/members` | Bearer | Registered members |

Run the end-to-end API test (uses a throwaway in-memory MongoDB):

```bash
node server/smoke-test.mjs
```

## Admin credentials

There is exactly **one** admin account. It is configured with environment
variables (see `.env.example`):

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin@123   # CHANGE THIS before going live
```

Admin sessions are stored in MongoDB and expire after 12 hours.

## Notes

- The OTP on `/join` is generated client-side for demo purposes. For a live
  deployment, generate and deliver the OTP from a server instead.
- The wishlist is stored in the browser, not on the server.
- Data migration: the app previously used Convex. Data created there (reviews,
  enquiries, members, gallery images) is not carried over automatically —
  starting fresh with MongoDB is expected.
