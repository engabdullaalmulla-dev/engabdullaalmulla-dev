import * as wc2026 from './wc2026.js';
import * as afcq2026 from './afcq2026.js';

// Every competition is an explicit, versioned ruleset module. There is no
// generic "make a bracket" fallback: a competition that has not been researched
// and encoded does not appear in the picker at all.
export const COMPETITIONS = { wc2026, afcq2026 };

export const COMPETITION_ORDER = ['wc2026', 'afcq2026'];

export function listCompetitions() {
  return COMPETITION_ORDER.map(id => COMPETITIONS[id]).filter(Boolean);
}
