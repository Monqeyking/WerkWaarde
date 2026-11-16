/**
 * Runs after `next build` (npm "postbuild").
 *
 * The static export writes the client router's prefetch files as folders,
 * for example out/totaal/__next.totaal/__PAGE__.txt, while the browser asks
 * for out/totaal/__next.totaal.__PAGE__.txt. A Node server maps one to the
 * other; static hosting such as Cloudflare Pages does not. Copy each file to
 * the flat name so prefetching works and the console stays free of 404s.
 */
import { copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const outDir = new URL("../out/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
if (!existsSync(outDir)) process.exit(0);

let copied = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else flatten(path);
  }
}

function flatten(file) {
  const parts = relative(outDir, file).split(sep);
  const start = parts.findIndex((part) => part.startsWith("__next."));
  if (start === -1 || start === parts.length - 1) return; // not inside a segment folder
  const flatName = parts.slice(start).join(".");
  const target = join(outDir, ...parts.slice(0, start), flatName);
  if (existsSync(target)) return;
  copyFileSync(file, target);
  copied += 1;
}

walk(outDir);
console.log(`flatten-segments: ${copied} prefetch files copied to flat names`);
