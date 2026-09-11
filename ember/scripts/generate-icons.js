/**
 * Draws EMBER's app icons straight to PNG — no design tools, no binary blobs
 * checked in that nobody can regenerate.
 *
 *   node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BG = [0xf6, 0xee, 0xe4];
const EMBER = [0xe8, 0x73, 0x4a];
const GOLD = [0xf7, 0xb2, 0x67];
const WHITE = [0xff, 0xff, 0xff];

/* ---- PNG writing ------------------------------------------------- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = -1;
  for (let i = 0; i < buffer.length; i++) c = CRC_TABLE[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function writePng(file, size, pixels) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // no filter
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  fs.writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', header),
      chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}

/* ---- the mark ---------------------------------------------------- */

/**
 * A teardrop of fire: a disc at the bottom, tapering to a point at the top,
 * with a hotter core low in the flame.
 */
function flameCoverage(x, y, cx, cy, r) {
  const top = cy - r * 1.78;
  if (y >= cy) {
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= r * r ? 1 : 0;
  }
  if (y < top) return 0;
  const t = (y - top) / (cy - top);
  // Full shoulders, and a tip that leans over the way a flame does.
  const halfWidth = r * Math.pow(t, 0.82);
  const lean = r * 0.3 * Math.pow(1 - t, 1.7);
  return Math.abs(x - (cx + lean)) <= halfWidth ? 1 : 0;
}

function coreCoverage(x, y, cx, cy, r) {
  const dx = x - cx;
  const dy = y - (cy + r * 0.1);
  const rr = r * 0.4;
  return dx * dx + dy * dy <= rr * rr ? 1 : 0;
}

function render(size, options) {
  const { background, scale = 0.5, flame = EMBER, core = GOLD, monochrome = false } = options;
  const pixels = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const r = size * scale * 0.5;
  // Sit the disc low enough that the whole teardrop is optically centred.
  const cy = size / 2 + r * 0.55;
  const SAMPLES = 3;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let inFlame = 0;
      let inCore = 0;
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const px = x + (sx + 0.5) / SAMPLES;
          const py = y + (sy + 0.5) / SAMPLES;
          inFlame += flameCoverage(px, py, cx, cy, r);
          inCore += coreCoverage(px, py, cx, cy, r);
        }
      }
      const total = SAMPLES * SAMPLES;
      const flameAlpha = inFlame / total;
      const coreAlpha = monochrome ? 0 : (inCore / total) * flameAlpha;

      let rgb = background ?? [0, 0, 0];
      let alpha = background ? 255 : 0;

      if (flameAlpha > 0) {
        rgb = blend(rgb, flame, flameAlpha, alpha);
        alpha = Math.max(alpha, Math.round(flameAlpha * 255));
      }
      if (coreAlpha > 0) {
        rgb = blend(rgb, core, coreAlpha, alpha);
      }

      const at = (y * size + x) * 4;
      pixels[at] = rgb[0];
      pixels[at + 1] = rgb[1];
      pixels[at + 2] = rgb[2];
      pixels[at + 3] = alpha;
    }
  }
  return pixels;
}

function blend(base, over, amount, baseAlpha) {
  if (baseAlpha === 0) return over.slice();
  return [
    Math.round(base[0] * (1 - amount) + over[0] * amount),
    Math.round(base[1] * (1 - amount) + over[1] * amount),
    Math.round(base[2] * (1 - amount) + over[2] * amount),
  ];
}

/* ---- outputs ----------------------------------------------------- */

const assets = path.join(__dirname, '..', 'assets');
fs.mkdirSync(assets, { recursive: true });

const jobs = [
  { file: 'icon.png', size: 1024, options: { background: BG, scale: 0.52 } },
  { file: 'splash-icon.png', size: 1024, options: { background: null, scale: 0.42 } },
  { file: 'favicon.png', size: 96, options: { background: BG, scale: 0.56 } },
  { file: 'android-icon-background.png', size: 1024, options: { background: BG, scale: 0 } },
  { file: 'android-icon-foreground.png', size: 1024, options: { background: null, scale: 0.36 } },
  {
    file: 'android-icon-monochrome.png',
    size: 1024,
    options: { background: null, scale: 0.36, flame: WHITE, monochrome: true },
  },
];

for (const job of jobs) {
  const pixels = render(job.size, job.options);
  writePng(path.join(assets, job.file), job.size, pixels);
  console.log(`wrote assets/${job.file} (${job.size}px)`);
}
