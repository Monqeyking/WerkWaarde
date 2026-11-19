"use client";

import { useEffect, useState } from "react";
import { adsenseUnit, houseAdsEnabled, pickHouseAd, readAdConfig, type HouseAdChoice } from "../../lib/ads.ts";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const config = readAdConfig();
const adsense = adsenseUnit(config);
const houseAds = houseAdsEnabled(config);

/** House ads already shown on the current page, so a second box picks another one. */
let shownOnPage: { path: string; ids: string[] } = { path: "", ids: [] };

/** Which boxes an ad spot shows. Pages with one spot show both; pages with two split them. */
export type AdShow = "both" | "house" | "adsense";

function AdSenseBox({ publisherId, slotId }: { publisherId: string; slotId: string }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense can be blocked by a browser extension or consent settings.
    }
  }, []);
  return <aside className="ad-box shell" aria-label="Advertentie" data-ad-kind="adsense">
    <span className="ad-label">Advertentie</span>
    <ins className="adsbygoogle ad-unit"
      style={{ display: "block" }}
      data-ad-client={publisherId}
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true" />
  </aside>;
}

function HouseAdBox({ placement }: { placement: string }) {
  const [choice, setChoice] = useState<HouseAdChoice | null>(null);

  useEffect(() => {
    // Picking is random, so it must run on the client only (no hydration mismatch).
    const path = window.location.pathname;
    if (shownOnPage.path !== path) shownOnPage = { path, ids: [] };
    const next = pickHouseAd({ placement, exclude: shownOnPage.ids });
    shownOnPage.ids.push(next.ad.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChoice(next);
  }, [placement]);

  return <aside className="ad-box shell" aria-label="Advertentie" data-ad-kind="house">
    <span className="ad-label">Advertentie</span>
    {choice && <a className="house-ad" href={choice.href} target="_blank" rel="sponsored noopener">
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

/**
 * An ad spot: a Virtrust house ad and, when AdSense is configured, a separate
 * Google ad box. Place it between content sections, never next to inputs,
 * buttons or results. Each box reserves its height.
 */
export default function AdSlot({ placement, show = "both" }: { placement: string; show?: AdShow }) {
  const house = houseAds && show !== "adsense";
  const google = adsense && show !== "house" ? adsense : null;
  if (!house && !google) return null;
  return <>
    {house && <HouseAdBox placement={placement} />}
    {google && <AdSenseBox publisherId={google.publisherId} slotId={google.slotId} />}
  </>;
}
