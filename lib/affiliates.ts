/**
 * Affiliate ads: a paid link to an outside advertiser, via an affiliate network
 * (Daisycon). Kept apart from the Virtrust house ads in ads.ts: these never
 * replace or rotate with them, and unlike house ads their links are tracked.
 *
 * An offer stays switched off until it has an advertiser, an https tracking
 * link and a start date. Switched off, it renders nothing and changes no page.
 * The legal pages mention affiliate links only while an offer is active, and
 * their "last updated" date moves to the start date then.
 */

export type AffiliateOffer = {
  id: string;
  /** Advertiser name as shown in the ad, e.g. "Justlease". Empty = off. */
  advertiser: string;
  /** Tracking link from the network's dashboard, used as given. Empty = off. */
  href: string;
  /** Date the offer goes live (YYYY-MM-DD); the legal pages take it as their update date. Empty = off. */
  since: string;
  title: string;
  body: string;
  cta: string;
  /** What we get paid for, shown under the ad. */
  disclosure: string;
  /** AdSlot placements that show this offer. Chosen by page topic, never by the calculation result. */
  placements: readonly string[];
};

/** The network the tracking links run through, named on the privacy and cookie pages. */
export const AFFILIATE_NETWORK = "Daisycon";

export const AFFILIATE_OFFERS: readonly AffiliateOffer[] = [
  {
    id: "private-lease",
    advertiser: "",
    href: "",
    since: "",
    title: "Zelf een auto regelen?",
    body: "Met private lease betaal je een vast bedrag per maand voor een auto. Vergelijk het met wat een eigen auto je kost.",
    cta: "Bekijk private lease",
    disclosure: "Nettoplaatje krijgt een vergoeding als je via deze link een offerte aanvraagt of een lease afsluit.",
    // Pages for people who pick a mobility budget or drive their own car. Not /bijtelling:
    // a lease car from the employer is the opposite choice.
    placements: ["mobiliteit", "kilometervergoeding", "vragen-leaseauto-of-mobiliteitsbudget", "vragen-kilometervergoeding-onbelast"],
  },
];

/** An offer is live only when advertiser, an https link and a valid start date are all filled in. */
export function isActiveOffer(offer: AffiliateOffer): boolean {
  return offer.advertiser.trim() !== "" && /^https:\/\/\S+$/.test(offer.href.trim()) && isIsoDate(offer.since);
}

export function activeOffers(offers: readonly AffiliateOffer[] = AFFILIATE_OFFERS): AffiliateOffer[] {
  return offers.filter(isActiveOffer);
}

/** The live offer for an ad placement, or null. */
export function affiliateOfferFor(placement: string, offers: readonly AffiliateOffer[] = AFFILIATE_OFFERS): AffiliateOffer | null {
  return activeOffers(offers).find((offer) => offer.placements.includes(placement)) ?? null;
}

/** Names of the live affiliate advertisers, once each, for the legal pages. */
export function affiliateAdvertisers(offers: readonly AffiliateOffer[] = AFFILIATE_OFFERS): string[] {
  return [...new Set(activeOffers(offers).map((offer) => offer.advertiser.trim()))];
}

const dateFormat = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/**
 * "Last updated" text for a legal page: its own date, or the start date of the
 * newest live affiliate offer when that is later.
 */
export function legalUpdatedText(pageDate: string, offers: readonly AffiliateOffer[] = AFFILIATE_OFFERS): string {
  const latest = activeOffers(offers).map((offer) => offer.since).reduce((max, date) => (date > max ? date : max), pageDate);
  return dateFormat.format(new Date(`${latest}T00:00:00Z`));
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}
