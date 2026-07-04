import express, { type Express } from "express";
import fs from "node:fs";
import path from "node:path";
import { logger } from "./lib/logger";
import { injectHeadMeta, resolveHeadMeta } from "./lib/cw/head-meta";

/**
 * Serves the built public SPA and rewrites index.html's head per route so
 * social link-preview crawlers get the right card for a deep link (see
 * lib/cw/head-meta.ts). This is the production HTML-serving layer: point the
 * deployment at the api-server (which then serves /api, the static assets,
 * and the meta-injected HTML from one origin). No-op when the client build
 * isn't present, so API-only runs and local dev (Vite serves the SPA) are
 * unaffected.
 */
export function setupClientServing(app: Express): void {
  const clientDir = process.env.CLIENT_DIR
    ? path.resolve(process.env.CLIENT_DIR)
    : path.resolve(__dirname, "../../cwsite/dist/public");
  const indexPath = path.join(clientDir, "index.html");

  if (!fs.existsSync(indexPath)) {
    logger.info(
      { clientDir },
      "Client build not found; running API-only (no SPA serving / meta injection)",
    );
    return;
  }

  // Read the built index.html once; it already carries the default meta
  // (baked in at build time) that per-route injection overrides or keeps.
  const baseHtml = fs.readFileSync(indexPath, "utf8");

  // Hashed asset filenames are immutable, so they can cache for a year.
  // index:false leaves HTML to the meta-injecting handler below.
  app.use(express.static(clientDir, { index: false, maxAge: "1y" }));

  app.use(async (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    // Unmatched /api/* requests: let the API router's 404 stand.
    if (req.path.startsWith("/api/")) return next();
    // A file-looking path that static didn't serve is a genuine miss —
    // 404 rather than handing back SPA HTML with a 200.
    if (path.extname(req.path)) {
      res.status(404).send("Not found");
      return;
    }

    let html = baseHtml;
    try {
      const meta = await resolveHeadMeta(req.path);
      if (meta) html = injectHeadMeta(baseHtml, meta);
    } catch (err) {
      logger.warn({ err, path: req.path }, "Head meta injection failed; serving default HTML");
    }
    res.set("Content-Type", "text/html; charset=utf-8").send(html);
  });
}
