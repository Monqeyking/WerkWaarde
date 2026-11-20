import assert from "node:assert/strict";
import test from "node:test";
import { amsterdamDate, applyLastmods, sitemapLastmods, updateContentDates } from "../lib/content-dates.ts";
import { contentHash } from "../lib/indexnow.ts";

const SITEMAP = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>https://x.nl/</loc>
</url>
<url>
<loc>https://x.nl/vragen/a</loc>
<lastmod>2026-11-16</lastmod>
</url>
</urlset>`;

test("dates move only when the text changes; new pages take the data date first", () => {
  const first = updateContentDates({}, { "https://x.nl/": "h1", "https://x.nl/vragen/a": "h2" }, "2026-11-20", sitemapLastmods(SITEMAP));
  assert.deepEqual(first, {
    "https://x.nl/": { hash: "h1", changed: "2026-11-20" },
    "https://x.nl/vragen/a": { hash: "h2", changed: "2026-11-16" },
  });
  const same = updateContentDates(first, { "https://x.nl/": "h1", "https://x.nl/vragen/a": "h2" }, "2026-12-01");
  assert.deepEqual(same, first, "a rebuild without changes keeps every date");
  const edited = updateContentDates(first, { "https://x.nl/": "h1", "https://x.nl/vragen/a": "h3" }, "2026-12-01");
  assert.equal(edited["https://x.nl/vragen/a"].changed, "2026-12-01");
  assert.equal(edited["https://x.nl/"].changed, "2026-11-20");
  assert.deepEqual(Object.keys(updateContentDates(first, { "https://x.nl/": "h1" }, "2026-12-01")), ["https://x.nl/"], "removed pages are dropped");
});

test("the sitemap gets exactly one lastmod per URL", () => {
  const xml = applyLastmods(SITEMAP, {
    "https://x.nl/": { hash: "h1", changed: "2026-11-20" },
    "https://x.nl/vragen/a": { hash: "h2", changed: "2026-12-01" },
  });
  assert.equal((xml.match(/<lastmod>/g) ?? []).length, 2);
  assert.deepEqual(sitemapLastmods(xml), { "https://x.nl/": "2026-11-20", "https://x.nl/vragen/a": "2026-12-01" });
  assert.match(xml, /<loc>https:\/\/x\.nl\/<\/loc>\n<lastmod>2026-11-20<\/lastmod>/);
});

test("header and footer changes do not count as a change of the page", () => {
  const page = (footer: string, text: string) =>
    `<main><nav class="topbar"><a href="/">Start</a></nav><h1>${text}</h1><footer><nav><a href="/x">${footer}</a></nav></footer></main>`;
  assert.equal(contentHash(page("Over", "€ 2.906")), contentHash(page("Over ons en meer", "€ 2.906")));
  assert.notEqual(contentHash(page("Over", "€ 2.906")), contentHash(page("Over", "€ 2.910")));
});

test("dates are in Dutch time", () => {
  assert.equal(amsterdamDate(new Date("2026-11-20T23:30:00Z")), "2026-11-21");
  assert.equal(amsterdamDate(new Date("2026-07-01T21:59:00Z")), "2026-07-01");
});
