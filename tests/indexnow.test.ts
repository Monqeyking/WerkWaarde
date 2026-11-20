import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { changedUrls, contentHash, htmlFileFor, isKeyFileName, sitemapUrls } from "../lib/indexnow.ts";

test("sitemap URLs and the exported file for each", () => {
  const xml = `<urlset><url><loc>https://nettoplaatje.nl</loc></url><url><loc>
    https://nettoplaatje.nl/bruto-netto/3500-per-maand</loc><lastmod>2026-11-16</lastmod></url></urlset>`;
  assert.deepEqual(sitemapUrls(xml), ["https://nettoplaatje.nl", "https://nettoplaatje.nl/bruto-netto/3500-per-maand"]);
  assert.equal(htmlFileFor("https://nettoplaatje.nl"), "index.html");
  assert.equal(htmlFileFor("https://nettoplaatje.nl/"), "index.html");
  assert.equal(htmlFileFor("https://nettoplaatje.nl/over"), "over.html");
  assert.equal(htmlFileFor("https://nettoplaatje.nl/bruto-netto/3500-per-maand"), "bruto-netto/3500-per-maand.html");
});

test("content hash ignores scripts and build file names, not the text", () => {
  const page = (text: string, build: string) =>
    `<html><head><script src="/_next/static/chunks/${build}.js"></script></head><body><main><h1>${text}</h1><script>self.__next_f.push(["${build}"])</script><img src="/_next/static/media/${build}.png"></main></body></html>`;
  assert.equal(contentHash(page("€ 2.906 netto", "abc123")), contentHash(page("€ 2.906 netto", "zz9988")));
  assert.notEqual(contentHash(page("€ 2.906 netto", "abc123")), contentHash(page("€ 2.910 netto", "abc123")));
});

test("only changed pages are submitted, all of them the first time", () => {
  const hashes = { "https://x.nl": "a", "https://x.nl/over": "b", "https://x.nl/nieuw": "c" };
  assert.deepEqual(changedUrls(hashes, {}), Object.keys(hashes));
  assert.deepEqual(changedUrls(hashes, { "https://x.nl": "a", "https://x.nl/over": "old" }), ["https://x.nl/over", "https://x.nl/nieuw"]);
});

test("exactly one key file in public/, containing its own key", () => {
  const keys = readdirSync("public").filter(isKeyFileName);
  assert.equal(keys.length, 1);
  assert.equal(readFileSync(`public/${keys[0]}`, "utf8").trim(), keys[0].slice(0, -4));
});
