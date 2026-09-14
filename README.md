# S K Furniture

A website for **S K Furniture**, a modular-kitchen and PVC-furniture workshop in
Bilimora, Gujarat. It's a customer-facing marketing site with a wishlist,
reviews, a map/Instagram presence, an enquiry form, customer registration, and a
single-admin control panel for managing images and rates.

## Features

**Public site (`/`)**
- Premium homepage: hero (with admin-uploaded images), services & rates, gallery,
  why-us, stats, process, reviews, FAQ, location and contact.
- **Wishlist** — heart button on every service, a nav counter, and a `/wishlist`
  page. Saved in the browser (localStorage).
- **Reviews** — customers can leave a star-rated review; it appears on the site
  after the admin approves it.
- **Google Map** embed of the Bilimora showroom, plus **Instagram** buttons.
- **Enquiry form** — quote requests are stored in Convex.

**Customer registration (`/join`)**
- Name / email / phone, then an OTP that is generated **in the browser with
  JavaScript**, verified client-side, and the member is saved to Convex.

**Admin panel (`/admin`)**
- Single admin login (username + password).
- **Images** — upload photos to Convex file storage and delete them.
- **Rates** — edit each service's name, description and price.
- **Reviews** — approve / unapprove / delete.
- **Enquiries** — view, mark handled, delete.
- **Members** — everyone who registered.

## Tech stack

- Vite + React 19 + TypeScript
- React Router v7
- Tailwind v4 + shadcn/ui + Lucide icons + Framer Motion
- Convex (database, functions, file storage)
- Package manager: **Bun**

## Getting started

```bash
bun install
bunx convex dev      # connects/creates the Convex deployment and generates types
bun run dev          # starts the Vite dev server
```

### Environment variables

Set these wherever you run the app (e.g. `.env.local`, which is not committed):

- `CONVEX_DEPLOYMENT`
- `VITE_CONVEX_URL`
- Auth keys on the Convex backend: `JWKS`, `JWT_PRIVATE_KEY`, `SITE_URL`

## Routes

| Path | Description |
| --- | --- |
| `/` | Marketing homepage |
| `/wishlist` | Saved services |
| `/join` | Customer registration (browser OTP) |
| `/admin` | Admin control panel |

## Admin credentials

There is exactly **one** admin account. It is configured in
`src/convex/admin.ts`:

```ts
export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "********"; // set your own here
```

Change both values before going live, then let Convex redeploy. Admin sessions
expire after 12 hours.

## Project structure

```
src/
  components/      # UI pieces (WishlistButton, ReviewForm, Stars, EnquiryForm, ui/*)
  convex/          # backend: schema.ts, admin.ts, products.ts, gallery.ts,
                   #          reviews.ts, members.ts, enquiries.ts
  hooks/           # use-wishlist, use-mobile
  lib/             # wishlist store, utils
  pages/           # Landing.tsx, Wishlist.tsx, Join.tsx, Admin.tsx, NotFound.tsx
  main.tsx         # routes
  index.css        # theme tokens
```

## Notes

- The OTP on `/join` is generated client-side for demo purposes. For a live
  deployment, generate and deliver the OTP from a server instead.
- The wishlist is stored in the browser, not on the server.
- `src/convex/_generated` is git-ignored; regenerate it with `bunx convex dev`.
