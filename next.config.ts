import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships WASM that must be loaded from node_modules at runtime,
  // not bundled; pg is native-friendly and safest left external too.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  experimental: {
    serverActions: {
      // Admin image uploads go through a server action; allow up to the
      // 8 MB validation cap (plus multipart overhead).
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
