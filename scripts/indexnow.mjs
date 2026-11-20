/**
 * Tells Bing and the other IndexNow engines (Yandex, Seznam, Naver…) which pages
 * changed since the last deploy. Google does not take part; it uses the sitemap.
 * Runs at the end of `npm run deploy`, after the key file is live.
 *
 *   node scripts/indexnow.mjs            submit changed pages
 *   node scripts/indexnow.mjs --dry-run  only show what would be submitted
 *   node scripts/indexnow.mjs --all      submit every page in the sitemap
 *
 * "Changed" compares the visible text of each page (the <main> element without scripts)
 * with the previous successful run, stored in .indexnow-state.json (gitignored).
 * A failed ping never fails the deploy.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { changedUrls, contentHash, htmlFileFor, isKeyFileName, sitemapUrls } from "../lib/indexnow.ts";

const ENDPOINT = "https://api.indexnow.org/indexnow";
const root = fileURLToPath(new URL("../", import.meta.url));
const STATE_FILE = `${root}.indexnow-state.json`;

/** The key is the name of the 32-hex .txt file in public/ that contains itself. */
function findKey() {
  const name = readdirSync(`${root}public`).find(isKeyFileName);
  if (!name) throw new Error("no key file (public/<32 hex>.txt) found");
  const key = name.slice(0, -4);
  if (readFileSync(`${root}public/${name}`, "utf8").trim() !== key) throw new Error(`public/${name} does not contain its own key`);
  return key;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const all = process.argv.includes("--all");
  const urls = sitemapUrls(readFileSync(`${root}out/sitemap.xml`, "utf8"));
  if (urls.length === 0) throw new Error("out/sitemap.xml has no URLs; run the build first");

  const hashes = {};
  for (const url of urls) {
    const file = `${root}out/${htmlFileFor(url)}`;
    hashes[url] = existsSync(file) ? contentHash(readFileSync(file, "utf8")) : "missing";
  }
  const previous = !all && existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, "utf8")) : {};
  const changed = changedUrls(hashes, previous);
  if (changed.length === 0) return console.log("indexnow: no changed pages, nothing to submit.");

  const key = findKey();
  const host = new URL(urls[0]).host;
  const body = { host, key, keyLocation: `https://${host}/${key}.txt`, urlList: changed.slice(0, 10_000) };

  if (dryRun) {
    console.log(`indexnow (dry run): would submit ${changed.length} of ${urls.length} pages for ${host}:`);
    for (const url of changed.slice(0, 20)) console.log(`  ${url}`);
    if (changed.length > 20) console.log(`  … and ${changed.length - 20} more`);
    return;
  }

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  // 200 = accepted, 202 = accepted while the key is still being checked (first time).
  if (response.status === 200 || response.status === 202) {
    writeFileSync(STATE_FILE, JSON.stringify(hashes, null, 2));
    console.log(`indexnow: submitted ${changed.length} of ${urls.length} pages (HTTP ${response.status}).`);
  } else {
    const detail = await response.text().catch(() => "");
    console.warn(`indexnow: not accepted (HTTP ${response.status}) ${detail}`.trim());
    console.warn("indexnow: the deploy itself is fine; these pages are submitted again on the next deploy.");
  }
}

main().catch((error) => console.warn(`indexnow: ${error.message} (the deploy itself is fine)`));
