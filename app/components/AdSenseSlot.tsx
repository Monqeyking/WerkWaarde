"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const slots = {
  home: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME,
  work: process.env.NEXT_PUBLIC_ADSENSE_SLOT_WORK,
  result: process.env.NEXT_PUBLIC_ADSENSE_SLOT_RESULT,
} as const;

type Placement = keyof typeof slots;

export default function AdSenseSlot({ placement }: { placement: Placement }) {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID;
  const slotId = slots[placement];

  useEffect(() => {
    if (!publisherId || !slotId) return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense can be blocked by a browser extension or consent settings.
    }
  }, [publisherId, slotId]);

  if (!publisherId || !slotId) {
    return <aside className="ad-slot" aria-label="Advertentieruimte"><span>Advertentieruimte</span><p>Relevante partners kunnen hier later zichtbaar worden.</p></aside>;
  }

  return <ins className="adsbygoogle ad-slot ad-slot-live"
    style={{ display: "block" }}
    data-ad-client={publisherId}
    data-ad-slot={slotId}
    data-ad-format="auto"
    data-full-width-responsive="true"
    aria-label="Advertentie" />;
}
