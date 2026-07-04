/**
 * Canonical site URL for sitemap/robots/OG tags. Set SITE_URL in production
 * (e.g. https://clarencewilliams.com). Falls back to Replit's domain
 * variables so a fresh Replit deploy is correct with no configuration.
 */
export function getBaseUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const replit = process.env.REPLIT_DOMAINS?.split(",")[0] ?? process.env.REPLIT_DEV_DOMAIN;
  if (replit) return `https://${replit}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
