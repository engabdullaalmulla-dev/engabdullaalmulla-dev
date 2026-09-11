// Marble art.
//
// Every nation's marble carries its national flag, drawn procedurally from the
// spec in src/data/flags.js, wrapped onto a glass sphere. Each flag is rendered
// once into an offscreen canvas and cached: the same bitmap then serves the DOM
// chips (as a data URL) and the live arena (via drawImage), so a nation looks
// identical everywhere it appears.

import { TAU } from '../core/dmath.js';
import { flagSpec } from '../data/flags.js';
import { drawFlagSpec } from '../data/flagdraw.js';

const FLAG_W = 144, FLAG_H = 96;      // 3:2, big enough for a 60px marble at 2x
const canvasCache = new Map();
const urlCache = new Map();

export function flagCanvas(code) {
  if (canvasCache.has(code)) return canvasCache.get(code);
  const c = document.createElement('canvas');
  c.width = FLAG_W; c.height = FLAG_H;
  drawFlagSpec(c.getContext('2d'), FLAG_W, FLAG_H, flagSpec(code));
  canvasCache.set(code, c);
  return c;
}

export function flagURL(code) {
  if (urlCache.has(code)) return urlCache.get(code);
  const u = flagCanvas(code).toDataURL('image/png');
  urlCache.set(code, u);
  return u;
}

/** Background for a DOM marble face. */
export function marbleBackground(t) {
  return `center / cover no-repeat url(${flagURL(t.code)})`;
}

/** Marble + three-letter code + name. `fav` adds a label AND an outline. */
export function teamChip(t, { size = '', fav = false, showCode = true, name = true } = {}) {
  const el = document.createElement('div');
  el.className = 'teamline';
  const m = document.createElement('div');
  m.className = 'mb' + (size ? ' ' + size : '') + (fav ? ' fav' : '');
  const i = document.createElement('i');
  i.style.background = marbleBackground(t);
  m.appendChild(i);
  el.appendChild(m);
  if (showCode) {
    const c = document.createElement('span');
    c.className = 'code';
    c.textContent = t.code;
    el.appendChild(c);
  }
  if (name) {
    const n = document.createElement('div');
    n.className = 'nm spread';
    n.textContent = t.name;
    el.appendChild(n);
  }
  if (fav) {
    const tag = document.createElement('span');
    tag.className = 'favtag';
    tag.textContent = 'FOLLOWING';
    el.appendChild(tag);
  }
  return el;
}

// --- canvas ----------------------------------------------------------------

function clipCircle(ctx, x, y, r) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.clip();
}

/** The flag, wrapped onto the marble and spun with it. */
export function drawMarbleFace(ctx, x, y, r, t, spin = 0) {
  clipCircle(ctx, x, y, r);
  ctx.translate(x, y);
  ctx.rotate(spin);
  // Cover the circle. A 3:2 flag cropped to a circle loses its outer thirds, so
  // the width is squashed to 1.36:1 first: vertical tricolours and hoist bands
  // stay visible, and the distortion is small enough not to read as wrong.
  const h = 2 * r * 1.02, w = h * 1.36;
  ctx.drawImage(flagCanvas(t.code), -w / 2, -h / 2, w, h);
  ctx.restore();
}

/** Full marble: flag, glass shading, follow ring, three-letter code plate. */
export function drawMarble(ctx, x, y, r, t, opts = {}) {
  const { spin = 0, followed = false, glow = 0, label = false } = opts;

  if (glow > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, glow) * 0.5;
    const g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 3.4);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r * 3.4, 0, TAU); ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = r * 0.7; ctx.shadowOffsetY = r * 0.25;
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.restore();

  drawMarbleFace(ctx, x, y, r, t, spin);

  // Glass: rim darkening plus a specular highlight.
  clipCircle(ctx, x, y, r);
  const rim = ctx.createRadialGradient(x, y, r * 0.45, x, y, r);
  rim.addColorStop(0, 'rgba(0,0,0,0)');
  rim.addColorStop(1, 'rgba(0,0,0,.5)');
  ctx.fillStyle = rim; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  const hi = ctx.createRadialGradient(x - r * 0.34, y - r * 0.42, 0, x - r * 0.34, y - r * 0.42, r * 0.72);
  hi.addColorStop(0, 'rgba(255,255,255,.7)');
  hi.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hi; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = followed ? '#3fe08c' : 'rgba(255,255,255,.35)';
  ctx.lineWidth = Math.max(1.2, r * (followed ? 0.16 : 0.07));
  ctx.beginPath(); ctx.arc(x, y, r + ctx.lineWidth * 0.5, 0, TAU); ctx.stroke();
  ctx.restore();

  if (label) {
    ctx.save();
    ctx.font = `800 ${Math.round(r * 1.0)}px "Saira Condensed", system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(t.code).width + r * 0.7;
    const ly = y + r * 2.2;
    ctx.fillStyle = 'rgba(6,11,15,.85)';
    ctx.beginPath();
    ctx.roundRect(x - w / 2, ly - r * 0.66, w, r * 1.32, r * 0.3);
    ctx.fill();
    ctx.strokeStyle = followed ? '#3fe08c' : 'rgba(255,255,255,.25)';
    ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#eaf1f5';
    ctx.fillText(t.code, x, ly);
    ctx.restore();
  }
}
