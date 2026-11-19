"use client";

import { usePathname } from "next/navigation";

/** Pages shown inside other sites' iframes: no ads and no third-party scripts there. */
export const isEmbedPath = (pathname: string | null) => pathname?.startsWith("/embed/") ?? false;

/**
 * AdSense account tag and loader for every page except the embeds. React hoists
 * the async script into <head>, also in the static HTML.
 */
export default function AdSenseHead({ publisherId }: { publisherId: string }) {
  if (isEmbedPath(usePathname())) return null;
  return <>
    <meta name="google-adsense-account" content={publisherId} />
    <script async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`} crossOrigin="anonymous" />
  </>;
}
