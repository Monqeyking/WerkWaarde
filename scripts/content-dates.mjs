/**
 * Postbuild: gives every URL in out/sitemap.xml a <lastmod> with the date its visible
 * text last changed. The dates and text hashes live in content-dates.json, which is
 * committed: commit it together with the change that moved a date.
 * See lib/content-dates.ts for the rules.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { amsterdamDate, applyLastmods, sitemapLastmods, updateContentDates } from "../lib/content-dates.ts";
import { contentHash, htmlFileFor, sitemapUrls } from "../lib/indexnow.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const SITEMAP = `${root}out/sitemap.xml`;
const DATES = `${root}content-dates.json`;

const xml = readFileSync(SITEMAP, "utf8");
const hashes = {};
for (const url of sitemapUrls(xml)) {
  const file = `${root}out/${htmlFileFor(url)}`;
  if (!existsSync(file)) throw new Error(`content-dates: no exported page for ${url} (${file})`);
  hashes[url] = contentHash(readFileSync(file, "utf8"));
}

const previous = existsSync(DATES) ? JSON.parse(readFileSync(DATES, "utf8")) : {};
const dates = updateContentDates(previous, hashes, amsterdamDate(), sitemapLastmods(xml));
const moved = Object.keys(dates).filter((url) => previous[url]?.changed !== dates[url].changed);

writeFileSync(DATES, `${JSON.stringify(dates, null, 2)}\n`);
writeFileSync(SITEMAP, applyLastmods(xml, dates));
console.log(`content-dates: lastmod for ${Object.keys(dates).length} URLs, ${moved.length} with a new date.`);
