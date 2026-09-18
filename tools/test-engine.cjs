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

process.stdout.write('\n' + passed + ' engine checks passed.\n');
