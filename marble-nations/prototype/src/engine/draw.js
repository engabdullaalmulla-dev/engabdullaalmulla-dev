// Constrained draw.
//
// A real draw is not a shuffle. It is uniform sampling over the set of
// assignments that satisfy the competition's constraints, which is why the
// televised ones use software to check each ball before it is placed. This does
// the same thing: randomised backtracking, with forward checks that prune
// branches which could not be completed.

export function drawGroups(cfg, rng) {
  const {
    groupNames,          // ['A','B',...]
    pots,                // [[codes pot1], [codes pot2], ...] -- one slot per group per pot
    fixed = {},          // { MEX: 'A', CAN: 'B', USA: 'D' }
    confOf,              // code -> confederation
    confMax = {}, defaultConfMax = 1,
    confMin = {},        // { UEFA: 1 } -- every group must end with at least this many
    separation = [],     // [{ codes, by }] -- those codes must land in distinct zones
    zoneOf = () => null, // group name -> zone id, for `separation`
    slotPattern = {},    // group -> [potIndex for position 2, 3, 4]
  } = cfg;

  const G = groupNames.length;
  const steps = [];

  function attempt() {
    const groups = Object.fromEntries(groupNames.map(n => [n, []]));
    const confCount = Object.fromEntries(groupNames.map(n => [n, {}]));
    const zoneUsed = separation.map(() => new Set());
    steps.length = 0;

    const fits = (code, g) => {
      if (groups[g].length >= pots.length) return false;
      const conf = confOf(code);
      const max = confMax[conf] ?? defaultConfMax;
      if ((confCount[g][conf] || 0) >= max) return false;
      for (let s = 0; s < separation.length; s++) {
        if (!separation[s].codes.includes(code)) continue;
        const z = zoneOf(g, separation[s].by);
        if (z != null && zoneUsed[s].has(z)) return false;
      }
      return true;
    };

    const place = (code, g) => {
      const conf = confOf(code);
      groups[g].push(code);
      confCount[g][conf] = (confCount[g][conf] || 0) + 1;
      for (let s = 0; s < separation.length; s++) {
        if (!separation[s].codes.includes(code)) continue;
        const z = zoneOf(g, separation[s].by);
        if (z != null) zoneUsed[s].add(z);
      }
    };

    const unplace = (code, g) => {
      const conf = confOf(code);
      groups[g].pop();
      confCount[g][conf]--;
      for (let s = 0; s < separation.length; s++) {
        if (!separation[s].codes.includes(code)) continue;
        const z = zoneOf(g, separation[s].by);
        if (z != null) zoneUsed[s].delete(z);
      }
    };

    // Forward check for "every group needs at least N of confederation X":
    // if the groups still missing one outnumber the teams of that confederation
    // still to be drawn, this branch is already dead.
    const minFeasible = (remaining) => {
      for (const [conf, need] of Object.entries(confMin)) {
        const left = remaining.filter(c => confOf(c) === conf).length;
        let short = 0;
        for (const g of groupNames) {
          const have = confCount[g][conf] || 0;
          const slotsLeft = pots.length - groups[g].length;
          if (have < need) {
            if (slotsLeft < need - have) return false;
            short += need - have;
          }
        }
        if (left < short) return false;
      }
      return true;
    };

    // Pre-place hosts / fixed slots from pot 1.
    for (const [code, g] of Object.entries(fixed)) {
      place(code, g);
      steps.push({ pot: 1, code, group: g, fixed: true });
    }

    const solve = (potIdx, queue, remainingAll) => {
      if (potIdx >= pots.length) return groups;
      if (queue.length === 0) return solve(potIdx + 1, rng.shuffle(pots[potIdx + 1] || []), remainingAll);
      const code = queue[0];
      const rest = queue.slice(1);
      const cands = rng.shuffle(groupNames.filter(g => groups[g].length === potIdx && fits(code, g)));
      for (const g of cands) {
        place(code, g);
        const remaining = rest.concat(...pots.slice(potIdx + 1));
        if (minFeasible(remaining)) {
          steps.push({ pot: potIdx + 1, code, group: g });
          const ok = solve(potIdx, rest, remaining);
          if (ok) return ok;
          steps.pop();
        }
        unplace(code, g);
      }
      return null;
    };

    const pot1Queue = rng.shuffle(pots[0].filter(c => !(c in fixed)));
    return solve(0, pot1Queue, pot1Queue.concat(...pots.slice(1)));
  }

  let result = null;
  for (let tries = 0; tries < 40 && !result; tries++) result = attempt();
  if (!result) throw new Error('draw: no valid assignment found');

  // Order each group by the edition's position pattern.
  const ordered = {};
  for (const g of groupNames) {
    const byPot = new Map();
    result[g].forEach((code) => {
      const p = pots.findIndex(list => list.includes(code));
      byPot.set(p, code);
    });
    const pattern = slotPattern[g] || pots.map((_, i) => i);
    ordered[g] = pattern.map(p => byPot.get(p)).filter(Boolean);
    // Anything the pattern missed (shouldn't happen) goes on the end.
    for (const code of result[g]) if (!ordered[g].includes(code)) ordered[g].push(code);
  }

  return { groups: ordered, steps: steps.slice() };
}

// Uniform pot draw with no cross-constraints -- used by the AFC group rounds,
// where all entrants share one confederation.
export function drawPotsSimple(pots, groupNames, rng) {
  const groups = Object.fromEntries(groupNames.map(n => [n, []]));
  const steps = [];
  pots.forEach((pot, pi) => {
    const order = rng.shuffle(groupNames);
    rng.shuffle(pot).forEach((code, i) => {
      groups[order[i]].push(code);
      steps.push({ pot: pi + 1, code, group: order[i] });
    });
  });
  return { groups, steps };
}
