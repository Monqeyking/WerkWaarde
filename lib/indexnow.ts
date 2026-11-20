/**
 * Helpers for scripts/indexnow.mjs, which tells Bing and the other IndexNow engines
 * which pages changed after a deploy. Pure functions, so they can be tested.
 */
import { createHash } from "node:crypto";

/** All <loc> URLs of a sitemap. */
export function sitemapUrls(xml: string): string[] {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((match) => match[1]);
}

/** The exported HTML file for a URL: "/" -> index.html, "/bruto-netto" -> bruto-netto.html. */
export function htmlFileFor(url: string): string {
  const path = new URL(url).pathname.replace(/\/+$/, "");
  return path === "" ? "index.html" : `${path.slice(1)}.html`;
}

/**
 * Hash of what a visitor reads on this page: the <main> content without the site-wide
 * header and footer, scripts, styles and build file names. A new footer link is not a
 * change of the page itself.
 */
export function contentHash(html: string): string {
  const main = html.match(/<main[\s\S]*<\/main>/)?.[0] ?? html;
  const text = main
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<footer[\s\S]*?<\/footer>/g, "")
    .replace(/<nav[\s\S]*?<\/nav>/g, "")
    .replace(/\/_next\/[^"'\s)]+/g, "")
    .replace(/\s+/g, " ");
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

/** URLs whose content hash differs from the previous run (all of them the first time). */
export function changedUrls(hashes: Record<string, string>, previous: Record<string, string>): string[] {
  return Object.keys(hashes).filter((url) => previous[url] !== hashes[url]);
}

/** Whether a file name is an IndexNow key file: 32 hex characters + .txt. */
export const isKeyFileName = (name: string) => /^[a-f0-9]{32}\.txt$/.test(name);
