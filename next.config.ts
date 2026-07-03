import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PGlite ships WASM that must be loaded from node_modules at runtime,
  // not bundled; pg is native-friendly and safest left external too.
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
};

export default nextConfig;
