/** Site-wide name and URL. Change the brand here, not in individual pages. */
export const SITE_NAME = "Nettoplaatje";
export const SITE_TAGLINE = "Wat houd je écht over van je werk?";
export const SITE_DESCRIPTION = "Gratis en onafhankelijk: vergelijk je huidige en nieuwe baan. Netto salaris, bonus, pensioen, leaseauto of mobiliteitsbudget, reiskosten en reistijd.";

/**
 * Public URL, used for canonical links, sitemap and robots.txt.
 * Set NEXT_PUBLIC_SITE_URL in Vercel once the nettoplaatje.nl domain is live.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://werk-waarde-khaki.vercel.app").replace(/\/+$/, "");
