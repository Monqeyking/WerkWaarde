/**
 * Advertising config: each ad box is filled either by Google AdSense or by a
 * house ad. House ads promote Virtrust's services and need no cookies or consent.
 */

export type HouseAd = {
  id: string;
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
    id: "hseq-volgende-stap",
    advertiser: "Virtrust",
    logo: "/ads/virtrust.svg",
    title: "Toe aan een volgende stap in veiligheid?",
    body: "Virtrust geeft advies, bemiddelt en detacheert specialisten in veiligheid, kwaliteit en milieu.",
    cta: "Meer informatie",
    path: "/",
  },
  {
    id: "veiligheidskunde",
    advertiser: "Virtrust",
    logo: "/ads/virtrust.svg",
    title: "Een veiligheidskundige nodig?",
    body: "MVK- en HVK-veiligheidskundigen die veiligheid concreet en meetbaar maken, van werkvloer tot directie.",
    cta: "Bekijk veiligheidskunde",
    path: "/dienstverlening/veiligheidskunde",
  },
  {
    id: "procesveiligheid",
    advertiser: "Virtrust",
    logo: "/ads/virtrust.svg",
    title: "Grip op risicovolle processen?",
    body: "HAZOP-, LOPA- en QRA-studies en audits die verder gaan dan vinkjes zetten.",
    cta: "Meer over procesveiligheid",
    path: "/dienstverlening/procesveiligheid",
  },
  {
    id: "adr-pgs",
    advertiser: "Virtrust",
    logo: "/ads/virtrust.svg",
    title: "Gevaarlijke stoffen goed geregeld?",
    body: "Advies over opslag, transport en beheer van gevaarlijke stoffen volgens ADR en PGS.",
    cta: "Bekijk ADR & PGS",
    path: "/dienstverlening/adr-pgs-solutions",
  },
  {
    id: "interim-projectinzet",
    advertiser: "Virtrust",
    logo: "/ads/virtrust.svg",
    title: "Tijdelijk extra HSEQ-capaciteit nodig?",
    body: "Direct inzetbare professionals die met ervaring en daadkracht een project versterken.",
    cta: "Bekijk interim-inzet",
    path: "/dienstverlening/interim-en-projectinzet",
  },
  {
    id: "projectmanagement",
    advertiser: "Virtrust",
    logo: "/ads/virtrust.svg",
    title: "Een project met veiligheidsrisico's?",
    body: "Projectmanagers die van vergunning tot oplevering grip houden op planning en veiligheid.",
    cta: "Meer over projectmanagement",
    path: "/dienstverlening/projectmanagement",
  },
  {
    id: "quickscan",
    advertiser: "Virtrust",
    logo: "/ads/virtrust.svg",
    title: "Voldoet de organisatie aan de regels?",
    body: "De Virtrust Quickscan geeft snel inzicht in compliance en werkgeversverantwoordelijkheid.",
    cta: "Meer over de Quickscan",
    path: "/dienstverlening/virtrust-quickscan",
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
export function pickAd(config: AdConfig, options: { placement: string; exclude?: readonly string[]; random?: () => number }): AdChoice | null {
  const random = options.random ?? Math.random;
  const share = houseAdShare(config);
  const adsense = config.publisherId && config.slotId ? { kind: "adsense" as const, publisherId: config.publisherId, slotId: config.slotId } : null;

  if (share > 0 && (!adsense || random() * 100 < share)) {
    // Prefer ads not yet on the page, so two boxes don't repeat the same ad.
    const fresh = HOUSE_ADS.filter((ad) => !options.exclude?.includes(ad.id));
    const pool = fresh.length > 0 ? fresh : HOUSE_ADS;
    const ad = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
    return { kind: "house", ad, href: houseAdHref(ad, options.placement) };
  }
  return adsense;
}
