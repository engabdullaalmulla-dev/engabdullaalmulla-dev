#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const E = require('../prototype/game/engine.js');
const C = require('../prototype/game/content.js');
let passed = 0;
function test(name, run) {
  try { run(); passed++; process.stdout.write('✓ ' + name + '\n'); }
  catch (error) { process.stderr.write('✗ ' + name + '\n'); throw error; }
}
const copy = value => JSON.parse(JSON.stringify(value));
function act(state, type, data) {
  const result = E.dispatch(state, Object.assign({type}, data || {}));
  assert.equal(result.error, null, type + ': ' + result.error);
  return result.state;
}
function owns(before, after) {
  ['recipes', 'upgrades', 'venues', 'staff', 'knowledge'].forEach(key => before[key].forEach(id => assert(after[key].includes(id), key + ' lost ' + id)));
  before.customRecipes.forEach(r => assert(after.customRecipes.some(item => item.id === r.id)));
}
function translated(object, path = 'content') {
  if (!object || typeof object !== 'object') return;
  for (const [key, value] of Object.entries(object)) {
    if (['name', 'description', 'role', 'title', 'body', 'label', 'result', 'memory'].includes(key)) {
      assert(value && typeof value.en === 'string' && value.en.trim().length, path + '.' + key + ' missing English');
      assert(value && typeof value.ar === 'string' && /[\u0600-\u06ff]/.test(value.ar), path + '.' + key + ' missing Arabic');
    }
    translated(value, path + '.' + key);
  }
}

test('catalogues, translations and all narrative references are complete', () => {
  ['recipes', 'characters', 'stories', 'events', 'upgrades', 'layouts', 'suppliers', 'heirs', 'venues', 'ambitions'].forEach(key => {
    assert(C[key].length > 0, key + ' is empty');
    assert.equal(new Set(C[key].map(item => item.id)).size, C[key].length, key + ' duplicate IDs');
  });
  translated(C);
  C.stories.concat(C.events).forEach(story => {
    assert(story.choices.length >= 2, story.id + ' lacks meaningful choice');
    assert(story.choices.some(choice => !choice.cost), story.id + ' lacks a free route');
    if (story.requires) assert(C.stories.concat(C.events).some(s => s.id === story.requires), story.id + ' dependency missing');
    if (story.requiresChoices) Object.entries(story.requiresChoices).forEach(([id, choices]) => {
      const prerequisite = C.stories.concat(C.events).find(s => s.id === id);
      assert(prerequisite, story.id + ' choice prerequisite missing');
      (Array.isArray(choices) ? choices : [choices]).forEach(choiceId => assert(prerequisite.choices.some(choice => choice.id === choiceId), story.id + ' prerequisite choice missing'));
    });
    if (story.requiresRelationships) Object.entries(story.requiresRelationships).forEach(([id, minimum]) => {
      assert(C.characters.some(person => person.id === id), story.id + ' relationship character missing');
      assert(Number.isInteger(minimum) && minimum > 0 && minimum <= 100, story.id + ' invalid relationship requirement');
    });
    story.choices.forEach(choice => { if (choice.recipe) assert(C.recipes.some(r => r.id === choice.recipe), choice.recipe + ' missing reward'); });
  });
});

test('new games are deterministic, valid, and have a real initial menu choice', () => {
  assert.deepEqual(E.newGame(), E.newGame());
  const state = E.newGame();
  assert.deepEqual(E.validate(state), state);
  assert(state.recipes.length > state.boardSlots);
  assert(state.menu.length <= state.boardSlots);
  assert.equal(E.seasonFor(state.date), 'winter');
  assert(E.availableStories(state).length > 0);
  assert(E.forecast(state).profit >= 0);
  assert(E.forecast(state).customers > 0);
});

test('actions never mutate the supplied state, including failures', () => {
  const input = E.newGame();
  const frozen = copy(input);
  const opened = E.dispatch(input, {type: 'OPEN_DAY'});
  assert.deepEqual(input, frozen);
  assert.notEqual(opened.state, input);
  const failed = E.dispatch(input, {type: 'BUY_UPGRADE', id: 'unknown'});
  assert(failed.error);
  assert.equal(failed.state, input);
  assert.deepEqual(failed.effects, []);
  assert.deepEqual(input, frozen);
});

test('manual service and instant delegation pay precisely the same amount', () => {
  const initial = E.newGame();
  let manual = act(initial, 'OPEN_DAY');
  assert.equal(manual.service.guests.length, 4);
  while (E.currentGuest(manual)) manual = act(manual, 'SERVE', {recipeId: E.currentGuest(manual).recommended});
  manual = act(manual, 'CLOSE_DAY');
  const delegated = act(initial, 'CLOSE_DAY');
  assert.equal(manual.cash, delegated.cash);
  assert.equal(manual.lastDay.profit, delegated.lastDay.profit);
  assert.equal(manual.totalServed, delegated.totalServed);
  assert.deepEqual(manual.ambitionsDone, delegated.ambitionsDone);
  assert.deepEqual(manual.relationships, delegated.relationships);
  assert.deepEqual(manual.memories, delegated.memories);
  assert.equal(manual.service.manual, 4);
  assert.equal(delegated.service.manual, 0);
  assert.deepEqual(E.validate(manual), manual);
});

test('double close and repeated completed choices cannot duplicate rewards', () => {
  let state = act(E.newGame(), 'CLOSE_DAY');
  assert.deepEqual(act(state, 'CLOSE_DAY'), state);
  const story = E.availableStories(state)[0];
  state = act(state, 'CHOOSE', {storyId: story.id, choiceId: story.choices[0].id});
  const result = E.dispatch(state, {type: 'CHOOSE', storyId: story.id, choiceId: story.choices[0].id});
  assert.equal(result.error, 'STORY_UNAVAILABLE');
  assert.equal(result.state.cash, state.cash);
  assert.deepEqual(result.state, state);
});

test('open-day earnings are frozen; menu edits affect the following day', () => {
  let state = act(E.newGame(), 'OPEN_DAY');
  const locked = E.forecast(state);
  const lockedMenu = state.service.menu.slice();
  state = act(state, 'SET_MENU', {ids: ['mint']});
  state = act(state, 'SET_LAYOUT', {id: 'express'});
  assert.deepEqual(E.forecast(state), locked);
  assert.deepEqual(state.service.menu, lockedMenu);
  assert.equal(state.service.layout, 'communal');
  assert.equal(state.layout, 'express');
  state = act(state, 'NEXT_DAY');
  assert.deepEqual(state.menu, ['mint']);
  assert.deepEqual(E.forecast(state).menu.map(r => r.id), ['mint']);
});

test('audience and season matter, while reordering the same menu cannot change earnings', () => {
  let state = act(E.newGame(), 'JUMP', {days: 30});
  state = act(state, 'SET_MENU', {ids: ['iced', 'roselem', 'jallab']});
  state = act(state, 'SET_LAYOUT', {id: 'express'});
  state.date = '1994-01-01';
  const winter = E.forecast(state);
  state.date = '1994-07-01';
  const summer = E.forecast(state);
  assert(summer.fit > winter.fit);
  state = act(state, 'SET_MENU', {ids: ['jallab', 'roselem', 'iced']});
  assert.deepEqual(E.forecast(state), summer);
  const original = copy(state);
  state = act(state, 'SET_LAYOUT', {id: 'quiet'});
  assert.notDeepEqual(E.forecast(state), E.forecast(original));
});

test('recipe workshop ingredients create actual trade-offs and cannot duplicate a discovery', () => {
  let state = E.newGame();
  state = act(state, 'CREATE_RECIPE', {name: 'A familiar cup', base: 'tea', flavour: 'cardamom', temperature: 'hot'});
  state = act(state, 'CREATE_RECIPE', {name: 'A floral cup', base: 'tea', flavour: 'rose', temperature: 'cold'});
  const [first, second] = state.customRecipes;
  assert.notDeepEqual(first.tags, second.tags);
  assert.notEqual(first.price, second.price);
  const result = E.dispatch(state, {type: 'CREATE_RECIPE', name: 'Another name', base: 'tea', flavour: 'rose', temperature: 'cold'});
  assert.equal(result.error, 'RECIPE_EXISTS');
  assert.equal(result.state.customRecipes.length, 2);
});

test('zero cash never blocks a day, a story, a recipe, or immediate continuation', () => {
  let state = E.newGame(); state.cash = 0;
  state = act(state, 'CREATE_RECIPE', {name: 'Rose morning', base: 'tea', flavour: 'rose', temperature: 'hot'});
  const story = E.availableStories(state)[0];
  state = act(state, 'CHOOSE', {storyId: story.id, choiceId: story.choices.find(choice => !choice.cost).id});
  state.cash = 0;
  state = act(state, 'CLOSE_DAY');
  assert(state.cash >= 0);
  state = act(state, 'NEXT_DAY');
  assert.equal(state.day, 2);
  assert.equal(state.phase, 'planning');
  assert(state.recipes.includes('espresso'));
  assert.equal(state.customRecipes.length, 1);
  E.validate(state);
});

test('branch decisions preserve different memories, identity and recipe outcomes', () => {
  const initial = E.newGame();
  const story = C.stories.find(s => s.id === 'mariam-1');
  const gathering = act(initial, 'CHOOSE', {storyId: story.id, choiceId: 'breakfast'});
  const tasting = act(initial, 'CHOOSE', {storyId: story.id, choiceId: 'tasting'});
  assert.notDeepEqual(gathering.memories, tasting.memories);
  assert.notDeepEqual(gathering.identity, tasting.identity);
  assert(tasting.recipes.includes('saffron'));
  assert(!gathering.recipes.includes('saffron'));
  assert.equal(gathering.storyChoices['mariam-1'], 'breakfast');
  assert.equal(tasting.storyChoices['mariam-1'], 'tasting');
});

test('the Gregorian calendar handles months, 2000 and the non-leap year 2100', () => {
  assert.equal(E.advanceDate('1994-01-31', 1), '1994-02-01');
  assert.equal(E.advanceDate('2000-02-28', 1), '2000-02-29');
  assert.equal(E.advanceDate('2000-02-29', 1), '2000-03-01');
  assert.equal(E.advanceDate('2100-02-28', 1), '2100-03-01');
  assert.equal(E.advanceDate('1999-12-31', 1), '2000-01-01');
  assert.equal(E.seasonFor('1994-12-01'), 'winter');
  assert.equal(E.seasonFor('1994-06-01'), 'summer');
  assert.throws(() => E.advanceDate('2100-02-29', 1));
  let state = E.newGame(); state.date = '2100-02-28';
  state = act(state, 'NEXT_DAY');
  assert.equal(state.date, '2100-03-01');
});

test('monthly accounts reconcile with the same daily figures the player sees', () => {
  let state = E.newGame();
  let totalProfit = 0;
  for (let i = 0; i < 31; i++) {
    state = act(state, 'CLOSE_DAY'); totalProfit += state.lastDay.profit;
    state = act(state, 'NEXT_DAY');
  }
  assert.equal(state.date, '1994-02-01');
  assert.equal(state.monthly.month, '1994-02');
  assert.equal(state.monthly.days, 0);
  assert.equal(state.accounts.length, 1);
  state = act(state, 'CLOSE_DAY');
  assert.equal(state.accounts.length, 1);
  assert.equal(state.accounts[0].month, '1994-01');
  assert.equal(state.accounts[0].days, 31);
  assert(Math.abs(state.accounts[0].profit - totalProfit) < 0.01);
  assert.equal(state.monthly.month, '1994-02');
  assert.equal(state.monthly.days, 1);
});

test('purchases and succession conserve every permanent capability and the whole estate', () => {
  let state = E.newGame(); state.cash = 100000;
  for (const upgrade of C.upgrades) state = act(state, 'BUY_UPGRADE', {id: upgrade.id});
  for (const venue of C.venues.filter(v => !state.venues.includes(v.id))) state = act(state, 'BUY_VENUE', {id: venue.id});
  state = act(state, 'HIRE', {id: 'barista'});
  state = act(state, 'CREATE_RECIPE', {name: 'Family cup', base: 'milk', flavour: 'date', temperature: 'cold'});
  const before = copy(state);
  state = act(state, 'SUCCESSION', {id: C.heirs[0].id});
  owns(before, state);
  assert.equal(state.date, '2014-01-01');
  assert.equal(state.generation, 2);
  assert.equal(state.monthly.month, '2014-01');
  assert(state.cash >= before.cash); // A finite succession ambition may add a grant; there is never a haircut.
  const knowledge = state.knowledge.length;
  state = act(state, 'SUCCESSION', {id: C.heirs[0].id});
  assert.equal(state.knowledge.length, knowledge);
  E.validate(state);
  const invalidHire = E.dispatch(state, {type: 'HIRE', id: '__proto__'});
  assert.equal(invalidHire.error, 'INVALID_STAFF');
});

test('old regulars retire and later generations meet descendants, never resurrected founders', () => {
  let state = E.newGame();
  state.date = '2100-01-01';
  assert.equal(E.personStatus(state, 'grandmother').active, false);
  assert(E.personStatus(state, 'grandmother').descendant.age < 60);
  assert(E.availableStories(state).every(story => !story.character));
  state = act(state, 'OPEN_DAY');
  assert(state.service.guests.every(guest => guest.descendant && guest.personId !== guest.characterId));
  assert(state.service.guests.every(guest => guest.name.en.includes('family')));
});

test('generation-neutral opportunities have separate permanent decisions in each generation', () => {
  let state = act(E.newGame(), 'JUMP', {days: 30});
  const event = E.availableStories(state).find(story => C.events.some(event => event.id === story.id));
  assert(event);
  state = act(state, 'CHOOSE', {storyId: event.id, choiceId: event.choices[0].id});
  state = act(state, 'SUCCESSION', {id: C.heirs[0].id});
  const later = E.availableStories(state).find(story => story.id === event.id + '@g2');
  assert(later);
  state = act(state, 'CHOOSE', {storyId: later.id, choiceId: later.choices[1].id});
  assert(state.storiesDone.includes(event.id));
  assert(state.storiesDone.includes(later.id));
  E.validate(state);
});

test('save round trips remain exact during planning, service and after settlement', () => {
  let state = E.newGame({name: 'مقهى الدار', owner: 'علي', lang: 'ar'});
  for (const type of ['SET_PREF', 'OPEN_DAY', 'SERVE', 'CLOSE_DAY', 'NEXT_DAY']) {
    const data = type === 'SET_PREF' ? {key: 'textSize', value: 'large'} : type === 'SERVE' ? {recipeId: state.service.menu[0]} : {};
    state = act(state, type, data);
    assert.deepEqual(E.importSave(E.exportSave(state)), state);
    assert.deepEqual(E.importSave(JSON.stringify(state)), state);
  }
});

test('invalid import is rejected atomically before any live save can be changed', () => {
  const live = E.newGame();
  const original = E.exportSave(live);
  const invalid = [null, {}, {version: 999}, {...live, cash: -1}, {...live, cash: '100'}, {...live, date: '2100-02-29'}, {...live, menu: []}, {...live, menu: ['unknown']}, {...live, phase: 'open', service: null}, {...live, settings: {}}, {...live, recipes: ['karak', 'karak']}];
  invalid.forEach(value => assert.throws(() => E.importSave(JSON.stringify(value))));
  assert.throws(() => E.importSave('{broken'));
  assert.throws(() => E.importSave('x'.repeat(25000001)));
  const corrupted = act(live, 'OPEN_DAY');
  corrupted.service.forecast.profit = 999999;
  assert.throws(() => E.importSave(JSON.stringify(corrupted)));
  const invalidCount = act(live, 'OPEN_DAY');
  invalidCount.service.forecast.customers = 1.5;
  assert.throws(() => E.importSave(JSON.stringify(invalidCount)));
  const invalidProgress = act(live, 'OPEN_DAY');
  invalidProgress.service.index = 1;
  assert.throws(() => E.importSave(JSON.stringify(invalidProgress)));
  const invalidArt = act(live, 'CREATE_RECIPE', {base: 'tea', flavour: 'rose', temperature: 'hot', name: 'Rose'});
  invalidArt.customRecipes[0].art = 'karak" onerror="alert(1)';
  assert.throws(() => E.importSave(JSON.stringify(invalidArt)));
  assert.throws(() => E.importSave(JSON.stringify({...live, legacy: {}})));
  const invalidMonth = copy(live); invalidMonth.monthly.month = '1994-99';
  assert.throws(() => E.importSave(JSON.stringify(invalidMonth)));
  const invalidRoom = act(live, 'OPEN_DAY'); invalidRoom.service.layout = 'missing';
  assert.throws(() => E.importSave(JSON.stringify(invalidRoom)));
  const poisonedBreakdown = act(live, 'OPEN_DAY');
  poisonedBreakdown.service.forecast.breakdown.extra = {};
  assert.throws(() => E.importSave(JSON.stringify(poisonedBreakdown)));
  assert.equal(E.exportSave(live), original);
});

test('legacy conversion preserves the original archive, identity, cash and possessions', () => {
  const old = {year: 2034, month: 5, day: 12, gen: 2, cafeName: 'Old café', owner: {nm: 'Layla'}, cash: 68000000,
    recipes: ['karak', 'mint', 'qahwa', 'croissant', 'own0_2'], board: ['karak', 'croissant', 'own0_2'], slots: 8, seats: 32,
    owned: {grinder: 1, freehold: 1, historicUnknown: 1}, branches: [{nm: 'Satwa'}],
    cookbook: [{k: 'own0_2', nm: 'An old recipe', invented: true, price: 24, cost: 8, tags: ['cold', 'share']}],
    staff: [{role: 'barista'}, {role: 'manager'}], debt: 150};
  const initial = copy(old);
  const migrated = E.migrateLegacy(old, {lang: 'ar'});
  assert.deepEqual(old, initial);
  assert.deepEqual(migrated.legacy.original, old);
  assert.equal(migrated.cash, old.cash);
  assert.equal(migrated.cafeName, old.cafeName);
  assert.equal(migrated.owner, old.owner.nm);
  assert.equal(migrated.legacy.possessions.historicUnknown, 1);
  assert.equal(migrated.legacy.branches[0].nm, 'Satwa');
  assert.equal(migrated.legacy.debtRetired, 150);
  assert.equal(migrated.customRecipes.length, 2);
  assert.equal(migrated.menu.length, 3);
  assert(E.recipe(migrated, migrated.menu[1]).name.en.includes('croissant'));
  assert.equal(E.recipe(migrated, migrated.menu[2]).name.en, 'An old recipe');
  assert(migrated.upgrades.includes('good-grinder'));
  assert.equal(migrated.venues.length, C.venues.length);
  assert.deepEqual(migrated.staff, ['barista', 'host']);
  assert.equal(E.forecast(migrated).breakdown.rent, 0);
  E.validate(migrated);
  assert.throws(() => E.migrateLegacy({year: 2000}));
});

test('large legacy recipe collections keep every earned dish and permit new creations', () => {
  const cookbook = Array.from({length: 150}, (_, i) => ({k: 'own' + i + '_3', nm: 'Family dish ' + i, invented: true, price: 100 + i, cost: 6, tags: ['warm'], sp: 'karak'}));
  const old = {year: 2094, month: 0, day: 1, gen: 3, cafeName: 'The family café', owner: {nm: 'Noor'}, cash: 12345,
    recipes: ['karak'].concat(cookbook.map(r => r.k)), board: ['own149_3', 'karak'], slots: 8, seats: 32, cookbook,
    log: ['A large original archive: ' + 'x'.repeat(2100000)]};
  let migrated = E.migrateLegacy(old);
  assert.equal(migrated.customRecipes.length, 150);
  assert.equal(E.recipe(migrated, migrated.menu[0]).price, 249);
  migrated = act(migrated, 'CREATE_RECIPE', {name: 'Still creating', base: 'tea', flavour: 'rose', temperature: 'hot'});
  assert.equal(migrated.customRecipes.length, 151);
  const exported = E.exportSave(migrated);
  assert(exported.length > 2000000);
  assert.deepEqual(E.importSave(exported), migrated);
});

test('all daily recipes are reachable without purchases or grinding a particular action', () => {
  let state = E.newGame(); state.cash = 0;
  state = act(state, 'JUMP', {days: 30});
  assert.equal(state.recipes.length, C.recipes.length);
  assert.equal(state.date, '1994-01-31');
  assert.equal(state.phase, 'planning');
  assert(state.cash >= 0);
  const invalidJump = E.dispatch(state, {type: 'JUMP', days: 3651});
  assert.equal(invalidJump.error, 'INVALID_JUMP');
});

test('thirty years of immediate daily operation remain finite, bounded and playable', () => {
  let state = E.newGame();
  const snapshots = [];
  for (let decade = 0; decade < 3; decade++) {
    const before = copy(state);
    state = act(state, 'JUMP', {days: 3650});
    owns(before, state);
    assert(Number.isFinite(state.cash) && state.cash >= 0);
    assert(state.history.length <= 500);
    assert(state.accounts.length <= 120);
    E.validate(state);
    snapshots.push({date: state.date, cash: state.cash, served: state.totalServed});
  }
  state = act(state, 'OPEN_DAY');
  assert(E.currentGuest(state));
  process.stdout.write('  Economy: ' + JSON.stringify(snapshots) + '\n');
});


function prepareBrief(initial, brief) {
  let state = act(initial, 'SELECT_BRIEF', {id: brief.id});
  if (brief.kind === 'room') return act(state, 'SET_LAYOUT', {id: brief.target});
  if (brief.kind === 'supplier') return act(state, 'SET_SUPPLIER', {id: brief.target});
  const dishes = E.allRecipes(state);
  if (brief.kind === 'regular') return act(state, 'SET_MENU', {ids: [C.characters.find(p => p.id === brief.target).usual]});
  if (brief.kind !== 'variety') return act(state, 'SET_MENU', {ids: dishes.filter(r => r.tags.includes(brief.kind)).slice(0, brief.target).map(r => r.id)});
  // Explore actual menus rather than reproducing the generator's greedy construction.
  function solve(start, ids) {
    if (ids.length) {
      const candidate = act(state, 'SET_MENU', {ids});
      if (E.briefStatus(candidate).ready) return candidate;
    }
    if (ids.length === state.boardSlots) return null;
    for (let index = start; index < dishes.length; index++) {
      const result = solve(index + 1, ids.concat(dishes[index].id));
      if (result) return result;
    }
    return null;
  }
  return solve(0, []);
}

test('daily briefs are deterministic, bilingual, optional and free to prepare across a month', () => {
  let first = E.newGame(); let second = E.newGame(); const kinds = new Set();
  translated(E.BRIEF_STAMPS, 'brief stamps');
  for (let day = 0; day < 31; day++) {
    first.cash = 0;
    const offers = E.dailyBriefs(first);
    assert.equal(offers.length, 3);
    assert.equal(new Set(offers.map(item => item.kind)).size, 3);
    assert.deepEqual(offers, E.dailyBriefs(second));
    translated(offers, 'daily briefs');
    offers.forEach(brief => {
      kinds.add(brief.kind);
      assert(brief.hint.en && /[\u0600-\u06ff]/.test(brief.hint.ar));
      assert(brief.rewardCash >= 20 && brief.rewardCash <= 50);
      const prepared = prepareBrief(first, brief);
      assert(prepared, 'No owned-recipe route for ' + brief.id);
      assert(E.briefStatus(prepared).ready, brief.id + ' did not become ready');
      assert.equal(prepared.cash, 0, 'Preparation required cash');
      assert.deepEqual(E.dailyBriefs(prepared), offers, 'Planning changed offered briefs');
    });
    assert.equal(E.briefStatus(first), null);
    first = act(first, 'NEXT_DAY'); second = act(second, 'NEXT_DAY');
    assert.equal(first.keepsakes.length, 0);
  }
  assert.equal(kinds.size, E.BRIEF_STAMPS.length);
});

test('briefs reward the same day once whether served manually, delegated or skipped', () => {
  const initial = E.newGame(); const brief = E.dailyBriefs(initial)[0];
  const planned = prepareBrief(initial, brief);
  let manual = act(planned, 'OPEN_DAY');
  assert.equal(E.briefStatus(manual).settled, false);
  assert.equal(E.briefStatus(manual).rewardEarned, 0);
  while (E.currentGuest(manual)) manual = act(manual, 'SERVE', {recipeId: manual.service.menu[0]});
  manual = act(manual, 'CLOSE_DAY');
  const delegated = act(planned, 'CLOSE_DAY');
  const skipped = act(planned, 'JUMP', {days: 1});
  const without = act(act(planned, 'CLEAR_BRIEF'), 'CLOSE_DAY');
  assert.equal(manual.cash, delegated.cash);
  assert.equal(skipped.cash, delegated.cash);
  assert.equal(Math.round((delegated.cash - without.cash) * 100), brief.rewardCash * 100);
  assert.deepEqual(manual.lastDay.brief, delegated.lastDay.brief);
  assert.equal(E.briefStatus(delegated).completed, true);
  assert.equal(E.briefStatus(delegated).rewardEarned, brief.rewardCash);
  assert.deepEqual(delegated.keepsakes, [{kind: brief.kind, date: initial.date, count: 1}]);
  assert.deepEqual(act(delegated, 'CLOSE_DAY'), delegated);
  assert.equal(E.dispatch(delegated, {type: 'SELECT_BRIEF', id: brief.id}).error, 'INVALID_PHASE');
  assert.equal(E.dispatch(delegated, {type: 'CLEAR_BRIEF'}).error, 'INVALID_PHASE');
  assert.deepEqual(E.importSave(E.exportSave(delegated)), delegated);
});

test('opening freezes brief outcomes even if a later menu meets or breaks the condition', () => {
  const initial = E.newGame(); const brief = E.dailyBriefs(initial).find(item => item.kind === 'warm');
  let failure = act(initial, 'SELECT_BRIEF', {id: brief.id});
  failure = act(failure, 'SET_MENU', {ids: ['regag']});
  assert.equal(E.briefStatus(failure).ready, false);
  failure = act(failure, 'OPEN_DAY');
  failure = act(failure, 'SET_MENU', {ids: ['karak', 'mint']});
  assert.equal(E.briefStatus(failure).ready, false);
  failure = act(failure, 'CLOSE_DAY');
  assert.equal(E.briefStatus(failure).rewardEarned, 0);
  assert.equal(failure.keepsakes.length, 0);
  let success = act(prepareBrief(initial, brief), 'OPEN_DAY');
  success = act(success, 'SET_MENU', {ids: ['regag']});
  assert.equal(E.briefStatus(success).ready, true);
  assert.deepEqual(E.importSave(E.exportSave(success)), success);
  success = act(success, 'CLOSE_DAY');
  assert.equal(E.briefStatus(success).rewardEarned, brief.rewardCash);
  E.validate(success);
  const tomorrow = act(failure, 'NEXT_DAY');
  assert.equal(tomorrow.briefs.selectedId, null);
  assert.equal(tomorrow.phase, 'planning');
  assert.equal(E.briefStatus(tomorrow), null);
});

test('selecting and clearing briefs pays nothing and never blocks continuation', () => {
  let state = E.newGame(); const cash = state.cash;
  for (let i = 0; i < 20; i++) {
    state = act(state, 'SELECT_BRIEF', {id: E.dailyBriefs(state)[i % 3].id});
    state = act(state, 'CLEAR_BRIEF');
  }
  assert.equal(state.cash, cash);
  assert.equal(state.keepsakes.length, 0);
  assert.equal(E.dispatch(state, {type: 'SELECT_BRIEF', id: 'fake'}).error, 'INVALID_BRIEF');
  state = act(state, 'CONTINUE'); state = act(state, 'CONTINUE'); state = act(state, 'CONTINUE');
  assert.equal(state.day, 2);
  assert.equal(state.phase, 'planning');
});

test('keepsake stamps remain permanent through new mornings, saves and inheritance', () => {
  let state = E.newGame();
  for (let day = 0; day < 24; day++) {
    const brief = E.dailyBriefs(state).find(item => !state.keepsakes.some(stamp => stamp.kind === item.kind)) || E.dailyBriefs(state)[0];
    state = act(prepareBrief(state, brief), 'CLOSE_DAY');
    state = act(state, 'NEXT_DAY');
  }
  assert.equal(state.keepsakes.length, 8);
  assert.equal(state.keepsakes.reduce((sum, stamp) => sum + stamp.count, 0), 24);
  const collection = copy(state.keepsakes);
  state = act(state, 'SUCCESSION', {id: C.heirs[0].id});
  assert.deepEqual(state.keepsakes, collection);
  assert.equal(E.briefStatus(state), null);
  assert.equal(E.dailyBriefs(state).length, 3);
  assert.deepEqual(E.importSave(E.exportSave(state)), state);
});

test('older v6 saves gain optional briefs without losing any progress or inventing rewards', () => {
  let state = E.newGame(); state = act(state, 'JUMP', {days: 4});
  for (const phase of ['planning', 'open', 'closed']) {
    let old = copy(state);
    if (phase !== 'planning') old = act(old, 'OPEN_DAY');
    if (phase === 'closed') old = act(old, 'CLOSE_DAY');
    delete old.briefs; delete old.keepsakes;
    if (old.service) delete old.service.brief;
    if (old.lastDay) delete old.lastDay.brief;
    const restored = E.importSave(JSON.stringify({format: E.SAVE_FORMAT, version: 6, state: old}));
    assert.equal(restored.cash, old.cash);
    assert.deepEqual(restored.recipes, old.recipes);
    assert.deepEqual(restored.history, old.history);
    assert.deepEqual(restored.memories, old.memories);
    assert.equal(restored.phase, old.phase);
    assert.equal(E.briefStatus(restored), null);
    assert.equal(restored.keepsakes.length, 0);
    assert.equal(E.dailyBriefs(restored).length, 3);
    assert.deepEqual(E.importSave(E.exportSave(restored)), restored);
  }
});

test('malformed brief selections, snapshots and collections are rejected atomically', () => {
  const initial = E.newGame(); const saved = E.exportSave(initial);
  const changes = [
    state => { state.briefs = null; },
    state => { state.briefs.date = '1994-01-02'; },
    state => { state.briefs.options[0].target = 100; },
    state => { state.briefs.options[0].id = 'warm:100'; },
    state => { state.briefs.options[1] = copy(state.briefs.options[0]); },
    state => { state.briefs.selectedId = 'missing'; },
    state => { state.keepsakes = [{kind: 'warm', date: state.date, count: -1}]; },
    state => { state.keepsakes = [{kind: 'warm', date: '1994-99-01', count: 1}]; },
    state => { state.keepsakes = [{kind: 'warm', date: state.date, count: 1}, {kind: 'warm', date: state.date, count: 2}]; }
  ];
  changes.forEach(change => { const invalid = copy(initial); change(invalid); assert.throws(() => E.importSave(JSON.stringify(invalid))); });
  const opened = act(prepareBrief(initial, E.dailyBriefs(initial)[0]), 'OPEN_DAY');
  const closed = act(opened, 'CLOSE_DAY');
  const tampered = copy(opened); tampered.service.brief.ready = false;
  assert.throws(() => E.importSave(JSON.stringify(tampered)));
  const paidEarly = copy(opened); paidEarly.service.brief.rewardEarned = 25;
  assert.throws(() => E.importSave(JSON.stringify(paidEarly)));
  const double = copy(closed); double.lastDay.brief.rewardEarned *= 2;
  assert.throws(() => E.importSave(JSON.stringify(double)));
  assert.equal(E.exportSave(initial), saved);
});

test('serving preferences creates permanent relationship consequences without changing the day’s money', () => {
  const start = act(E.newGame(), 'SET_MENU', {ids: ['karak', 'mint', 'regag']});
  const opened = act(start, 'OPEN_DAY');
  assert.equal(E.currentGuest(opened).characterId, 'omar');
  assert.equal(E.serviceMatch(opened, 'omar', 'regag'), 'liked');
  assert.equal(E.serviceMatch(opened, 'omar', 'karak'), 'different');
  const liked = act(opened, 'SERVE', {recipeId: 'regag'});
  const different = act(opened, 'SERVE', {recipeId: 'karak'});
  const goodRelationship = E.relationshipStatus(liked, 'omar');
  assert.equal(goodRelationship.meetings, 1);
  assert.equal(goodRelationship.satisfaction, 2);
  assert.deepEqual(goodRelationship.rememberedPreferences, ['regag']);
  assert.equal(goodRelationship.lastServedRecipe, 'regag');
  assert.equal(E.relationshipStatus(different, 'omar').satisfaction, 0);
  assert.equal(E.relationshipStatus(different, 'omar').meetings, 1);
  assert.deepEqual(E.relationshipStatus(different, 'omar').rememberedPreferences, []);
  assert.equal(act(liked, 'CLOSE_DAY').cash, act(different, 'CLOSE_DAY').cash);
  let usual = opened;
  while (E.currentGuest(usual).characterId !== 'noor') usual = act(usual, 'SERVE', {recipeId: E.currentGuest(usual).recommended});
  usual = act(usual, 'SERVE', {recipeId: 'mint'});
  assert.equal(E.relationshipStatus(usual, 'noor').satisfaction, 3);
  assert.equal(E.relationshipStatus(usual, 'noor').bondLevel, 1);
  assert(usual.memories.some(item => item.id === 'bond:noor:1'));
  assert.deepEqual(E.validate(usual), usual);
  assert.equal(E.relationshipStatus(usual, 'unknown'), null);
});

test('delegation remembers exactly the same guests as manual recommendations and never counts them twice', () => {
  let start = act(E.newGame(), 'SET_MENU', {ids: ['karak', 'mint', 'regag']});
  let manual = act(start, 'OPEN_DAY');
  const automatic = act(start, 'CLOSE_DAY');
  const initialGuests = copy(manual.service.guests);
  for (const guest of initialGuests) manual = act(manual, 'SERVE', {recipeId: guest.recommended});
  const rememberedBeforeClosing = copy(manual.relationships);
  manual = act(manual, 'CLOSE_DAY');
  assert.deepEqual(manual.relationships, rememberedBeforeClosing);
  assert.deepEqual(manual.relationships, automatic.relationships);
  assert.deepEqual(manual.memories, automatic.memories);
  assert.equal(manual.cash, automatic.cash);
  assert.deepEqual(act(automatic, 'CLOSE_DAY'), automatic);
  let partial = act(start, 'OPEN_DAY');
  partial = act(partial, 'SERVE', {recipeId: E.currentGuest(partial).recommended});
  partial = E.importSave(E.exportSave(partial));
  partial = act(partial, 'CLOSE_DAY');
  assert.deepEqual(partial.relationships, automatic.relationships);
  assert.equal(Object.values(partial.relationships).reduce((sum, relationship) => sum + relationship.meetings, 0), 4);
  const reordered = act(act(start, 'SET_MENU', {ids: start.menu.slice().reverse()}), 'OPEN_DAY');
  assert.deepEqual(reordered.service.guests.map(guest => guest.recommended), initialGuests.map(guest => guest.recommended));
});

test('bonds never decay, cash stays bounded, and descendants inherit the café’s remembered preferences', () => {
  let state = act(E.newGame(), 'SET_MENU', {ids: ['karak', 'mint', 'regag']});
  state = act(state, 'JUMP', {days: 120});
  const before = copy(state.relationships);
  assert(Object.values(before).some(relationship => relationship.satisfaction === 100));
  state = act(state, 'SET_MENU', {ids: ['karak']});
  state = act(state, 'JUMP', {days: 60});
  C.characters.forEach(person => {
    assert(state.relationships[person.id].satisfaction >= before[person.id].satisfaction);
    before[person.id].rememberedPreferences.forEach(id => assert(state.relationships[person.id].rememberedPreferences.includes(id)));
  });
  const inherited = copy(state.relationships);
  state = act(state, 'SUCCESSION', {id: C.heirs[0].id});
  state = act(state, 'SUCCESSION', {id: C.heirs[0].id});
  state = act(state, 'SUCCESSION', {id: C.heirs[0].id});
  state = act(state, 'SUCCESSION', {id: C.heirs[0].id});
  assert.deepEqual(state.relationships, inherited);
  const opened = act(state, 'OPEN_DAY');
  assert(opened.service.guests.every(guest => guest.descendant));
  state = act(opened, 'CLOSE_DAY');
  opened.service.guests.forEach(guest => assert.equal(state.relationships[guest.characterId].meetings, inherited[guest.characterId].meetings + 1));
  assert(Object.values(state.relationships).every(relationship => relationship.satisfaction <= 100));
  assert.deepEqual(E.importSave(E.exportSave(state)), state);
  E.RELATIONSHIP_LEVELS.forEach(label => assert(label.en && /[\u0600-\u06ff]/.test(label.ar)));
});

test('older v6 saves gain empty relationship memory without fabricating already-served visits', () => {
  const initial = E.newGame();
  const opened = act(initial, 'OPEN_DAY');
  const partial = act(opened, 'SERVE', {recipeId: E.currentGuest(opened).recommended});
  const closed = act(initial, 'CLOSE_DAY');
  for (const source of [initial, partial, closed]) {
    const old = copy(source); delete old.relationships;
    const restored = E.importSave(JSON.stringify(old));
    assert.deepEqual(restored.relationships, E.newGame().relationships);
    assert.equal(restored.cash, source.cash);
    assert.deepEqual(restored.memories, source.memories);
    assert.deepEqual(restored.service, source.service);
    const after = act(restored, 'CLOSE_DAY');
    const expectedVisits = source.phase === 'closed' ? 0 : source.phase === 'open' ? 3 : 4;
    assert.equal(Object.values(after.relationships).reduce((sum, relationship) => sum + relationship.meetings, 0), expectedVisits);
    assert.deepEqual(E.importSave(E.exportSave(after)), after);
  }
});

test('malformed relationship memory is rejected before replacing the live café', () => {
  const initial = act(E.newGame(), 'CLOSE_DAY'); const saved = E.exportSave(initial);
  const changes = [
    state => { state.relationships = null; },
    state => { delete state.relationships.mariam; },
    state => { state.relationships.unknown = copy(state.relationships.mariam); },
    state => { state.relationships.mariam.meetings = -1; },
    state => { state.relationships.mariam.satisfaction = 101; },
    state => { state.relationships.mariam.satisfaction = 3.5; },
    state => { state.relationships.mariam.lastServedRecipe = 'unknown'; },
    state => { state.relationships.mariam.rememberedPreferences = ['karak', 'karak']; },
    state => { state.relationships.noor.rememberedPreferences = ['karak']; },
    state => { state.relationships.mariam.freeCash = 1000; }
  ];
  changes.forEach(change => { const invalid = copy(initial); change(invalid); assert.throws(() => E.importSave(JSON.stringify(invalid))); });
  assert.equal(E.exportSave(initial), saved);
});

test('each regular’s earlier choice opens its own later scene and rejects the other branch', () => {
  const followups = C.stories.filter(story => story.requiresChoices);
  assert(followups.length >= 12, 'six regulars need at least two distinct follow-up paths');
  followups.forEach(followup => {
    const [[prerequisiteId, accepted]] = Object.entries(followup.requiresChoices);
    const acceptedIds = Array.isArray(accepted) ? accepted : [accepted];
    const prerequisite = C.stories.find(story => story.id === prerequisiteId);
    const other = prerequisite.choices.find(choice => !acceptedIds.includes(choice.id));
    assert(other, followup.id + ' must distinguish at least one decision');
    const start = act(E.newGame(), 'JUMP', {days: followup.minDay - 1});
    assert(!E.availableStories(start).some(story => story.id === followup.id));
    const wrong = act(start, 'CHOOSE', {storyId: prerequisite.id, choiceId: other.id});
    assert(!E.availableStories(wrong).some(story => story.id === followup.id));
    const rejected = E.dispatch(wrong, {type: 'CHOOSE', storyId: followup.id, choiceId: followup.choices[0].id});
    assert.equal(rejected.error, 'STORY_UNAVAILABLE');
    assert.equal(rejected.state, wrong);
    acceptedIds.forEach(choiceId => {
      let selected = act(start, 'CHOOSE', {storyId: prerequisite.id, choiceId});
      assert(E.availableStories(selected).some(story => story.id === followup.id), followup.id + ' did not follow ' + choiceId);
      selected = act(selected, 'CHOOSE', {storyId: followup.id, choiceId: followup.choices[0].id});
      assert(selected.memories.some(item => item.storyId === followup.id));
      assert.equal(E.dispatch(selected, {type: 'CHOOSE', storyId: followup.id, choiceId: followup.choices[1].id}).error, 'STORY_UNAVAILABLE');
      assert.deepEqual(E.importSave(E.exportSave(selected)), selected);
    });
  });
});

test('second-year choices change later scenes and each generation follows its own decisions', () => {
  const routes = [
    ['kitchen', 'guides', 'kitchen-guides'], ['kitchen', 'exchange', 'kitchen-exchange'],
    ['street', 'table', 'street-table'], ['street', 'walk', 'street-walk']
  ];
  const routeIds = routes.map(route => route[2]);
  routes.forEach(([direction, method, expectedScene]) => {
    let state = act(E.newGame(), 'JUMP', {days: 509});
    state = act(state, 'CHOOSE', {storyId: 'first-year-together', choiceId: direction});
    const planningScene = 'second-year-' + direction;
    assert(E.availableStories(state).some(story => story.id === planningScene));
    assert(!E.availableStories(state).some(story => story.id === 'second-year-' + (direction === 'kitchen' ? 'street' : 'kitchen')));
    state = act(state, 'CHOOSE', {storyId: planningScene, choiceId: method});
    assert.deepEqual(E.availableStories(state).filter(story => routeIds.includes(story.id)).map(story => story.id), [expectedScene]);
    const variant = C.events.find(story => story.id === expectedScene);
    state = act(state, 'CHOOSE', {storyId: variant.id, choiceId: variant.choices[0].id});
    state = act(state, 'JUMP', {days: 190});
    const nextVolume = direction === 'kitchen' ? 'kitchen-next-volume' : 'street-next-map';
    assert(E.availableStories(state).some(story => story.id === nextVolume));
    assert(!E.availableStories(state).some(story => story.id === (direction === 'kitchen' ? 'street-next-map' : 'kitchen-next-volume')));
    state = act(state, 'SUCCESSION', {id: C.heirs[0].id});
    assert(!E.availableStories(state).some(story => /^second-year-(kitchen|street)@g2$/.test(story.id)), 'ancestor’s choice must not decide the next generation');
    const newDirection = direction === 'kitchen' ? 'street' : 'kitchen';
    state = act(state, 'CHOOSE', {storyId: 'first-year-together@g2', choiceId: newDirection});
    assert(E.availableStories(state).some(story => story.id === 'second-year-' + newDirection + '@g2'));
    assert(!E.availableStories(state).some(story => story.id === planningScene + '@g2'));
    state = act(state, 'CHOOSE', {storyId: 'second-year-' + newDirection + '@g2', choiceId: newDirection === 'street' ? 'table' : 'guides'});
    const generatedVariant = (newDirection === 'street' ? 'street-table' : 'kitchen-guides') + '@g2';
    assert(E.availableStories(state).some(story => story.id === generatedVariant));
    assert.equal(state.storyChoices['first-year-together'], direction);
    assert.equal(state.storyChoices['first-year-together@g2'], newDirection);
    assert.deepEqual(E.importSave(E.exportSave(state)), state);
  });
});

test('remembered preferences open optional personal scenes while an unmet bond never blocks another day', () => {
  const bonuses = C.stories.filter(story => story.requiresRelationships);
  assert(bonuses.length >= 2);
  bonuses.forEach(bonus => {
    const [[characterId, minimum]] = Object.entries(bonus.requiresRelationships);
    const person = C.characters.find(person => person.id === characterId);
    let state = E.newGame();
    state = act(state, 'CREATE_RECIPE', {name: 'A cool floral cup', base: 'fruit', flavour: 'rose', temperature: 'cold'});
    const unmatched = E.allRecipes(state).find(dish => E.serviceMatch(state, characterId, dish.id) === 'different');
    assert(unmatched);
    state = act(state, 'SET_MENU', {ids: [unmatched.id]});
    state = act(state, 'JUMP', {days: bonus.minDay - 1});
    const prerequisite = C.stories.find(story => story.id === bonus.requires);
    state = act(state, 'CHOOSE', {storyId: prerequisite.id, choiceId: prerequisite.choices[0].id});
    assert.equal(E.relationshipStatus(state, characterId).satisfaction, 0);
    assert(!E.availableStories(state).some(story => story.id === bonus.id));
    assert.equal(E.dispatch(state, {type: 'CHOOSE', storyId: bonus.id, choiceId: bonus.choices[0].id}).error, 'STORY_UNAVAILABLE');
    state = act(state, 'NEXT_DAY');
    assert.equal(state.day, bonus.minDay + 1);
    state = act(state, 'SET_MENU', {ids: [person.usual]});
    for (let attempts = 0; E.relationshipStatus(state, characterId).satisfaction < minimum && attempts < 12; attempts++) state = act(state, 'NEXT_DAY');
    assert(E.relationshipStatus(state, characterId).satisfaction >= minimum);
    assert(E.availableStories(state).some(story => story.id === bonus.id));
    state = act(state, 'CHOOSE', {storyId: bonus.id, choiceId: bonus.choices[0].id});
    assert(state.memories.some(item => item.storyId === bonus.id));
    assert.deepEqual(E.importSave(E.exportSave(state)), state);
  });
});

process.stdout.write('\n' + passed + ' engine checks passed.\n');
