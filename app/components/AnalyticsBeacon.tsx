"use client";

import { usePathname } from "next/navigation";
import { isEmbedPath } from "./AdSenseHead";

/**
 * Cloudflare Web Analytics: counts page views without cookies or local storage.
 * Not on the embeds, which promise other sites no third-party code.
 */
export default function AnalyticsBeacon({ token }: { token: string }) {
  if (isEmbedPath(usePathname())) return null;
  // Cloudflare's own snippet uses type="module", which loads deferred anyway; the explicit
  // defer keeps the Next.js lint rule against blocking scripts satisfied.
  return <script type="module" defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={JSON.stringify({ token })} />;
}
