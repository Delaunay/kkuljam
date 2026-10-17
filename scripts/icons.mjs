// Draws the Kkuljam app icon and writes the PNG sizes the PWA needs. Pure Node,
// no image library:  npm run icons
// A cocoon shaped like a crescent moon hangs from a branch by a silk thread in
// the night sky (after "Hope for the Flowers"): sleep now, fly later.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const OUT = new URL('../public/', import.meta.url);

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = buf => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

function png(size, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const SKY_TOP = [30, 58, 138];
const SKY_BOTTOM = [15, 23, 42];
const COCOON = [253, 224, 120];
const SILK = [224, 182, 72];
const BRANCH = [120, 84, 52];
const LEAF = [96, 165, 98];
const THREAD = [226, 232, 240];
const STAR = [226, 232, 240];
const STARS = [[0.8, 0.33, 0.02], [0.86, 0.6, 0.015], [0.73, 0.84, 0.013], [0.18, 0.84, 0.012], [0.16, 0.42, 0.013]];

const inEllipse = (x, y, cx, cy, rx, ry, angle = 0) => {
  const dx = x - cx, dy = y - cy;
  const c = Math.cos(angle), s = Math.sin(angle);
  const u = (dx * c + dy * s) / rx, v = (-dx * s + dy * c) / ry;
  return u * u + v * v < 1;
};

// Branch: a slightly arched line across the top, thicker on the left.
const branchY = x => 0.15 + 0.06 * (x - 0.45) * (x - 0.45);
const branchHalf = x => 0.024 - 0.01 * x;

/** Colour at (u, v) in [0, 1]; `pad` shrinks the art for maskable icons (safe zone). */
function shade(u, v, pad) {
  let c = mix(SKY_TOP, SKY_BOTTOM, v);
  const x = 0.5 + (u - 0.5) / (1 - 2 * pad);
  const y = 0.5 + (v - 0.5) / (1 - 2 * pad);
  for (const [sx, sy, r] of STARS) if (Math.hypot(x - sx, y - sy) < r) c = STAR;

  // Silk thread from the branch down to the top of the cocoon.
  const tx = 0.47;
  if (Math.abs(x - tx) < 0.0045 && y > branchY(tx) && y < 0.3) c = THREAD;

  // Cocoon: an upright ellipse minus an offset one -> a crescent hanging point-up.
  const inCocoon = inEllipse(x, y, 0.47, 0.57, 0.2, 0.29) && !inEllipse(x, y, 0.59, 0.51, 0.165, 0.27);
  if (inCocoon) {
    // Faint diagonal silk wraps.
    const wrap = Math.sin((x * 0.6 + y) * 70);
    c = wrap > 0.82 ? mix(COCOON, SILK, 0.55) : COCOON;
  }

  if (x > 0.02 && x < 0.98 && Math.abs(y - branchY(x)) < branchHalf(x)) c = BRANCH;
  // A leaf hanging under the branch, and a small one on top.
  if (inEllipse(x, y, 0.24, 0.205, 0.075, 0.03, 0.55)) c = LEAF;
  if (inEllipse(x, y, 0.765, 0.128, 0.055, 0.022, -0.45)) c = LEAF;
  return c;
}

function draw(size, pad = 0) {
  const SS = 4; // supersampling for smooth edges
  const out = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let acc = [0, 0, 0];
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = shade((px + (sx + 0.5) / SS) / size, (py + (sy + 0.5) / SS) / size, pad);
          acc = acc.map((v, i) => v + c[i]);
        }
      }
      const o = (py * size + px) * 4;
      for (let i = 0; i < 3; i++) out[o + i] = Math.round(acc[i] / (SS * SS));
      out[o + 3] = 255;
    }
  }
  return png(size, out);
}

mkdirSync(OUT, { recursive: true });
writeFileSync(new URL('apple-touch-icon.png', OUT), draw(180));
writeFileSync(new URL('icon-192.png', OUT), draw(192));
writeFileSync(new URL('icon-512.png', OUT), draw(512));
writeFileSync(new URL('icon-maskable-512.png', OUT), draw(512, 0.1));
writeFileSync(new URL('favicon.png', OUT), draw(64));
console.log('Kkuljam icons written to', OUT.pathname);
