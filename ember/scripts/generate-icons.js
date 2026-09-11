/**
 * Draws EMBER's app icons straight to PNG — no design tools, no binary blobs
 * checked in that nobody can regenerate.
 *
 *   node scripts/generate-icons.js
 *
 * The mark is the same one the app draws on its own home screen: a playing
 * card with the fire knocked out of the middle of it. See scripts/shapes.js.
 */

const fs = require('fs');
const path = require('path');

const { encodePng } = require('./png.js');
const { coverage, emblem, placed, roundedBox, FLAME } = require('./shapes.js');

const BG = [0xf6, 0xee, 0xe4];
const CORAL = [0xe8, 0x73, 0x4a];
const WHITE = [0xff, 0xff, 0xff];

/**
 * One icon.
 *
 * `scale` is how much of the square the card fills. The flame inside it is a
 * hole, so on a filled ground it reads as the ground colour and on a
 * transparent one it is genuinely see-through — which is what the adaptive
 * foreground and the splash both want.
 */
function render(size, { background, scale = 0.62, ink = CORAL, tilt = -8, flameOnly = false }) {
  const pixels = Buffer.alloc(size * size * 4);
  const c = size / 2;
  const box = size * scale;
  // Built once, not once per pixel: `placed` carries a per-row cache, and
  // throwing that away sixteen million times is the difference between a
  // second and a coffee break.
  const card = roundedBox(c, c, box * 0.45, box * 0.62, box * 0.105, tilt);
  const fire = placed(FLAME, c, c, box * 0.78, tilt);
  const alone = placed(FLAME, c, c, box);
  const shape = flameOnly ? alone : (x, y) => card(x, y) && !fire(x, y);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const alpha = scale > 0 ? coverage(shape, x, y) : 0;
      let rgb = background ?? [0, 0, 0];
      let out = background ? 255 : 0;

      if (alpha > 0) {
        rgb = background
          ? [
              Math.round(background[0] * (1 - alpha) + ink[0] * alpha),
              Math.round(background[1] * (1 - alpha) + ink[1] * alpha),
              Math.round(background[2] * (1 - alpha) + ink[2] * alpha),
            ]
          : ink.slice();
        out = Math.max(out, Math.round(alpha * 255));
      }

      const at = (y * size + x) * 4;
      pixels[at] = rgb[0];
      pixels[at + 1] = rgb[1];
      pixels[at + 2] = rgb[2];
      pixels[at + 3] = out;
    }
  }
  return pixels;
}

const assets = path.join(__dirname, '..', 'assets');
fs.mkdirSync(assets, { recursive: true });

const jobs = [
  { file: 'icon.png', size: 1024, options: { background: BG, scale: 0.64 } },
  { file: 'splash-icon.png', size: 1024, options: { background: null, scale: 0.5 } },
  // A favicon is 16px by the time anyone sees it, so it drops the card and
  // shows the fire on its own — the one part that survives being that small.
  { file: 'favicon.png', size: 96, options: { background: BG, scale: 0.66, flameOnly: true } },
  { file: 'android-icon-background.png', size: 1024, options: { background: BG, scale: 0 } },
  { file: 'android-icon-foreground.png', size: 1024, options: { background: null, scale: 0.42 } },
  {
    file: 'android-icon-monochrome.png',
    size: 1024,
    options: { background: null, scale: 0.42, ink: WHITE },
  },
];

for (const job of jobs) {
  const pixels = render(job.size, job.options);
  fs.writeFileSync(path.join(assets, job.file), encodePng(job.size, job.size, pixels));
  console.log(`wrote assets/${job.file} (${job.size}px)`);
}
