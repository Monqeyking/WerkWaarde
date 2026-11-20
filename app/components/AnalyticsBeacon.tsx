"use client";

import { usePathname } from "next/navigation";
import { isEmbedPath } from "./AdSenseHead";

/**
 * Cloudflare Web Analytics: counts page views without cookies or local storage.
 * Not on the embeds, which promise other sites no third-party code.
 */
export default function AnalyticsBeacon({ token }: { token: string }) {
  if (isEmbedPath(usePathname())) return null;
  // Same attributes as Cloudflare's own snippet; module scripts load deferred.
  return <script type="module" src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon={JSON.stringify({ token })} />;
}
