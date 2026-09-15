/**
 * CLI launcher — connects to MongoDB and serves the API + built SPA on one
 * port (local dev and self-hosting, including Render).
 *
 * Serverless hosts import server/app.js directly instead (see api/index.js).
 */

import app, { connectDb } from "./app.js";

const PORT = Number(process.env.PORT || 3001);

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[api] S K Furniture API listening on http://localhost:${PORT}`);
    });
  })
  .catch(() => {
    console.error(
      "[db] Start MongoDB locally (e.g. `mongod`) or set MONGODB_URI to a MongoDB Atlas connection string in .env.local, then restart the API.",
    );
    process.exit(1);
  });
