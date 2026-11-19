import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "./site";

/** The share image from app/opengraph-image.tsx, exported to /opengraph-image. */
export const OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME}: wat levert een nieuwe baan je écht op?` };

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** Google shows about 60 characters of a title; longer titles drop the " | Nettoplaatje" suffix. */
const TITLE_SUFFIX = ` | ${SITE_NAME}`;
const MAX_TITLE = 60;

type PageMeta = {
  /** Path from the site root, e.g. "/bijtelling". Used for canonical and og:url. */
  path: string;
  /** Page title without the site suffix. Leave out on the home page to use the site default. */
  title?: string;
  description?: string;
  /** Title and description for link previews, when they should differ from the search snippet. */
  socialTitle?: string;
  socialDescription?: string;
  article?: { published: string; modified: string };
};

/**
 * Metadata for one page. Next.js replaces the layout's openGraph object as a
 * whole when a page sets its own, so every page sets the full object here,
 * including the share image and og:url.
 */
export function pageMetadata({ path, title, description, socialTitle, socialDescription, article }: PageMeta): Metadata {
  const ogTitle = socialTitle ?? title ?? `${SITE_NAME}: ${SITE_TAGLINE.toLowerCase()}`;
  const ogDescription = socialDescription ?? description ?? SITE_DESCRIPTION;
  const fitsSuffix = title !== undefined && title.length + TITLE_SUFFIX.length <= MAX_TITLE;
  return {
    ...(title !== undefined && { title: fitsSuffix ? title : { absolute: title } }),
    ...(description !== undefined && { description }),
    alternates: { canonical: path },
    openGraph: {
      locale: "nl_NL",
      siteName: SITE_NAME,
      url: path,
      title: ogTitle,
      description: ogDescription,
      images: [OG_IMAGE],
      ...(article
        ? { type: "article", publishedTime: article.published, modifiedTime: article.modified }
        : { type: "website" }),
    },
    twitter: { card: "summary_large_image", title: ogTitle, description: ogDescription, images: [OG_IMAGE.url] },
  };
}

/** Site-wide Organization and WebSite, rendered once per page by the root layout. */
export const SITE_JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": ORGANIZATION_ID, name: SITE_NAME, url: SITE_URL },
    { "@type": "WebSite", "@id": WEBSITE_ID, url: SITE_URL, name: SITE_NAME, description: SITE_DESCRIPTION, inLanguage: "nl-NL", publisher: { "@id": ORGANIZATION_ID } },
  ],
};

/** BreadcrumbList from the home page down to this page. Pass [name, path] pairs below "Start". */
export function breadcrumbList(trail: ReadonlyArray<readonly [name: string, path: string]>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [["Start", "/"] as const, ...trail].map(([name, path], index) => ({
      "@type": "ListItem", position: index + 1, name, item: `${SITE_URL}${path === "/" ? "" : path}`,
    })),
  };
}

/** A complete JSON-LD document with only a breadcrumb trail. */
export function breadcrumbJsonLd(trail: ReadonlyArray<readonly [name: string, path: string]>) {
  return { "@context": "https://schema.org", ...breadcrumbList(trail) };
}
