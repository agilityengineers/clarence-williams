import type { Request, Response, NextFunction } from "express";

/**
 * 301-redirects any request whose Host is not the canonical host to the same
 * path + query on the canonical origin, so search engines index a single
 * domain (see SITE_URL) and ranking signals don't split across the multiple
 * domains pointed at this deployment.
 *
 * Active only when SITE_URL is set — i.e. production with a real canonical
 * domain. In local dev and Replit preview (where the origin falls back to a
 * *.replit.dev/app host) it's a no-op, so those keep working normally.
 *
 * Never redirects `/api` or `/api/*` (keeps the API and the `/api/healthz`
 * deploy health check reachable from any host) and only acts on GET/HEAD so
 * form posts and other methods are left untouched. `trust proxy` is set on
 * the app, so `req.headers.host` reflects the client's requested host.
 */
export function canonicalHostRedirect(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl) {
    next();
    return;
  }

  let canonicalOrigin: string;
  let canonicalHost: string;
  try {
    const url = new URL(siteUrl);
    canonicalOrigin = `${url.protocol}//${url.host}`;
    canonicalHost = url.host.toLowerCase();
  } catch {
    next();
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    next();
    return;
  }
  if (req.path === "/api" || req.path.startsWith("/api/")) {
    next();
    return;
  }

  const host = req.headers.host?.toLowerCase();
  if (!host || host === canonicalHost) {
    next();
    return;
  }

  res.redirect(301, `${canonicalOrigin}${req.originalUrl}`);
}
