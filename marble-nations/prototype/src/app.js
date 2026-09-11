// Marble Nations -- prototype application shell.
//
// Screen structure follows the design doc: Play/setup, Draw ceremony, Tournament
// journey, Live arena + result, Collection & settings.

import { createCampaign, currentRound, playFixture, playRestOfMatchday, roundIsComplete,
  advance, matchConfigFor, groupTable, consequenceFor, isEliminated, aliveFollowed,
  competitionOf, arenaName } from './engine/campaign.js';
import { createMatch, step as stepMatch, runToEnd, resultOf, clockText, SIM_VERSION } from './sim/match.js';
import { STEP } from './core/physics.js';
import { seedFor } from './core/rng.js';
import { listCompetitions, COMPETITIONS } from './data/competitions/index.js';
import { team, CONFEDERATIONS } from './data/teams.js';
import { teamChip, marbleBackground } from './ui/marble.js';
import { makeRenderer } from './ui/render.js';
import { ARENA_META, ARENA_IDS } from './sim/arenas.js';
import * as store from './engine/storage.js';

// --- tiny DOM helpers -------------------------------------------------------

function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== null && v !== undefined && v !== false) {
      // aria-* are enumerated, not boolean: they need the literal string.
      el.setAttribute(k, v === true ? (k.startsWith('aria-') ? 'true' : '') : String(v));
    }
  }
  for (const kid of kids.flat()) {
    if (kid === null || kid === undefined || kid === false) continue;
    el.appendChild(typeof kid === 'string' || typeof kid === 'number' ? document.createTextNode(String(kid)) : kid);
  }
  return el;
}
const $ = s => document.querySelector(s);

function marbleEl(t, cls = '') {
  const m = h('div', { class: 'mb ' + cls });
  m.appendChild(h('i', { style: `background:${marbleBackground(t)}` }));
  return m;
}

function haptic(kind = 'light') {
  if (!S.settings.haptics || !navigator.vibrate) return;
  navigator.vibrate(kind === 'goal' ? [18, 40, 28] : kind === 'heavy' ? 24 : 8);
}

// --- audio (tiny synthesised cues; no asset files) ---------------------------

let audio = null;
function beep(freq, dur = 0.07, type = 'sine', gain = 0.05) {
  if (!S.settings.sound) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(gain, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
    o.connect(g); g.connect(audio.destination);
    o.start(); o.stop(audio.currentTime + dur);
  } catch {}
}

// --- state ------------------------------------------------------------------

const S = {
  screen: 'home',
  campaign: null,
  settings: store.loadSettings(),
  setup: { competitionId: 'wc2026', mode: 'authentic', followed: [], query: '' },
  live: null,
  journeyTab: 'fixtures',
  lastAd: 0,
  toastTimer: null,
};

function save() { if (S.campaign) store.saveCampaign(S.campaign); }
function comp() { return competitionOf(S.campaign); }

// --- shell ------------------------------------------------------------------

function render() {
  const app = $('#app');
  app.innerHTML = '';
  const body = h('div', { class: 'screen', id: 'screen' });
  let top, tabs = true;

  switch (S.screen) {
    case 'home': top = topbar('Marble Nations', 'Choose a competition'); homeScreen(body); break;
    case 'setup': top = topbar(compMeta().name, `${compMeta().edition} · ruleset ${compMeta().rulesetVersion}`, () => go('home')); setupScreen(body); break;
    case 'draw': top = topbar('The Draw', S.campaign.name); tabs = false; drawScreen(body); break;
    case 'journey': top = journeyTop(); journeyScreen(body); break;
    case 'live': top = null; tabs = false; liveScreen(app); return;
    case 'result': top = topbar('Result', S.live ? S.live.fixture.label : ''); tabs = false; resultScreen(body); break;
    case 'cabinet': top = topbar('Collection', 'Trophies, history & settings'); cabinetScreen(body); break;
  }
  if (top) app.appendChild(top);
  app.appendChild(body);
  if (tabs) app.appendChild(tabbar());
}

function topbar(title, sub, back) {
  return h('div', { class: 'topbar' },
    back ? h('button', { class: 'iconbtn', onclick: back, 'aria-label': 'Back' }, '‹') : null,
    h('h1', {}, title, sub ? h('div', { class: 'sub' }, sub) : null),
    h('button', { class: 'iconbtn', onclick: () => go('cabinet'), 'aria-label': 'Collection & settings' }, '☰'),
  );
}

function journeyTop() {
  const c = S.campaign, r = currentRound(c);
  const done = r ? r.fixtures.filter(f => f.result).length : 0;
  const sub = r ? `${r.label} · ${done}/${r.fixtures.length} played` : 'Campaign complete';
  return h('div', { class: 'topbar' },
    h('h1', {}, `${compMeta().shortName}`, h('div', { class: 'sub' }, sub)),
    c.mode === 'arcade' ? h('span', { class: 'pill warn' }, `♥ ${c.lives - c.livesUsed}`) : null,
    h('button', { class: 'iconbtn', onclick: () => go('cabinet'), 'aria-label': 'Collection & settings' }, '☰'),
  );
}

function tabbar() {
  const b = (id, glyph, label, on) => h('button', {
    'aria-current': S.screen === id ? 'true' : 'false', onclick: on,
  }, h('span', { class: 'g' }, glyph), label);
  return h('div', { class: 'tabbar' },
    b('home', '◉', 'PLAY', () => go('home')),
    b('journey', '▦', 'JOURNEY', () => S.campaign ? go('journey') : toast('Start a campaign first')),
    b('cabinet', '★', 'COLLECTION', () => go('cabinet')),
  );
}

function go(screen) { S.screen = screen; render(); $('#screen') && ($('#screen').scrollTop = 0); }

function toast(msg) {
  let t = $('#toast');
  if (!t) { t = h('div', { id: 'toast', style: 'position:absolute;left:50%;bottom:86px;transform:translateX(-50%);background:#1b262f;border:1px solid #32444f;padding:9px 14px;border-radius:10px;font-size:13px;z-index:40;box-shadow:0 8px 24px rgba(0,0,0,.5)' }); $('#app').appendChild(t); }
  t.textContent = msg; t.style.opacity = '1';
  clearTimeout(S.toastTimer);
  S.toastTimer = setTimeout(() => { t.style.opacity = '0'; }, 1800);
}

function compMeta() { return COMPETITIONS[S.setup.competitionId] ? COMPETITIONS[S.setup.competitionId].meta : comp().meta; }

// --- home -------------------------------------------------------------------

function homeScreen(root) {
  const pad = h('div', { class: 'pad' });
  const saved = store.loadCampaign();

  if (saved && !saved.stale) {
    const c = saved;
    const cm = COMPETITIONS[c.competitionId].meta;
    const r = c.rounds[c.current];
    const played = c.rounds.reduce((s, x) => s + x.fixtures.filter(f => f.result).length, 0);
    const total = cm.id === 'wc2026' ? 104 : c.rounds.reduce((s, x) => s + x.fixtures.length, 0);
    pad.appendChild(h('div', { class: 'card tap', onclick: () => { S.campaign = c; go(c.rounds.length ? 'journey' : 'draw'); } },
      h('div', { class: 'row between' },
        h('div', {}, h('div', { style: 'font-weight:700;font-size:15px' }, 'Continue campaign'),
          h('div', { class: 'tiny muted' }, `${cm.shortName} · ${c.mode === 'arcade' ? 'Arcade' : 'Authentic'} · ${r ? r.label : 'complete'}`)),
        h('span', { class: 'pill ok' }, `${played}/${total}`)),
      h('div', { class: 'row', style: 'margin-top:10px;gap:6px;flex-wrap:wrap' },
        ...c.followed.map(code => {
          const el = h('span', { class: 'pill' + (isEliminated(c, code) ? ' bad' : ' ok') });
          el.appendChild(marbleEl(team(code), 'sm'));
          el.appendChild(document.createTextNode(team(code).name));
          return el;
        })),
      c.simDrift ? h('div', { class: 'note warn', style: 'margin-top:10px' }, c.simDrift) : null,
    ));
  }

  pad.appendChild(h('h3', {}, 'Competitions'));
  for (const cm of listCompetitions()) {
    const m = cm.meta;
    pad.appendChild(h('div', { class: 'card tap', onclick: () => { S.setup.competitionId = m.id; S.setup.followed = []; go('setup'); } },
      h('div', { class: 'row between' },
        h('div', { class: 'spread' },
          h('div', { style: 'font-weight:700;font-size:16px' }, m.name),
          h('div', { class: 'tiny muted' }, `${m.edition} · ${m.teams} nations · ${m.category}`)),
        h('span', { class: 'pill ok' }, 'Playable')),
      h('p', { style: 'margin:9px 0 0' }, m.blurb),
      h('div', { class: 'row', style: 'margin-top:9px;gap:6px;flex-wrap:wrap' },
        h('span', { class: 'pill' }, `ruleset ${m.rulesetVersion}`),
        h('span', { class: 'pill' }, `${m.sources.length} sources`),
        m.flags.length ? h('span', { class: 'pill warn' }, `${m.flags.length} flags`) : null),
    ));
  }

  pad.appendChild(h('div', { class: 'note' },
    'Every competition here is an explicit, versioned ruleset with its sources recorded. Competitions that have not been researched and encoded do not appear at all — there is no generic bracket fallback.'));
  root.appendChild(pad);
}

// --- setup ------------------------------------------------------------------

function setupScreen(root) {
  const pad = h('div', { class: 'pad' });
  const m = compMeta();
  const C = COMPETITIONS[S.setup.competitionId];

  pad.appendChild(h('div', { class: 'card' },
    h('div', { style: 'font-weight:700' }, m.name + ' ' + m.edition),
    h('p', { style: 'margin:6px 0 0' }, m.entrantsNote),
    h('div', { class: 'row', style: 'margin-top:10px;gap:6px' },
      h('button', { class: 'btn ghost sm', onclick: () => rulesetSheet(m) }, 'Ruleset & sources'))));

  pad.appendChild(h('h3', {}, 'Mode'));
  pad.appendChild(h('div', { class: 'seg' },
    h('button', { 'aria-pressed': S.setup.mode === 'authentic', onclick: () => { S.setup.mode = 'authentic'; render(); } }, 'Authentic'),
    h('button', { 'aria-pressed': S.setup.mode === 'arcade', onclick: () => { S.setup.mode = 'arcade'; render(); } }, 'Arcade')));
  pad.appendChild(h('p', {},
    S.setup.mode === 'authentic'
      ? 'Verified rules, one run, no retries. A result stands. When your nations go out you can keep watching or start again.'
      : 'Assisted run. Three retries: each restores the tournament to the start of the round it went wrong in and simulates it again from scratch. A retry is a fresh attempt, not a guaranteed win — and results from an arcade run are labelled as such.'));

  pad.appendChild(h('h3', {}, `Follow ${S.setup.followed.length ? `(${S.setup.followed.length} selected)` : ''}`));
  pad.appendChild(h('p', {}, 'Pick one nation or several. Following more nations means you see more of their matches — it gives them no advantage, and every other nation still competes.'));

  const search = h('input', { class: 'search', placeholder: 'Search nations…', value: S.setup.query });
  search.addEventListener('input', e => { S.setup.query = e.target.value; renderGrid(); });
  pad.appendChild(search);

  const grid = h('div', { class: 'grid' });
  pad.appendChild(grid);

  function renderGrid() {
    grid.innerHTML = '';
    const q = S.setup.query.trim().toLowerCase();
    const codes = C.eligible().filter(code => {
      const t = team(code);
      return !q || t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.conf.toLowerCase().includes(q);
    }).sort((a, b) => team(a).name.localeCompare(team(b).name));
    for (const code of codes) {
      const t = team(code);
      const on = S.setup.followed.includes(code);
      const cell = h('div', { class: 'ncell' + (on ? ' on' : ''), onclick: () => toggle(code) },
        marbleEl(t, 'lg'),
        h('div', { class: 'code' }, t.code),
        h('div', { class: 'nm' }, t.name),
        h('div', { class: 'cf' }, C.entryStage && C.meta.id === 'afcq2026' ? (C.entryStage(code) === 'r1' ? 'RD 1' : 'RD 2') : t.conf));
      grid.appendChild(cell);
    }
  }
  function toggle(code) {
    const i = S.setup.followed.indexOf(code);
    if (i >= 0) S.setup.followed.splice(i, 1);
    else if (S.setup.followed.length >= 6) return toast('Follow up to six nations');
    else S.setup.followed.push(code);
    haptic(); renderGrid(); updateCta();
  }
  renderGrid();

  const cta = h('button', { class: 'btn', style: 'margin-top:14px', onclick: startCampaign });
  function updateCta() {
    cta.disabled = S.setup.followed.length === 0;
    cta.textContent = S.setup.followed.length === 0 ? 'Select at least one nation'
      : `Start ${S.setup.mode === 'arcade' ? 'arcade ' : ''}campaign`;
  }
  updateCta();
  pad.appendChild(cta);

  if (S.setup.followed.length && C.meta.id === 'afcq2026') {
    pad.appendChild(h('div', { class: 'note', style: 'margin-top:10px' },
      S.setup.followed.map(c2 => `${team(c2).name} enters at the ${C.entryStage(c2) === 'r1' ? 'first' : 'second'} round.`).join(' ')
      + ' A nation always enters at the stage its seeding puts it in.'));
  }
  root.appendChild(pad);
}

function startCampaign() {
  const c = createCampaign({
    competitionId: S.setup.competitionId,
    mode: S.setup.mode,
    followed: S.setup.followed.slice(),
  });
  checkpoint(c);
  S.campaign = c;
  save();
  go('draw');
}

// --- ruleset sheet ----------------------------------------------------------

function rulesetSheet(m) {
  const inner = h('div', { class: 'inner' },
    h('div', { class: 'grab' }),
    h('h2', {}, `${m.name} ${m.edition}`),
    h('p', {}, m.blurb),
    h('div', { class: 'kv' }, h('span', {}, 'Ruleset version'), h('b', {}, m.rulesetVersion)),
    h('div', { class: 'kv' }, h('span', {}, 'Simulation version'), h('b', {}, SIM_VERSION)),
    h('div', { class: 'kv' }, h('span', {}, 'Category'), h('b', {}, m.category)),
    h('div', { class: 'kv' }, h('span', {}, 'Group tiebreakers'), h('b', { class: 'tiny' }, m.groupTiebreakers.join(' → '))),
    h('h3', {}, 'Sources'),
    ...m.sources.map(s => h('div', { class: 'kv' }, h('a', { href: s.url, target: '_blank', rel: 'noopener' }, s.label))),
    h('h3', {}, 'Flags'),
    h('p', {}, 'Anything we could not confirm from a published source, or deliberately left out, is listed here rather than assumed.'),
    ...m.flags.map(f => h('div', { class: 'card' },
      h('span', { class: 'pill ' + (f.level === 'out-of-scope' ? '' : 'warn') }, f.level),
      h('p', { style: 'margin:8px 0 0' }, f.text))),
    h('button', { class: 'btn ghost', style: 'margin-top:12px', onclick: close }, 'Close'),
  );
  const sheet = h('div', { class: 'sheet', onclick: e => { if (e.target === sheet) close(); } }, inner);
  function close() { sheet.remove(); }
  $('#app').appendChild(sheet);
}

// --- draw ceremony ----------------------------------------------------------

function drawScreen(root) {
  const c = S.campaign;
  const pad = h('div', { class: 'pad' });
  root.appendChild(pad);

  if (!c.meta.drawSteps) return drawScreenTies(pad);

  const steps = c.meta.drawSteps;
  const letters = Object.keys(c.meta.groups);
  const placed = new Set();

  pad.appendChild(h('h2', {}, 'Final Draw'));
  const line = h('div', { class: 'drawline' }, 'Pot 1. The hosts take their places first.');
  const potsEl = h('div', { class: 'pots' });
  const gridEl = h('div', { class: 'groupgrid' });
  pad.appendChild(line); pad.appendChild(potsEl); pad.appendChild(gridEl);

  const pots = c.meta.pots || [];
  pots.forEach((pot, i) => {
    const el = h('div', { class: 'pot' }, h('h4', {}, 'POT ' + (i + 1)));
    for (const code of pot) {
      const m = h('div', { class: 'm', 'data-code': code }, marbleEl(team(code), 'sm'));
      el.appendChild(m);
    }
    potsEl.appendChild(el);
  });

  const cells = {};
  for (const g of letters) {
    const cell = h('div', { class: 'gcell' }, h('h5', {}, 'GROUP ' + g));
    for (let i = 0; i < 4; i++) cell.appendChild(h('div', { class: 'slot empty', 'data-i': i }, h('div', { class: 'mb sm' }), h('span', { class: 'cd' }, '—')));
    cells[g] = cell;
    gridEl.appendChild(cell);
  }

  const controls = h('div', { class: 'row', style: 'gap:8px;margin-top:14px' },
    h('button', { class: 'btn ghost', onclick: finish }, 'Skip to the groups'));
  pad.appendChild(controls);

  let idx = 0, timer = null;
  function apply(stepIndex) {
    const st = steps[stepIndex];
    if (!st) return;
    placed.add(st.code);
    const g = st.group;
    const list = c.meta.groups[g];
    // Fill the slot this team actually occupies once ordering is applied.
    const slotIndex = Math.min(list.indexOf(st.code) >= 0 ? list.indexOf(st.code) : cells[g].querySelectorAll('.slot:not(.empty)').length,
      3);
    const slot = cells[g].querySelectorAll('.slot')[slotIndex];
    slot.className = 'slot';
    slot.innerHTML = '';
    const t = team(st.code);
    const mb = marbleEl(t, 'sm');
    if (c.followed.includes(st.code)) mb.classList.add('fav');
    slot.appendChild(mb);
    slot.appendChild(h('span', { class: 'cd' }, t.code));
    const potMarble = potsEl.querySelector(`[data-code="${st.code}"]`);
    if (potMarble) potMarble.classList.add('used');
    cells[g].classList.add('hit');
    setTimeout(() => cells[g].classList.remove('hit'), 420);
    line.textContent = st.fixed
      ? `${t.name} is placed at ${g}1 as a host — hosts are not drawn.`
      : `${t.name} (Pot ${st.pot}) to Group ${g}. ${reason(st, g)}`;
    beep(520 + st.pot * 40, 0.05, 'triangle', 0.035);
    if (c.followed.includes(st.code)) { haptic('heavy'); beep(880, 0.12, 'sine', 0.06); }
  }

  function reason(st, g) {
    const t = team(st.code);
    const others = c.meta.groups[g].filter(x => x !== st.code && placed.has(x));
    const sameConf = others.filter(x => team(x).conf === t.conf);
    if (t.conf === 'UEFA') return `Europe may have two teams in a group; this makes ${sameConf.length + 1}.`;
    return sameConf.length ? '' : `No other ${CONFEDERATIONS[t.conf] || t.conf} team here — a valid placement.`;
  }

  function tick() {
    if (idx >= steps.length) return finish();
    apply(idx++);
    timer = setTimeout(tick, idx < 4 ? 620 : Math.max(105, 420 - idx * 7));
  }
  function finish() {
    clearTimeout(timer);
    while (idx < steps.length) apply(idx++);
    line.textContent = 'Draw complete. Twelve groups of four.';
    controls.innerHTML = '';
    controls.appendChild(h('button', { class: 'btn', onclick: () => { save(); go('journey'); } }, 'To the tournament'));
  }
  timer = setTimeout(tick, 500);
}

function drawScreenTies(pad) {
  const c = S.campaign;
  const r = currentRound(c);
  pad.appendChild(h('h2', {}, r.label + ' draw'));
  pad.appendChild(h('p', {}, r.note || ''));
  const list = h('div');
  pad.appendChild(list);
  r.ties.forEach((tie, i) => {
    setTimeout(() => {
      const mine = tie.teams.some(t => c.followed.includes(t));
      list.appendChild(fixtureRow(c, { teams: tie.teams, label: tie.label }, { mine }));
      if (mine) { haptic('heavy'); beep(880, 0.12); } else beep(560, 0.04, 'triangle', 0.03);
      list.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }, 180 * i);
  });
  setTimeout(() => pad.appendChild(h('button', { class: 'btn', style: 'margin-top:14px', onclick: () => { save(); go('journey'); } }, 'To the tournament')), 180 * r.ties.length + 200);
}

// --- journey ----------------------------------------------------------------

function journeyScreen(root) {
  const c = S.campaign;
  const pad = h('div', { class: 'pad' });
  root.appendChild(pad);

  if (c.finished) return finishedPanel(pad);

  const r = currentRound(c);
  const alive = aliveFollowed(c);

  if (alive.length === 0 && c.followed.length) {
    pad.appendChild(h('div', { class: 'consequence bad' },
      `Every nation you were following is out. ${c.followed.map(x => team(x).name).join(', ')} — eliminated.`));
    pad.appendChild(h('div', { class: 'row', style: 'gap:8px;margin-bottom:12px;flex-wrap:wrap' },
      h('button', { class: 'btn ghost sm', onclick: () => { toast('Keep watching — the tournament plays on'); } }, 'Keep watching'),
      h('button', { class: 'btn ghost sm', onclick: adoptNation }, 'Follow another nation'),
      h('button', { class: 'btn ghost sm', onclick: () => go('home') }, 'New campaign')));
    if (c.mode === 'arcade' && c.lives - c.livesUsed > 0 && c.checkpoint) {
      pad.appendChild(h('div', { class: 'card' },
        h('div', { style: 'font-weight:700' }, `Arcade retry (${c.lives - c.livesUsed} left)`),
        h('p', { style: 'margin:6px 0 10px' }, `Restores the tournament to the start of ${c.checkpoint.label} and simulates that round again from scratch, with new seeds. It is a fresh attempt, not a guaranteed win.`),
        h('button', { class: 'btn gold', onclick: useRetry }, 'Use a retry')));
    }
  }

  // next match CTA
  const wave = pendingWave(c);
  if (wave.length) {
    const pick = wave.find(f => f.teams.some(t => c.followed.includes(t))) || wave[0];
    pad.appendChild(h('div', { class: 'card tap', onclick: () => openLive(pick) },
      h('div', { class: 'row between' },
        h('div', {}, h('div', { class: 'tiny muted' }, 'NEXT MATCH · ' + pick.label),
          h('div', { style: 'font-weight:700;font-size:15px;margin-top:3px' }, `${team(pick.teams[0]).name} v ${team(pick.teams[1]).name}`)),
        h('span', { class: 'pill' }, arenaName(pick.arenaId))),
      h('button', { class: 'btn', style: 'margin-top:11px' }, 'Watch')));
    if (wave.length > 1) {
      pad.appendChild(h('p', { class: 'tiny' }, `${wave.length - 1} other ${wave.length === 2 ? 'match' : 'matches'} in this round will be simulated at the same time. Tap any fixture below to watch that one instead.`));
    }
  }

  pad.appendChild(h('div', { class: 'seg' },
    ...[['fixtures', 'Fixtures'], ['tables', r && r.kind === 'groups' ? 'Tables' : 'Path'], ['bracket', 'Bracket']]
      .map(([id, label]) => h('button', { 'aria-pressed': S.journeyTab === id, onclick: () => { S.journeyTab = id; render(); } }, label))));

  if (S.journeyTab === 'fixtures') fixturesTab(pad, c, r);
  else if (S.journeyTab === 'tables') tablesTab(pad, c, r);
  else bracketTab(pad, c);
}

function pendingWave(c) {
  const r = currentRound(c);
  if (!r) return [];
  const pending = r.fixtures.filter(f => !f.result);
  if (!pending.length) return [];
  const md = Math.min(...pending.map(f => f.matchday ?? 0));
  return pending.filter(f => (f.matchday ?? 0) === md);
}

function fixtureRow(c, f, opts = {}) {
  const mine = opts.mine ?? f.teams.some(t => c.followed.includes(t));
  const row = h('div', { class: 'fx' + (mine ? ' mine' : '') + (opts.next ? ' next' : '') });
  const side = (code, right) => {
    const t = team(code);
    const fav = c.followed.includes(code);
    const el = h('div', { class: 'side' + (right ? ' r' : '') });
    const mb = marbleEl(t, 'sm');
    if (fav) mb.classList.add('fav');
    const cd = h('span', { class: 'codechip' + (fav ? ' fav' : '') }, t.code);
    const nm = h('div', { class: 'nm' }, (fav ? '★ ' : '') + t.name);
    if (right) { el.appendChild(nm); el.appendChild(cd); el.appendChild(mb); }
    else { el.appendChild(mb); el.appendChild(cd); el.appendChild(nm); }
    return el;
  };
  row.appendChild(side(f.teams[0], false));
  const score = f.result
    ? `${f.result.score[0]}–${f.result.score[1]}`
    : (opts.clickable ? '▶' : 'v');
  row.appendChild(h('div', { class: 'sc' + (f.result ? '' : ' dim') }, score));
  row.appendChild(side(f.teams[1], true));
  if (opts.clickable && !f.result) { row.style.cursor = 'pointer'; row.addEventListener('click', () => openLive(f)); }
  if (f.result && f.result.pens) row.appendChild(h('div', { class: 'tiny dim', style: 'width:100%;text-align:center;margin-top:4px' }, `${f.result.pens[0]}–${f.result.pens[1]} on penalties`));
  return row;
}

function fixturesTab(pad, c, r) {
  if (!r) return;
  const byDay = new Map();
  for (const f of r.fixtures) {
    const k = f.matchday ?? 1;
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k).push(f);
  }
  const wave = pendingWave(c);
  const nextPick = wave.find(f => f.teams.some(t => c.followed.includes(t))) || wave[0];
  for (const [md, list] of [...byDay.entries()].sort((a, b) => a[0] - b[0])) {
    pad.appendChild(h('h3', {}, r.kind === 'groups' ? `Matchday ${md}` : (r.ties[0] && r.ties[0].legs === 2 ? `Leg ${md}` : r.label)));
    const mine = list.filter(f => f.teams.some(t => c.followed.includes(t)));
    const rest = list.filter(f => !mine.includes(f));
    for (const f of mine.concat(rest)) {
      pad.appendChild(fixtureRow(c, f, { clickable: wave.includes(f), next: nextPick === f }));
    }
  }
  if (r.note) pad.appendChild(h('div', { class: 'note' }, r.note));
}

function tablesTab(pad, c, r) {
  if (!r) return;
  if (r.kind !== 'groups') {
    pad.appendChild(h('h3', {}, 'Route to the trophy'));
    for (const code of c.followed) {
      const out = isEliminated(c, code);
      pad.appendChild(h('div', { class: 'card' },
        teamChip(team(code), { fav: true, size: 'lg' }),
        h('div', { class: 'hr' }),
        ...c.rounds.map(rd => {
          const f = rd.fixtures.filter(x => x.teams.includes(code) && x.result);
          if (!f.length) return null;
          return h('div', { class: 'kv' },
            h('span', { class: 'tiny' }, rd.label),
            h('b', { class: 'tiny' }, f.map(x => {
              const i = x.teams.indexOf(code);
              const opp = team(x.teams[1 - i]).code;
              return `${x.result.score[i]}–${x.result.score[1 - i]} v ${opp}`;
            }).join(' · ')));
        }),
        h('div', { class: out ? 'consequence bad' : 'consequence', style: 'margin-top:10px' },
          out ? `Eliminated — ${out}.` : 'Still in.')));
    }
    return;
  }
  const letters = Object.keys(r.groups);
  for (const g of letters) {
    const tbl = groupTable(c, r, g);
    pad.appendChild(h('h3', {}, 'Group ' + g));
    const t = h('table', {},
      h('thead', {}, h('tr', {},
        h('th', {}, 'Team'), h('th', {}, 'P'), h('th', {}, 'W'), h('th', {}, 'D'), h('th', {}, 'L'),
        h('th', {}, 'GD'), h('th', {}, 'Pts'))),
      h('tbody', {}, ...tbl.map((row, i) => {
        const adv = advanceCount(c);
        const cls = [i < adv ? 'qual' : (i === 2 && c.competitionId === 'wc2026' ? 'third' : ''),
          c.followed.includes(row.code) ? 'me' : ''].filter(Boolean).join(' ');
        const nameCell = h('td', {});
        const line = h('div', { class: 'teamline' });
        const mb = marbleEl(team(row.code), 'sm');
        if (c.followed.includes(row.code)) mb.classList.add('fav');
        line.appendChild(mb);
        line.appendChild(h('span', { class: 'code' + (c.followed.includes(row.code) ? ' fav' : '') }, team(row.code).code));
        line.appendChild(h('span', { class: 'nm', style: 'font-size:12.5px;color:var(--muted)' }, team(row.code).name));
        nameCell.appendChild(line);
        return h('tr', { class: cls },
          h('td', { class: 'pos' }, String(i + 1)), nameCell,
          h('td', {}, row.p), h('td', {}, row.w), h('td', {}, row.d), h('td', {}, row.l),
          h('td', {}, (row.gd > 0 ? '+' : '') + row.gd), h('td', {}, h('b', {}, row.pts)));
      })));
    // header cell alignment fix: prepend position header
    t.querySelector('thead tr').insertBefore(h('th', {}, ''), t.querySelector('thead tr').firstChild);
    pad.appendChild(t);
    const sep = tbl.filter(x => x.sep).map(x => `${team(x.code).code} separated on ${x.sep}`);
    if (sep.length) pad.appendChild(h('div', { class: 'tiny dim', style: 'margin-top:6px' }, sep.join(' · ')));
  }
  if (c.competitionId === 'wc2026' && r.id === 'group') {
    pad.appendChild(h('div', { class: 'note' }, 'Top two in each group go through. The eight best third-placed teams across all twelve groups also reach the round of 32.'));
  }
}

function advanceCount(c) {
  const r = currentRound(c);
  if (c.competitionId === 'wc2026') return 2;
  if (!r) return 2;
  if (r.id === 'r2') return 2;
  if (r.id === 'r3') return 2;
  if (r.id === 'r4') return 1;
  return 2;
}

function bracketTab(pad, c) {
  const rounds = c.rounds.filter(r => r.kind === 'ties');
  if (!rounds.length) return pad.appendChild(h('p', {}, 'The bracket appears once the group stage is done.'));
  const wrap = h('div', { class: 'bracket' });
  for (const r of rounds) {
    const col = h('div', { class: 'bcol' }, h('h5', {}, r.label));
    for (const tie of r.ties) {
      const mine = tie.teams.some(t => c.followed.includes(t));
      const box = h('div', { class: 'btie' + (mine ? ' mine' : '') });
      for (const code of tie.teams) {
        if (!code) { box.appendChild(h('div', { class: 'r dim' }, '—')); continue; }
        const won = tie.winner === code, lost = tie.winner && tie.winner !== code;
        const row = h('div', { class: 'r' + (won ? ' w' : lost ? ' l' : '') });
        const mb = marbleEl(team(code), 'sm');
        if (c.followed.includes(code)) mb.classList.add('fav');
        row.appendChild(mb);
        row.appendChild(h('span', { class: 'nm' }, team(code).code + ' · ' + team(code).name));
        const f = r.fixtures.find(x => x.tieId === tie.id && x.result);
        if (f) row.appendChild(h('span', { class: 'mono' }, String(f.result.score[f.teams.indexOf(code)])));
        box.appendChild(row);
      }
      if (tie.summary) box.appendChild(h('div', { class: 'tiny dim', style: 'margin-top:3px' }, tie.summary));
      col.appendChild(box);
    }
    wrap.appendChild(col);
  }
  pad.appendChild(wrap);
}

function adoptNation() {
  const c = S.campaign;
  const r = currentRound(c);
  const remaining = r ? (r.kind === 'groups' ? Object.values(r.groups).flat() : r.ties.flatMap(t => t.teams)) : [];
  const options = [...new Set(remaining)].filter(Boolean).filter(x => !c.followed.includes(x));
  const inner = h('div', { class: 'inner' }, h('div', { class: 'grab' }),
    h('h2', {}, 'Follow another nation'),
    h('p', {}, 'You keep your history with the nations you have already followed. This simply adds another to watch — it changes nothing about the tournament.'),
    h('div', { class: 'grid' }, ...options.sort((a, b) => team(a).name.localeCompare(team(b).name)).map(code =>
      h('div', { class: 'ncell', onclick: () => { c.followed.push(code); save(); sheet.remove(); render(); } },
        marbleEl(team(code), 'lg'), h('div', { class: 'nm' }, team(code).name)))));
  const sheet = h('div', { class: 'sheet', onclick: e => { if (e.target === sheet) sheet.remove(); } }, inner);
  $('#app').appendChild(sheet);
}

// --- arcade retry -----------------------------------------------------------

function checkpoint(c) {
  const r = c.rounds[c.current];
  if (!r) return;
  const copy = { ...c, checkpoint: null };
  c.checkpoint = { roundIndex: c.current, label: r.label, snapshot: JSON.stringify(copy), salt: c.retrySalt || 0 };
}

function useRetry() {
  const c = S.campaign;
  if (c.mode !== 'arcade' || c.livesUsed >= c.lives || !c.checkpoint) return;
  const restored = JSON.parse(c.checkpoint.snapshot);
  restored.livesUsed = c.livesUsed + 1;
  restored.retrySalt = (c.retrySalt || 0) + 1;
  restored.assisted = true;
  // Fresh seeds for every fixture in the restored round: a new simulation, not
  // a re-roll of the same one, and definitely not a guaranteed win.
  const r = restored.rounds[restored.current];
  for (const f of r.fixtures) {
    f.result = null;
    f.seed = seedFor(restored.seed, r.id, f.id, 'retry' + restored.retrySalt);
  }
  for (const tie of r.ties || []) { tie.winner = null; tie.loser = null; tie.summary = null; }
  r.eliminated = [];
  restored.checkpoint = c.checkpoint;
  S.campaign = restored;
  save();
  toast(`Retry used — ${r.label} restarts`);
  go('journey');
}

// --- live match -------------------------------------------------------------

function openLive(fixture) {
  const c = S.campaign;
  const m = createMatch(matchConfigFor(c, fixture));
  S.live = { fixture, match: m, speed: S.settings.speed || 1, playing: true, acc: 0, replay: false, seenGoals: 0, cut: null, cutAcc: 0 };
  go('live');
}

function liveScreen(app) {
  const { fixture } = S.live;
  const c = S.campaign;
  const m = S.live.match;
  const [a, b] = fixture.teams.map(team);
  S.live.cam = S.live.cam || { mode: S.settings.camera || 'wide', zoom: 1, panX: 0, panY: 0, focus: 0 };
  const cam = S.live.cam;

  const scoreEl = h('div', { class: 'score mono' }, `${m.score[0]}–${m.score[1]}`);
  const clockEl = h('div', { class: 'clockline' },
    h('span', {}, fixture.label), h('span', {}, '·'),
    h('span', { class: 'mono', id: 'clock' }, "0'"), h('span', {}, '·'),
    h('span', {}, arenaName(fixture.arenaId)));

  const sideEl = (t, right) => {
    const el = h('div', { class: 't' + (right ? ' r' : '') });
    const mb = marbleEl(t, '');
    if (c.followed.includes(t.code)) mb.classList.add('fav');
    const nm = h('div', { class: 'nm' }, t.code);
    if (right) { el.appendChild(nm); el.appendChild(mb); } else { el.appendChild(mb); el.appendChild(nm); }
    return el;
  };

  const board = h('div', {},
    h('div', { class: 'scoreboard' }, sideEl(a, false), scoreEl, sideEl(b, true)), clockEl);

  const canvas = h('canvas', { id: 'arena' });
  const flash = h('div', { class: 'bigflash' });
  const badge = h('div', { class: 'cutbadge', hidden: true }, 'GOAL REPLAY');
  const wrap = h('div', { class: 'arena-wrap' }, canvas, flash, badge);

  // Arena card: each match announces which challenge it is, so nine arenas read
  // as nine different games rather than one pitch with the furniture moved.
  const meta = ARENA_META[fixture.arenaId] || {};
  const card = h('div', { class: 'arenacard' },
    h('div', { class: 'k' }, 'ARENA ' + (Object.keys(ARENA_META).indexOf(fixture.arenaId) + 1).toString().padStart(2, '0')),
    h('div', { class: 'n' }, meta.name || fixture.arenaId),
    h('div', { class: 'r' }, meta.rule || ''));
  wrap.appendChild(card);
  setTimeout(() => card.remove(), 2700);

  const ticker = h('div', { class: 'ticker' });
  const hint = h('div', { class: 'hint' }, 'Tap a marble to follow it · drag to pan · pinch to zoom · tap a goal below to see it again');

  const speedBtn = v => h('button', {
    'aria-pressed': S.live.speed === v,
    onclick: () => { S.live.speed = v; S.settings.speed = v; store.saveSettings(S.settings); renderControls(); },
  }, v + '×');
  const controls = h('div', { class: 'controls' });
  function camLabel() {
    return cam.mode === 'focus' ? team(fixture.teams[cam.focus]).code : cam.mode === 'close' ? 'Close' : 'Wide';
  }
  function renderControls() {
    controls.innerHTML = '';
    controls.appendChild(speedBtn(1));
    controls.appendChild(speedBtn(2));
    controls.appendChild(speedBtn(4));
    controls.appendChild(h('button', {
      'aria-pressed': cam.mode !== 'wide' || cam.zoom !== 1,
      onclick: () => {
        cam.mode = cam.mode === 'wide' ? 'close' : 'wide';
        cam.zoom = 1; cam.panX = 0; cam.panY = 0;
        S.settings.camera = cam.mode; store.saveSettings(S.settings); renderControls();
      },
    }, camLabel()));
    controls.appendChild(h('button', { onclick: skip }, 'Skip ⏭'));
  }
  renderControls();

  app.innerHTML = '';
  app.appendChild(h('div', { class: 'topbar' },
    h('button', { class: 'iconbtn', onclick: () => { stop(); go('journey'); } }, '‹'),
    h('h1', {}, `${a.code} v ${b.code}`, h('div', { class: 'sub' }, `${a.name} v ${b.name}${S.live.replay ? ' · REPLAY' : ''}`)),
  ));
  app.appendChild(board);
  app.appendChild(wrap);
  app.appendChild(hint);
  app.appendChild(ticker);
  app.appendChild(controls);

  const renderer = makeRenderer(canvas);
  const ro = new ResizeObserver(() => renderer.resize());
  ro.observe(canvas);
  renderer.resize();

  // --- gestures. All of this is camera and decoration; none of it touches the
  // simulation, so a match watched zoomed in produces the same score. ---------
  const pointers = new Map();
  let moved = 0, lastPinch = 0;
  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = 0; lastPinch = 0;
  });
  canvas.addEventListener('pointermove', e => {
    const p = pointers.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    if (pointers.size === 1) {
      const k = canvas.width / canvas.getBoundingClientRect().width;
      cam.panX += dx * k; cam.panY += dy * k;
      if (cam.mode === 'focus') cam.mode = 'close';
    } else if (pointers.size === 2) {
      const [p1, p2] = [...pointers.values()];
      const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (lastPinch) cam.zoom = Math.min(4, Math.max(1, cam.zoom * (d / lastPinch)));
      lastPinch = d;
    }
  });
  const endPointer = e => {
    const had = pointers.size;
    pointers.delete(e.pointerId);
    if (had !== 1 || moved > 10) return;
    const w = renderer.toWorld(m, cam, e.clientX, e.clientY);
    const hit = m.world.bodies.findIndex(bd => bd.alive && Math.hypot(bd.x - w.x, bd.y - w.y) < 7);
    if (hit >= 0) {
      if (cam.mode === 'focus' && cam.focus === hit) { cam.mode = 'wide'; cam.zoom = 1; }
      else { cam.mode = 'focus'; cam.focus = hit; cam.panX = 0; cam.panY = 0; }
      haptic(); beep(700, 0.05, 'triangle', 0.03);
    } else {
      cheer(e.clientX, e.clientY);
    }
    renderControls();
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    cam.zoom = Math.min(4, Math.max(1, cam.zoom * (e.deltaY < 0 ? 1.12 : 0.89)));
  }, { passive: false });

  function cheer(px, py) {
    if (!S.settings.reducedMotion) {
      const r = wrap.getBoundingClientRect();
      const el = h('div', { class: 'ripple', style: `left:${px - r.left}px;top:${py - r.top}px` });
      wrap.appendChild(el);
      setTimeout(() => el.remove(), 600);
    }
    haptic();
    beep(300 + Math.random() * 90, 0.13, 'sawtooth', 0.02);
  }

  // --- goal replay cutaway ---------------------------------------------------
  function replayGoal(ev) {
    const m2 = createMatch(matchConfigFor(c, fixture));
    const from = Math.max(0, ev.t - 2.4);
    let guard = 0;
    while (m2.world.t < from && !m2.finished && guard++ < 120 * 400) stepMatch(m2);
    S.live.cut = { m: m2, until: ev.t + 1.6 };
    badge.hidden = false;
    beep(520, 0.07, 'triangle', 0.04);
  }

  let raf = null, last = performance.now(), stopped = false;
  function stop() { stopped = true; cancelAnimationFrame(raf); ro.disconnect(); }
  S.live.stop = stop;

  function pushEvents() {
    while (S.live.seenGoals < m.events.length) {
      const e = m.events[S.live.seenGoals++];
      if (!['kickoff', 'goal', 'drain', 'halftime', 'fulltime', 'pens', 'pen', 'etbreak', 'result'].includes(e.type)) continue;
      const who = e.team != null ? team(fixture.teams[e.team]).code : '';
      const row = h('div', { class: e.type === 'goal' ? 'goal' : '' },
        h('span', { class: 't' }, e.clock),
        h('span', {}, e.type === 'goal' ? h('b', {}, `GOAL — ${who}`) : (who ? `${who} — ${e.text}` : e.text)));
      if (e.type === 'goal') {
        row.title = 'Watch this goal again';
        row.addEventListener('click', () => replayGoal(e));
        row.appendChild(h('span', { class: 'tiny dim', style: 'margin-left:auto' }, '↻'));
      }
      ticker.appendChild(row);
      ticker.scrollTop = ticker.scrollHeight;
      if (e.type === 'goal') {
        flash.textContent = 'GOAL';
        flash.style.color = '#ffffff';
        flash.classList.remove('on'); void flash.offsetWidth; flash.classList.add('on');
        beep(660, 0.18, 'square', 0.06); setTimeout(() => beep(880, 0.22, 'square', 0.05), 120);
        haptic('goal');
      } else if (e.type === 'pen') {
        beep(e.text.startsWith('Scored') ? 760 : 220, 0.12, 'triangle', 0.05);
      }
    }
  }

  function trails(match) {
    for (const bd of match.world.bodies) {
      if (!bd.alive) { bd.trail.length = 0; continue; }
      bd.trail.push({ x: bd.x, y: bd.y });
      if (bd.trail.length > 26) bd.trail.shift();
    }
  }

  function frame(now) {
    if (stopped) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    const cut = S.live.cut;
    if (cut) {
      let acc = (S.live.cutAcc || 0) + dt;
      let guard = 0;
      while (acc >= STEP && !cut.m.finished && guard++ < 2000) { stepMatch(cut.m); acc -= STEP; }
      S.live.cutAcc = acc;
      trails(cut.m);
      if (cut.m.phase === 'pens') renderer.drawPens(cut.m, { followed: c.followed });
      else renderer.draw(cut.m, { camera: { mode: 'close' }, followed: c.followed, reducedMotion: S.settings.reducedMotion });
      if (cut.m.world.t >= cut.until || cut.m.finished) { S.live.cut = null; badge.hidden = true; }
      raf = requestAnimationFrame(frame);
      return;
    }

    if (!m.finished) {
      S.live.acc += dt * S.live.speed;
      let guard = 0;
      while (S.live.acc >= STEP && !m.finished && guard++ < 2000) { stepMatch(m); S.live.acc -= STEP; }
      trails(m);
    }
    scoreEl.textContent = `${m.score[0]}–${m.score[1]}`;
    const ck = $('#clock'); if (ck) ck.textContent = clockText(m);
    pushEvents();
    if (m.phase === 'pens') renderer.drawPens(m, { followed: c.followed });
    else renderer.draw(m, { camera: cam, followed: c.followed, reducedMotion: S.settings.reducedMotion });
    if (m.finished) { stop(); setTimeout(finishMatch, 700); return; }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  function skip() { runToEnd(m); pushEvents(); stop(); finishMatch(); }

  function finishMatch() {
    if (S.live.replay) { go('result'); return; }
    store.recordArena(fixture.arenaId);
    const res = resultOf(m);
    playFixture(c, S.live.fixture, res);
    playRestOfMatchday(c, S.live.fixture);
    if (roundIsComplete(c)) {
      const finishedRound = currentRound(c);
      const next = advance(c);
      S.live.roundClosed = finishedRound;
      if (next) checkpoint(c);
      if (!next) { c.finished = true; store.recordFinish(c, comp()); }
    }
    save();
    go('result');
  }
}

// --- result -----------------------------------------------------------------

function resultScreen(root) {
  const c = S.campaign, { fixture } = S.live;
  const m = S.live.match;
  const pad = h('div', { class: 'pad' });
  root.appendChild(pad);
  const [a, b] = fixture.teams.map(team);
  const res = fixture.result || resultOf(m);

  const big = h('div', { class: 'card', style: 'text-align:center' },
    h('div', { class: 'tiny muted' }, fixture.label + ' · ' + arenaName(fixture.arenaId)),
    h('div', { class: 'row', style: 'justify-content:center;gap:14px;margin:12px 0 6px' },
      h('div', { style: 'display:grid;justify-items:center;gap:6px;flex:1' }, marbleEl(a, 'lg'), h('div', { class: 'tiny' }, a.name)),
      h('div', { class: 'mono', style: 'font:800 34px/1 inherit' }, `${res.score[0]}–${res.score[1]}`),
      h('div', { style: 'display:grid;justify-items:center;gap:6px;flex:1' }, marbleEl(b, 'lg'), h('div', { class: 'tiny' }, b.name))),
    res.pens ? h('div', { class: 'tiny muted' }, `${res.pens[0]}–${res.pens[1]} on penalties`) : null,
    res.decidedBy === 'aet' ? h('div', { class: 'tiny muted' }, 'After extra time') : null,
    h('div', { class: 'tiny dim', style: 'margin-top:8px' }, `${res.shots[0] + res.shots[1]} clear chances · simulation ${res.simVersion} · seed ${res.seed}`));
  pad.appendChild(big);

  const involved = fixture.teams.filter(t => c.followed.includes(t));
  for (const code of (involved.length ? involved : fixture.teams)) {
    const txt = consequenceFor(c, fixture, code);
    if (!txt) continue;
    const bad = /Eliminated|cannot|Runners-up|Fourth/.test(txt);
    const good = /Qualified|Through|champions|Third place/.test(txt);
    pad.appendChild(h('div', { class: 'consequence' + (bad ? ' bad' : good ? '' : ' neutral') },
      h('span', { style: 'opacity:.75' }, team(code).name + ' — '), txt));
  }

  pad.appendChild(h('div', { class: 'row', style: 'gap:8px;margin:12px 0' },
    h('button', { class: 'btn ghost', onclick: replay }, '↻ Replay'),
    h('button', { class: 'btn', onclick: next }, S.live.roundClosed ? 'Round summary' : 'Continue')));
  pad.appendChild(h('p', { class: 'tiny' }, 'Replay shows this same match again, event for event. It cannot change the result — only an explicit new attempt could, and that is an arcade feature.'));

  if (S.live.roundClosed) roundSummary(pad, S.live.roundClosed);

  function replay() {
    S.live = { fixture, match: createMatch(matchConfigFor(c, fixture)), speed: S.live.speed, playing: true, acc: 0, replay: true, seenGoals: 0, cut: null, cutAcc: 0, roundClosed: S.live.roundClosed };
    go('live');
  }
  function next() {
    if (c.finished) return go('journey');
    if (S.live.roundClosed && !S.settings.premium && canShowAd()) return showAd(() => go('journey'));
    go('journey');
  }
}

function roundSummary(pad, round) {
  const c = S.campaign;
  pad.appendChild(h('h3', {}, round.label + ' complete'));
  if (round.qualified && round.qualified.length) {
    pad.appendChild(h('div', { class: 'consequence' }, 'Qualified: ' + round.qualified.map(x => team(x).name).join(', ')));
  }
  const mine = c.followed.filter(x => round.eliminated.includes(x));
  if (mine.length) pad.appendChild(h('div', { class: 'consequence bad' }, mine.map(x => team(x).name).join(', ') + (mine.length > 1 ? ' are out.' : ' is out.')));
  const nextR = currentRound(c);
  if (nextR) {
    pad.appendChild(h('p', {}, nextR.note || `${nextR.label} next.`));
    const ours = nextR.kind === 'ties' ? nextR.ties.filter(t => t.teams.some(x => c.followed.includes(x))) : [];
    for (const t of ours) pad.appendChild(fixtureRow(c, { teams: t.teams, label: t.label }, { mine: true }));
  }
}

// --- ads (free tier demonstration) ------------------------------------------
//
// Never during live marble action, a decisive replay, or a trophy celebration.
// Only at a round break, at most once every three minutes.

function canShowAd() {
  return Date.now() - S.lastAd > 180000;
}
function showAd(done) {
  S.lastAd = Date.now();
  S.settings.adsSeen = (S.settings.adsSeen || 0) + 1;
  store.saveSettings(S.settings);
  let left = 4;
  const count = h('div', { class: 'tiny dim' }, `Continue in ${left}…`);
  const btn = h('button', { class: 'btn', disabled: true, onclick: () => { sheet.remove(); done(); } }, 'Continue');
  const inner = h('div', { class: 'inner', style: 'text-align:center' },
    h('div', { class: 'grab' }),
    h('div', { style: 'font-size:42px;margin:8px 0' }, '▣'),
    h('h2', {}, 'Ad break'),
    h('p', {}, 'A placeholder for the free tier. Real breaks only ever appear here — between rounds — never during marble action, a decisive replay or a trophy celebration.'),
    count, btn,
    h('button', { class: 'btn gold', style: 'margin-top:8px', onclick: () => { S.settings.premium = true; store.saveSettings(S.settings); sheet.remove(); toast('Premium enabled (prototype)'); done(); } }, 'Remove ads — Premium'));
  const sheet = h('div', { class: 'sheet' }, inner);
  $('#app').appendChild(sheet);
  const iv = setInterval(() => {
    left--;
    if (left <= 0) { clearInterval(iv); count.textContent = ''; btn.disabled = false; }
    else count.textContent = `Continue in ${left}…`;
  }, 1000);
}

// --- finished campaign ------------------------------------------------------

function finishedPanel(pad) {
  const c = S.campaign;
  if (c.competitionId === 'wc2026') {
    const won = c.followed.includes(c.champion);
    pad.appendChild(h('div', { class: 'trophy' },
      h('div', { class: 'cup' }, won ? '🏆' : '🎖'),
      h('h2', {}, `${team(c.champion).name} are world champions`),
      marbleEl(team(c.champion), 'lg'),
      h('p', {}, won ? 'Your nation went all the way.' : `${c.followed.map(x => team(x).name).join(', ')} could not stop them. Somebody had to lift it.`),
      c.mode === 'arcade' ? h('span', { class: 'pill warn' }, 'Arcade run — assisted') : h('span', { class: 'pill ok' }, 'Authentic run'),
    ));
    pad.appendChild(h('div', { class: 'card' },
      h('div', { class: 'kv' }, h('span', {}, 'Runner-up'), h('b', {}, team(c.meta.runnerUp).name)),
      h('div', { class: 'kv' }, h('span', {}, 'Third'), h('b', {}, team(c.meta.third).name)),
      h('div', { class: 'kv' }, h('span', {}, 'Ruleset'), h('b', {}, c.rulesetVersion)),
      h('div', { class: 'kv' }, h('span', {}, 'Seed'), h('b', { class: 'mono' }, String(c.seed)))));
  } else {
    const C = COMPETITIONS.afcq2026;
    pad.appendChild(h('h2', {}, 'Qualification complete'));
    for (const code of c.followed) {
      const o = c.meta.outcome[code];
      pad.appendChild(h('div', { class: 'consequence' + (o === 'qualified' ? '' : o === 'playoff' ? ' neutral' : ' bad') },
        h('span', { style: 'opacity:.75' }, team(code).name + ' — '), C.outcomeText(c, code)));
    }
    pad.appendChild(h('div', { class: 'card' },
      h('h3', { style: 'margin-top:0' }, 'Asia’s nine'),
      ...c.meta.qualified.map(x => h('div', { class: 'kv' }, teamChip(team(x), { fav: c.followed.includes(x) }), h('b', { class: 'pill ok' }, 'World Cup'))),
      h('div', { class: 'kv' }, teamChip(team(c.meta.playoffRep), { fav: c.followed.includes(c.meta.playoffRep) }), h('b', { class: 'pill warn' }, 'Play-off')),
      h('div', { class: 'note warn', style: 'margin-top:10px' }, 'Eight nations qualified. The ninth has only reached the inter-confederation play-off, which is a separate tournament and is not part of this ruleset. Reaching it is not qualifying.')));
  }
  pad.appendChild(h('button', { class: 'btn', style: 'margin-top:12px', onclick: () => { store.clearCampaign(); S.campaign = null; go('home'); } }, 'Start another journey'));
}

// --- collection & settings --------------------------------------------------

function cabinetScreen(root) {
  const pad = h('div', { class: 'pad' });
  root.appendChild(pad);
  const cab = store.loadCabinet();

  pad.appendChild(h('h3', { style: 'margin-top:0' }, 'Trophy cabinet'));
  if (!cab.trophies.length) pad.appendChild(h('p', {}, 'Empty. Win a competition with a nation you are following and it lands here.'));
  for (const t of cab.trophies) {
    pad.appendChild(h('div', { class: 'card row', style: 'gap:12px' },
      h('div', { style: 'font-size:28px' }, '🏆'),
      h('div', { class: 'spread' },
        h('div', { style: 'font-weight:700' }, `${team(t.nation).name}`),
        h('div', { class: 'tiny muted' }, `${t.competition} ${t.edition}`)),
      t.mode === 'arcade' ? h('span', { class: 'pill warn' }, 'arcade') : h('span', { class: 'pill ok' }, 'authentic')));
  }

  pad.appendChild(h('h3', {}, `Arena index · ${Object.keys(cab.arenas || {}).length}/${ARENA_IDS.length}`));
  pad.appendChild(h('p', {}, 'Twenty-five arenas. Tier 1 turns up in group stages, tier 5 only in a final. Every one of them is exactly symmetric end to end — none of them favours a nation.'));
  const tiers = [...new Set(ARENA_IDS.map(id => ARENA_META[id].tier))].sort();
  for (const tier of tiers) {
    pad.appendChild(h('div', { class: 'tierhead' }, `TIER ${tier}`));
    for (const id of ARENA_IDS.filter(i => ARENA_META[i].tier === tier)) {
      const n = (cab.arenas || {})[id] || 0;
      const meta = ARENA_META[id];
      pad.appendChild(h('div', { class: 'arow' + (n ? '' : ' locked') },
        h('span', { class: 'anum' }, String(ARENA_IDS.indexOf(id) + 1).padStart(2, '0')),
        h('div', { class: 'spread' },
          h('div', { class: 'anm' }, meta.name),
          h('div', { class: 'tiny muted' }, meta.rule)),
        h('span', { class: 'pill' + (n ? ' ok' : '') }, n ? `${n}` : '—')));
    }
  }

  pad.appendChild(h('h3', {}, 'Campaign history'));
  if (!cab.campaigns.length) pad.appendChild(h('p', {}, 'No completed campaigns yet.'));
  for (const e of cab.campaigns.slice(0, 12)) {
    pad.appendChild(h('div', { class: 'card' },
      h('div', { class: 'row between' },
        h('div', {}, h('div', { style: 'font-weight:650;font-size:14px' }, `${e.competition} ${e.edition}`),
          h('div', { class: 'tiny muted' }, e.followed.map(x => team(x).name).join(', '))),
        h('span', { class: 'pill' + (e.mode === 'arcade' ? ' warn' : '') }, e.mode)),
      e.champion ? h('div', { class: 'tiny', style: 'margin-top:7px' }, 'Won by ' + team(e.champion).name) : null,
      e.qualified ? h('div', { class: 'tiny', style: 'margin-top:7px' }, 'Qualified: ' + e.qualified.map(x => team(x).code).join(' ')) : null));
  }

  pad.appendChild(h('h3', {}, 'Premium'));
  pad.appendChild(h('div', { class: 'card' },
    h('div', { class: 'row between' },
      h('div', { class: 'spread' }, h('div', { style: 'font-weight:700' }, 'Marble Nations Premium'),
        h('div', { class: 'tiny muted' }, 'One-time purchase · non-consumable')),
      h('span', { class: 'pill ' + (S.settings.premium ? 'ok' : '') }, S.settings.premium ? 'Owned' : 'Not owned')),
    h('ul', { class: 'tiny muted', style: 'margin:10px 0 12px;padding-left:18px;line-height:1.7' },
      h('li', {}, 'No ads, permanently'),
      h('li', {}, 'Ten arcade retries per campaign instead of three'),
      h('li', {}, 'Marble trails, arena themes and trophy-room customisation'),
      h('li', {}, 'Included benefits never require watching a rewarded ad')),
    S.settings.premium
      ? h('button', { class: 'btn ghost', onclick: () => { S.settings.premium = false; store.saveSettings(S.settings); render(); } }, 'Reset (prototype only)')
      : h('button', { class: 'btn gold', onclick: () => { S.settings.premium = true; store.saveSettings(S.settings); toast('Premium enabled (prototype)'); render(); } }, 'Unlock — prototype, no payment'),
    h('button', { class: 'btn ghost', style: 'margin-top:8px', onclick: () => toast('Restore purchases: nothing to restore in the prototype') }, 'Restore purchases'),
    h('p', { class: 'tiny', style: 'margin-top:10px' }, 'In the shipping app this is a StoreKit non-consumable, kept separate from any future consumable product, with explicit restore and purchase-failure states.')));

  pad.appendChild(h('h3', {}, 'Settings'));
  const toggle = (key, label, note) => {
    const row = h('div', { class: 'card row between tap', onclick: () => { S.settings[key] = !S.settings[key]; store.saveSettings(S.settings); render(); } },
      h('div', { class: 'spread' }, h('div', { style: 'font-weight:600;font-size:14px' }, label),
        note ? h('div', { class: 'tiny muted' }, note) : null),
      h('span', { class: 'pill ' + (S.settings[key] ? 'ok' : '') }, S.settings[key] ? 'On' : 'Off'));
    return row;
  };
  pad.appendChild(toggle('sound', 'Sound', 'Whistles, collisions and goal cues'));
  pad.appendChild(toggle('haptics', 'Haptics', 'A pulse when a nation you follow scores'));
  pad.appendChild(toggle('reducedMotion', 'Reduced motion', 'Removes trails, sparks and screen shake. Results are unchanged.'));
  pad.appendChild(toggle('autoAdvance', 'Auto-advance', 'Move to the next match without tapping'));

  pad.appendChild(h('h3', {}, 'About this build'));
  pad.appendChild(h('div', { class: 'card' },
    h('div', { class: 'kv' }, h('span', {}, 'Simulation'), h('b', { class: 'mono' }, SIM_VERSION)),
    h('div', { class: 'kv' }, h('span', {}, 'Save format'), h('b', { class: 'mono' }, 'v3')),
    ...listCompetitions().map(cm => h('div', { class: 'kv' },
      h('span', {}, cm.meta.shortName), h('b', {}, h('button', { class: 'btn ghost sm', onclick: () => rulesetSheet(cm.meta) }, 'ruleset ' + cm.meta.rulesetVersion)))),
    h('p', { class: 'tiny', style: 'margin-top:10px' }, 'Nation names are used; marbles are original abstract designs and no flag, crest or federation mark is reproduced. Competition names are descriptive and are flagged for rights review before publication. Nothing here implies official endorsement.')));

  if (S.campaign) {
    pad.appendChild(h('button', { class: 'btn ghost', style: 'margin-top:10px', onclick: () => { if (confirm('Delete the saved campaign?')) { store.clearCampaign(); S.campaign = null; go('home'); } } }, 'Delete saved campaign'));
  }
}

// --- boot -------------------------------------------------------------------

const saved = store.loadCampaign();
if (saved && !saved.stale) S.campaign = saved;
render();
window.addEventListener('beforeunload', save);
