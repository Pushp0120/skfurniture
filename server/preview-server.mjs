/**
 * Preview / no-MongoDB launcher.
 *
 * Runs the full site (API + built SPA) against a throwaway in-memory
 * MongoDB, so the app can be tried without installing MongoDB.
 *
 *   node server/preview-server.mjs
 *
 * Notes:
 * - Data is ephemeral: it resets whenever this process restarts.
 * - The four default services/rates are auto-seeded on first start.
 * - Admin login uses ADMIN_USERNAME / ADMIN_PASSWORD (defaults: admin / Admin@123).
 */

import { MongoMemoryServer } from "mongodb-memory-server";

// Preview always listens on 3001. (Guard against a inherited PORT=0 / empty.)
if (!process.env.PORT || process.env.PORT === "0") {
  process.env.PORT = "3001";
}

const memoryServer = await MongoMemoryServer.create();
process.env.MONGODB_URI = memoryServer.getUri("skfurniture_preview");

console.log("[preview] Using in-memory MongoDB:", process.env.MONGODB_URI);

// Imported after the env vars are set so server/index.js picks them up.
await import("./index.js");

const shutdown = async () => {
  try {
    await memoryServer.stop();
  } catch {
    // ignore
  }
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
