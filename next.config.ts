import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets CI or a local check build without touching the dev server's `.next` folder.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
