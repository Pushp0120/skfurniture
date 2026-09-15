/**
 * Vercel serverless entry — handles every /api/* request with the Express
 * app (server/app.js). The built SPA in dist/ is served by Vercel's CDN as
 * static files (see vercel.json: buildCommand + outputDirectory + rewrites).
 */

import app from "../server/app.js";

export default app;
