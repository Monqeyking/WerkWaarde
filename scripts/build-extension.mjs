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
import { crc32, deflateRawSync, deflateSync } from "node:zlib";

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

// --- Icons: the three bars of the logo on a dark rounded square (64-unit canvas, like app/icon.svg).
const SHAPES = [
  { x: 0, y: 0, w: 64, h: 64, r: 16, color: [0x17, 0x2d, 0x42] },
  { x: 12, y: 40, w: 9, h: 12, r: 2.5, color: [0x5c, 0x7a, 0x92] },
  { x: 27.5, y: 30, w: 9, h: 22, r: 2.5, color: [0x8f, 0xd9, 0xcc] },
  { x: 43, y: 16, w: 9, h: 36, r: 2.5, color: [0x12, 0x97, 0x83] },
];

function inside(shape, px, py) {
  const { x, y, w, h, r } = shape;
  if (px < x || py < y || px > x + w || py > y + h) return false;
  const cx = Math.min(Math.max(px, x + r), x + w - r);
  const cy = Math.min(Math.max(py, y + r), y + h - r);
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
}

function iconPng(size) {
  const samples = 4;
  const rows = [];
  for (let row = 0; row < size; row++) {
    const line = Buffer.alloc(1 + size * 4); // filter byte 0, then RGBA
    for (let col = 0; col < size; col++) {
      let red = 0, green = 0, blue = 0, alpha = 0;
      for (let sy = 0; sy < samples; sy++) for (let sx = 0; sx < samples; sx++) {
        const px = (col + (sx + 0.5) / samples) * 64 / size;
        const py = (row + (sy + 0.5) / samples) * 64 / size;
        const hit = SHAPES.findLast((shape) => inside(shape, px, py));
        if (hit) { red += hit.color[0]; green += hit.color[1]; blue += hit.color[2]; alpha += 1; }
      }
      const n = samples * samples;
      const offset = 1 + col * 4;
      if (alpha) { line[offset] = red / alpha; line[offset + 1] = green / alpha; line[offset + 2] = blue / alpha; }
      line[offset + 3] = Math.round(alpha / n * 255);
    }
    rows.push(line);
  }
  const chunk = (type, data) => {
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
    return Buffer.concat([length, body, crc]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4);
  header[8] = 8; header[9] = 6; // 8-bit RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header), chunk("IDAT", deflateSync(Buffer.concat(rows))), chunk("IEND", Buffer.alloc(0)),
  ]);
}

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
