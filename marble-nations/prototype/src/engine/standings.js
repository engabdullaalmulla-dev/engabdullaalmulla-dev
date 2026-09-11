// Group tables and the tiebreaker chains that decide them.
//
// The chain is supplied by the competition's ruleset rather than hard-coded,
// because editions genuinely differ: some apply head-to-head before goal
// difference, some after. Whichever step actually separated two teams is
// recorded on the row so the UI can say so in plain language.

export function emptyRow(code) {
  return { code, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, sep: null };
}

export function buildTable(codes, matches, points = { win: 3, draw: 1, loss: 0 }) {
  const rows = new Map(codes.map(c => [c, emptyRow(c)]));
  for (const m of matches) {
    if (!m.result) continue;
    const [a, b] = m.teams;
    const [ga, gb] = m.result.score;
    const ra = rows.get(a), rb = rows.get(b);
    if (!ra || !rb) continue;
    ra.p++; rb.p++;
    ra.gf += ga; ra.ga += gb; rb.gf += gb; rb.ga += ga;
    if (ga > gb) { ra.w++; rb.l++; ra.pts += points.win; rb.pts += points.loss; }
    else if (gb > ga) { rb.w++; ra.l++; rb.pts += points.win; ra.pts += points.loss; }
    else { ra.d++; rb.d++; ra.pts += points.draw; rb.pts += points.draw; }
  }
  for (const r of rows.values()) r.gd = r.gf - r.ga;
  return [...rows.values()];
}

// Mini-table over only the matches played between `subset`.
function headToHead(subset, matches, points) {
  const set = new Set(subset);
  return buildTable(subset, matches.filter(m => m.result && set.has(m.teams[0]) && set.has(m.teams[1])), points);
}

const CRITERIA = {
  pts: { label: 'points', get: r => r.pts },
  gd: { label: 'goal difference', get: r => r.gd },
  gf: { label: 'goals scored', get: r => r.gf },
  wins: { label: 'matches won', get: r => r.w },
};

// `chain` entries: 'pts' | 'gd' | 'gf' | 'wins' | 'h2h:pts' | 'h2h:gd' |
// 'h2h:gf' | 'fairplay' | 'lots'
export function rankTeams(codes, matches, chain, rng, points = { win: 3, draw: 1, loss: 0 }) {
  const base = new Map(buildTable(codes, matches, points).map(r => [r.code, r]));
  const order = [...codes];

  // Recursive: sort a block by the next criterion that separates it.
  function sortBlock(block, step) {
    if (block.length <= 1) return block;
    if (step >= chain.length) return block;
    const key = chain[step];

    if (key === 'fairplay') {
      // Not modelled: a marble match produces no cards, so this step can never
      // separate anybody. It stays in the chain so the ruleset matches the
      // regulations and the UI can say the tie fell through to a drawing of lots.
      return sortBlock(block, step + 1);
    }
    if (key === 'lots') {
      const drawn = rng.shuffle(block);
      for (const c of drawn) if (block.length > 1) base.get(c).sep = 'drawing of lots';
      return drawn;
    }

    const h2h = key.startsWith('h2h:');
    const crit = CRITERIA[h2h ? key.slice(4) : key];
    if (!crit) return sortBlock(block, step + 1);

    let value;
    if (h2h) {
      const mini = new Map(headToHead(block, matches, points).map(r => [r.code, r]));
      value = c => crit.get(mini.get(c));
    } else {
      value = c => crit.get(base.get(c));
    }

    const sorted = block.slice().sort((a, b) => value(b) - value(a));
    const out = [];
    let i = 0;
    while (i < sorted.length) {
      let j = i + 1;
      while (j < sorted.length && value(sorted[j]) === value(sorted[i])) j++;
      const tied = sorted.slice(i, j);
      if (tied.length > 1) out.push(...sortBlock(tied, step + 1));
      else {
        if (block.length > 1 && base.get(tied[0]).sep === null) {
          base.get(tied[0]).sep = (h2h ? 'head-to-head ' : '') + crit.label;
        }
        out.push(tied[0]);
      }
      i = j;
    }
    return out;
  }

  const ranked = sortBlock(order, 0);
  return ranked.map((c, i) => ({ ...base.get(c), pos: i + 1 }));
}

// Rank the third-placed teams across groups. They have not played each other,
// so head-to-head steps are meaningless and are skipped by the caller's chain.
export function rankThirds(entries, chain, rng) {
  // entries: [{ code, row, group }]
  const rows = new Map(entries.map(e => [e.code, { ...e.row, group: e.group }]));
  const codes = entries.map(e => e.code);
  const fake = [];
  const ranked = rankTeams(codes, fake, chain, rng);
  // rankTeams rebuilt empty rows because it had no matches; re-key on real rows
  // while keeping the order it produced from the supplied chain.
  const byCode = new Map();
  for (const r of ranked) byCode.set(r.code, r);
  return codes
    .slice()
    .sort((a, b) => {
      const ra = rows.get(a), rb = rows.get(b);
      for (const key of chain) {
        if (key === 'fairplay' || key.startsWith('h2h:')) continue;
        if (key === 'lots') break;
        const crit = CRITERIA[key];
        if (!crit) continue;
        const d = crit.get(rb) - crit.get(ra);
        if (d !== 0) return d;
      }
      // Fell all the way through: drawing of lots, using the campaign RNG order.
      return byCode.get(a).pos - byCode.get(b).pos;
    })
    .map((c, i) => ({ ...rows.get(c), pos: i + 1 }));
}

// Aggregate score across the legs of a two-legged tie, in tie.teams order.
export function aggregate(tie) {
  const agg = [0, 0];
  for (const f of tie.fixtures) {
    if (!f.result) continue;
    const flip = f.teams[0] !== tie.teams[0];
    agg[0] += flip ? f.result.score[1] : f.result.score[0];
    agg[1] += flip ? f.result.score[0] : f.result.score[1];
  }
  return agg;
}
