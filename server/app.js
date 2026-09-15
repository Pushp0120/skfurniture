/**
 * S K Furniture — API app (Express + MongoDB)
 *
 * The Express app is exported for serverless hosting (Vercel, see
 * api/index.js); server/index.js is the CLI launcher that connects to
 * MongoDB and listens on a port for local/self-hosted runs.
 *
 *   - Public:  products, gallery, reviews, members, enquiries
 *   - Admin:   login/logout sessions, stats, gallery upload/delete,
 *              product/rates editing, review moderation, enquiry handling
 *
 * Images are stored in MongoDB via GridFS (no external storage needed).
 *
 * Env vars (see .env.example):
 *   MONGODB_URI      — MongoDB connection string (default: mongodb://127.0.0.1:27017/skfurniture)
 *   PORT             — API port (default: 3001)
 *   PUBLIC_API_BASE  — public base URL for image links in production (optional)
 *   ADMIN_USERNAME   — admin login username (default: admin)
 *   ADMIN_PASSWORD   — admin login password (default: Admin@123)
 */

import "dotenv/config";

import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import cors from "cors";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT || 3001);
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/skfurniture";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Admin@123";
const SESSION_MS = 1000 * 60 * 60 * 12; // 12 hours, same as before

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------
const app = express();
app.set("trust proxy", true); // correct req.ip/protocol behind Vercel/Render proxies
app.use(cors()); // open CORS: the SPA may be deployed on another origin
app.use(express.json({ limit: "1mb" }));

// Lazy MongoDB connection + first-run seeding. On serverless hosts (Vercel)
// the module loads per cold start; connecting on the first request keeps boot
// fast and reuses one pooled connection across warm invocations.
let dbReadyPromise;
function connectDb() {
  if (!dbReadyPromise) {
    dbReadyPromise = (async () => {
      await mongoose.connect(MONGODB_URI);
      await ensureSeeded();
      console.log("[db] Connected to MongoDB");
    })().catch((err) => {
      dbReadyPromise = undefined; // allow a retry on the next request
      console.error("[db] Could not connect to MongoDB:", err.message);
      throw err;
    });
  }
  return dbReadyPromise;
}
app.use((_req, _res, next) => {
  connectDb().then(() => next(), next);
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
// Mongoose models
// ---------------------------------------------------------------------------
const enquiryStatuses = ["new", "handled"];
const reviewStatuses = ["pending", "approved"];

const EnquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    requirement: { type: String },
    message: { type: String, required: true },
    status: { type: String, enum: enquiryStatuses, default: "new" },
    createdAt: { type: Number, default: () => Date.now() },
  },
  { versionKey: false },
);
EnquirySchema.index({ createdAt: -1 });

const AdminSessionSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    createdAt: { type: Number, default: () => Date.now() },
    expiresAt: { type: Number, required: true },
  },
  { versionKey: false },
);
AdminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    priceNote: { type: String, default: "onwards" },
    order: { type: Number, required: true },
    updatedAt: { type: Number, default: () => Date.now() },
  },
  { versionKey: false },
);
ProductSchema.index({ order: 1 });

const GalleryImageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
    order: { type: Number, required: true },
    createdAt: { type: Number, default: () => Date.now() },
  },
  { versionKey: false },
);
GalleryImageSchema.index({ order: -1 });

const ReviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    text: { type: String, required: true },
    status: { type: String, enum: reviewStatuses, default: "pending" },
    createdAt: { type: Number, default: () => Date.now() },
  },
  { versionKey: false },
);
ReviewSchema.index({ createdAt: -1 });

const MemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    createdAt: { type: Number, default: () => Date.now() },
  },
  { versionKey: false },
);
MemberSchema.index({ email: 1 }, { unique: true });
MemberSchema.index({ createdAt: -1 });

const Enquiry = mongoose.model("Enquiry", EnquirySchema);
const AdminSession = mongoose.model("AdminSession", AdminSessionSchema);
const Product = mongoose.model("Product", ProductSchema);
const GalleryImage = mongoose.model("GalleryImage", GalleryImageSchema);
const Review = mongoose.model("Review", ReviewSchema);
const Member = mongoose.model("Member", MemberSchema);

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
  const session = await AdminSession.findOne({ token }).lean();
  if (!session || session.expiresAt <= Date.now()) {
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
  const count = await Product.estimatedDocumentCount();
  if (count === 0) {
    await Product.insertMany(
      DEFAULT_PRODUCTS.map((p) => ({ ...p, updatedAt: Date.now() })),
    );
    console.log("[seed] Inserted default services/rates");
  }
}

app.get(
  "/api/products",
  wrap(async (req, res) => {
    const products = await Product.find({}).sort({ order: 1 }).lean();
    res.json(products);
  }),
);

/** Gallery — admin-uploaded images, newest first. */
app.get(
  "/api/gallery",
  wrap(async (req, res) => {
    const images = await GalleryImage.find({}).sort({ order: -1 }).lean();
    res.json(
      images.map((image) => ({
        _id: String(image._id),
        title: image.title,
        url: imageFileUrl(req, image.fileId),
      })),
    );
  }),
);

/** Reviews — approved only, newest first. */
app.get(
  "/api/reviews",
  wrap(async (req, res) => {
    const reviews = await Review.find({ status: "approved" })
      .sort({ createdAt: -1 })
      .lean();
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

    const review = await Review.create({
      name: name.slice(0, 80),
      rating,
      text: text.slice(0, 1000),
      status: "pending",
      createdAt: Date.now(),
    });
    res.status(201).json({ _id: String(review._id) });
  }),
);

/** Members — registered customers. */
app.post(
  "/api/members",
  wrap(async (req, res) => {
    const name = String(req.body?.name ?? "").trim();
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const phone = String(req.body?.phone ?? "").trim();

    if (name.length < 2) {
      throw new HttpError(400, "Please enter your name.");
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new HttpError(400, "Please enter a valid email address.");
    }

    const existing = await Member.findOne({ email }).lean();
    if (existing) {
      return res.json({
        id: String(existing._id),
        alreadyRegistered: true,
      });
    }

    const member = await Member.create({
      name: name.slice(0, 80),
      email: email.slice(0, 160),
      phone: phone ? phone.slice(0, 40) : undefined,
      createdAt: Date.now(),
    });
    res.status(201).json({ id: String(member._id), alreadyRegistered: false });
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
    const message = String(req.body?.message ?? "").trim();

    if (name.length < 2) {
      throw new HttpError(400, "Please enter your name.");
    }
    if (phone.replace(/\D/g, "").length < 7) {
      throw new HttpError(400, "Please enter a valid phone number.");
    }
    if (message.length < 5) {
      throw new HttpError(400, "Please tell us a little about what you need.");
    }

    const enquiry = await Enquiry.create({
      name: name.slice(0, 120),
      phone: phone.slice(0, 40),
      email: email ? email.slice(0, 160) : undefined,
      requirement: requirement ? requirement.slice(0, 80) : undefined,
      message: message.slice(0, 2000),
      status: "new",
      createdAt: Date.now(),
    });
    res.status(201).json({ _id: String(enquiry._id) });
  }),
);

// ---------------------------------------------------------------------------
// Image download (GridFS)
// ---------------------------------------------------------------------------
app.get(
  "/api/images/:fileId",
  wrap(async (req, res) => {
    const { fileId } = req.params;
    if (!mongoose.isValidObjectId(fileId)) {
      throw new HttpError(404, "Not found");
    }
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "uploads",
    });
    const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
    const file = files[0];
    if (!file) throw new HttpError(404, "Not found");

    res.setHeader("Content-Type", file.contentType || "application/octet-stream");
    res.setHeader("Content-Length", file.length);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    const stream = bucket.openDownloadStream(file._id);
    stream.on("error", () => res.status(404).end());
    stream.pipe(res);
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
    await AdminSession.create({
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_MS,
    });
    res.json({ token });
  }),
);

app.post(
  "/api/admin/logout",
  wrap(async (req, res) => {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    if (token) {
      await AdminSession.deleteOne({ token });
    }
    res.json({ ok: true });
  }),
);

app.get(
  "/api/admin/stats",
  wrap(async (req, res) => {
    await requireAdmin(req);
    const [images, products, reviews, enquiries, members] = await Promise.all([
      GalleryImage.countDocuments(),
      Product.countDocuments(),
      Review.find({}).select("status").lean(),
      Enquiry.find({}).select("status").lean(),
      Member.countDocuments(),
    ]);
    res.json({
      images,
      products,
      pendingReviews: reviews.filter((r) => r.status === "pending").length,
      approvedReviews: reviews.filter((r) => r.status === "approved").length,
      newEnquiries: enquiries.filter((e) => e.status === "new").length,
      members,
    });
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

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "uploads",
    });
    const fileId = await new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
      });
      uploadStream.end(req.file.buffer, (err) =>
        err ? reject(err) : resolve(uploadStream.id),
      );
    });

    const image = await GalleryImage.create({
      title,
      fileId,
      order: Date.now(),
      createdAt: Date.now(),
    });
    res.status(201).json({
      _id: String(image._id),
      title: image.title,
      url: imageFileUrl(req, fileId),
    });
  }),
);

function requireAdminWrap() {
  return wrap(async (req, _res, next) => {
    await requireAdmin(req);
    next();
  });
}

app.delete(
  "/api/admin/images/:id",
  requireAdminWrap(),
  wrap(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new HttpError(404, "Not found");
    const image = await GalleryImage.findById(id);
    if (!image) throw new HttpError(404, "Not found");

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "uploads",
    });
    try {
      await bucket.delete(image.fileId);
    } catch {
      // ignore missing file
    }
    await image.deleteOne();
    res.json({ ok: true });
  }),
);

app.patch(
  "/api/admin/products/:id",
  requireAdminWrap(),
  wrap(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new HttpError(404, "Not found");
    const name = String(req.body?.name ?? "").trim();
    const description = String(req.body?.description ?? "").trim();
    const price = Math.round(Number(req.body?.price));

    if (!name) throw new HttpError(400, "Enter a valid name.");
    if (!Number.isFinite(price) || price < 0) {
      throw new HttpError(400, "Enter a valid price.");
    }

    const product = await Product.findByIdAndUpdate(
      id,
      {
        name: name.slice(0, 120) || "Service",
        description: description ? description.slice(0, 400) : undefined,
        price,
        updatedAt: Date.now(),
      },
      { new: true },
    );
    if (!product) throw new HttpError(404, "Not found");
    res.json(product);
  }),
);

app.patch(
  "/api/admin/reviews/:id",
  requireAdminWrap(),
  wrap(async (req, res) => {
    const { id } = req.params;
    const status = String(req.body?.status);
    if (!reviewStatuses.includes(status)) {
      throw new HttpError(400, "Invalid status.");
    }
    const review = await Review.findByIdAndUpdate(id, { status }, { new: true });
    if (!review) throw new HttpError(404, "Not found");
    res.json(review);
  }),
);

app.delete(
  "/api/admin/reviews/:id",
  requireAdminWrap(),
  wrap(async (req, res) => {
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id);
    if (!review) throw new HttpError(404, "Not found");
    res.json({ ok: true });
  }),
);

app.get(
  "/api/admin/reviews",
  wrap(async (req, res) => {
    await requireAdmin(req);
    const reviews = await Review.find({}).sort({ createdAt: -1 }).lean();
    res.json(reviews);
  }),
);

app.get(
  "/api/admin/enquiries",
  wrap(async (req, res) => {
    await requireAdmin(req);
    const enquiries = await Enquiry.find({}).sort({ createdAt: -1 }).lean();
    res.json(enquiries);
  }),
);

app.patch(
  "/api/admin/enquiries/:id",
  requireAdminWrap(),
  wrap(async (req, res) => {
    const { id } = req.params;
    const status = String(req.body?.status);
    if (!enquiryStatuses.includes(status)) {
      throw new HttpError(400, "Invalid status.");
    }
    const enquiry = await Enquiry.findByIdAndUpdate(id, { status }, { new: true });
    if (!enquiry) throw new HttpError(404, "Not found");
    res.json(enquiry);
  }),
);

app.delete(
  "/api/admin/enquiries/:id",
  requireAdminWrap(),
  wrap(async (req, res) => {
    const { id } = req.params;
    const enquiry = await Enquiry.findByIdAndDelete(id);
    if (!enquiry) throw new HttpError(404, "Not found");
    res.json({ ok: true });
  }),
);

app.get(
  "/api/admin/members",
  wrap(async (req, res) => {
    await requireAdmin(req);
    const members = await Member.find({}).sort({ createdAt: -1 }).lean();
    res.json(members);
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
  if (err?.name === "ValidationError" || err?.name === "CastError") {
    return res.status(400).json({ error: "Invalid request." });
  }
  console.error("[api] Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

// ---------------------------------------------------------------------------
// Export the app. Serverless hosts (Vercel — see api/index.js) call it per
// request; server/index.js is the CLI launcher that connects and listens.
// ---------------------------------------------------------------------------
export default app;
export { connectDb };
