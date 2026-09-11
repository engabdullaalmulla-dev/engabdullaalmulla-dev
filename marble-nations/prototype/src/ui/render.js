// Arena renderer.
//
// Strictly one-way: the renderer reads simulation state and draws it. It never
// writes back. That is what lets the same match be watched at 1x, at 4x, or
// skipped entirely and still produce the same score -- and it is why camera
// choices, frame rate and ad breaks cannot affect a result.

import { colliderWorld, gateOpen } from '../core/physics.js';
import { drainActive, W as AW, H as AH } from '../sim/arenas.js';
import { drawMarble } from './marble.js';
import { team } from '../data/teams.js';
import { TAU } from '../core/dmath.js';

const THEMES = {
  grass: { deep: '#07130f', pitch: '#103528', line: 'rgba(120,200,170,.20)', accent: '#3fe08c', wall: '#2f6b57' },
  neon: { deep: '#0b0718', pitch: '#1a1136', line: 'rgba(170,140,255,.20)', accent: '#b48cff', wall: '#5b40a8' },
  ice: { deep: '#061218', pitch: '#0e2d3a', line: 'rgba(140,220,255,.20)', accent: '#7fd8ff', wall: '#2f6c84' },
  court: { deep: '#140d07', pitch: '#33210f', line: 'rgba(255,205,140,.18)', accent: '#ffbe6b', wall: '#7a5326' },
  stone: { deep: '#0a0b0d', pitch: '#22262c', line: 'rgba(200,210,225,.16)', accent: '#aab6c6', wall: '#4d545f' },
  gold: { deep: '#120d03', pitch: '#2a2008', line: 'rgba(255,220,140,.22)', accent: '#f3c451', wall: '#7d6420' },
};

export function makeRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let dpr = 1;

  function resize() {
    dpr = Math.min(2.5, window.devicePixelRatio || 1);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
  }

  function view(m, camera) {
    const cw = canvas.width, ch = canvas.height;
    const fit = Math.min(cw / AW, ch / AH);
    if (camera === 'wide' || !m) {
      return { s: fit, ox: (cw - AW * fit) / 2, oy: (ch - AH * fit) / 2 };
    }
    // Close camera: zoom on the midpoint of the two marbles, clamped in-bounds.
    const s = fit * 1.7;
    const b = m.world.bodies;
    const mx = (b[0].x + b[1].x) / 2, my = (b[0].y + b[1].y) / 2;
    let ox = cw / 2 - mx * s, oy = ch / 2 - my * s;
    ox = Math.min(0, Math.max(cw - AW * s, ox));
    oy = Math.min(0, Math.max(ch - AH * s, oy));
    return { s, ox, oy };
  }

  function draw(m, opts = {}) {
    const { camera = 'wide', followed = [], reducedMotion = false } = opts;
    const th = THEMES[m.arena.decor.theme] || THEMES.grass;
    const { s, ox, oy } = view(m, camera);
    const X = x => ox + x * s, Y = y => oy + y * s, S = v => v * s;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = th.deep;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // pitch
    ctx.fillStyle = th.pitch;
    ctx.fillRect(X(0), Y(0), S(AW), S(AH));
    // mown bands
    ctx.fillStyle = 'rgba(255,255,255,.018)';
    for (let i = 0; i < 10; i += 2) ctx.fillRect(X(0), Y(i * AH / 10), S(AW), S(AH / 10));
    // markings
    ctx.strokeStyle = th.line; ctx.lineWidth = Math.max(1, S(0.5));
    ctx.beginPath();
    ctx.moveTo(X(0), Y(AH / 2)); ctx.lineTo(X(AW), Y(AH / 2));
    ctx.arc(X(AW / 2), Y(AH / 2), S(16), 0, TAU);
    ctx.stroke();

    const t = m.world.t;

    // hazards under everything
    for (const d of m.arena.drains) {
      const open = drainActive(d, t);
      ctx.beginPath(); ctx.arc(X(d.x), Y(d.y), S(d.r), 0, TAU);
      if (open) {
        const g = ctx.createRadialGradient(X(d.x), Y(d.y), 0, X(d.x), Y(d.y), S(d.r));
        g.addColorStop(0, '#000'); g.addColorStop(0.75, '#05080b'); g.addColorStop(1, 'rgba(5,8,11,.1)');
        ctx.fillStyle = g; ctx.fill();
        ctx.strokeStyle = 'rgba(255,120,120,.5)'; ctx.lineWidth = Math.max(1, S(0.4)); ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,.045)'; ctx.fill();
        ctx.setLineDash([S(1.5), S(1.5)]);
        ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = Math.max(1, S(0.35)); ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // colliders
    for (const c of m.arena.colliders) {
      if (c.gate && gateOpen(c.gate, t)) {
        if (c.tag === 'door') {
          const g = colliderWorld(c, t);
          ctx.strokeStyle = 'rgba(255,255,255,.10)';
          ctx.lineWidth = Math.max(1, S(0.6));
          ctx.setLineDash([S(1.2), S(1.6)]);
          ctx.beginPath(); ctx.moveTo(X(g[0]), Y(g[1])); ctx.lineTo(X(g[4]), Y(g[5])); ctx.stroke();
          ctx.setLineDash([]);
        }
        continue;
      }
      const g = colliderWorld(c, t);
      const style = STYLE[c.tag] || STYLE.default;
      if (c.type === 'seg') {
        ctx.lineCap = style.cap || 'round';
        ctx.lineWidth = Math.max(1.2, S(style.w));
        ctx.strokeStyle = style.stroke === 'theme' ? th.wall : style.stroke;
        if (style.shadow) { ctx.shadowColor = style.shadow; ctx.shadowBlur = S(2.2); }
        ctx.beginPath(); ctx.moveTo(X(g[0]), Y(g[1])); ctx.lineTo(X(g[4]), Y(g[5])); ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        ctx.beginPath(); ctx.arc(X(g[0]), Y(g[1]), S(g[4]), 0, TAU);
        ctx.fillStyle = style.fill === 'theme' ? th.wall : (style.fill || '#3a4650');
        ctx.fill();
        if (style.stroke) {
          ctx.lineWidth = Math.max(1, S(0.6));
          ctx.strokeStyle = style.stroke === 'theme' ? th.accent : style.stroke;
          ctx.stroke();
        }
      }
    }

    // goal mouths, drawn on top so it is always obvious where the ball must go
    m.arena.goals.forEach((gl, i) => {
      const dirY = i === 0 ? -1 : 1;
      const col = i === 0 ? '#ffffff' : '#ffffff';
      ctx.save();
      ctx.globalAlpha = 0.14 + (m.flash > 0 && m.lastGoal && m.lastGoal.team === i ? 0.5 * Math.min(1, m.flash) : 0);
      ctx.fillStyle = col;
      ctx.fillRect(X(gl.cx - gl.halfW), Y(gl.y + (dirY === -1 ? -10 : 0)), S(gl.halfW * 2), S(10));
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,.55)';
      ctx.lineWidth = Math.max(1.4, S(0.7));
      ctx.beginPath();
      ctx.moveTo(X(gl.cx - gl.halfW), Y(gl.y)); ctx.lineTo(X(gl.cx + gl.halfW), Y(gl.y));
      ctx.stroke();
    });

    // marbles with trails
    m.world.bodies.forEach((b, i) => {
      const tm = team(m.cfg.teams[i]);
      const fav = followed.includes(m.cfg.teams[i]);
      if (!b.alive) return;
      if (!reducedMotion && b.trail.length > 1) {
        ctx.lineCap = 'round';
        for (let k = 1; k < b.trail.length; k++) {
          const p0 = b.trail[k - 1], p1 = b.trail[k];
          ctx.globalAlpha = (k / b.trail.length) * 0.35;
          ctx.strokeStyle = tm.colours[0];
          ctx.lineWidth = S(2.4 * (k / b.trail.length));
          ctx.beginPath(); ctx.moveTo(X(p0.x), Y(p0.y)); ctx.lineTo(X(p1.x), Y(p1.y)); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      drawMarble(ctx, X(b.x), Y(b.y), S(b.r), tm, {
        followed: fav,
        glow: m.flash > 0 && m.lastGoal && m.lastGoal.team === i ? m.flash : 0,
        label: true,
      });
    });

    // contact sparks
    if (!reducedMotion) {
      for (const c of m.world.contacts) {
        if (c.force < 14) continue;
        ctx.globalAlpha = Math.min(0.75, c.force / 60);
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(X(c.x), Y(c.y), S(0.9 + c.force / 40), 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  // Penalty challenge gets its own, much simpler picture: one marble, one goal,
  // one keeper. It has to be readable at a glance or the shoot-out is confusing.
  function drawPens(m, opts = {}) {
    const { followed = [] } = opts;
    const p = m.pens;
    const cw = canvas.width, ch = canvas.height;
    const s = Math.min(cw / 100, ch / 90);
    const ox = (cw - 100 * s) / 2, oy = (ch - 90 * s) / 2;
    const X = x => ox + x * s, Y = y => oy + y * s, S = v => v * s;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#07130f'; ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = '#103528'; ctx.fillRect(X(6), Y(20), S(88), S(66));
    ctx.strokeStyle = 'rgba(120,200,170,.25)'; ctx.lineWidth = Math.max(1, S(0.5));
    ctx.strokeRect(X(6), Y(20), S(88), S(66));

    // goal + net
    ctx.fillStyle = 'rgba(255,255,255,.10)';
    ctx.fillRect(X(35), Y(14), S(30), S(12));
    ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = Math.max(1.5, S(0.8));
    ctx.beginPath(); ctx.moveTo(X(35), Y(26)); ctx.lineTo(X(65), Y(26)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X(35), Y(14)); ctx.lineTo(X(35), Y(26));
    ctx.moveTo(X(65), Y(14)); ctx.lineTo(X(65), Y(26)); ctx.stroke();

    // keeper
    if (p.active) {
      const kx = 50 + (15 - 9.4 / 2) * Math.sin((p.active.t / 1.5 + p.keeperPhase[p.active.team]) * TAU);
      ctx.strokeStyle = '#ffd24a'; ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(3, S(2.4));
      ctx.beginPath(); ctx.moveTo(X(kx - 4.7), Y(27.5)); ctx.lineTo(X(kx + 4.7), Y(27.5)); ctx.stroke();
      const tm = team(m.cfg.teams[p.active.team]);
      for (let k = 1; k < p.active.trail.length; k++) {
        const a = p.active.trail[k - 1], b = p.active.trail[k];
        ctx.globalAlpha = (k / p.active.trail.length) * 0.4;
        ctx.strokeStyle = tm.colours[0]; ctx.lineWidth = S(2);
        ctx.beginPath(); ctx.moveTo(X(a.x), Y(a.y)); ctx.lineTo(X(b.x), Y(b.y)); ctx.stroke();
      }
      ctx.globalAlpha = 1;
      drawMarble(ctx, X(p.active.x), Y(p.active.y), S(2.25), tm, {
        followed: followed.includes(m.cfg.teams[p.active.team]), label: true,
      });
    }

    // scorecard: five slots each, then sudden death appended
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    [0, 1].forEach(side => {
      const rowY = Y(72 + side * 9);
      const tm = team(m.cfg.teams[side]);
      ctx.font = `700 ${Math.round(S(4))}px -apple-system, system-ui, sans-serif`;
      ctx.fillStyle = '#eaf1f5';
      ctx.fillText(tm.code, X(9), rowY);
      const marks = p.log.filter(l => l.team === side);
      for (let i = 0; i < Math.max(5, marks.length); i++) {
        const cx = X(30 + i * 6.5), r = S(2.1);
        ctx.beginPath(); ctx.arc(cx, rowY, r, 0, TAU);
        if (i < marks.length) { ctx.fillStyle = marks[i].scored ? '#3fe08c' : '#ff6b6b'; ctx.fill(); }
        else { ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = Math.max(1, S(0.4)); ctx.stroke(); }
      }
    });
  }

  return { resize, draw, drawPens, canvas };
}

const STYLE = {
  wall: { stroke: 'theme', w: 1.8 },
  post: { stroke: '#ffffff', w: 1.6 },
  net: { stroke: 'rgba(255,255,255,.28)', w: 1.0 },
  goalline: { stroke: 'rgba(255,255,255,.10)', w: 0.8 },
  funnel: { stroke: 'rgba(255,255,255,.30)', w: 1.4 },
  keeper: { stroke: '#ffd24a', w: 2.6, shadow: 'rgba(255,210,74,.8)' },
  rotor: { stroke: '#8fa3b0', w: 2.6, shadow: 'rgba(255,255,255,.25)' },
  hub: { fill: '#5d6d7a', stroke: 'rgba(255,255,255,.35)' },
  bumper: { fill: '#38485a', stroke: 'rgba(255,255,255,.40)' },
  peg: { fill: '#46545f', stroke: 'rgba(255,255,255,.3)' },
  corner: { fill: '#33414b', stroke: 'rgba(255,255,255,.18)' },
  sling: { stroke: '#ffd9a0', w: 2.0, shadow: 'rgba(255,217,160,.55)' },
  blocker: { stroke: '#9fb2c0', w: 2.4 },
  door: { stroke: '#c7d6e0', w: 2.0 },
  ring: { stroke: '#8894a0', w: 2.0 },
  rail: { stroke: '#7d8c98', w: 1.8 },
  default: { stroke: '#55636e', w: 1.6, fill: '#3a4650' },
};
