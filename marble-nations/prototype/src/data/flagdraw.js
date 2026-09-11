// Flag drawing primitives.
//
// Flags are drawn procedurally from a compact spec rather than shipped as
// images: it keeps the app offline, keeps the download tiny, and lets one marble
// render crisply at 19px in a list and at 60px in the arena.
//
// Coordinates are in unit space over a 3:2 field. x and y run 0..1; radii and
// line widths are in units of HEIGHT so circles stay circular.
//
// Small central emblems (eagles, calligraphy, lions, temples) are stylised:
// at the size a marble is actually drawn they resolve to a few pixels, and the
// field layout and colours are what carry recognition.

import { dsin, dcos, TAU } from '../core/dmath.js';

function bands(ctx, W, H, list, horizontal) {
  const total = list.reduce((s, b) => s + (Array.isArray(b) ? b[1] : 1), 0);
  let at = 0;
  for (const b of list) {
    const col = Array.isArray(b) ? b[0] : b;
    const w = (Array.isArray(b) ? b[1] : 1) / total;
    ctx.fillStyle = col;
    if (horizontal) ctx.fillRect(-1, at * H - 1, W + 2, w * H + 2);
    else ctx.fillRect(at * W - 1, -1, w * W + 2, H + 2);
    at += w;
  }
}

function starPath(ctx, cx, cy, r, points, rot = -TAU / 4, inner = 0.382) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const rr = i % 2 === 0 ? r : r * inner;
    const a = rot + (i / (points * 2)) * TAU;
    const x = cx + rr * dcos(a), y = cy + rr * dsin(a);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}

const GLYPH = {
  // Canada's leaf is the whole flag, so it gets real geometry.
  maple(ctx, x, y, r, c) {
    const pts = [[0,-1],[.12,-.62],[.36,-.7],[.28,-.44],[.62,-.16],[.5,-.06],[.56,.12],[.26,.06],[.3,.22],[.08,.12],[.06,.52],[-.06,.52],[-.08,.12],[-.3,.22],[-.26,.06],[-.56,.12],[-.5,-.06],[-.62,-.16],[-.28,-.44],[-.36,-.7],[-.12,-.62]];
    ctx.fillStyle = c; ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(x + px * r, y + py * r) : ctx.moveTo(x + px * r, y + py * r)));
    ctx.closePath(); ctx.fill();
  },
  cedar(ctx, x, y, r, c) {
    ctx.fillStyle = c;
    for (let i = 0; i < 3; i++) {
      const s = 1 - i * 0.24, yy = y + r * (0.42 - i * 0.42);
      ctx.beginPath();
      ctx.moveTo(x, yy - r * 0.62 * s); ctx.lineTo(x + r * 0.78 * s, yy);
      ctx.lineTo(x - r * 0.78 * s, yy); ctx.closePath(); ctx.fill();
    }
    ctx.fillRect(x - r * 0.09, y + r * 0.38, r * 0.18, r * 0.34);
  },
  wheel(ctx, x, y, r, c) {
    ctx.strokeStyle = c; ctx.lineWidth = r * 0.13;
    ctx.beginPath(); ctx.arc(x, y, r * 0.86, 0, TAU); ctx.stroke();
    ctx.lineWidth = r * 0.07;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r * 0.86 * dcos(a), y + r * 0.86 * dsin(a)); ctx.stroke();
    }
  },
  sun(ctx, x, y, r, c, rays = 16) {
    ctx.fillStyle = c;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * TAU;
      ctx.beginPath();
      ctx.moveTo(x + r * 0.55 * dcos(a - 0.09), y + r * 0.55 * dsin(a - 0.09));
      ctx.lineTo(x + r * 1.5 * dcos(a), y + r * 1.5 * dsin(a));
      ctx.lineTo(x + r * 0.55 * dcos(a + 0.09), y + r * 0.55 * dsin(a + 0.09));
      ctx.closePath(); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(x, y, r * 0.7, 0, TAU); ctx.fill();
  },
  // A calligraphic band plus (optionally) a sword, as on several Arab flags.
  script(ctx, x, y, r, c, sword) {
    ctx.strokeStyle = c; ctx.lineCap = 'round'; ctx.lineWidth = r * 0.17;
    ctx.beginPath();
    ctx.moveTo(x - r, y - r * 0.22);
    ctx.bezierCurveTo(x - r * 0.4, y - r * 0.62, x + r * 0.35, y + r * 0.18, x + r, y - r * 0.3);
    ctx.stroke();
    ctx.lineWidth = r * 0.11;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.62, y + r * 0.16);
    ctx.bezierCurveTo(x - r * 0.2, y - r * 0.1, x + r * 0.2, y + r * 0.3, x + r * 0.62, y + r * 0.06);
    ctx.stroke();
    if (sword) {
      ctx.lineWidth = r * 0.12;
      ctx.beginPath(); ctx.moveTo(x - r * 0.95, y + r * 0.6); ctx.lineTo(x + r * 0.8, y + r * 0.6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + r * 0.8, y + r * 0.6); ctx.lineTo(x + r * 1.05, y + r * 0.44); ctx.stroke();
    }
  },
  // Stand-in silhouette for a complex central charge (eagle, lion, dragon...).
  crest(ctx, x, y, r, c) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x - r, y + r * 0.15);
    ctx.quadraticCurveTo(x - r * 0.45, y - r * 0.15, x - r * 0.2, y - r * 0.72);
    ctx.quadraticCurveTo(x + r * 0.05, y - r * 0.2, x + r * 0.5, y - r * 0.42);
    ctx.quadraticCurveTo(x + r * 0.35, y + r * 0.1, x + r * 0.95, y + r * 0.3);
    ctx.quadraticCurveTo(x + r * 0.2, y + r * 0.45, x + r * 0.1, y + r * 0.95);
    ctx.quadraticCurveTo(x - r * 0.25, y + r * 0.35, x - r, y + r * 0.15);
    ctx.closePath(); ctx.fill();
  },
  flower(ctx, x, y, r, c) {
    ctx.fillStyle = c;
    for (let i = 0; i < 5; i++) {
      const a = -TAU / 4 + (i / 5) * TAU;
      ctx.beginPath();
      ctx.ellipse(x + r * 0.55 * dcos(a), y + r * 0.55 * dsin(a), r * 0.46, r * 0.24, a, 0, TAU);
      ctx.fill();
    }
  },
  temple(ctx, x, y, r, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x - r * 0.85, y + r * 0.4, r * 1.7, r * 0.3);
    ctx.fillRect(x - r * 0.6, y - r * 0.1, r * 1.2, r * 0.5);
    for (const dx of [-0.55, 0, 0.55]) {
      ctx.beginPath();
      ctx.moveTo(x + dx * r, y - r * 0.95);
      ctx.lineTo(x + dx * r + r * 0.22, y - r * 0.1);
      ctx.lineTo(x + dx * r - r * 0.22, y - r * 0.1);
      ctx.closePath(); ctx.fill();
    }
  },
  taegeuk(ctx, x, y, r) {
    ctx.save();
    ctx.rotate && ctx.translate(x, y); ctx.rotate(-0.9); ctx.translate(-x, -y);
    ctx.fillStyle = '#CD2E3A';
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.fillStyle = '#0047A0';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(x - r / 2, y, r / 2, 0, TAU); ctx.fillStyle = '#CD2E3A'; ctx.fill();
    ctx.beginPath(); ctx.arc(x + r / 2, y, r / 2, 0, TAU); ctx.fillStyle = '#0047A0'; ctx.fill();
    ctx.restore();
  },
};

// Union-flag canton, used by several Oceania and Pacific members.
function unionCanton(ctx, x, y, w, h) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = '#00247D'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = h * 0.17;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + h); ctx.moveTo(x + w, y); ctx.lineTo(x, y + h); ctx.stroke();
  ctx.strokeStyle = '#CF142B'; ctx.lineWidth = h * 0.09;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + h); ctx.moveTo(x + w, y); ctx.lineTo(x, y + h); ctx.stroke();
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = h * 0.3;
  ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
  ctx.strokeStyle = '#CF142B'; ctx.lineWidth = h * 0.18;
  ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
  ctx.restore();
}

// Execute one op of a flag spec.
export function runOp(ctx, W, H, op) {
  const X = v => v * W, Y = v => v * H, R = v => v * H;
  const k = op[0];
  switch (k) {
    case 'bg': ctx.fillStyle = op[1]; ctx.fillRect(-1, -1, W + 2, H + 2); break;
    case 'hb': bands(ctx, W, H, op[1], true); break;
    case 'vb': bands(ctx, W, H, op[1], false); break;
    case 'r': ctx.fillStyle = op[5]; ctx.fillRect(X(op[1]), Y(op[2]), X(op[3]), Y(op[4])); break;
    case 'd': ctx.fillStyle = op[4]; ctx.beginPath(); ctx.arc(X(op[1]), Y(op[2]), R(op[3]), 0, TAU); ctx.fill(); break;
    case 'ring':
      ctx.strokeStyle = op[5]; ctx.lineWidth = R(op[4]);
      ctx.beginPath(); ctx.arc(X(op[1]), Y(op[2]), R(op[3]), 0, TAU); ctx.stroke(); break;
    case 's':
      ctx.fillStyle = op[5];
      starPath(ctx, X(op[1]), Y(op[2]), R(op[3]), op[4], op[6] ?? -TAU / 4, op[7]);
      ctx.fill(); break;
    case 'cres': {                       // crescent = disc minus offset disc
      const cx = X(op[1]), cy = Y(op[2]), r = R(op[3]);
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU);
      ctx.arc(cx + r * (op[5] ?? 0.32), cy, r * (op[6] ?? 0.84), 0, TAU, true);
      ctx.fillStyle = op[4]; ctx.fill('evenodd');
      ctx.restore(); break;
    }
    case 'cross': {                      // centred cross
      const t = R(op[2]);
      ctx.fillStyle = op[1];
      ctx.fillRect(W / 2 - t / 2, -1, t, H + 2);
      ctx.fillRect(-1, H / 2 - t / 2, W + 2, t); break;
    }
    case 'nord': {                       // Nordic cross, offset toward the hoist
      const t = R(op[2]), x = X(op[3] ?? 0.36);
      ctx.fillStyle = op[1];
      ctx.fillRect(x - t / 2, -1, t, H + 2);
      ctx.fillRect(-1, H / 2 - t / 2, W + 2, t); break;
    }
    case 'nord2': {
      runOp(ctx, W, H, ['nord', op[1], op[3], op[5]]);
      runOp(ctx, W, H, ['nord', op[2], op[4], op[5]]); break;
    }
    case 'salt': {
      ctx.strokeStyle = op[1]; ctx.lineWidth = R(op[2]);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, H); ctx.moveTo(W, 0); ctx.lineTo(0, H); ctx.stroke(); break;
    }
    case 'tri':
      ctx.fillStyle = op[2]; ctx.beginPath();
      op[1].forEach(([px, py], i) => (i ? ctx.lineTo(X(px), Y(py)) : ctx.moveTo(X(px), Y(py))));
      ctx.closePath(); ctx.fill(); break;
    case 'band': {                       // diagonal band, hoist-bottom to fly-top
      ctx.strokeStyle = op[1]; ctx.lineWidth = R(op[2]);
      ctx.beginPath(); ctx.moveTo(-W * 0.1, H * 1.05); ctx.lineTo(W * 1.1, -H * 0.05); ctx.stroke(); break;
    }
    case 'chk': {                        // checkerboard inside a rect
      const [, x, y, w, h, c1, c2, cols, rows] = op;
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        ctx.fillStyle = (i + j) % 2 ? c2 : c1;
        ctx.fillRect(X(x) + X(w) * i / cols, Y(y) + Y(h) * j / rows, X(w) / cols + 0.6, Y(h) / rows + 0.6);
      }
      break;
    }
    case 'stars': {                      // ring or arc of small stars
      const [, cx, cy, rad, n, size, col, from = -TAU / 4, span = TAU] = op;
      ctx.fillStyle = col;
      for (let i = 0; i < n; i++) {
        const a = from + (span === TAU ? (i / n) * span : (i / (n - 1)) * span);
        starPath(ctx, X(cx) + R(rad) * dcos(a), Y(cy) + R(rad) * dsin(a), R(size), 5);
        ctx.fill();
      }
      break;
    }
    case 'grid-stars': {                 // the US canton
      const [, x, y, w, h, rows, cols, size, col] = op;
      ctx.fillStyle = col;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        starPath(ctx, X(x) + X(w) * (i + 0.5) / cols, Y(y) + Y(h) * (j + 0.5) / rows, R(size), 5);
        ctx.fill();
      }
      break;
    }
    case 'union': unionCanton(ctx, X(op[1]), Y(op[2]), X(op[3]), Y(op[4])); break;
    case 'g': {                           // glyph
      const fn = GLYPH[op[1]];
      if (fn) { ctx.save(); fn(ctx, X(op[2]), Y(op[3]), R(op[4]), op[5], op[6]); ctx.restore(); }
      break;
    }
    default: break;
  }
}

export function drawFlagSpec(ctx, W, H, spec) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  for (const op of spec) runOp(ctx, W, H, op);
  ctx.restore();
}
