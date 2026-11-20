/**
 * Draws the Nettoplaatje logo (the three bars of app/icon.svg on a dark square)
 * as a PNG of any size, with plain Node: no image tools needed.
 */
import { crc32, deflateSync } from "node:zlib";

const BARS = [
  { x: 12, y: 40, w: 9, h: 12, r: 2.5, color: [0x5c, 0x7a, 0x92] },
  { x: 27.5, y: 30, w: 9, h: 22, r: 2.5, color: [0x8f, 0xd9, 0xcc] },
  { x: 43, y: 16, w: 9, h: 36, r: 2.5, color: [0x12, 0x97, 0x83] },
];
const BACKGROUND = [0x17, 0x2d, 0x42];

function inside(shape, px, py) {
  const { x, y, w, h, r } = shape;
  if (px < x || py < y || px > x + w || py > y + h) return false;
  const cx = Math.min(Math.max(px, x + r), x + w - r);
  const cy = Math.min(Math.max(py, y + r), y + h - r);
  return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
}

/**
 * @param {number} size width and height in pixels
 * @param {{ rounded?: boolean }} [options] rounded corners like the favicon (default);
 *   false for a full square, which iOS and Android round themselves.
 */
export function iconPng(size, { rounded = true } = {}) {
  const shapes = [{ x: 0, y: 0, w: 64, h: 64, r: rounded ? 16 : 0, color: BACKGROUND }, ...BARS];
  const samples = 4;
  const rows = [];
  for (let row = 0; row < size; row++) {
    const line = Buffer.alloc(1 + size * 4); // filter byte 0, then RGBA
    for (let col = 0; col < size; col++) {
      let red = 0, green = 0, blue = 0, alpha = 0;
      for (let sy = 0; sy < samples; sy++) for (let sx = 0; sx < samples; sx++) {
        const px = (col + (sx + 0.5) / samples) * 64 / size;
        const py = (row + (sy + 0.5) / samples) * 64 / size;
        const hit = shapes.findLast((shape) => inside(shape, px, py));
        if (hit) { red += hit.color[0]; green += hit.color[1]; blue += hit.color[2]; alpha += 1; }
      }
      const offset = 1 + col * 4;
      if (alpha) { line[offset] = red / alpha; line[offset + 1] = green / alpha; line[offset + 2] = blue / alpha; }
      line[offset + 3] = Math.round(alpha / (samples * samples) * 255);
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
