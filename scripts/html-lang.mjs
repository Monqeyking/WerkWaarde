/**
 * Runs after `next build` (npm "postbuild").
 *
 * The root layout renders <html lang="nl"> for every page, because a root layout
 * cannot see the path in a static export. Set lang="en" in the exported English
 * pages under /en, so browsers, screen readers and search engines get the right
 * language. app/components/HtmlLang.tsx does the same during client navigation.
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { langForPath, pathForHtmlFile, setHtmlLang } from "../lib/lang.ts";

const outDir = new URL("../out/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
if (!existsSync(outDir)) process.exit(0);

let changed = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const file = join(dir, name);
    if (statSync(file).isDirectory()) walk(file);
    else if (name.endsWith(".html")) fix(file);
  }
}

function fix(file) {
  const lang = langForPath(pathForHtmlFile(relative(outDir, file)));
  if (lang === "nl") return;
  const html = readFileSync(file, "utf8");
  const next = setHtmlLang(html, lang);
  if (next === html) return;
  writeFileSync(file, next);
  changed += 1;
}

walk(outDir);
console.log(`html-lang: ${changed} pages set to lang="en"`);
