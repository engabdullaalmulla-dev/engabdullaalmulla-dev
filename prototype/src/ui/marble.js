// Marble art.
//
// Each nation's marble is an original abstract design in that nation's sporting
// colours -- a band, a split, a swirl, a ring or a fleck, under glass. No flag
// is reproduced. The same five finishes render both in the DOM (team chips) and
// on the canvas (live arena) so a nation looks like itself everywhere.

import { dsin, dcos, TAU } from '../core/dmath.js';

export function marbleBackground(t) {
  const [a, b, c] = [t.colours[0], t.colours[1] || '#fff', t.colours[2] || t.colours[0]];
  switch (t.pattern) {
    case 'band':
      return t.colours[2]
        ? `linear-gradient(180deg, ${a} 0 32%, ${b} 32% 62%, ${c} 62% 100%)`
        : `linear-gradient(180deg, ${a} 0 34%, ${b} 34% 66%, ${a} 66% 100%)`;
    case 'split':
      return `linear-gradient(108deg, ${a} 0 50%, ${b} 50% 100%)`;
    case 'swirl':
      return `conic-gradient(from 200deg, ${a} 0 22%, ${b} 30% 48%, ${a} 56% 78%, ${b} 86% 100%)`;
    case 'ring':
      return `radial-gradient(circle at 50% 50%, ${b} 0 28%, ${a} 28% 60%, ${b} 60% 100%)`;
    case 'speck':
      return `radial-gradient(circle at 32% 30%, ${b} 0 15%, transparent 16%),
              radial-gradient(circle at 70% 60%, ${b} 0 11%, transparent 12%),
              radial-gradient(circle at 52% 82%, ${b} 0 8%, transparent 9%), ${a}`;
    default:
      return a;
  }
}

// A team chip: marble + name. `fav` adds a label AND an outline, never colour alone.
export function teamChip(t, { size = '', fav = false, showCode = true, name = true } = {}) {
  const el = document.createElement('div');
  el.className = 'teamline';
  const m = document.createElement('div');
  m.className = 'mb' + (size ? ' ' + size : '') + (fav ? ' fav' : '');
  const i = document.createElement('i');
  i.style.background = marbleBackground(t);
  m.appendChild(i);
  el.appendChild(m);
  if (name) {
    const wrap = document.createElement('div');
    wrap.className = 'spread';
    const n = document.createElement('div');
    n.className = 'nm';
    n.textContent = t.name;
    wrap.appendChild(n);
    if (showCode) {
      const c = document.createElement('div');
      c.className = 'cd';
      c.textContent = t.code + (fav ? '' : '');
      wrap.appendChild(c);
    }
    el.appendChild(wrap);
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

export function drawMarbleFace(ctx, x, y, r, t, spin = 0) {
  const [a, b, c] = [t.colours[0], t.colours[1] || '#ffffff', t.colours[2] || t.colours[0]];
  clipCircle(ctx, x, y, r);
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.translate(-x, -y);
  const box = (fill, y0, y1) => { ctx.fillStyle = fill; ctx.fillRect(x - r, y + y0 * r, 2 * r, (y1 - y0) * r); };

  switch (t.pattern) {
    case 'band':
      if (t.colours[2]) { box(a, -1, -0.36); box(b, -0.36, 0.24); box(c, 0.24, 1); }
      else { box(a, -1, -0.32); box(b, -0.32, 0.32); box(a, 0.32, 1); }
      break;
    case 'split':
      ctx.fillStyle = a; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
      ctx.fillStyle = b;
      ctx.beginPath();
      ctx.moveTo(x - r, y + r); ctx.lineTo(x + r, y - r); ctx.lineTo(x + r, y + r);
      ctx.closePath(); ctx.fill();
      break;
    case 'swirl': {
      ctx.fillStyle = a; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
      ctx.strokeStyle = b; ctx.lineWidth = r * 0.42; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const u = i / 40, ang = u * TAU * 1.5, rad = r * (0.12 + u * 0.9);
        const px = x + rad * dcos(ang), py = y + rad * dsin(ang);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
      break;
    }
    case 'ring':
      ctx.fillStyle = b; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
      ctx.fillStyle = a;
      ctx.beginPath(); ctx.arc(x, y, r * 0.78, 0, TAU); ctx.fill();
      ctx.fillStyle = b;
      ctx.beginPath(); ctx.arc(x, y, r * 0.34, 0, TAU); ctx.fill();
      break;
    default: // speck
      ctx.fillStyle = a; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
      ctx.fillStyle = b;
      for (const [dx, dy, dr] of [[-0.32, -0.34, 0.24], [0.34, 0.22, 0.18], [0.02, 0.5, 0.14], [0.44, -0.4, 0.12]]) {
        ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, dr * r, 0, TAU); ctx.fill();
      }
  }
  ctx.restore();
}

// Full marble with glass shading, optional follow ring and code label.
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
  rim.addColorStop(1, 'rgba(0,0,0,.55)');
  ctx.fillStyle = rim; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  const hi = ctx.createRadialGradient(x - r * 0.34, y - r * 0.42, 0, x - r * 0.34, y - r * 0.42, r * 0.72);
  hi.addColorStop(0, 'rgba(255,255,255,.85)');
  hi.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hi; ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  ctx.restore();

  if (followed) {
    // A ring AND a label: never colour on its own.
    ctx.save();
    ctx.strokeStyle = '#3fe08c'; ctx.lineWidth = Math.max(1.6, r * 0.16);
    ctx.beginPath(); ctx.arc(x, y, r + ctx.lineWidth, 0, TAU); ctx.stroke();
    ctx.restore();
  }
  if (label) {
    ctx.save();
    ctx.font = `700 ${Math.round(r * 0.95)}px -apple-system, system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(t.code).width + r * 0.6;
    const ly = y + r * 2.15;
    ctx.fillStyle = 'rgba(6,11,15,.82)';
    ctx.beginPath();
    ctx.roundRect(x - w / 2, ly - r * 0.62, w, r * 1.24, r * 0.35);
    ctx.fill();
    if (followed) { ctx.strokeStyle = '#3fe08c'; ctx.lineWidth = 1.2; ctx.stroke(); }
    ctx.fillStyle = '#eaf1f5';
    ctx.fillText(t.code, x, ly);
    ctx.restore();
  }
}
