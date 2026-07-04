import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

/**
 * Absolute site origin for SEO artifacts baked into the static build
 * (robots.txt Sitemap directive, Open Graph URLs). SITE_URL wins; a fresh
 * Replit deploy falls back to its *.replit.app domain. Returns null when
 * neither is available (e.g. local dev build), in which case the
 * URL-dependent artifacts are skipped.
 */
function getSiteOrigin(): string | null {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const replit = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  if (replit) return `https://${replit}`;
  return null;
}

/**
 * Writes robots.txt into the build output with an absolute Sitemap URL.
 * The sitemap is served by the API at /api/sitemap.xml (the proxy only
 * routes /api/* to Express); declaring it in robots.txt makes that
 * location valid for Google/Bing. Without a known origin, the static
 * public/robots.txt copy (no Sitemap line) is left as-is.
 */
function robotsTxtPlugin(): Plugin {
  return {
    name: "generate-robots-txt",
    apply: "build",
    closeBundle() {
      const origin = getSiteOrigin();
      if (!origin) return;
      const outDir = path.resolve(import.meta.dirname, "dist/public");
      const robots = `User-agent: *\nAllow: /\n\nSitemap: ${origin}/api/sitemap.xml\n`;
      fs.writeFileSync(path.join(outDir, "robots.txt"), robots);
    },
  };
}

/**
 * Injects absolute-URL Open Graph tags into the built index.html. Link
 * crawlers (LinkedIn, Facebook, Slack) don't execute JS, so these static
 * tags are what shared links actually render. og:image must be an
 * absolute URL; opengraph.jpg (1280×720) ships in public/. Skipped when
 * no site origin is known at build time.
 */
function ogTagsPlugin(): Plugin {
  return {
    name: "inject-og-tags",
    apply: "build",
    transformIndexHtml(html) {
      const origin = getSiteOrigin();
      if (!origin) return html;
      const tags = [
        `<meta property="og:url" content="${origin}/" />`,
        `<meta property="og:image" content="${origin}/opengraph.jpg" />`,
        `<meta property="og:image:width" content="1280" />`,
        `<meta property="og:image:height" content="720" />`,
        `<meta property="og:image:alt" content="Clarence Williams — Business &amp; Management Consultant" />`,
        `<meta name="twitter:image" content="${origin}/opengraph.jpg" />`,
      ]
        .map((t) => `    ${t}`)
        .join("\n");
      return html.replace('<meta name="twitter:card"', `${tags}\n    <meta name="twitter:card"`);
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    robotsTxtPlugin(),
    ogTagsPlugin(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
