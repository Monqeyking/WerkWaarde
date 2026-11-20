/**
 * Real "last changed" dates for every page in the sitemap. After each build,
 * scripts/content-dates.mjs compares the text of each page with content-dates.json
 * (committed) and moves a page's date to today only when its text changed. The
 * sitemap then gets an accurate <lastmod> for every URL, as Bing and Google ask.
 */

export type ContentDates = Record<string, { hash: string; changed: string }>;

/** Today's date in the Netherlands as YYYY-MM-DD. */
export function amsterdamDate(date = new Date()): string {
  return date.toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
}

/** The <lastmod> per URL that the sitemap already has (from real dates in the data). */
export function sitemapLastmods(xml: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [, block] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = block.match(/<loc>\s*([^<\s]+)\s*<\/loc>/)?.[1];
    const lastmod = block.match(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/)?.[1];
    if (loc && lastmod) result[loc] = lastmod.slice(0, 10);
  }
  return result;
}

/**
 * New dates: unchanged pages keep their date, changed pages get today. A page seen for
 * the first time takes the date from the data (an article's "updated") or else today.
 * Pages that left the sitemap are dropped.
 */
export function updateContentDates(previous: ContentDates, hashes: Record<string, string>, today: string, seed: Record<string, string> = {}): ContentDates {
  const next: ContentDates = {};
  for (const [url, hash] of Object.entries(hashes)) {
    const before = previous[url];
    if (before && before.hash === hash) next[url] = before;
    else next[url] = { hash, changed: before ? today : (seed[url] ?? today) };
  }
  return next;
}

/** The sitemap with exactly one <lastmod> per URL, taken from the dates. */
export function applyLastmods(xml: string, dates: ContentDates): string {
  return xml.replace(/<url>([\s\S]*?)<\/url>/g, (whole, block: string) => {
    const loc = block.match(/<loc>\s*([^<\s]+)\s*<\/loc>/)?.[1];
    const date = loc ? dates[loc]?.changed : undefined;
    if (!loc || !date) return whole;
    const withoutLastmod = block.replace(/\s*<lastmod>[\s\S]*?<\/lastmod>/, "");
    return `<url>${withoutLastmod.replace(/(<\/loc>)/, `$1\n<lastmod>${date}</lastmod>`)}</url>`;
  });
}
