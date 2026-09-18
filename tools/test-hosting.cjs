#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const E = require('../prototype/game/engine.js');
const C = require('../prototype/game/content.js');
let passed = 0;
const copy = value => JSON.parse(JSON.stringify(value));
const routes = C.occasions.flatMap(occasion => occasion.approaches.map(approach => ({occasion, approach})));
function test(name, run) {
  try { run(); passed++; process.stdout.write('✓ ' + name + '\n'); }
  catch (error) { process.stderr.write('✗ ' + name + '\n'); throw error; }
}
function act(state, type, data) {
  const result = E.dispatch(state, Object.assign({type}, data || {}));
  assert.equal(result.error, null, type + ': ' + result.error);
  return result.state;
}
function prepare(route, state = E.newGame()) {
  state = act(state, 'SELECT_OCCASION', {occasionId: route.occasion.id, approachId: route.approach.id});
  return act(state, 'PREPARE_OCCASION');
}
function manual(state) {
  state = act(state, 'OPEN_DAY');
  while (E.currentGuest(state)) state = act(state, 'SERVE', {recipeId: E.currentGuest(state).recommended});
  return act(state, 'CLOSE_DAY');
}
const roundTrip = state => assert.deepEqual(E.importSave(E.exportSave(state)), state);

test('all six hosting approaches have three valid, different guest moments and bilingual outcomes', () => {
  assert.equal(C.occasions.length, 3); assert.equal(routes.length, 6);
  assert.equal(new Set(routes.map(({approach}) => approach.id)).size, 6);
  assert.equal(C.decorations.length, 6);
  for (const {occasion, approach} of routes) {
    assert.equal(approach.guestIds.length, 3); assert.equal(approach.intentions.length, 3);
    assert.equal(new Set(approach.guestIds).size, 3);
    assert.equal(new Set(approach.intentions).size, 3);
    assert(approach.guestIds.every(id => C.characters.some(person => person.id === id)));
    assert(approach.intentions.every(id => C.hostIntentions.some(item => item.id === id)));
    assert(C.layouts.some(item => item.id === approach.layout));
    assert(C.decorations.some(item => item.id === approach.decorationId && item.occasionId === occasion.id && item.approachId === approach.id));
    assert(C.occasions.some(item => item.id === approach.nextOccasionId));
    for (const key of ['name', 'description', 'opening', 'outcome', 'followUp']) for (const lang of ['en', 'ar']) assert(approach[key][lang].trim().length);
  }
});

test('every approach can be freely selected, prepared and completed from a zero-cash new café', () => {
  for (const route of routes) {
    let state = E.newGame(); state.cash = 0;
    const before = copy(state);
    state = act(state, 'SELECT_OCCASION', {occasionId: route.occasion.id, approachId: route.approach.id});
    assert.deepEqual(state.menu, before.menu); assert.equal(state.layout, before.layout); assert.equal(state.cash, 0);
    assert.deepEqual(E.hostingPlan(state), route);
    state = act(state, 'PREPARE_OCCASION');
    assert.equal(state.cash, 0); assert.equal(state.layout, route.approach.layout);
    assert(state.menu.length <= state.boardSlots && state.menu.every(id => state.recipes.includes(id)));
    state = act(state, 'OPEN_DAY');
    assert.deepEqual(state.service.guests.map(guest => guest.characterId), route.approach.guestIds);
    assert.deepEqual(state.service.guests.map(guest => guest.intention), route.approach.intentions);
    assert(state.service.guests.every(guest => E.hostingMatch(state, guest, guest.recommended)));
    state = act(state, 'CLOSE_DAY');
    assert.deepEqual(state.hosting.owned, [route.approach.decorationId]);
    assert.equal(state.hosting.completed[route.approach.id], 1);
    assert(state.hosting.last.served.every(guest => guest.matched));
    assert.deepEqual(state.lastDay.hosting, state.hosting.last);
    roundTrip(state);
    state = act(state, 'NEXT_DAY');
    assert.equal(state.day, 2); assert.equal(state.hosting.plan, null);
    assert.equal(state.hosting.last.approachId, route.approach.id);
    assert.equal(E.hostingPlan(state), null);
    roundTrip(state);
  }
});

test('manual, instant and partial delegation have identical cash, relationships, keepsakes and outcomes', () => {
  for (const route of routes) {
    let source = prepare(route);
    source = act(source, 'SELECT_BRIEF', {id: E.dailyBriefs(source)[0].id});
    const fullyManual = manual(source); const delegated = act(source, 'CLOSE_DAY');
    let partial = act(source, 'OPEN_DAY');
    partial = act(partial, 'SERVE', {recipeId: E.currentGuest(partial).recommended});
    partial = E.importSave(E.exportSave(partial));
    partial = act(partial, 'CLOSE_DAY');
    for (const other of [delegated, partial]) {
      for (const key of ['cash', 'relationships', 'hosting', 'monthly', 'daysRun', 'totalServed', 'keepsakes']) assert.deepEqual(fullyManual[key], other[key], route.approach.id + ': ' + key);
      assert.deepEqual(fullyManual.lastDay.hosting, other.lastDay.hosting);
      assert.deepEqual(fullyManual.lastDay.brief, other.lastDay.brief);
      assert.equal(fullyManual.lastDay.profit, other.lastDay.profit);
    }
    assert.equal(fullyManual.lastDay.manual, 3); assert.equal(delegated.lastDay.manual, 0); assert.equal(partial.lastDay.manual, 1);
  }
});

test('hosted wishes earn the same bond progress and can broaden original preferences', () => {
  const route = routes.find(({approach}) => approach.id === 'tasting-discovery');
  let state = prepare(route);
  state = act(state, 'OPEN_DAY');
  const guest = E.currentGuest(state);
  assert.equal(guest.characterId, 'noor'); assert.equal(guest.intention, 'discovery');
  const newTaste = state.service.menu.find(id => E.serviceMatch(state, 'noor', id) === 'different' && E.hostingMatch(state, guest, id));
  assert(newTaste);
  const result = E.dispatch(state, {type: 'SERVE', recipeId: newTaste}); assert.equal(result.error, null); state = result.state;
  assert.equal(state.relationships.noor.satisfaction, 3);
  assert(state.relationships.noor.rememberedPreferences.includes(newTaste));
  const effect = result.effects.find(item => item.type === 'serve');
  assert.equal(effect.intention, 'discovery'); assert.equal(effect.matched, true);
  assert(E.hostingMatch(state, state.service.guests[0], newTaste), 'learning a taste must not rewrite its opening wish');
  roundTrip(state);
  state = act(state, 'CLOSE_DAY');
  assert(state.hosting.last.served.every(row => row.matched));
  for (const id of route.approach.guestIds) assert.equal(state.relationships[id].satisfaction, 3);
  roundTrip(state);
});

test('custom discoveries are suggested without requiring a workshop purchase or a particular menu', () => {
  const route = routes.find(({approach}) => approach.id === 'tasting-discovery');
  let state = act(E.newGame(), 'CREATE_RECIPE', {name: 'Neighbourhood rose', base: 'milk', flavour: 'rose', temperature: 'cold'});
  const customId = state.customRecipes[0].id;
  state = prepare(route, state);
  assert(state.menu.includes(customId));
  state = act(state, 'OPEN_DAY');
  assert.equal(state.service.guests[0].recommended, customId);
  roundTrip(act(state, 'CLOSE_DAY'));
  let limited = act(E.newGame(), 'SET_MENU', {ids: ['karak']});
  limited = act(limited, 'SELECT_OCCASION', {occasionId: route.occasion.id, approachId: route.approach.id});
  limited = act(limited, 'CLOSE_DAY');
  assert(limited.hosting.owned.includes(route.approach.decorationId));
  assert(limited.hosting.last.served.some(row => !row.matched));
  roundTrip(limited);
});

test('opening freezes guests, recommendations, menu earnings and display history while live displays remain editable', () => {
  let state = act(prepare(routes[0]), 'CLOSE_DAY');
  const souvenir = routes[0].approach.decorationId;
  state = act(state, 'PLACE_DECORATION', {id: souvenir, slot: 'wall'});
  state = act(state, 'NEXT_DAY');
  state = prepare(routes[1], state); state = act(state, 'OPEN_DAY');
  const snapshot = copy(state.service); const expected = E.forecast(state);
  state = act(state, 'SET_MENU', {ids: ['mint']});
  state = act(state, 'SET_LAYOUT', {id: 'quiet'}); state = act(state, 'SET_SUPPLIER', {id: C.suppliers.at(-1).id});
  state = act(state, 'PLACE_DECORATION', {id: souvenir, slot: 'shelf'});
  assert.equal(state.hosting.displays.wall, null); assert.equal(state.hosting.displays.shelf, souvenir);
  assert.equal(state.service.hosting.displays.wall, souvenir);
  assert.deepEqual(state.service, snapshot); assert.deepEqual(E.forecast(state), expected);
  assert.equal(E.dispatch(state, {type: 'SELECT_OCCASION', occasionId: routes[2].occasion.id, approachId: routes[2].approach.id}).error, 'INVALID_PHASE');
  assert.equal(E.dispatch(state, {type: 'CLEAR_OCCASION'}).error, 'INVALID_PHASE');
  assert.equal(E.dispatch(state, {type: 'PREPARE_OCCASION'}).error, 'INVALID_PHASE');
  roundTrip(state);
  state = act(state, 'CLOSE_DAY');
  assert.equal(state.lastDay.profit, expected.profit);
  assert.equal(state.hosting.last.approachId, routes[1].approach.id);
  roundTrip(state);
});

test('repeat hosting preserves one souvenir and one memory without special cash rewards or double settlement', () => {
  const route = routes[0]; let state = prepare(route);
  const ordinary = act(act(state, 'CLEAR_OCCASION'), 'CLOSE_DAY');
  state = act(state, 'CLOSE_DAY');
  assert.equal(state.cash, ordinary.cash); assert.equal(state.lastDay.profit, ordinary.lastDay.profit);
  assert.equal(state.hosting.last.newDecoration, true);
  assert.deepEqual(act(state, 'CLOSE_DAY'), state);
  state = act(state, 'NEXT_DAY'); state = prepare(route, state); state = act(state, 'CLOSE_DAY');
  assert.equal(state.hosting.completed[route.approach.id], 2); assert.equal(state.hosting.last.newDecoration, false);
  assert.deepEqual(state.hosting.owned, [route.approach.decorationId]);
  assert.equal(state.memories.filter(memory => memory.id === 'hosting:' + route.approach.id).length, 1);
  roundTrip(state);
});

test('owned decorations rearrange in every phase without spending cash or losing an object', () => {
  let state = act(prepare(routes[0]), 'CLOSE_DAY');
  const id = routes[0].approach.decorationId;
  for (const phase of ['closed', 'planning', 'open']) {
    if (phase === 'planning') state = act(state, 'NEXT_DAY');
    if (phase === 'open') state = act(state, 'OPEN_DAY');
    const cash = state.cash;
    for (const slot of E.DISPLAY_SLOTS) {
      state = act(state, 'PLACE_DECORATION', {id, slot});
      assert.equal(state.hosting.displays[slot], id);
      assert.equal(Object.values(state.hosting.displays).filter(Boolean).length, 1);
      assert.equal(state.cash, cash); roundTrip(state);
    }
    state = act(state, 'CLEAR_DISPLAY', {slot: 'corner'});
    assert(state.hosting.owned.includes(id)); assert(Object.values(state.hosting.displays).every(value => value === null));
  }
  assert.equal(E.dispatch(state, {type: 'PLACE_DECORATION', id: 'imaginary', slot: 'wall'}).error, 'INVALID_DECORATION');
  assert.equal(E.dispatch(state, {type: 'PLACE_DECORATION', id: C.decorations[1].id, slot: 'wall'}).error, 'NOT_OWNED');
});

test('collections, arrangement, learned preferences and hosted outcomes survive succession', () => {
  let state = act(prepare(routes[0]), 'CLOSE_DAY');
  state = act(state, 'PLACE_DECORATION', {id: routes[0].approach.decorationId, slot: 'wall'});
  const before = copy(state);
  state = act(state, 'SUCCESSION', {id: C.heirs[0].id});
  assert.deepEqual(state.hosting, before.hosting); assert.deepEqual(state.relationships, before.relationships);
  state = act(state, 'CLEAR_OCCASION'); state = prepare(routes[2], state); state = act(state, 'OPEN_DAY');
  assert(state.service.guests.some(guest => guest.descendant));
  state = act(state, 'CLOSE_DAY');
  assert(state.hosting.owned.includes(before.hosting.owned[0])); assert.equal(state.hosting.displays.wall, before.hosting.displays.wall);
  roundTrip(state);
});

test('older saves migrate only represented story souvenirs, never hosted-day counts or fabricated visits', () => {
  const migratedObjects = C.decorations.filter(item => Object.keys(item.legacyChoices || {}).length);
  assert.equal(migratedObjects.length, 4);
  for (const decoration of migratedObjects) {
    const [storyId, choices] = Object.entries(decoration.legacyChoices)[0];
    let state = act(E.newGame(), 'JUMP', {days: 6});
    const story = C.stories.find(item => item.id === storyId);
    if (story.requires) {
      const previous = C.stories.find(item => item.id === story.requires);
      state = act(state, 'CHOOSE', {storyId: previous.id, choiceId: previous.choices[0].id});
    }
    state = act(state, 'CHOOSE', {storyId, choiceId: choices[0]});
    assert(state.hosting.owned.includes(decoration.id), 'new story choices also place represented souvenirs in inventory');
    const relationships = copy(state.relationships); delete state.hosting;
    const migrated = E.validate(state);
    assert(migrated.hosting.owned.includes(decoration.id)); assert.deepEqual(migrated.hosting.completed, {});
    assert.equal(migrated.hosting.last, null); assert.equal(migrated.hosting.plan, null);
    assert.deepEqual(migrated.relationships, relationships); roundTrip(migrated);
  }
  let old = act(E.newGame(), 'OPEN_DAY'); old = act(old, 'SERVE', {recipeId: E.currentGuest(old).recommended});
  delete old.hosting; delete old.service.hosting;
  const guests = copy(old.service.guests); const migrated = E.validate(old);
  assert.deepEqual(migrated.service.guests, guests); assert.equal(migrated.service.index, 1);
  assert.equal(migrated.service.hosting, null); assert.deepEqual(migrated.hosting.owned, []);
  roundTrip(act(migrated, 'CLOSE_DAY'));
});

test('hosting selection is optional, non-expiring and does not leak into subsequent ordinary days', () => {
  let state = prepare(routes[0]);
  state = E.importSave(E.exportSave(state)); assert.equal(E.hostingPlan(state).approach.id, routes[0].approach.id);
  const before = copy(state); state = act(state, 'CLEAR_OCCASION');
  assert.deepEqual(state.menu, before.menu); assert.equal(state.cash, before.cash);
  state = act(state, 'OPEN_DAY'); assert.equal(state.service.guests.length, 4); assert.equal(state.service.hosting, null);
  state = act(state, 'NEXT_DAY'); state = prepare(routes[0], state); state = act(state, 'JUMP', {days: 10});
  assert.equal(state.hosting.completed[routes[0].approach.id], 1); assert.equal(state.hosting.plan, null);
  state = act(state, 'OPEN_DAY'); assert.equal(state.service.guests.length, 4); roundTrip(state);
});

test('malformed hosting plans, possession claims, snapshots and results are rejected atomically', () => {
  const closed = act(prepare(routes[0]), 'CLOSE_DAY'); const saved = E.exportSave(closed);
  const invalids = [
    s => { s.hosting = null; },
    s => { s.hosting.paid = true; },
    s => { s.hosting.plan.approachId = 'invented'; },
    s => { s.hosting.owned.push(s.hosting.owned[0]); },
    s => { s.hosting.owned.push('unknown'); },
    s => { s.hosting.owned.push(C.decorations[1].id); },
    s => { s.hosting.completed['reunion-breakfast'] = s.daysRun + 1; },
    s => { s.hosting.last = null; },
    s => { s.hosting.displays.wall = C.decorations[1].id; },
    s => { s.hosting.displays.wall = s.hosting.owned[0]; s.hosting.displays.shelf = s.hosting.owned[0]; },
    s => { s.hosting.displays.roof = null; },
    s => { s.hosting.completed['reunion-breakfast'] = -1; },
    s => { s.hosting.completed['unknown'] = 1; },
    s => { s.hosting.last.served.pop(); },
    s => { s.hosting.last.served[0].intention = 'discovery'; },
    s => { s.hosting.last.served[0].matched = 'yes'; },
    s => { s.hosting.last.date = '1995-01-01'; },
    s => { s.hosting.last.decorationId = C.decorations[1].id; },
    s => { s.lastDay.hosting.served[0].recipeId = 'missing'; },
    s => { s.lastDay.hosting = null; },
    s => { s.service.hosting.approachId = routes[1].approach.id; },
    s => { s.service.guests[0].characterId = 'noor'; },
    s => { s.service.guests[0].intention = 'sharing'; },
    s => { s.service.guests[0].matchRecipes = []; },
    s => { s.service.guests[0].rememberedAtOpen = ['unowned']; },
    s => { s.service.guests[0].servedRecipe = 'unowned'; },
    s => { s.service.guests[0].paid = true; },
    s => { s.service.guests.push(copy(s.service.guests[0])); }
  ];
  invalids.forEach((mutate, index) => { const invalid = copy(closed); mutate(invalid); assert.throws(() => E.importSave(JSON.stringify(invalid)), 'mutation ' + index); });
  assert.equal(E.exportSave(closed), saved);
  const partial = act(act(prepare(routes[1]), 'OPEN_DAY'), 'SERVE', {recipeId: E.currentGuest(act(prepare(routes[1]), 'OPEN_DAY')).recommended});
  roundTrip(partial);
  const badPartial = copy(partial); badPartial.service.guests[2].servedRecipe = badPartial.service.menu[0];
  assert.throws(() => E.validate(badPartial));
});

test('hosting copy follows actual ages in both languages and preserves earned family memories', () => {
  const tasting = routes.find(({approach}) => approach.id === 'tasting-pairings');
  const original = copy(tasting.approach.outcome); let state = E.newGame();
  assert.deepEqual(E.hostingText(state, original), original, 'active originals must remain unchanged');
  state = act(state, 'SUCCESSION', {id: C.heirs[0].id});
  assert.equal(state.date, '2014-01-01');
  assert(!E.personStatus(state, 'grandmother').active); assert(E.personStatus(state, 'noor').active);
  const mixed = E.hostingText(state, original);
  assert(mixed.en.includes('The Um Saeed family')); assert(mixed.ar.includes('عائلة أم سعيد'));
  assert(mixed.en.includes('Noor')); assert(!mixed.en.includes('The Noor family')); assert(!mixed.ar.includes('عائلة نور'));
  assert.deepEqual(tasting.approach.outcome, original, 'localizing must never change the authored catalogue');
  state = act(prepare(tasting, state), 'CLOSE_DAY');
  const earned = copy(state.memories.find(item => item.id === 'hosting:' + tasting.approach.id));
  assert.deepEqual(earned.text, mixed); roundTrip(state);
  for (let generation = 0; generation < 4; generation++) state = act(state, 'SUCCESSION', {id: C.heirs[0].id});
  assert(C.characters.every(person => !E.personStatus(state, person.id).active));
  for (const {occasion, approach} of routes) {
    for (const source of [occasion.name, occasion.invitation, approach.opening, approach.outcome, approach.followUp]) {
      const hydrated = E.hostingText(state, source);
      assert.deepEqual(E.hostingText(state, hydrated), hydrated, 'family names must not expand on a second pass');
      for (const person of C.characters) for (const lang of ['en', 'ar']) {
        if (source[lang].includes(person.name[lang])) assert(hydrated[lang].includes(E.personStatus(state, person.id).descendant.name[lang]));
      }
    }
  }
  const tokens = E.hostingText(state, {en: 'Noorish is not Noor. Mariam’s gathering.', ar: 'نوري غير نور. لقاء مريم.'});
  assert.equal(tokens.en, 'Noorish is not The Noor family. The Mariam family’s gathering.');
  assert.equal(tokens.ar, 'نوري غير عائلة نور. لقاء عائلة مريم.');
  assert.deepEqual(state.memories.find(item => item.id === earned.id), earned, 'later ageing must not rewrite an already earned memory');
  roundTrip(state);
});

process.stdout.write('\n' + passed + ' hosting checks passed.\n');
