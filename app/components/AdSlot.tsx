"use client";

import { useEffect, useState } from "react";
import { adsEnabled, pickAd, readAdConfig, type AdAudience, type AdChoice } from "../../lib/ads.ts";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const config = readAdConfig();

/** House ads already shown on the current page, so a second box picks another one. */
let shownOnPage: { path: string; ids: string[] } = { path: "", ids: [] };

function AdSenseUnit({ publisherId, slotId }: { publisherId: string; slotId: string }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense can be blocked by a browser extension or consent settings.
    }
  }, []);
  return <ins className="adsbygoogle ad-unit"
    style={{ display: "block" }}
    data-ad-client={publisherId}
    data-ad-slot={slotId}
    data-ad-format="auto"
    data-full-width-responsive="true" />;
}

/**
 * One labelled ad box. Place it between content sections, never next to
 * inputs, buttons or results. The choice is made after mount so server and
 * client render the same empty box first; the box reserves its height.
 */
export default function AdSlot({ placement, audience }: { placement: string; audience?: AdAudience }) {
  const [choice, setChoice] = useState<AdChoice | null>(null);

  useEffect(() => {
    // Picking is random, so it must run on the client only (no hydration mismatch).
    const path = window.location.pathname;
    if (shownOnPage.path !== path) shownOnPage = { path, ids: [] };
    const next = pickAd(config, { placement, audience, exclude: shownOnPage.ids });
    if (next?.kind === "house") shownOnPage.ids.push(next.ad.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChoice(next);
  }, [placement, audience]);

  if (!adsEnabled(config)) return null;

  return <aside className="ad-box shell" aria-label="Advertentie" data-ad-kind={choice?.kind}>
    <span className="ad-label">Advertentie</span>
    {choice?.kind === "adsense" && <AdSenseUnit publisherId={choice.publisherId} slotId={choice.slotId} />}
    {choice?.kind === "house" && <a className="house-ad" href={choice.href} target="_blank" rel="sponsored noopener">
      {/* Plain img: the site is a static export without the image optimizer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {choice.ad.logo && <img className="house-ad-logo" src={choice.ad.logo} alt={choice.ad.advertiser} width={82} height={28} />}
      <span className="house-ad-text">
        <strong>{choice.ad.title}</strong>
        <span>{choice.ad.body}</span>
        {!choice.ad.logo && <span className="house-ad-advertiser">{choice.ad.advertiser}</span>}
      </span>
      <span className="house-ad-cta">{choice.ad.cta} →</span>
    </a>}
  </aside>;
}
