/**
 * Preview launcher.
 *
 * Runs the full site (API + built SPA) against an embedded Postgres (PGlite)
 * stored in server/data/pg — zero setup, no database install needed.
 *
 *   node server/preview-server.mjs
 *
 * Notes:
 * - Data persists in server/data/pg while the folder exists; delete it for a
 *   factory reset.
 * - The four default services/rates are auto-seeded on first start.
 * - Admin login uses ADMIN_USERNAME / ADMIN_PASSWORD (defaults: admin / Admin@123).
 */

// Preview always listens on 3001. (Guard against an inherited PORT=0 / empty.)
if (!process.env.PORT || process.env.PORT === "0") {
  process.env.PORT = "3001";
}

delete process.env.DATABASE_URL; // force the embedded database for previews

// Imported after the env vars are set so server/index.js picks them up.
await import("./index.js");

const shutdown = async () => {
  const { closeDb } = await import("./app.js");
  try {
    await closeDb();
  } catch {
    // ignore
  }
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
