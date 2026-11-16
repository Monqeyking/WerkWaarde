/**
 * Advertising config: every page shows one labelled ad box, filled either by
 * Google AdSense or by a house ad. House ads need no cookies or consent.
 */

export type AdAudience = "candidate" | "employer";

export type HouseAd = {
  id: string;
  audience: AdAudience;
  advertiser: string;
  /** Small advertiser logo under public/, shown left in the ad. Text fallback without it. */
  logo?: string;
  title: string;
  body: string;
  cta: string;
  /** Path on the advertiser's site, appended to HOUSE_AD_BASE_URL. */
  path: string;
};

export type AdChoice =
  | { kind: "adsense"; publisherId: string; slotId: string }
  | { kind: "house"; ad: HouseAd; href: string };

export const HOUSE_AD_BASE_URL = (process.env.NEXT_PUBLIC_HOUSE_AD_URL ?? "https://virtrust.nl").replace(/\/+$/, "");

/** Names of the advertisers in our own house ads, for the disclaimer and privacy policy. */
export function houseAdAdvertisers(): string[] {
  return [...new Set(HOUSE_ADS.map((ad) => ad.advertiser))];
}

export const HOUSE_ADS: readonly HouseAd[] = [
  {
    id: "hseq-vacatures",
    audience: "candidate",
    advertiser: "Virtrust",
    logo: "/ads/virtrust.svg",
    title: "Werk je in veiligheid, gezondheid of milieu?",
    body: "Bekijk vacatures en opdrachten voor HSEQ-professionals.",
    cta: "Bekijk vacatures",
    path: "/",
  },
  {
    id: "hseq-volgende-stap",
    audience: "candidate",
    advertiser: "Virtrust",
    logo: "/ads/virtrust.svg",
    title: "Toe aan een volgende stap in HSEQ?",
    body: "Virtrust bemiddelt en detacheert specialisten in veiligheid, kwaliteit en milieu.",
    cta: "Meer informatie",
    path: "/",
  },
  {
    id: "hseq-specialist-nodig",
    audience: "employer",
    advertiser: "Virtrust",
    logo: "/ads/virtrust.svg",
    title: "Tijdelijk een HSEQ-specialist nodig?",
    body: "Virtrust levert adviseurs voor veiligheid, gezondheid, kwaliteit en milieu.",
    cta: "Neem contact op",
    path: "/",
  },
];

export type AdConfig = {
  publisherId?: string;
  slotId?: string;
  /** Percentage (0–100) of ad boxes that show a house ad when AdSense is available. */
  houseShare?: string;
};

export function readAdConfig(): AdConfig {
  return {
    publisherId: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID,
    slotId: process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT,
    houseShare: process.env.NEXT_PUBLIC_HOUSE_AD_SHARE,
  };
}

/** Share of house ads in percent. Defaults to 50 with AdSense, 100 without; "0" turns house ads off. */
export function houseAdShare(config: AdConfig): number {
  const adsense = Boolean(config.publisherId && config.slotId);
  const parsed = Number.parseFloat(config.houseShare ?? "");
  if (!Number.isFinite(parsed)) return adsense ? 50 : 100;
  const share = Math.min(100, Math.max(0, parsed));
  // Without AdSense there is nothing else to show, so any non-zero share means "always".
  return adsense || share === 0 ? share : 100;
}

/** True when the ad box can show anything at all. */
export function adsEnabled(config: AdConfig): boolean {
  return Boolean(config.publisherId && config.slotId) || houseAdShare(config) > 0;
}

export function houseAdHref(ad: HouseAd, placement: string): string {
  const url = new URL(ad.path, `${HOUSE_AD_BASE_URL}/`);
  url.searchParams.set("utm_source", "nettoplaatje");
  url.searchParams.set("utm_medium", "house-ad");
  url.searchParams.set("utm_campaign", ad.id);
  url.searchParams.set("utm_content", placement);
  return url.toString();
}

/**
 * Pick what one ad box shows. `random` returns a number in [0, 1) and is
 * called at most twice: once for house-vs-AdSense, once for which house ad.
 */
export function pickAd(config: AdConfig, options: { placement: string; audience?: AdAudience; exclude?: readonly string[]; random?: () => number }): AdChoice | null {
  const random = options.random ?? Math.random;
  const share = houseAdShare(config);
  const adsense = config.publisherId && config.slotId ? { kind: "adsense" as const, publisherId: config.publisherId, slotId: config.slotId } : null;

  if (share > 0 && (!adsense || random() * 100 < share)) {
    const matching = HOUSE_ADS.filter((ad) => !options.audience || ad.audience === options.audience);
    // Prefer ads not yet on the page, so two boxes don't repeat the same ad.
    const fresh = matching.filter((ad) => !options.exclude?.includes(ad.id));
    const pool = fresh.length > 0 ? fresh : matching.length > 0 ? matching : HOUSE_ADS;
    const ad = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
    return { kind: "house", ad, href: houseAdHref(ad, options.placement) };
  }
  return adsense;
}
