// Local persistence. Offline, single-player, no account.
//
// A campaign save is seeds plus results, so it stays small and can always be
// replayed. Saves carry the schema version, the ruleset version and the
// simulation version: if any of those move, we say so rather than silently
// reinterpreting an old save under new rules.

import { SAVE_VERSION } from './campaign.js';
import { SIM_VERSION } from '../sim/match.js';

const K = {
  campaign: 'mn.campaign.v3',
  settings: 'mn.settings.v1',
  cabinet: 'mn.cabinet.v1',
};

function read(key, fallback) {
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : fallback;
  } catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

export function saveCampaign(c) { c.updated = Date.now(); return write(K.campaign, c); }
export function loadCampaign() {
  const c = read(K.campaign, null);
  if (!c) return null;
  if (c.v !== SAVE_VERSION) return { stale: true, reason: `save format ${c.v} vs ${SAVE_VERSION}`, campaign: c };
  if (c.simVersion !== SIM_VERSION) {
    // Results already recorded stay valid; future matches would differ, so the
    // player is told rather than quietly given a different game.
    c.simDrift = `Saved under simulation ${c.simVersion}; this build runs ${SIM_VERSION}.`;
  }
  return c;
}
export function clearCampaign() { try { localStorage.removeItem(K.campaign); } catch {} }

export const DEFAULT_SETTINGS = {
  sound: true, haptics: true, reducedMotion: false,
  autoAdvance: true, camera: 'wide', speed: 1,
  premium: false,           // prototype stands in for the real purchase
  adsSeen: 0,
};
export function loadSettings() { return { ...DEFAULT_SETTINGS, ...read(K.settings, {}) }; }
export function saveSettings(s) { return write(K.settings, s); }

export function loadCabinet() { return read(K.cabinet, { trophies: [], campaigns: [] }); }
export function saveCabinet(c) { return write(K.cabinet, c); }

export function recordFinish(campaign, comp) {
  const cab = loadCabinet();
  const entry = {
    id: campaign.id,
    competition: comp.meta.name,
    edition: comp.meta.edition,
    mode: campaign.mode,
    followed: campaign.followed.slice(),
    champion: campaign.champion || null,
    outcome: campaign.meta.outcome || null,
    qualified: campaign.meta.qualified || null,
    playoffRep: campaign.meta.playoffRep || null,
    rulesetVersion: campaign.rulesetVersion,
    simVersion: campaign.simVersion,
    finishedAt: Date.now(),
  };
  cab.campaigns.unshift(entry);
  cab.campaigns = cab.campaigns.slice(0, 40);
  if (campaign.champion && campaign.followed.includes(campaign.champion)) {
    cab.trophies.unshift({
      competition: comp.meta.shortName, edition: comp.meta.edition,
      nation: campaign.champion, mode: campaign.mode, at: Date.now(),
    });
    cab.trophies = cab.trophies.slice(0, 60);
  }
  saveCabinet(cab);
  return entry;
}
