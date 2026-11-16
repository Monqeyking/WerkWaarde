import type { NextConfig } from "next";

/**
 * Static export: every page is built to plain HTML in out/ and hosted on
 * Cloudflare Pages (free, commercial use allowed). The calculators run in the
 * browser, so no server is needed. Security headers live in public/_headers,
 * because Next.js headers() does not apply to a static export.
 */
const nextConfig: NextConfig = {
  output: "export",
};

export default nextConfig;
