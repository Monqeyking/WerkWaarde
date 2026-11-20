/**
 * Builds the browser extension into extension/dist and packs it as a zip for
 * the Chrome Web Store (also accepted by Edge). Run: npm run build:extension
 *
 * The content script bundles the site's own calculation from lib/, so the
 * extension shows the same net amounts as nettoplaatje.nl. Icons are drawn
 * here from the same shapes as app/icon.svg, so no image tools are needed.
 */
import { build } from "esbuild";
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { crc32, deflateRawSync } from "node:zlib";
import { iconPng } from "./icon-png.mjs";

const root = new URL("../extension/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const dist = join(root, "dist");
const manifest = JSON.parse(readFileSync(join(root, "static", "manifest.json"), "utf8"));

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, "icons"), { recursive: true });

await build({
  entryPoints: [join(root, "src", "content.ts")],
  outfile: join(dist, "content.js"),
  bundle: true,
  format: "iife",
  target: "chrome110",
  minify: true,
  legalComments: "none",
  // lib/site.ts and lib/tax-years.ts read Next.js env vars; the extension uses the defaults.
  define: { "process.env": "{}" },
});

cpSync(join(root, "static"), dist, { recursive: true });

// --- Icons: the logo from scripts/icon-png.mjs.
for (const size of [16, 32, 48, 128]) writeFileSync(join(dist, "icons", `icon-${size}.png`), iconPng(size));

// --- Zip (deflate), the format the Chrome Web Store asks for.
function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

function zip(paths, base) {
  const local = [];
  const central = [];
  let offset = 0;
  for (const path of paths) {
    const name = Buffer.from(relative(base, path).split("\\").join("/"));
    const data = readFileSync(path);
    const packed = deflateRawSync(data);
    const crc = crc32(data);
    const head = Buffer.alloc(30);
    head.writeUInt32LE(0x04034b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(0x0800, 6); head.writeUInt16LE(8, 8);
    head.writeUInt16LE(0, 10); head.writeUInt16LE(0x21, 12); // fixed date: 1 Jan 1980
    head.writeUInt32LE(crc, 14); head.writeUInt32LE(packed.length, 18); head.writeUInt32LE(data.length, 22);
    head.writeUInt16LE(name.length, 26); head.writeUInt16LE(0, 28);
    local.push(head, name, packed);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0); entry.writeUInt16LE(20, 4); entry.writeUInt16LE(20, 6); entry.writeUInt16LE(0x0800, 8);
    entry.writeUInt16LE(8, 10); entry.writeUInt16LE(0, 12); entry.writeUInt16LE(0x21, 14);
    entry.writeUInt32LE(crc, 16); entry.writeUInt32LE(packed.length, 20); entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(name.length, 28); entry.writeUInt32LE(offset, 42);
    central.push(entry, name);
    offset += head.length + name.length + packed.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(paths.length, 8); end.writeUInt16LE(paths.length, 10);
  end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}

const zipPath = join(root, `nettoplaatje-extensie-${manifest.version}.zip`);
writeFileSync(zipPath, zip(files(dist), dist));
console.log(`extension: ${relative(process.cwd(), dist)} and ${relative(process.cwd(), zipPath)}`);
