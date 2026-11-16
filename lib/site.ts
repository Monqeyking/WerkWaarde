/** Site-wide name and URL. Change the brand here, not in individual pages. */
export const SITE_NAME = "Nettoplaatje";
export const SITE_TAGLINE = "Wat houd je écht over van je werk?";
export const SITE_DESCRIPTION = "Gratis en zonder account: vergelijk je huidige en nieuwe baan. Netto salaris, bonus, pensioen, leaseauto of mobiliteitsbudget, reiskosten en reistijd.";

/**
 * Public URL, used for canonical links, sitemap and robots.txt.
 * Set NEXT_PUBLIC_SITE_URL in Vercel once the nettoplaatje.nl domain is live.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://werk-waarde-khaki.vercel.app").replace(/\/+$/, "");

/**
 * The company behind Nettoplaatje, shown in the footer, on the contact page and
 * in the privacy policy. Required by law (art. 3:15d BW, AVG art. 13) before
 * going live with ads. Leave a field empty until it is known; empty fields are
 * not shown.
 */
export const OPERATOR = {
  name: "Monqifyx", // use the exact name as registered with the KvK
  address: "", // street, postcode and town
  kvk: "42199903", // Chamber of Commerce number
  website: "", // e.g. "https://…"; linked only on the contact page
};

/** Public contact address (NEXT_PUBLIC_CONTACT_EMAIL). Empty until set. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? "";
