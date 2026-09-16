/**
 * CLI launcher — connects to Postgres and serves the API + built SPA on one
 * port (local dev and self-hosting, including Render).
 *
 * Set DATABASE_URL to a Postgres connection string (Neon works great); if
 * it is not set, an embedded Postgres (PGlite) is used automatically —
 * nothing to install or start.
 *
 * Serverless hosts import server/app.js directly instead (see api/index.js).
 */

import app, { connectDb } from "./app.js";

const PORT = Number(process.env.PORT || 3001);

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[api] S KITCHEN POINT API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(
      "[db] Could not start the API:",
      err?.message || err,
      "\n[db] Check the DATABASE_URL (Postgres connection string) in .env.local, then restart.",
    );
    process.exit(1);
  });
