"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function AdSenseSlot() {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  const slotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT;

  useEffect(() => {
    if (!publisherId || !slotId) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense can be blocked by a browser extension or consent settings.
    }
  }, [publisherId, slotId]);

  if (!publisherId || !slotId) return null;

  return <ins className="adsbygoogle ad-slot ad-slot-live"
    style={{ display: "block" }}
    data-ad-client={publisherId}
    data-ad-slot={slotId}
    data-ad-format="auto"
    data-full-width-responsive="true"
    aria-label="Advertentie" />;
}
