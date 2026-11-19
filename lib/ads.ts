/**
 * Advertising config. An ad spot shows a house ad box and, when configured, a
 * separate Google AdSense box. House ads promote Virtrust's services and need no
 * cookies or consent.
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

export type HouseAdChoice = { ad: HouseAd; href: string };

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
  /** "0" turns the house-ad box off; anything else (or empty) keeps it on. */
  houseAds?: string;
};

export function readAdConfig(): AdConfig {
  return {
    publisherId: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID,
    slotId: process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT,
    houseAds: process.env.NEXT_PUBLIC_HOUSE_ADS,
  };
}

/** The AdSense unit, or null while AdSense is not configured. */
export function adsenseUnit(config: AdConfig): { publisherId: string; slotId: string } | null {
  return config.publisherId && config.slotId ? { publisherId: config.publisherId, slotId: config.slotId } : null;
}

/** House ads are on by default; NEXT_PUBLIC_HOUSE_ADS=0 turns them off. */
export function houseAdsEnabled(config: AdConfig): boolean {
  return (config.houseAds ?? "").trim() !== "0";
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
 * Pick which house ad a box shows. `random` returns a number in [0, 1).
 * Ads already on the page are skipped while others are left.
 */
export function pickHouseAd(options: { placement: string; exclude?: readonly string[]; random?: () => number }): HouseAdChoice {
  const random = options.random ?? Math.random;
  const fresh = HOUSE_ADS.filter((ad) => !options.exclude?.includes(ad.id));
  const pool = fresh.length > 0 ? fresh : HOUSE_ADS;
  const ad = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
  return { ad, href: houseAdHref(ad, options.placement) };
}
