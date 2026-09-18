/* Café Life daily rules. No clocks, storage, DOM, network, or hidden randomness. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./content.js'));
  else root.CafeEngine = factory(root.CafeContent);
}(typeof globalThis !== 'undefined' ? globalThis : this, function (C) {
  'use strict';
  if (!C) throw new Error('CafeContent must be loaded before CafeEngine');
  const VERSION = 6;
  const SAVE_FORMAT = 'cafe-life-daily';
  const MAX_CASH = Number.MAX_SAFE_INTEGER;
  const MAX_SAVE_CHARS = 25000000;
  const START_DATE = '1994-01-01';
  const STAFF = {barista: {cost: 180, wage: 8}, host: {cost: 150, wage: 6}};
  const clone = value => JSON.parse(JSON.stringify(value));
  const list = key => Array.isArray(C[key]) ? C[key] : Object.values(C[key] || {});
  const find = (key, id) => list(key).find(item => item.id === id);
  const unique = value => [...new Set(value)];
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const money = n => Math.round(n * 100) / 100;
  const addCash = (state, n) => { state.cash = Math.min(MAX_CASH, money(state.cash + n)); };
  const hash = value => {
    let n = 2166136261;
    for (const c of String(value)) { n ^= c.charCodeAt(0); n = Math.imul(n, 16777619); }
    n ^= n >>> 16; n = Math.imul(n, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35);
    return (n ^ (n >>> 16)) >>> 0;
  };
  const cleanName = (value, fallback, max = 40) => {
    if (typeof value !== 'string') return fallback;
    return value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max) || fallback;
  };
  const localized = (value, lang) => typeof value === 'string' ? value : value && (value[lang] || value.en) || '';
  function parseDate(value) {
    if (typeof value !== 'string' || !/^\d{4,6}-\d{2}-\d{2}$/.test(value)) throw new Error('INVALID_DATE');
    const [year, month, day] = value.split('-').map(Number);
    if (year < 1 || year > 250000) throw new Error('INVALID_DATE');
    const date = new Date(0);
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCFullYear(year, month - 1, day);
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) throw new Error('INVALID_DATE');
    return date;
  }
  function dateString(date) {
    return String(date.getUTCFullYear()).padStart(4, '0') + '-' + String(date.getUTCMonth() + 1).padStart(2, '0') + '-' + String(date.getUTCDate()).padStart(2, '0');
  }
  function advanceDate(value, days) {
    const date = parseDate(value);
    date.setUTCDate(date.getUTCDate() + days);
    const result = dateString(date);
    parseDate(result);
    return result;
  }
  function seasonFor(date) {
    const month = parseDate(date).getUTCMonth() + 1;
    return [12, 1, 2].includes(month) ? 'winter' : [6, 7, 8].includes(month) ? 'summer' : [3, 4, 5].includes(month) ? 'spring' : 'autumn';
  }
  function personStatus(state, id) {
    const person = find('characters', id);
    if (!person) return null;
    const birthYears = {mariam: 1964, noor: 1970, hassan: 1958, salma: 1966, omar: 1969, grandmother: 1924};
    const year = parseDate(state.date).getUTCFullYear();
    const birthYear = person.birthYear || birthYears[id] || 1964;
    const age = Math.max(0, year - birthYear);
    const active = age < 85;
    const descendantGeneration = active ? 0 : Math.max(1, Math.floor((age - 28) / 28));
    return {age, active, name: clone(person.name), descendant: active ? null : {
      id: id + ':family:' + descendantGeneration, generation: descendantGeneration,
      name: {en: 'The ' + localized(person.name, 'en') + ' family', ar: 'عائلة ' + localized(person.name, 'ar')},
      age: age - descendantGeneration * 28, art: person.art, usual: person.usual
    }};
  }
  function allRecipes(state) { return list('recipes').filter(r => state.recipes.includes(r.id)).concat(state.customRecipes); }
  function recipe(state, id) { return find('recipes', id) || state.customRecipes.find(r => r.id === id) || null; }
  function record(state, type, data) {
    state.history.push(Object.assign({type, date: state.date, day: state.day, generation: state.generation}, data || {}));
    // Detailed transactions are bounded. Collections and story choices remain permanent elsewhere.
    if (state.history.length > 500) state.history.splice(0, state.history.length - 500);
  }
  function memory(state, id, text, data) {
    if (state.memories.some(m => m.id === id)) return;
    state.memories.push(Object.assign({id, text: clone(text), date: state.date, generation: state.generation}, data || {}));
  }
  function grantRecipe(state, id, effects) {
    if (find('recipes', id) && !state.recipes.includes(id)) {
      state.recipes.push(id);
      effects.push({type: 'recipe', id});
    }
  }
  function unlockForDay(state, effects) {
    list('recipes').forEach(r => { if (Number.isFinite(r.unlockDay) && r.unlockDay <= state.day) grantRecipe(state, r.id, effects); });
  }
  function newGame(options) {
    options = options || {};
    const lang = options.lang === 'ar' ? 'ar' : 'en';
    const origin = ['family', 'independent', 'partner'].includes(options.origin) ? options.origin : 'family';
    const starterRecipes = list('recipes').filter(r => (r.unlockDay || 1) <= 1).map(r => r.id);
    const starters = ['karak', 'regag', 'luqaimat', 'mint'].filter(id => starterRecipes.includes(id));
    const owned = unique(starters.concat(starterRecipes));
    const home = find('venues', 'home') || list('venues')[0];
    const state = {
      version: VERSION, cafeName: cleanName(options.name, lang === 'ar' ? 'مقهى الحارة' : 'Little Street'),
      owner: cleanName(options.owner, lang === 'ar' ? 'آمنة' : 'Amina'), lang, origin,
      date: START_DATE, day: 1, phase: 'planning', cash: origin === 'partner' ? 700 : origin === 'independent' ? 600 : 480,
      menu: owned.slice(0, 3), recipes: owned, customRecipes: [],
      layout: (list('layouts')[0] || {}).id || 'communal', supplier: (list('suppliers')[0] || {}).id || 'local',
      upgrades: [], venues: home ? [home.id] : [], venue: home ? home.id : 'home', boardSlots: 3, seats: 8, staff: [],
      generation: 1, heir: null, knowledge: [], memories: [], history: [], storiesDone: [], storyChoices: {},
      pendingStory: null, service: null, lastDay: null, ambitionsDone: [], reputation: 0,
      identity: {people: 0, recipe: 0, street: 0}, daysRun: 0, totalServed: 0,
      monthly: {month: '1994-01', days: 0, sales: 0, costs: 0, profit: 0, customers: 0}, accounts: [],
      settings: {music: true, sfx: true, haptics: true, reducedMotion: false, textSize: 'normal', theme: 'light'}, legacy: null
    };
    record(state, 'founded', {origin});
    return state;
  }
  function planningForecast(state) {
    const dishes = state.menu.map(id => recipe(state, id)).filter(Boolean).sort((a, b) => a.id.localeCompare(b.id));
    const season = seasonFor(state.date);
    const layout = find('layouts', state.layout) || {};
    const venue = find('venues', state.venue) || {};
    const supplier = find('suppliers', state.supplier) || {};
    const desired = season === 'summer' ? ['cool', 'quick'] : season === 'winter' ? ['warm', 'sharing'] : ['familiar', 'quick', 'sharing'];
    const tags = unique(dishes.flatMap(r => r.tags || []));
    const seasonal = desired.filter(tag => tags.includes(tag)).length;
    const spatial = unique((layout.tags || []).concat(venue.tags || [])).filter(tag => tags.includes(tag)).length;
    const tools = state.upgrades.map(id => find('upgrades', id)).filter(u => u && u.kind === 'tool');
    const toolFit = Math.min(0.08, tools.reduce((sum, tool) => sum + (tool.tags || []).filter(tag => tags.includes(tag)).length * 0.02, 0));
    const knowledgeFit = Math.min(0.03, list('heirs').filter(h => state.knowledge.includes(h.traitId || h.id)).reduce((sum, h) => sum + (h.tags || []).filter(tag => tags.includes(tag)).length * 0.01, 0));
    const regularCoverage = list('characters').filter(p => dishes.some(r => r.id === p.usual)).length;
    const averagePrice = dishes.reduce((sum, r) => sum + r.price, 0) / dishes.length;
    const pricePressure = Math.max(0, averagePrice - 13) * 0.028;
    const fit = money(clamp(0.50 + Math.min(tags.length, 6) * 0.035 + seasonal * 0.045 + Math.min(spatial, 3) * 0.045 + regularCoverage * 0.015 + clamp(Number(supplier.quality) || 0, 0, 0.15) + toolFit + knowledgeFit - pricePressure, 0.35, 0.98));
    const capacity = Math.min(64, 10 + state.seats * 1.35 + state.staff.length * 3 + tools.length * 2);
    const customers = Math.max(4, Math.round(capacity * fit));
    let sales = 0;
    let ingredients = 0;
    const menu = dishes.map(r => ({id: r.id, orders: 0}));
    const weights = dishes.map(r => {
      const matches = values => values.filter(tag => (r.tags || []).includes(tag)).length;
      return (1 + matches(desired) * 1.6 + matches(venue.tags || []) * 1.3 + matches(layout.tags || []) * 0.9)
        * clamp(1 - (r.price - 14) * 0.035, 0.45, 1.35);
    });
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    for (let i = 0; i < customers; i++) {
      let point = (hash(state.date + ':' + state.venue + ':' + i) / 4294967296) * totalWeight;
      let choice = 0;
      while (choice < dishes.length - 1 && point >= weights[choice]) { point -= weights[choice]; choice++; }
      const item = dishes[choice];
      const row = menu.find(r => r.id === item.id);
      row.orders++;
      sales += item.price;
      ingredients += item.cost * clamp(Number(supplier.costMultiplier) || 1, 0.5, 1.8);
    }
    const rent = state.knowledge.includes('legacy-freehold') ? 0 : money(8 + state.seats * 0.6 + (state.venue === (state.venues[0] || 'home') ? 0 : 8));
    const wages = money(state.staff.reduce((sum, id) => sum + STAFF[id].wage, 0));
    const supplierFee = Math.max(0, Number(supplier.fee) || 0);
    const operating = money(sales * 0.06);
    const costs = money(ingredients + rent + wages + supplierFee + operating);
    sales = money(sales);
    return {
      date: state.date, sales, costs, profit: money(Math.max(0, sales - costs)), customers, fit, season, menu,
      breakdown: {ingredients: money(ingredients), rent, wages, supplier: supplierFee, operating},
      coveredShortfall: money(Math.max(0, costs - sales)),
      matches: {seasonal, spatial, regulars: regularCoverage, tools: toolFit, knowledge: knowledgeFit}, venue: state.venue
    };
  }
  function forecast(state) {
    if (state.phase === 'open' && state.service) return clone(state.service.forecast);
    if (state.phase === 'closed' && state.lastDay && state.lastDay.day === state.day) return clone(state.lastDay);
    return planningForecast(state);
  }
  function generationEvents(state) {
    return list('events').map(event => state.generation === 1 ? event : Object.assign({}, event, {
      id: event.id + '@g' + state.generation, templateId: event.id,
      requires: event.requires ? (Array.isArray(event.requires) ? event.requires : [event.requires]).map(id => find('events', id) ? id + '@g' + state.generation : id) : undefined
    }));
  }
  function storyTemplate(id) {
    const base = typeof id === 'string' ? id.replace(/@g\d+$/, '') : id;
    return list('stories').concat(list('events')).find(s => s.id === base);
  }
  function eligibleStory(state, story) {
    if (!story || state.storiesDone.includes(story.id)) return false;
    if (story.requires && !(Array.isArray(story.requires) ? story.requires : [story.requires]).every(id => state.storiesDone.includes(id))) return false;
    if ((story.minDay || story.day || 1) > state.day) return false;
    if (story.generation && state.generation < story.generation) return false;
    if (story.venue && !state.venues.includes(story.venue)) return false;
    const characterId = story.characterId || story.character;
    if (characterId && find('characters', characterId) && !personStatus(state, characterId).active) return false;
    return true;
  }
  function availableStories(state) {
    return list('stories').concat(generationEvents(state)).filter(story => eligibleStory(state, story));
  }
  function currentGuest(state) {
    return state.phase === 'open' && state.service ? clone(state.service.guests[state.service.index] || null) : null;
  }
  function rollMonth(state) {
    const month = state.date.slice(0, state.date.lastIndexOf('-'));
    if (state.monthly.month === month) return;
    if (state.monthly.days) state.accounts.push(clone(state.monthly));
    if (state.accounts.length > 120) state.accounts.shift();
    state.monthly = {month, days: 0, sales: 0, costs: 0, profit: 0, customers: 0};
  }
  function openDay(state, effects) {
    if (state.phase !== 'planning') return false;
    const people = list('characters');
    const offset = hash(state.date + ':' + state.venue) % people.length;
    const guests = Array.from({length: 4}, (_, index) => {
      const person = people[(offset + index) % people.length];
      const status = personStatus(state, person.id);
      return {id: state.day + ':' + index, characterId: person.id, usual: person.usual,
        name: status.active ? clone(person.name) : status.descendant.name,
        descendant: !status.active, personId: status.active ? person.id : status.descendant.id,
        recommended: state.menu.includes(person.usual) ? person.usual : state.menu[(index + state.day) % state.menu.length], servedRecipe: null};
    });
    state.service = {date: state.date, day: state.day, menu: state.menu.slice(), layout: state.layout,
      supplier: state.supplier, venue: state.venue, seats: state.seats, guests, index: 0, manual: 0, forecast: planningForecast(state)};
    state.phase = 'open';
    effects.push({type: 'open'});
    return true;
  }
  function checkAmbitions(state, effects) {
    const counts = {days: state.daysRun, stories: state.storiesDone.length, customRecipes: state.customRecipes.length,
      recipes: state.recipes.length + state.customRecipes.length, upgrades: state.upgrades.length,
      venues: state.venues.length, generation: state.generation, served: state.totalServed};
    list('ambitions').forEach(a => {
      if (!state.ambitionsDone.includes(a.id) && Number.isFinite(a.target) && (counts[a.kind] || 0) >= a.target) {
        state.ambitionsDone.push(a.id);
        const reward = Math.max(0, Math.min(500, Number(a.rewardCash) || 0));
        addCash(state, reward);
        memory(state, 'ambition:' + a.id, a.name, {kind: 'ambition', ambitionId: a.id});
        effects.push({type: 'ambition', id: a.id, amount: reward});
      }
    });
  }
  function closeDay(state, effects) {
    if (state.phase === 'closed') return;
    if (state.phase === 'planning') openDay(state, effects);
    const result = Object.assign(clone(state.service.forecast), {day: state.day, manual: state.service.manual});
    addCash(state, result.profit);
    state.daysRun++;
    state.totalServed += result.customers;
    state.lastDay = result;
    state.phase = 'closed';
    state.service.guests.forEach(guest => { if (!guest.servedRecipe) guest.servedRecipe = guest.recommended; });
    state.service.index = state.service.guests.length;
    rollMonth(state);
    state.monthly.days++;
    ['sales', 'costs', 'profit', 'customers'].forEach(key => { state.monthly[key] = money(state.monthly[key] + result[key]); });
    record(state, 'day', {profit: result.profit, customers: result.customers, venue: result.venue});
    effects.push({type: 'close', amount: result.profit, customers: result.customers});
    checkAmbitions(state, effects);
  }
  function nextDay(state, effects) {
    if (state.phase !== 'closed') closeDay(state, effects);
    state.date = advanceDate(state.date, 1);
    rollMonth(state);
    state.day++;
    state.phase = 'planning';
    state.service = null;
    unlockForDay(state, effects);
    effects.push({type: 'nextDay'});
  }
  function createRecipe(state, action, effects) {
    const bases = ['tea', 'coffee', 'milk', 'fruit'];
    const flavours = ['cardamom', 'rose', 'date', 'saffron', 'mint', 'chocolate'];
    if (!bases.includes(action.base) || !flavours.includes(action.flavour) || !['hot', 'cold'].includes(action.temperature)) return 'INVALID_RECIPE';
    if (state.customRecipes.filter(r => !r.legacy).length >= 120) return 'RECIPE_BOOK_FULL';
    const combination = action.base + ':' + action.flavour + ':' + action.temperature;
    const existing = state.customRecipes.find(r => r.combination === combination);
    if (existing) return 'RECIPE_EXISTS';
    const id = 'house-' + combination.replace(/:/g, '-');
    const name = cleanName(action.name, state.lang === 'ar' ? 'وصفة البيت' : 'House recipe', 48);
    const baseTag = {tea: 'familiar', coffee: 'quick', milk: 'sharing', fruit: 'quick'}[action.base];
    const flavourTag = {cardamom: 'familiar', rose: 'special', date: 'sharing', saffron: 'special', mint: 'quick', chocolate: 'sharing'}[action.flavour];
    const tags = unique([action.temperature === 'hot' ? 'warm' : 'cool', baseTag, flavourTag]);
    const price = {tea: 11, coffee: 17, milk: 14, fruit: 16}[action.base] + {cardamom: 1, rose: 3, date: 2, saffron: 4, mint: 0, chocolate: 2}[action.flavour];
    const cost = {tea: 2, coffee: 5, milk: 4, fruit: 5}[action.base] + (['saffron', 'chocolate'].includes(action.flavour) ? 2 : 1);
    const art = action.base === 'coffee' ? 'espresso' : action.base === 'fruit' ? 'roselem' : 'karak';
    state.customRecipes.push({id, name: {en: name, ar: name}, description: {en: 'Your own signature recipe.', ar: 'وصفتك الخاصة المميزة.'}, base: action.base, flavour: action.flavour,
      temperature: action.temperature, combination, tags, price, cost, art, custom: true});
    memory(state, 'recipe:' + id, {en: name, ar: name}, {kind: 'recipe', recipeId: id});
    record(state, 'recipe', {id});
    effects.push({type: 'recipe', id});
    return null;
  }
  function dispatch(input, action) {
    const effects = [];
    if (!action || typeof action.type !== 'string') return {state: input, effects, error: 'INVALID_ACTION'};
    let state;
    try { state = clone(input); } catch (_) { return {state: input, effects, error: 'INVALID_STATE'}; }
    let error = null;
    try {
      switch (action.type) {
        case 'SET_MENU': {
          const ids = action.ids;
          const owned = allRecipes(state).map(r => r.id);
          if (!Array.isArray(ids) || !ids.length || ids.length > state.boardSlots || unique(ids).length !== ids.length || !ids.every(id => owned.includes(id))) { error = 'INVALID_MENU'; break; }
          state.menu = ids.slice(); effects.push({type: 'menu'}); break;
        }
        case 'SET_LAYOUT':
          if (!find('layouts', action.id)) error = 'INVALID_LAYOUT';
          else { state.layout = action.id; effects.push({type: 'layout', id: action.id}); }
          break;
        case 'SET_SUPPLIER':
          if (!find('suppliers', action.id)) error = 'INVALID_SUPPLIER';
          else { state.supplier = action.id; effects.push({type: 'supplier', id: action.id}); }
          break;
        case 'BUY_UPGRADE': {
          const upgrade = find('upgrades', action.id);
          if (!upgrade) { error = 'INVALID_UPGRADE'; break; }
          if (state.upgrades.includes(upgrade.id)) { error = 'ALREADY_OWNED'; break; }
          if (state.cash < upgrade.cost) { error = 'NOT_ENOUGH_CASH'; break; }
          state.cash = money(state.cash - upgrade.cost); state.upgrades.push(upgrade.id);
          if (upgrade.kind === 'board') state.boardSlots = Math.min(8, state.boardSlots + upgrade.value);
          if (upgrade.kind === 'seats') state.seats = Math.min(32, state.seats + upgrade.value);
          effects.push({type: 'purchase', id: upgrade.id, amount: upgrade.cost}); record(state, 'upgrade', {id: upgrade.id}); break;
        }
        case 'OPEN_DAY':
          if (state.phase === 'closed') { error = 'DAY_FINISHED'; break; }
          openDay(state, effects); break;
        case 'SERVE': {
          if (state.phase !== 'open' || !state.service) { error = 'INVALID_PHASE'; break; }
          const guest = state.service.guests[state.service.index];
          if (!guest) { error = 'NO_GUEST'; break; }
          if (!state.service.menu.includes(action.recipeId)) { error = 'INVALID_RECIPE'; break; }
          guest.servedRecipe = action.recipeId;
          state.service.index++; state.service.manual++;
          effects.push({type: 'serve', id: guest.characterId, recipeId: action.recipeId, usual: action.recipeId === guest.usual});
          break;
        }
        case 'CLOSE_DAY': closeDay(state, effects); break;
        case 'NEXT_DAY': nextDay(state, effects); break;
        case 'CONTINUE':
          if (state.phase === 'planning') openDay(state, effects);
          else if (state.phase === 'open') closeDay(state, effects);
          else nextDay(state, effects);
          break;
        case 'TALK': {
          const story = availableStories(state).find(s => s.id === action.id || s.characterId === action.id || s.character === action.id || s.id.startsWith(action.id + '-'));
          if (!story) { error = 'STORY_UNAVAILABLE'; break; }
          state.pendingStory = story.id; effects.push({type: 'talk', id: story.id}); break;
        }
        case 'CHOOSE': {
          const story = availableStories(state).find(s => s.id === action.storyId);
          if (!story) { error = 'STORY_UNAVAILABLE'; break; }
          const choice = story.choices.find(c => c.id === action.choiceId);
          if (!choice) { error = 'INVALID_CHOICE'; break; }
          const cost = Math.max(0, Number(choice.cost) || 0);
          if (state.cash < cost) { error = 'NOT_ENOUGH_CASH'; break; }
          state.cash = money(state.cash - cost);
          state.storiesDone.push(story.id); state.storyChoices[story.id] = choice.id;
          state.pendingStory = null;
          const reward = Math.max(0, Math.min(1000, Number(choice.rewardCash) || 0));
          addCash(state, reward);
          state.reputation = Math.min(100, state.reputation + Math.max(0, Number(choice.reputation) || 0));
          if (Object.hasOwn(state.identity, choice.kind)) state.identity[choice.kind] = Math.min(100, state.identity[choice.kind] + 1);
          if (choice.recipe) grantRecipe(state, choice.recipe, effects);
          memory(state, story.id, choice.memory || choice.result || story.title, {kind: choice.kind || 'people', storyId: story.id, choiceId: choice.id});
          record(state, 'story', {id: story.id, choiceId: choice.id});
          effects.push({type: 'story', id: story.id, choiceId: choice.id, amount: reward}); break;
        }
        case 'CREATE_RECIPE': error = createRecipe(state, action, effects); break;
        case 'BUY_VENUE': {
          const venue = find('venues', action.id);
          if (!venue) { error = 'INVALID_VENUE'; break; }
          if (state.venues.includes(venue.id)) { error = 'ALREADY_OWNED'; break; }
          if (state.cash < venue.cost) { error = 'NOT_ENOUGH_CASH'; break; }
          state.cash = money(state.cash - venue.cost); state.venues.push(venue.id);
          memory(state, 'venue:' + venue.id, venue.name, {kind: 'venue', venueId: venue.id});
          effects.push({type: 'purchase', id: venue.id, amount: venue.cost}); break;
        }
        case 'SWITCH_VENUE':
          if (!state.venues.includes(action.id)) { error = 'NOT_OWNED'; break; }
          state.venue = action.id; effects.push({type: 'venue', id: action.id}); break;
        case 'HIRE':
          if (!Object.hasOwn(STAFF, action.id)) { error = 'INVALID_STAFF'; break; }
          if (state.staff.includes(action.id)) { error = 'ALREADY_OWNED'; break; }
          if (state.cash < STAFF[action.id].cost) { error = 'NOT_ENOUGH_CASH'; break; }
          state.cash = money(state.cash - STAFF[action.id].cost); state.staff.push(action.id);
          effects.push({type: 'hire', id: action.id}); break;
        case 'SUCCESSION': {
          const heir = find('heirs', action.id);
          if (!heir) { error = 'INVALID_HEIR'; break; }
          if (state.phase === 'open') closeDay(state, effects);
          const previousOwner = state.owner;
          const oldDate = state.date;
          const date = parseDate(state.date);
          const month = date.getUTCMonth();
          date.setUTCFullYear(date.getUTCFullYear() + 20);
          if (date.getUTCMonth() !== month) date.setUTCDate(0);
          state.date = dateString(date);
          parseDate(state.date);
          rollMonth(state);
          state.day += Math.round((date.getTime() - parseDate(oldDate).getTime()) / 86400000);
          state.phase = 'planning'; state.service = null; state.pendingStory = null;
          state.generation++; state.heir = heir.id; state.owner = localized(heir.name, state.lang);
          const traitId = heir.traitId || heir.id;
          if (!state.knowledge.includes(traitId)) state.knowledge.push(traitId);
          if (heir.recipe) grantRecipe(state, heir.recipe, effects);
          unlockForDay(state, effects);
          memory(state, 'generation:' + state.generation, {en: previousOwner + ' passed the café to ' + localized(heir.name, 'en') + '.', ar: 'انتقل المقهى من ' + previousOwner + ' إلى ' + localized(heir.name, 'ar') + '.'}, {kind: 'family', owner: previousOwner, heirId: heir.id});
          record(state, 'succession', {owner: previousOwner, heirId: heir.id});
          effects.push({type: 'succession', id: heir.id}); break;
        }
        case 'JUMP': {
          if (!Number.isInteger(action.days) || action.days < 1 || action.days > 3650) { error = 'INVALID_JUMP'; break; }
          const openingCash = state.cash;
          for (let i = 0; i < action.days; i++) nextDay(state, effects);
          effects.push({type: 'jump', days: action.days, amount: money(state.cash - openingCash)}); break;
        }
        case 'SET_PREF': {
          if (action.key === 'lang') { if (!['en', 'ar'].includes(action.value)) error = 'INVALID_PREF'; else state.lang = action.value; break; }
          if (['music', 'sfx', 'haptics', 'reducedMotion'].includes(action.key) && typeof action.value === 'boolean') state.settings[action.key] = action.value;
          else if (action.key === 'textSize' && ['normal', 'large', 'larger'].includes(action.value)) state.settings.textSize = action.value;
          else if (action.key === 'theme' && ['auto', 'light', 'dark'].includes(action.value)) state.settings.theme = action.value;
          else error = 'INVALID_PREF';
          break;
        }
        case 'RENAME':
          state.cafeName = cleanName(action.name, state.cafeName); state.owner = cleanName(action.owner, state.owner); break;
        default: error = 'INVALID_ACTION';
      }
      if (!error) checkAmbitions(state, effects);
    } catch (_) { error = 'INVALID_STATE'; }
    return error ? {state: input, effects: [], error} : {state, effects, error: null};
  }

  function validate(candidate) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate) || candidate.version !== VERSION) throw new Error('INVALID_SAVE');
    const raw = clone(candidate);
    const validNumber = (n, max = MAX_CASH) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= max;
    const validInt = (n, max = MAX_CASH) => Number.isInteger(n) && validNumber(n, max);
    const requireValue = condition => { if (!condition) throw new Error('INVALID_SAVE'); };
    const ids = (value, allowed, max = 500) => Array.isArray(value) && value.length <= max && unique(value).length === value.length && value.every(id => typeof id === 'string' && allowed.includes(id));
    requireValue(typeof raw.cafeName === 'string' && raw.cafeName.length <= 40 && raw.cafeName.trim().length && typeof raw.owner === 'string' && raw.owner.length <= 40 && raw.owner.trim().length);
    requireValue(['en', 'ar'].includes(raw.lang) && ['planning', 'open', 'closed'].includes(raw.phase));
    requireValue(validNumber(raw.cash) && validInt(raw.day) && raw.day >= 1 && validInt(raw.generation) && raw.generation >= 1);
    parseDate(raw.date);
    requireValue(validInt(raw.boardSlots, 8) && raw.boardSlots >= 3 && validInt(raw.seats, 32) && raw.seats >= 1);
    requireValue(ids(raw.recipes, list('recipes').map(r => r.id)) && raw.recipes.length > 0);
    requireValue(Array.isArray(raw.customRecipes) && raw.customRecipes.length <= 20000 && raw.customRecipes.filter(r => r && !r.legacy).length <= 120);
    const customIds = [];
    raw.customRecipes.forEach(r => {
      requireValue(r && typeof r.id === 'string' && /^house-[a-z0-9-]+$/.test(r.id) && !customIds.includes(r.id) && !find('recipes', r.id));
      requireValue(r.name && ['en', 'ar'].every(lang => typeof r.name[lang] === 'string' && r.name[lang].length > 0 && r.name[lang].length <= 48));
      requireValue(r.description && ['en', 'ar'].every(lang => typeof r.description[lang] === 'string' && r.description[lang].length <= 500));
      requireValue(list('recipes').map(item => item.art).concat('almond', 'chai').includes(r.art));
      const priceLimit = r.legacy === true ? 1000000000 : 100;
      requireValue(validNumber(r.price, priceLimit) && validNumber(r.cost, priceLimit) && Array.isArray(r.tags) && r.tags.length <= 16 && r.tags.every(tag => typeof tag === 'string' && tag.length < 24));
      requireValue(typeof r.combination === 'string' && r.combination.length < 100);
      customIds.push(r.id);
    });
    requireValue(ids(raw.menu, raw.recipes.concat(customIds), raw.boardSlots) && raw.menu.length > 0);
    requireValue(!!find('layouts', raw.layout) && !!find('suppliers', raw.supplier));
    requireValue(ids(raw.upgrades, list('upgrades').map(u => u.id)) && ids(raw.venues, list('venues').map(v => v.id)) && raw.venues.length > 0 && raw.venues.includes(raw.venue));
    requireValue(ids(raw.staff, Object.keys(STAFF)));
    requireValue(Array.isArray(raw.knowledge) && raw.knowledge.length <= 20 && raw.knowledge.every(x => typeof x === 'string' && x.length < 60));
    const storyIds = list('stories').concat(list('events')).map(s => s.id);
    const validStoryId = id => storyIds.includes(id) || (typeof id === 'string' && /@g[1-9]\d*$/.test(id) && Number(id.split('@g')[1]) <= raw.generation && !!find('events', id.replace(/@g\d+$/, '')));
    requireValue(Array.isArray(raw.storiesDone) && raw.storiesDone.length <= 10000 && unique(raw.storiesDone).length === raw.storiesDone.length && raw.storiesDone.every(validStoryId) && ids(raw.ambitionsDone, list('ambitions').map(a => a.id)));
    requireValue(raw.storyChoices && typeof raw.storyChoices === 'object' && !Array.isArray(raw.storyChoices));
    requireValue(Object.keys(raw.storyChoices).every(id => raw.storiesDone.includes(id)));
    raw.storiesDone.forEach(id => {
      const story = storyTemplate(id);
      requireValue(story.choices.some(choice => choice.id === raw.storyChoices[id]));
    });
    requireValue(raw.pendingStory === null || validStoryId(raw.pendingStory));
    requireValue(validInt(raw.daysRun) && validInt(raw.totalServed) && validNumber(raw.reputation, 100));
    requireValue(raw.identity && ['people', 'recipe', 'street'].every(key => validNumber(raw.identity[key], 100)));
    requireValue(Array.isArray(raw.memories) && raw.memories.length <= 10000 && raw.memories.every(m => m && typeof m.id === 'string' && m.text && typeof m.text.en === 'string' && typeof m.text.ar === 'string'));
    requireValue(Array.isArray(raw.history) && raw.history.length <= 500 && raw.history.every(h => h && typeof h.type === 'string' && typeof h.date === 'string'));
    requireValue(raw.settings && ['music', 'sfx', 'haptics', 'reducedMotion'].every(key => typeof raw.settings[key] === 'boolean') && ['normal', 'large', 'larger'].includes(raw.settings.textSize) && ['auto', 'light', 'dark'].includes(raw.settings.theme));
    requireValue(raw.legacy === null || (raw.legacy && typeof raw.legacy === 'object' && !Array.isArray(raw.legacy) && raw.legacy.original && typeof raw.legacy.original === 'object' && !Array.isArray(raw.legacy.original)));
    const validAccount = a => {
      if (!a || typeof a.month !== 'string' || !/^\d{4,6}-\d{2}$/.test(a.month)) return false;
      try { parseDate(a.month + '-01'); } catch (_) { return false; }
      return ['sales', 'costs', 'profit'].every(key => validNumber(a[key])) && validInt(a.days, 31) && validInt(a.customers);
    };
    requireValue(validAccount(raw.monthly) && Array.isArray(raw.accounts) && raw.accounts.length <= 120 && raw.accounts.every(validAccount));
    const validForecast = f => {
      if (!f || !['sales', 'costs', 'profit'].every(key => validNumber(f[key])) || !validNumber(f.fit, 1) || !validInt(f.customers, 1000) || f.customers < 1) return false;
      try { parseDate(f.date); } catch (_) { return false; }
      if (Math.abs(f.profit - Math.max(0, money(f.sales - f.costs))) >= 0.011) return false;
      if (!f.breakdown || !['ingredients', 'rent', 'wages', 'supplier', 'operating'].every(key => validNumber(f.breakdown[key]))) return false;
      const expenseKeys = ['ingredients', 'rent', 'wages', 'supplier', 'operating'];
      if (Object.keys(f.breakdown).some(key => !expenseKeys.includes(key))) return false;
      const totalCosts = expenseKeys.reduce((sum, key) => sum + f.breakdown[key], 0);
      if (Math.abs(totalCosts - f.costs) > 0.021) return false;
      if (!Array.isArray(f.menu) || !f.menu.length || f.menu.some(row => !row || !raw.recipes.concat(customIds).includes(row.id) || !validInt(row.orders, 1000))) return false;
      return f.menu.reduce((sum, row) => sum + row.orders, 0) === f.customers;
    };
    if (raw.phase === 'open' || raw.phase === 'closed') {
      const service = raw.service;
      requireValue(service && service.day === raw.day && service.date === raw.date && ids(service.menu, raw.recipes.concat(customIds), 8) && service.menu.length > 0);
      requireValue((service.layout === undefined || !!find('layouts', service.layout)) && (service.supplier === undefined || !!find('suppliers', service.supplier)) && (service.venue === undefined || raw.venues.includes(service.venue)) && (service.seats === undefined || (validInt(service.seats, 32) && service.seats > 0)));
      requireValue(Array.isArray(service.guests) && service.guests.length === 4 && validInt(service.index, 4) && validInt(service.manual, 4) && service.manual <= service.index);
      requireValue(service.guests.every(g => g && find('characters', g.characterId) && service.menu.includes(g.recommended) && (g.servedRecipe === null || service.menu.includes(g.servedRecipe))));
      requireValue(service.guests.every((g, index) => index < service.index ? g.servedRecipe !== null : g.servedRecipe === null));
      requireValue(validForecast(service.forecast));
      if (raw.phase === 'closed') requireValue(validForecast(raw.lastDay) && raw.lastDay.day === raw.day && service.index === 4);
    } else requireValue(raw.service === null);
    if (raw.lastDay !== null) requireValue(validForecast(raw.lastDay));
    // Return only the understood schema, so imported values cannot introduce executable or prototype fields.
    const state = newGame({name: raw.cafeName, owner: raw.owner, lang: raw.lang, origin: raw.origin});
    Object.keys(state).forEach(key => { if (Object.hasOwn(raw, key)) state[key] = raw[key]; });
    return state;
  }
  function exportSave(state) {
    const result = JSON.stringify({format: SAVE_FORMAT, version: VERSION, state: validate(state)});
    if (result.length > MAX_SAVE_CHARS) throw new Error('SAVE_TOO_LARGE');
    return result;
  }
  function importSave(text) {
    if (typeof text !== 'string' || text.length > MAX_SAVE_CHARS) throw new Error('INVALID_SAVE');
    let parsed;
    try { parsed = JSON.parse(text); } catch (_) { throw new Error('INVALID_SAVE'); }
    if (parsed && parsed.format === SAVE_FORMAT && parsed.version === VERSION) return validate(parsed.state);
    if (parsed && parsed.version === VERSION) return validate(parsed);
    throw new Error('INVALID_SAVE');
  }
  function migrateLegacy(legacy, options) {
    if (!legacy || typeof legacy !== 'object' || !Number.isInteger(legacy.year) || legacy.year < 1994 || !Number.isInteger(legacy.month) || legacy.month < 0 || legacy.month > 11 || !Number.isInteger(legacy.day) || !Number.isFinite(legacy.cash) || !Array.isArray(legacy.recipes)) throw new Error('INVALID_LEGACY');
    const original = clone(legacy);
    const date = String(legacy.year).padStart(4, '0') + '-' + String(legacy.month + 1).padStart(2, '0') + '-' + String(legacy.day).padStart(2, '0');
    parseDate(date);
    const state = newGame({name: legacy.cafeName, owner: legacy.owner && legacy.owner.nm, lang: options && options.lang, origin: 'family'});
    state.date = date;
    state.cash = Math.min(MAX_CASH, Math.max(0, legacy.cash));
    state.day = Math.round((parseDate(date).getTime() - parseDate(START_DATE).getTime()) / 86400000) + 1;
    state.generation = Math.max(1, Number.isInteger(legacy.gen) ? legacy.gen : 1);
    state.seats = clamp(Number.isInteger(legacy.seats) ? legacy.seats : 8, 1, 32);
    state.boardSlots = clamp(Number.isInteger(legacy.slots) ? legacy.slots : 3, 3, 8);
    const effects = [];
    const recipeMap = Object.assign(Object.create(null), {gahwa: 'qahwa', shake: 'dateshake'});
    const historic = {
      croissant: {name: {en: 'Almond croissant', ar: 'كرواسون باللوز'}, price: 17, cost: 6, tags: ['quick', 'sharing'], art: 'almond'},
      chai: {name: {en: 'Adeni chai', ar: 'شاي عدني'}, price: 12, cost: 3, tags: ['warm', 'familiar'], art: 'chai'}
    };
    legacy.recipes.forEach((oldId, index) => {
      if (typeof oldId !== 'string') return;
      const id = recipeMap[oldId] || oldId;
      if (find('recipes', id)) { grantRecipe(state, id, effects); recipeMap[oldId] = id; return; }
      const saved = (Array.isArray(legacy.cookbook) ? legacy.cookbook : []).find(r => r.k === oldId);
      const source = (Object.hasOwn(historic, oldId) ? historic[oldId] : null) || (saved ? {
        name: {en: cleanName(saved.nm, 'Family recipe', 48), ar: cleanName(saved.nm, 'وصفة العائلة', 48)},
        price: Number.isFinite(saved.price) ? clamp(saved.price, 0, 1000000000) : 18,
        cost: Number.isFinite(saved.cost) ? clamp(saved.cost, 0, 1000000000) : 5,
        tags: (Array.isArray(saved.tags) ? saved.tags : ['familiar']).map(tag => ({cold: 'cool', share: 'sharing', premium: 'special', cheap: 'familiar', slow: 'sharing'}[tag] || tag)),
        art: typeof saved.sp === 'string' && /^[a-z0-9_]+$/.test(saved.sp) ? saved.sp : 'karak'
      } : {name: {en: 'Family recipe ' + (index + 1), ar: 'وصفة العائلة ' + (index + 1)}, price: 18, cost: 5, tags: ['familiar'], art: 'karak'});
      const customId = 'house-legacy-' + index;
      state.customRecipes.push(Object.assign({}, source, {id: customId, custom: true, legacy: true, combination: 'legacy:' + oldId,
        art: list('recipes').map(item => item.art).concat('almond', 'chai').includes(source.art) ? source.art : 'karak',
        description: {en: 'Preserved from your original family cookbook.', ar: 'محفوظة من دفتر وصفات عائلتك الأصلي.'}}));
      recipeMap[oldId] = customId;
    });
    unlockForDay(state, effects);
    const oldMenu = (Array.isArray(legacy.board) ? legacy.board : []).map(id => recipeMap[id] || id).filter(id => state.recipes.includes(id) || state.customRecipes.some(r => r.id === id));
    if (oldMenu.length) state.menu = unique(oldMenu).slice(0, state.boardSlots);
    const owned = legacy.owned && typeof legacy.owned === 'object' ? legacy.owned : {};
    if (owned.freehold > 0) state.knowledge.push('legacy-freehold');
    const upgradeMap = {'good-grinder': ['grinder'], 'cold-counter': ['juicer'], 'pastry-case': ['case_'], 'family-saj': ['dallah'],
      'window-seats': ['backroom'], 'long-table': ['table_lg'], 'courtyard-seats': ['outdoor']};
    list('upgrades').forEach(item => {
      if (owned[item.id] > 0 || (item.legacyId && owned[item.legacyId] > 0) || (upgradeMap[item.id] || []).some(id => owned[id] > 0) ||
        (item.id === 'board-four' && state.boardSlots >= 4) || (item.id === 'board-six' && state.boardSlots >= 6) || (item.id === 'board-eight' && state.boardSlots >= 8)) state.upgrades.push(item.id);
    });
    if (Array.isArray(legacy.staff)) {
      if (legacy.staff.some(member => member.role === 'barista')) state.staff.push('barista');
      if (legacy.staff.some(member => member.role === 'manager')) state.staff.push('host');
    }
    if (Array.isArray(legacy.branches) && legacy.branches.length) list('venues').forEach(v => { if (!state.venues.includes(v.id)) state.venues.push(v.id); });
    // Unmapped historic possessions remain explicitly preserved, alongside the original save.
    state.legacy = {original, importedDate: date, possessions: clone(owned), branches: clone(legacy.branches || []), cookbook: clone(legacy.cookbook || []), debtRetired: Math.max(0, Number(legacy.debt) || 0)};
    state.monthly = {month: date.slice(0, date.lastIndexOf('-')), days: 0, sales: 0, costs: 0, profit: 0, customers: 0};
    memory(state, 'legacy-import', {en: 'Your original café history and possessions are preserved in the family archive.', ar: 'حُفظ تاريخ مقهاك الأصلي ومقتنياته في أرشيف العائلة.'}, {kind: 'family'});
    record(state, 'imported', {date});
    return validate(state);
  }
  return Object.freeze({VERSION, SAVE_FORMAT, STAFF, newGame, dispatch, forecast, availableStories, currentGuest, allRecipes, recipe, personStatus,
    validate, exportSave, importSave, migrateLegacy, advanceDate, seasonFor});
}));
