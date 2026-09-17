/**
 * S KITCHEN POINT — API app (Express + Postgres)
 *
 * The Express app is exported for serverless hosting (Vercel, see
 * api/index.js); server/index.js is the CLI launcher that connects to
 * Postgres and listens on a port for local/self-hosted runs.
 *
 * Database: any Postgres. On Vercel use the Neon integration — create the
 * database from the Storage tab and `DATABASE_URL` is injected automatically.
 * Locally (dev/preview/tests) it falls back to an embedded Postgres (PGlite)
 * stored in server/data/pg, so nothing needs to be installed or started.
 *
 *   - Public:  products, gallery, reviews, enquiries
 *   - Admin:   login/logout sessions, stats, gallery upload/delete,
 *              product/rates editing, review moderation, enquiry handling
 *
 * Uploaded images are stored in the database itself (bytea) — no external
 * storage service needed.
 *
 * Env vars (see .env.example):
 *   DATABASE_URL     — Postgres connection string (Neon on Vercel; optional
 *                      locally — defaults to the embedded Postgres)
 *   PORT             — API port (default: 3001)
 *   PUBLIC_API_BASE  — public base URL for image links in production (optional)
 *   ADMIN_USERNAME   — admin login username (default: admin)
 *   ADMIN_PASSWORD   — admin login password (default: Admin@123)
 */

import "dotenv/config";

import express from "express";
import multer from "multer";
import cors from "cors";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT || 3001);

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
const SESSION_MS = 1000 * 60 * 60 * 12; // 12 hours, same as before

// ---------------------------------------------------------------------------
// Database setup — postgres.js for a real Postgres (Neon), embedded PGlite
// otherwise. Both are exposed through the same `q(text, params) -> rows[]`.
// ---------------------------------------------------------------------------
let q;
let closeDb = async () => {};

function resolveDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ""
  );
}

async function initDb() {
  const url = resolveDatabaseUrl();

  if (url) {
    // Real Postgres — Neon on Vercel (connection string carries sslmode).
    const postgres = (await import("postgres")).default;
    const sql = postgres(url, { prepare: false });
    q = async (text, params = []) => sql.unsafe(text, params);
    closeDb = () => sql.end({ timeout: 1 });
    console.log("[db] Using Postgres (DATABASE_URL)");
    return;
  }

  // Embedded Postgres (PGlite) — local dev / preview / tests, zero setup.
  // Not supported on serverless hosts (read-only filesystem) — fail loudly
  // with an actionable message instead of a generic 500.
  if (process.env.VERCEL) {
    throw new Error(
      "DATABASE_URL is not set in this deployment. Add the Neon database in " +
        "Vercel → Storage (it injects DATABASE_URL), make sure it is enabled " +
        "for the Production environment, then redeploy.",
    );
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const dataDir = process.env.PGLITE_DATA_DIR || path.join(__dirname, "data", "pg");
  fs.mkdirSync(dataDir, { recursive: true }); // PGlite does not create parents
  const db = new PGlite(dataDir);
  q = async (text, params = []) => (await db.query(text, params)).rows;
  closeDb = () => db.close();
  console.log("[db] Using embedded Postgres (PGlite) at", dataDir);
}

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------
const app = express();
app.set("trust proxy", true); // correct req.ip/protocol behind Vercel/Render proxies
app.use(cors()); // open CORS: the SPA may be deployed on another origin
app.use(express.json({ limit: "1mb" }));

// Lazy database init + first-run seeding. On serverless hosts (Vercel) the
// module loads per cold start; connecting on the first request keeps boot
// fast and reuses one connection across warm invocations.
let dbReadyPromise;
function connectDb() {
  if (!dbReadyPromise) {
    dbReadyPromise = (async () => {
      await initDb();
      await createSchema();
      await ensureSeeded();
    })().catch((err) => {
      dbReadyPromise = undefined; // allow a retry on the next request
      console.error("[db] Could not connect to Postgres:", err.message);
      throw err;
    });
  }
  return dbReadyPromise;
}
app.use((_req, _res, next) => {
  connectDb().then(() => next(), (err) => {
    err.exposeMessage = true; // database misconfig: show the real cause to the caller
    next(err);
  });
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB, same as the old UI limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else {
      const err = new Error("Please choose an image file.");
      err.status = 400;
      cb(err);
    }
  },
});

// ---------------------------------------------------------------------------
// Schema (created idempotently on boot — no migrations to run)
// ---------------------------------------------------------------------------
async function createSchema() {
  await q(`
    CREATE TABLE IF NOT EXISTS products (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name        TEXT NOT NULL,
      description TEXT,
      price       INTEGER NOT NULL,
      price_note  TEXT NOT NULL DEFAULT 'onwards',
      "order"     INTEGER NOT NULL,
      updated_at  BIGINT NOT NULL
    )
  `);
  await q(`
    CREATE TABLE IF NOT EXISTS gallery_images (
      id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      title      TEXT NOT NULL,
      file_id    TEXT,
      url        TEXT,
      "order"    BIGINT NOT NULL,
      created_at BIGINT NOT NULL
    )
  `);
  await q(`
    CREATE TABLE IF NOT EXISTS reviews (
      id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name       TEXT NOT NULL,
      rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      text       TEXT NOT NULL,
      status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved')),
      created_at BIGINT NOT NULL
    )
  `);
  await q(`
    CREATE TABLE IF NOT EXISTS enquiries (
      id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name        TEXT NOT NULL,
      phone       TEXT NOT NULL,
      email       TEXT,
      requirement TEXT,
      location    TEXT,
      message     TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','handled')),
      created_at  BIGINT NOT NULL
    )
  `);
  // Pre-existing databases (deployed before the location field): add the
  // column without touching existing rows.
  await q(`ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS location TEXT`);
  await q(`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token      TEXT PRIMARY KEY,
      created_at BIGINT NOT NULL,
      expires_at BIGINT NOT NULL
    )
  `);
  await q(`
    CREATE TABLE IF NOT EXISTS uploads (
      id           TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      content_type TEXT NOT NULL,
      data         BYTEA NOT NULL,
      created_at   BIGINT NOT NULL
    )
  `);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function publicBaseUrl(req) {
  if (process.env.PUBLIC_API_BASE) {
    return process.env.PUBLIC_API_BASE.replace(/\/$/, "");
  }
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function imageFileUrl(req, fileId) {
  return `${publicBaseUrl(req)}/api/images/${fileId}`;
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const wrap = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

/** Throws 401 unless the bearer token maps to a live admin session. */
async function requireAdmin(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) throw new HttpError(401, "Admin sign-in required.");
  const sessions = await q(
    `SELECT token, expires_at FROM admin_sessions WHERE token = $1`,
    [token],
  );
  const session = sessions[0];
  if (!session || Number(session.expires_at) <= Date.now()) {
    throw new HttpError(401, "Admin sign-in required.");
  }
  return session;
}

// Simple in-memory rate limiting for the login endpoint.
const loginAttempts = new Map(); // ip -> { count, resetAt }
function loginRateLimit(req, res, next) {
  const key = req.ip || "unknown";
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return next();
  }
  entry.count += 1;
  if (entry.count > 10) {
    return res
      .status(429)
      .json({ error: "Too many attempts. Please try again in a few minutes." });
  }
  next();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Gallery tiles shown on the public site (served from /public). */
const DEFAULT_GALLERY = [
  { title: "L-shaped modular kitchen", img: "/gallery-kitchen-1.jpg" },
  { title: "Sliding-door wardrobe", img: "/gallery-wardrobe.jpg" },
  { title: "PVC TV unit", img: "/gallery-tv-unit.jpg" },
  { title: "Under-stair storage", img: "/gallery-storage-1.jpg" },
  { title: "Decorative door & wall panelling", img: "/gallery-door-1.jpg" },
];

/** Products — seeded with the default services on first run. */
const DEFAULT_PRODUCTS = [
  {
    name: "Modular Kitchens",
    description:
      "L-shaped, straight or parallel kitchen layouts with soft-close hardware and moisture-resistant carcass.",
    price: 14999,
    priceNote: "onwards",
    order: 1,
  },
  {
    name: "PVC Wardrobes & Storage",
    description:
      "Waterproof, termite-resistant wardrobes, lofts and utility cabinets built to your exact wall.",
    price: 8999,
    priceNote: "onwards",
    order: 2,
  },
  {
    name: "PVC TV Units & Consoles",
    description:
      "Wall-mounted TV units and consoles finished to match your existing interiors.",
    price: 5999,
    priceNote: "onwards",
    order: 3,
  },
  {
    name: "Custom Furniture & Decor",
    description:
      "Study tables, bathroom vanities and bespoke pieces, made to measure in your choice of finish.",
    price: 4999,
    priceNote: "onwards",
    order: 4,
  },
];

async function ensureSeeded() {
  const [{ count }] = await q(`SELECT count(*)::int AS count FROM products`);
  if (Number(count) === 0) {
    for (const p of DEFAULT_PRODUCTS) {
      await q(
        `INSERT INTO products (name, description, price, price_note, "order", updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [p.name, p.description, p.price, p.priceNote, p.order, Date.now()],
      );
    }
    console.log("[seed] Inserted default services/rates");
  }

  // Seed the gallery with the site's default photos the first time the
  // database is empty — otherwise the admin panel shows no images even
  // though the public site displays its built-in photos.
  const [{ count: imageCount }] = await q(
    `SELECT count(*)::int AS count FROM gallery_images`,
  );
  if (Number(imageCount) === 0) {
    const now = Date.now();
    let order = now;
    for (const tile of DEFAULT_GALLERY) {
      await q(
        `INSERT INTO gallery_images (title, url, "order", created_at)
         VALUES ($1, $2, $3, $4)`,
        [tile.title, tile.img, order, now],
      );
      order -= 1;
    }
    console.log("[seed] Inserted default gallery images");
  }
}

const PRODUCT_SELECT = `
  SELECT id AS "_id", name, description, price,
         price_note AS "priceNote", "order" AS "order",
         updated_at AS "updatedAt"
  FROM products
`;

app.get(
  "/api/products",
  wrap(async (_req, res) => {
    const products = await q(`${PRODUCT_SELECT} ORDER BY "order" ASC`);
    res.json(products);
  }),
);

/** Gallery — admin-added images, newest first. */
app.get(
  "/api/gallery",
  wrap(async (req, res) => {
    const images = await q(
      `SELECT id, title, file_id, url FROM gallery_images ORDER BY "order" DESC`,
    );
    res.json(
      images.map((image) => ({
        _id: image.id,
        title: image.title,
        url: image.url || imageFileUrl(req, image.file_id),
      })),
    );
  }),
);

/** Reviews — approved only, newest first. */
app.get(
  "/api/reviews",
  wrap(async (_req, res) => {
    const reviews = await q(
      `SELECT id AS "_id", name, rating, text, status, created_at AS "createdAt"
       FROM reviews WHERE status = 'approved' ORDER BY created_at DESC`,
    );
    res.json(reviews);
  }),
);

app.post(
  "/api/reviews",
  wrap(async (req, res) => {
    const name = String(req.body?.name ?? "").trim();
    const text = String(req.body?.text ?? "").trim();
    const rating = Math.round(Number(req.body?.rating));

    if (name.length < 2) throw new HttpError(400, "Please add your name.");
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new HttpError(400, "Please choose a rating from 1 to 5.");
    }
    if (text.length < 5) {
      throw new HttpError(400, "Please write a short review.");
    }

    const rows = await q(
      `INSERT INTO reviews (name, rating, text, status, created_at)
       VALUES ($1, $2, $3, 'pending', $4)
       RETURNING id`,
      [name.slice(0, 80), rating, text.slice(0, 1000), Date.now()],
    );
    res.status(201).json({ _id: rows[0].id });
  }),
);

/** Enquiries — submitted from the contact form. */
app.post(
  "/api/enquiries",
  wrap(async (req, res) => {
    const name = String(req.body?.name ?? "").trim();
    const phone = String(req.body?.phone ?? "").trim();
    const email = String(req.body?.email ?? "").trim();
    const requirement = String(req.body?.requirement ?? "").trim();
    const location = String(req.body?.location ?? "").trim();
    const message = String(req.body?.message ?? "").trim();

    if (name.length < 2) {
      throw new HttpError(400, "Please enter your name.");
    }
    // Exactly 10 digits — with or without spaces/+91 prefix.
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      throw new HttpError(400, "Please enter a 10-digit mobile number.");
    }
    if (message.length < 5) {
      throw new HttpError(400, "Please tell us a little about what you need.");
    }

    const rows = await q(
      `INSERT INTO enquiries (name, phone, email, requirement, location, message, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'new', $7)
       RETURNING id`,
      [
        name.slice(0, 120),
        phoneDigits,
        email ? email.slice(0, 160) : null,
        requirement ? requirement.slice(0, 80) : null,
        location ? location.slice(0, 160) : null,
        message.slice(0, 2000),
        Date.now(),
      ],
    );
    res.status(201).json({ _id: rows[0].id });
  }),
);

// ---------------------------------------------------------------------------
// Image download (stored in the database)
// ---------------------------------------------------------------------------
app.get(
  "/api/images/:fileId",
  wrap(async (req, res) => {
    const { fileId } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(fileId)) {
      throw new HttpError(404, "Not found");
    }
    const files = await q(
      `SELECT content_type, data FROM uploads WHERE id = $1`,
      [fileId],
    );
    const file = files[0];
    if (!file) throw new HttpError(404, "Not found");

    const data = Buffer.from(file.data);
    res.setHeader("Content-Type", file.content_type || "application/octet-stream");
    res.setHeader("Content-Length", data.length);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.end(data);
  }),
);

// ---------------------------------------------------------------------------
// Admin API
// ---------------------------------------------------------------------------
app.post(
  "/api/admin/login",
  loginRateLimit,
  wrap(async (req, res) => {
    const username = String(req.body?.username ?? "").trim();
    const password = String(req.body?.password ?? "");
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      throw new HttpError(401, "Incorrect username or password.");
    }
    const token = crypto.randomBytes(24).toString("hex");
    await q(`DELETE FROM admin_sessions WHERE expires_at <= $1`, [Date.now()]);
    await q(
      `INSERT INTO admin_sessions (token, created_at, expires_at) VALUES ($1, $2, $3)`,
      [token, Date.now(), Date.now() + SESSION_MS],
    );
    res.json({ token });
  }),
);

app.post(
  "/api/admin/logout",
  wrap(async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (token) {
      await q(`DELETE FROM admin_sessions WHERE token = $1`, [token]);
    }
    res.json({ ok: true });
  }),
);

app.get(
  "/api/admin/stats",
  wrap(async (req, res) => {
    await requireAdmin(req);
    const one = async (sqlText) =>
      Number((await q(sqlText))[0].count);
    const [images, products, pendingReviews, approvedReviews, newEnquiries] =
      await Promise.all([
        one(`SELECT count(*)::int AS count FROM gallery_images`),
        one(`SELECT count(*)::int AS count FROM products`),
        one(`SELECT count(*)::int AS count FROM reviews WHERE status = 'pending'`),
        one(`SELECT count(*)::int AS count FROM reviews WHERE status = 'approved'`),
        one(`SELECT count(*)::int AS count FROM enquiries WHERE status = 'new'`),
      ]);
    res.json({ images, products, pendingReviews, approvedReviews, newEnquiries });
  }),
);

function requireAdminWrap() {
  return wrap(async (req, _res, next) => {
    await requireAdmin(req);
    next();
  });
}

/** Add a gallery image by URL (talkntea-style — no upload needed). */
app.post(
  "/api/admin/image-links",
  requireAdminWrap(),
  wrap(async (req, res) => {
    const url = String(req.body?.url ?? "").trim();
    const title = String(req.body?.title ?? "").trim().slice(0, 120) || "Our work";
    if (!/^https?:\/\/.{2,}/i.test(url)) {
      throw new HttpError(400, "Enter a valid image URL (https://…).");
    }
    const rows = await q(
      `INSERT INTO gallery_images (title, url, "order", created_at)
       VALUES ($1, $2, $3, $4) RETURNING id, title, url`,
      [title, url, Date.now(), Date.now()],
    );
    const image = rows[0];
    res.status(201).json({ _id: image.id, title: image.title, url: image.url });
  }),
);

/** Upload an image: multipart/form-data with fields `file` and `title`. */
app.post(
  "/api/admin/images",
  requireAdminWrap(),
  upload.single("file"),
  wrap(async (req, res) => {
    if (!req.file) throw new HttpError(400, "Please choose an image file.");
    const title = String(req.body?.title ?? "").trim().slice(0, 120) || "Our work";

    const fileId = crypto.randomUUID();
    await q(
      `INSERT INTO uploads (id, name, content_type, data, created_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [fileId, req.file.originalname, req.file.mimetype, req.file.buffer, Date.now()],
    );
    const rows = await q(
      `INSERT INTO gallery_images (title, file_id, "order", created_at)
       VALUES ($1, $2, $3, $4) RETURNING id, title`,
      [title, fileId, Date.now(), Date.now()],
    );
    const image = rows[0];
    res.status(201).json({
      _id: image.id,
      title: image.title,
      url: imageFileUrl(req, fileId),
    });
  }),
);

app.delete(
  "/api/admin/images/:id",
  requireAdminWrap(),
  wrap(async (req, res) => {
    const { id } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, "Not found");
    const images = await q(
      `SELECT id, file_id FROM gallery_images WHERE id = $1`,
      [id],
    );
    const image = images[0];
    if (!image) throw new HttpError(404, "Not found");

    if (image.file_id) {
      await q(`DELETE FROM uploads WHERE id = $1`, [image.file_id]);
    }
    await q(`DELETE FROM gallery_images WHERE id = $1`, [id]);
    res.json({ ok: true });
  }),
);

app.patch(
  "/api/admin/products/:id",
  requireAdminWrap(),
  wrap(async (req, res) => {
    const { id } = req.params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(404, "Not found");
    const name = String(req.body?.name ?? "").trim();
    const description = String(req.body?.description ?? "").trim();
    const price = Math.round(Number(req.body?.price));

    if (!name) throw new HttpError(400, "Enter a valid name.");
    if (!Number.isFinite(price) || price < 0) {
      throw new HttpError(400, "Enter a valid price.");
    }

    const updated = await q(
      `UPDATE products SET name = $2, description = $3, price = $4, updated_at = $5
       WHERE id = $1
       RETURNING id AS "_id", name, description, price,
                 price_note AS "priceNote", "order" AS "order",
                 updated_at AS "updatedAt"`,
      [id, name.slice(0, 120) || "Service", description ? description.slice(0, 400) : null, price, Date.now()],
    );
    if (!updated[0]) throw new HttpError(404, "Not found");
    res.json(updated[0]);
  }),
);

app.patch(
  "/api/admin/reviews/:id",
  requireAdminWrap(),
  wrap(async (req, res) => {
    const { id } = req.params;
    const status = String(req.body?.status);
    if (!["pending", "approved"].includes(status)) {
      throw new HttpError(400, "Invalid status.");
    }
    const rows = await q(
      `UPDATE reviews SET status = $2 WHERE id = $1
       RETURNING id AS "_id", name, rating, text, status, created_at AS "createdAt"`,
      [id, status],
    );
    if (!rows[0]) throw new HttpError(404, "Not found");
    res.json(rows[0]);
  }),
);

app.delete(
  "/api/admin/reviews/:id",
  requireAdminWrap(),
  wrap(async (req, res) => {
    const { id } = req.params;
    const rows = await q(`DELETE FROM reviews WHERE id = $1 RETURNING id`, [id]);
    if (!rows[0]) throw new HttpError(404, "Not found");
    res.json({ ok: true });
  }),
);

app.get(
  "/api/admin/reviews",
  wrap(async (req, res) => {
    await requireAdmin(req);
    const reviews = await q(
      `SELECT id AS "_id", name, rating, text, status, created_at AS "createdAt"
       FROM reviews ORDER BY created_at DESC`,
    );
    res.json(reviews);
  }),
);

app.get(
  "/api/admin/enquiries",
  wrap(async (req, res) => {
    await requireAdmin(req);
    const enquiries = await q(
      `SELECT id AS "_id", name, phone, email, requirement, location, message, status,
              created_at AS "createdAt"
       FROM enquiries ORDER BY created_at DESC`,
    );
    res.json(enquiries);
  }),
);

app.patch(
  "/api/admin/enquiries/:id",
  requireAdminWrap(),
  wrap(async (req, res) => {
    const { id } = req.params;
    const status = String(req.body?.status);
    if (!["new", "handled"].includes(status)) {
      throw new HttpError(400, "Invalid status.");
    }
    const rows = await q(
      `UPDATE enquiries SET status = $2 WHERE id = $1
       RETURNING id AS "_id", name, phone, email, requirement, location, message, status,
                 created_at AS "createdAt"`,
      [id, status],
    );
    if (!rows[0]) throw new HttpError(404, "Not found");
    res.json(rows[0]);
  }),
);

app.delete(
  "/api/admin/enquiries/:id",
  requireAdminWrap(),
  wrap(async (req, res) => {
    const { id } = req.params;
    const rows = await q(`DELETE FROM enquiries WHERE id = $1 RETURNING id`, [id]);
    if (!rows[0]) throw new HttpError(404, "Not found");
    res.json({ ok: true });
  }),
);

// ---------------------------------------------------------------------------
// Health + static SPA serving (for production)
// ---------------------------------------------------------------------------
app.get("/api/health", (_req, res) => res.json({ ok: true }));

const distPath = path.join(__dirname, "..", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback (Express 5 requires a RegExp instead of the old "*").
  app.get(/^\/.*/, (req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "Not found" });
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
app.use((err, _req, res, _next) => {
  if (err instanceof HttpError || (err?.status >= 400 && err?.status < 600)) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Images must be under 8 MB." });
  }
  if (err?.exposeMessage) {
    // Database init failure — surface the cause so hosting problems are
    // diagnosable from the API response.
    return res.status(500).json({ error: err.message });
  }
  console.error("[api] Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

// ---------------------------------------------------------------------------
// Export the app. Serverless hosts (Vercel — see api/index.js) call it per
// request; server/index.js is the CLI launcher that connects and listens.
// ---------------------------------------------------------------------------
export default app;
export { connectDb, closeDb };
