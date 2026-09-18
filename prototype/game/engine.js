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
  const BRIEF_STAMPS = [
    {kind: 'warm', name: {en: 'A warm welcome', ar: 'ترحيب دافئ'}, description: {en: 'Made room for a comforting cup.', ar: 'خصصت مكاناً لكوب يمنح الراحة.'}},
    {kind: 'cool', name: {en: 'A little refreshment', ar: 'انتعاش لطيف'}, description: {en: 'Brought something refreshing to the board.', ar: 'أضفت شيئاً منعشاً إلى القائمة.'}},
    {kind: 'familiar', name: {en: 'A taste of home', ar: 'مذاق البيت'}, description: {en: 'Kept familiar favourites close.', ar: 'حافظت على الأصناف المألوفة والمحبوبة.'}},
    {kind: 'sharing', name: {en: 'Better together', ar: 'معاً أجمل'}, description: {en: 'Set the table for sharing.', ar: 'جهزت الطاولة للمشاركة.'}},
    {kind: 'variety', name: {en: 'Something for everyone', ar: 'لكل شخص ذوق'}, description: {en: 'Found a thoughtful mix for the menu.', ar: 'جمعت أصنافاً متنوعة بعناية.'}},
    {kind: 'regular', name: {en: 'The usual, please', ar: 'المعتاد من فضلك'}, description: {en: 'Remembered a familiar favourite.', ar: 'تذكرت الطلب المفضل لأحد أهل الحارة.'}},
    {kind: 'room', name: {en: 'A place to belong', ar: 'مكان يجمعنا'}, description: {en: 'Gave the room a fresh feeling.', ar: 'منحت المكان أجواء جديدة.'}},
    {kind: 'supplier', name: {en: 'Good ingredients', ar: 'مكونات طيبة'}, description: {en: 'Tried a different way to source the day.', ar: 'جربت طريقة مختلفة لتوريد مكونات اليوم.'}}
  ];
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
  function hostingText(state, value) {
    const inactive = list('characters').map(person => ({person, status: personStatus(state, person.id)})).filter(item => !item.status.active);
    return Object.fromEntries(['en', 'ar'].map(lang => {
      let text = localized(value, lang);
      if (inactive.length) {
        const names = new Map();
        inactive.forEach(({person, status}) => {
          const family = localized(status.descendant.name, lang);
          names.set(localized(person.name, lang), family);
          // Protect already hydrated family names so the helper is safe to apply twice.
          names.set(family, family);
        });
        const alternatives = [...names.keys()].sort((a, b) => b.length - a.length).map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
        const tokens = new RegExp('(^|[^\\p{L}\\p{N}\\p{M}_])(' + alternatives + ')(?=$|[^\\p{L}\\p{N}\\p{M}_])', 'gu');
        text = text.replace(tokens, (_, prefix, name) => prefix + names.get(name));
      }
      return [lang, text];
    }));
  }
  function allRecipes(state) { return list('recipes').filter(r => state.recipes.includes(r.id)).concat(state.customRecipes); }
  function recipe(state, id) { return find('recipes', id) || state.customRecipes.find(r => r.id === id) || null; }
  const RELATIONSHIP_LEVELS = [
    {en: 'Getting acquainted', ar: 'بداية التعارف'},
    {en: 'Familiar face', ar: 'وجه مألوف'},
    {en: 'Trusted host', ar: 'مضيف موثوق'},
    {en: 'Part of the family', ar: 'فرد من العائلة'}
  ];
  function emptyRelationship() { return {meetings: 0, satisfaction: 0, rememberedPreferences: [], lastServedRecipe: null}; }
  function newRelationships() { return Object.fromEntries(list('characters').map(person => [person.id, emptyRelationship()])); }
  function relationshipStatus(state, characterId) {
    if (!find('characters', characterId)) return null;
    const relationship = state.relationships && state.relationships[characterId] || emptyRelationship();
    const bondLevel = relationship.satisfaction >= 30 ? 3 : relationship.satisfaction >= 12 ? 2 : relationship.satisfaction >= 3 ? 1 : 0;
    return Object.assign({characterId}, clone(relationship), {bondLevel, bondLabel: clone(RELATIONSHIP_LEVELS[bondLevel])});
  }
  function serviceMatch(state, characterId, recipeId) {
    const person = find('characters', characterId); const dish = recipe(state, recipeId);
    if (!person || !dish) return 'different';
    if (person.usual === recipeId) return 'usual';
    return (person.tags || []).some(tag => (dish.tags || []).includes(tag)) ? 'liked' : 'different';
  }
  function recommendedRecipe(state, person) {
    // The counter uses the same preferences the player can read. Menu order cannot reroll its advice.
    if (state.menu.includes(person.usual)) return person.usual;
    const remembered = relationshipStatus(state, person.id).rememberedPreferences;
    const score = id => {
      const dish = recipe(state, id);
      return (person.tags || []).filter(tag => (dish.tags || []).includes(tag)).length * 2 + Number(remembered.includes(id));
    };
    return state.menu.slice().sort((a, b) => score(b) - score(a) || a.localeCompare(b))[0];
  }
  const DISPLAY_SLOTS = ['wall', 'shelf', 'corner'];
  function occasionPlan(plan) {
    if (!plan) return null;
    const occasion = find('occasions', plan.occasionId);
    const approach = occasion && occasion.approaches.find(item => item.id === plan.approachId);
    return approach ? {occasion, approach} : null;
  }
  function newHosting(state) {
    const owned = list('decorations').filter(item => item.legacyChoices && Object.entries(item.legacyChoices).some(([id, choices]) =>
      (Array.isArray(choices) ? choices : [choices]).includes((state.storyChoices || {})[id]))).map(item => item.id);
    return {plan: null, owned, displays: {wall: null, shelf: null, corner: null}, completed: {}, last: null};
  }
  function hostingPlan(state) {
    const active = state.phase !== 'planning' && state.service && state.service.hosting;
    const selected = active || state.hosting && state.hosting.plan;
    const plan = occasionPlan(selected);
    return plan ? clone(plan) : null;
  }
  function intentionMatch(state, characterId, intention, recipeId) {
    const person = find('characters', characterId); const dish = recipe(state, recipeId);
    if (!person || !dish) return false;
    const remembered = relationshipStatus(state, characterId).rememberedPreferences;
    if (intention === 'familiar') return recipeId === person.usual || remembered.includes(recipeId) || (dish.tags || []).includes('familiar');
    if (intention === 'discovery') return recipeId !== person.usual && !remembered.includes(recipeId);
    return intention === 'sharing' && (dish.tags || []).includes('sharing');
  }
  function hostingScore(state, characterId, intention, recipeId, tags) {
    const person = find('characters', characterId); const dish = recipe(state, recipeId);
    const remembered = relationshipStatus(state, characterId).rememberedPreferences;
    return Number(intentionMatch(state, characterId, intention, recipeId)) * 100 +
      (intention === 'discovery' ? Number(!!dish.custom) * 12 : Number(recipeId === person.usual) * 12 + Number(remembered.includes(recipeId)) * 6) +
      (person.tags || []).filter(tag => (dish.tags || []).includes(tag)).length * 3 +
      (tags || []).filter(tag => (dish.tags || []).includes(tag)).length * 2;
  }
  function hostingMenu(state) {
    const plan = hostingPlan(state);
    if (!plan) return state.menu.slice();
    const {approach} = plan; const owned = allRecipes(state).map(item => item.id); const selected = [];
    approach.guestIds.forEach((id, index) => {
      const intention = approach.intentions[index];
      const recommended = owned.slice().sort((a, b) => hostingScore(state, id, intention, b, approach.tags) - hostingScore(state, id, intention, a, approach.tags) || a.localeCompare(b))[0];
      if (recommended && !selected.includes(recommended) && selected.length < state.boardSlots) selected.push(recommended);
    });
    const score = id => approach.guestIds.reduce((sum, characterId, index) => sum + hostingScore(state, characterId, approach.intentions[index], id, approach.tags), 0);
    owned.sort((a, b) => score(b) - score(a) || a.localeCompare(b)).forEach(id => { if (!selected.includes(id) && selected.length < state.boardSlots) selected.push(id); });
    return selected;
  }
  function hostingMatch(state, guest, recipeId) {
    return !!(state.service && state.service.hosting && guest && Array.isArray(guest.matchRecipes) && guest.matchRecipes.includes(recipeId));
  }
  function settleHosting(state, effects) {
    const snapshot = state.service.hosting;
    if (!snapshot) return null;
    const {occasion, approach} = occasionPlan(snapshot);
    const decorationId = approach.decorationId;
    const newDecoration = !state.hosting.owned.includes(decorationId);
    if (newDecoration) state.hosting.owned.push(decorationId);
    state.hosting.completed[approach.id] = Math.min(MAX_CASH, (state.hosting.completed[approach.id] || 0) + 1);
    const result = {occasionId: occasion.id, approachId: approach.id, date: state.date, day: state.day, decorationId, newDecoration,
      served: state.service.guests.map(guest => ({characterId: guest.characterId, recipeId: guest.servedRecipe, intention: guest.intention,
        matched: hostingMatch(state, guest, guest.servedRecipe)}))};
    state.hosting.last = clone(result);
    memory(state, 'hosting:' + approach.id, hostingText(state, approach.outcome || approach.name), {kind: 'hosting', occasionId: occasion.id, approachId: approach.id, decorationId});
    record(state, 'hosting', {occasionId: occasion.id, approachId: approach.id, decorationId, newDecoration});
    effects.push(Object.assign({type: 'hosting'}, clone(result)));
    return result;
  }
  function resolveService(state, guest, recipeId, effects) {
    if (guest.servedRecipe !== null) return;
    guest.servedRecipe = recipeId;
    const relationship = state.relationships[guest.characterId];
    const match = serviceMatch(state, guest.characterId, recipeId);
    const previousLevel = relationshipStatus(state, guest.characterId).bondLevel;
    const hosted = !!(state.service && state.service.hosting);
    const matched = hosted ? hostingMatch(state, guest, recipeId) : match !== 'different';
    const points = hosted ? (matched ? 3 : 0) : match === 'usual' ? 3 : match === 'liked' ? 2 : 0;
    const satisfactionAwarded = Math.min(100 - relationship.satisfaction, points);
    const remembered = points > 0 && !relationship.rememberedPreferences.includes(recipeId);
    relationship.meetings = Math.min(MAX_CASH, relationship.meetings + 1);
    relationship.satisfaction += satisfactionAwarded;
    relationship.lastServedRecipe = recipeId;
    if (remembered) relationship.rememberedPreferences.push(recipeId);
    const bondLevel = relationshipStatus(state, guest.characterId).bondLevel;
    if (bondLevel > previousLevel) {
      const person = find('characters', guest.characterId);
      memory(state, 'bond:' + guest.characterId + ':' + bondLevel, {
        en: localized(person.name, 'en') + '’s family remembers your welcome: ' + RELATIONSHIP_LEVELS[bondLevel].en + '.',
        ar: 'تتذكر عائلة ' + localized(person.name, 'ar') + ' ترحيبك: ' + RELATIONSHIP_LEVELS[bondLevel].ar + '.'
      }, {kind: 'people', characterId: guest.characterId, bondLevel});
    }
    effects.push(Object.assign({type: 'relationship', id: guest.characterId, recipeId, match, satisfactionAwarded, remembered, bondLevel}, hosted ? {intention: guest.intention, matched} : {}));
  }
  function briefReference(kind, target) { return {id: kind + ':' + target, kind, target}; }
  function briefOptions(state) {
    const dishes = allRecipes(state).slice().sort((a, b) => a.id.localeCompare(b.id));
    const choices = [];
    ['warm', 'cool', 'familiar', 'sharing'].forEach(kind => {
      const matching = dishes.filter(r => (r.tags || []).includes(kind));
      if (matching.length) choices.push(briefReference(kind, Math.min(2, matching.length, state.boardSlots)));
    });
    // A constructive greedy mix ensures this target can be met with the existing board.
    const mix = []; const tags = new Set();
    for (let i = 0; i < state.boardSlots; i++) {
      const next = dishes.filter(r => !mix.includes(r.id)).sort((a, b) =>
        (b.tags || []).filter(tag => !tags.has(tag)).length - (a.tags || []).filter(tag => !tags.has(tag)).length)[0];
      if (!next) break;
      mix.push(next.id); (next.tags || []).forEach(tag => tags.add(tag));
    }
    if (tags.size) choices.push(briefReference('variety', Math.min(4, tags.size)));
    const regulars = list('characters').filter(p => dishes.some(r => r.id === p.usual));
    if (regulars.length) choices.push(briefReference('regular', regulars[hash(state.date + ':regular') % regulars.length].id));
    const layouts = list('layouts'); const suppliers = list('suppliers');
    choices.push(briefReference('room', layouts[hash(state.date + ':room') % layouts.length].id));
    choices.push(briefReference('supplier', suppliers[hash(state.date + ':supplier') % suppliers.length].id));
    // Rotate by played date, not a clock. Reloading and language changes cannot reroll offers.
    const offset = (state.day - 1) % choices.length;
    const stride = choices.length % 3 === 0 ? 1 : 3;
    return Array.from({length: 3}, (_, index) => choices[(offset + index * stride) % choices.length]);
  }
  function resetBriefs(state) {
    state.briefs = {date: state.date, options: briefOptions(state), selectedId: null};
  }
  function briefDefinition(state, option) {
    if (!option) return null;
    const base = clone(option);
    const count = option.target;
    const noun = {warm: {en: 'warm', ar: 'دافئة'}, cool: {en: 'cool', ar: 'باردة'}, familiar: {en: 'familiar', ar: 'مألوفة'}, sharing: {en: 'sharing', ar: 'للمشاركة'}}[option.kind];
    const stamp = BRIEF_STAMPS.find(item => item.kind === option.kind);
    base.title = clone(stamp.name);
    base.rewardCash = {warm: 25, cool: 25, familiar: 25, sharing: 25, variety: 40, regular: 30, room: 20, supplier: 20}[option.kind];
    if (noun) {
      const examples = allRecipes(state).filter(r => (r.tags || []).includes(option.kind)).slice(0, count);
      base.description = {en: 'Open with ' + count + ' ' + noun.en + (count === 1 ? ' recipe' : ' recipes') + ' on the board.', ar: 'افتح المقهى مع ' + count + ' من الوصفات ' + noun.ar + ' على القائمة.'};
      base.hint = {en: 'Try ' + examples.map(r => localized(r.name, 'en')).join(' + ') + '.', ar: 'جرب ' + examples.map(r => localized(r.name, 'ar')).join(' + ') + '.'};
    } else if (option.kind === 'variety') {
      base.description = {en: 'Give your opening menu ' + count + ' different qualities.', ar: 'اجمع ' + count + ' صفات مختلفة في قائمة الافتتاح.'};
      base.hint = {en: 'Mix warm, cool, familiar, quick, sharing or special recipes. A recipe can cover more than one.', ar: 'امزج وصفات دافئة وباردة ومألوفة وسريعة وأخرى للمشاركة أو مميزة. قد تحقق الوصفة أكثر من صفة.'};
    } else if (option.kind === 'regular') {
      const person = find('characters', option.target); const dish = recipe(state, person.usual);
      const status = personStatus(state, person.id); const name = status.active ? person.name : status.descendant.name;
      base.description = {en: 'Keep ' + localized(name, 'en') + '’s usual on the opening board.', ar: 'ضع الطلب المعتاد لدى ' + localized(name, 'ar') + ' على قائمة الافتتاح.'};
      base.hint = {en: 'Add ' + localized(dish.name, 'en') + ' to the menu.', ar: 'أضف ' + localized(dish.name, 'ar') + ' إلى القائمة.'};
    } else {
      const item = find(option.kind === 'room' ? 'layouts' : 'suppliers', option.target);
      base.description = option.kind === 'room' ? {en: 'Open the day with ' + localized(item.name, 'en') + '.', ar: 'ابدأ اليوم مع ' + localized(item.name, 'ar') + '.'} : {en: 'Let ' + localized(item.name, 'en') + ' supply today’s ingredients.', ar: 'اختر ' + localized(item.name, 'ar') + ' لتوريد مكونات اليوم.'};
      base.hint = option.kind === 'room' ? {en: 'Change the room in Plan. Every layout is free.', ar: 'غير ترتيب المكان من التخطيط. كل الترتيبات مجانية.'} : {en: 'Choose this supplier in Plan. No payment is needed to switch.', ar: 'اختر هذا المورد من التخطيط. لا تحتاج إلى دفع مبلغ للتبديل.'};
    }
    return base;
  }
  function dailyBriefs(state) {
    const offers = state.briefs && state.briefs.date === state.date ? state.briefs.options : briefOptions(state);
    return offers.map(option => briefDefinition(state, option));
  }
  function briefProgress(state, option, plan) {
    const dishes = plan.menu.map(id => recipe(state, id));
    const tags = unique(dishes.flatMap(r => r.tags || []));
    let progress; let targetCount;
    if (['warm', 'cool', 'familiar', 'sharing'].includes(option.kind)) {
      targetCount = option.target; progress = dishes.filter(r => (r.tags || []).includes(option.kind)).length;
    } else if (option.kind === 'variety') { targetCount = option.target; progress = tags.length; }
    else {
      targetCount = 1;
      progress = option.kind === 'regular' ? Number(plan.menu.includes(find('characters', option.target).usual)) :
        Number(plan[option.kind === 'room' ? 'layout' : 'supplier'] === option.target);
    }
    return Object.assign(clone(option), {progress, targetCount, ready: progress >= targetCount, completed: false, settled: false, rewardEarned: 0});
  }
  function briefStatus(state) {
    let snapshot;
    if (state.phase === 'closed' && state.lastDay && state.lastDay.day === state.day) snapshot = state.lastDay.brief;
    else if (state.phase === 'open' && state.service) snapshot = state.service.brief;
    else {
      const option = state.briefs && state.briefs.options.find(item => item.id === state.briefs.selectedId);
      if (option) snapshot = briefProgress(state, option, state);
    }
    return snapshot ? Object.assign(briefDefinition(state, snapshot), clone(snapshot)) : null;
  }
  function settleBrief(state, effects) {
    const snapshot = state.service.brief;
    if (!snapshot) return null;
    snapshot.settled = true; snapshot.completed = snapshot.ready;
    if (snapshot.completed) {
      const definition = briefDefinition(state, snapshot);
      snapshot.rewardEarned = definition.rewardCash;
      addCash(state, snapshot.rewardEarned);
      const stamp = state.keepsakes.find(item => item.kind === snapshot.kind);
      if (stamp) stamp.count = Math.min(MAX_CASH, stamp.count + 1);
      else state.keepsakes.push({kind: snapshot.kind, date: state.date, count: 1});
      record(state, 'brief', {id: snapshot.id, amount: snapshot.rewardEarned});
      effects.push({type: 'brief', id: snapshot.id, kind: snapshot.kind, amount: snapshot.rewardEarned, newStamp: !stamp});
    }
    return clone(snapshot);
  }
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
      pendingStory: null, service: null, lastDay: null, ambitionsDone: [], reputation: 0, briefs: null, keepsakes: [],
      identity: {people: 0, recipe: 0, street: 0}, relationships: newRelationships(), hosting: null, daysRun: 0, totalServed: 0,
      monthly: {month: '1994-01', days: 0, sales: 0, costs: 0, profit: 0, customers: 0}, accounts: [],
      settings: {music: true, sfx: true, haptics: true, reducedMotion: false, textSize: 'normal', theme: 'light'}, legacy: null
    };
    state.hosting = newHosting(state);
    resetBriefs(state);
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
      requires: event.requires ? (Array.isArray(event.requires) ? event.requires : [event.requires]).map(id => find('events', id) ? id + '@g' + state.generation : id) : undefined,
      requiresChoices: event.requiresChoices ? Object.fromEntries(Object.entries(event.requiresChoices).map(([id, choices]) => [find('events', id) ? id + '@g' + state.generation : id, choices])) : undefined
    }));
  }
  function storyTemplate(id) {
    const base = typeof id === 'string' ? id.replace(/@g\d+$/, '') : id;
    return list('stories').concat(list('events')).find(s => s.id === base);
  }
  function eligibleStory(state, story) {
    if (!story || state.storiesDone.includes(story.id)) return false;
    if (story.requires && !(Array.isArray(story.requires) ? story.requires : [story.requires]).every(id => state.storiesDone.includes(id))) return false;
    if (story.requiresChoices && !Object.entries(story.requiresChoices).every(([id, choices]) =>
      state.storiesDone.includes(id) && (Array.isArray(choices) ? choices : [choices]).includes(state.storyChoices[id]))) return false;
    if (story.requiresRelationships && !Object.entries(story.requiresRelationships).every(([id, minimum]) => {
      const relationship = relationshipStatus(state, id);
      return relationship && relationship.satisfaction >= minimum;
    })) return false;
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
    const hosted = hostingPlan(state);
    const guests = Array.from({length: hosted ? hosted.approach.guestIds.length : 4}, (_, index) => {
      const person = hosted ? find('characters', hosted.approach.guestIds[index]) : people[(offset + index) % people.length];
      const status = personStatus(state, person.id);
      const intention = hosted && hosted.approach.intentions[index];
      const hostingGuest = hosted ? {intention, rememberedAtOpen: relationshipStatus(state, person.id).rememberedPreferences, matchRecipes: state.menu.filter(id => intentionMatch(state, person.id, intention, id))} : {};
      const recommended = hosted ? state.menu.slice().sort((a, b) => hostingScore(state, person.id, intention, b, hosted.approach.tags) - hostingScore(state, person.id, intention, a, hosted.approach.tags) || a.localeCompare(b))[0] : recommendedRecipe(state, person);
      return Object.assign({id: state.day + ':' + index, characterId: person.id, usual: person.usual,
        name: status.active ? clone(person.name) : status.descendant.name,
        descendant: !status.active, personId: status.active ? person.id : status.descendant.id,
        recommended, servedRecipe: null}, hostingGuest);
    });
    state.service = {date: state.date, day: state.day, menu: state.menu.slice(), layout: state.layout,
      supplier: state.supplier, venue: state.venue, seats: state.seats, guests, index: 0, manual: 0, forecast: planningForecast(state),
      hosting: hosted ? {occasionId: hosted.occasion.id, approachId: hosted.approach.id, displays: clone(state.hosting.displays)} : null,
      brief: state.briefs.selectedId ? briefProgress(state, state.briefs.options.find(option => option.id === state.briefs.selectedId), state) : null};
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
    result.brief = settleBrief(state, effects);
    state.daysRun++;
    state.totalServed += result.customers;
    state.lastDay = result;
    state.phase = 'closed';
    state.service.guests.forEach(guest => { if (guest.servedRecipe === null) resolveService(state, guest, guest.recommended, effects); });
    state.service.index = state.service.guests.length;
    result.hosting = settleHosting(state, effects);
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
    if (state.service && state.service.hosting) state.hosting.plan = null;
    state.service = null;
    unlockForDay(state, effects);
    resetBriefs(state);
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
      if (!state.briefs || state.briefs.date !== state.date) resetBriefs(state);
      if (!state.keepsakes) state.keepsakes = [];
      if (!state.relationships) state.relationships = newRelationships();
      if (!state.hosting) state.hosting = newHosting(state);
      switch (action.type) {
        case 'SELECT_OCCASION': {
          if (state.phase !== 'planning') { error = 'INVALID_PHASE'; break; }
          const plan = occasionPlan(action);
          if (!plan) { error = 'INVALID_OCCASION'; break; }
          state.hosting.plan = {occasionId: plan.occasion.id, approachId: plan.approach.id};
          effects.push({type: 'occasionSelected', occasionId: plan.occasion.id, approachId: plan.approach.id}); break;
        }
        case 'CLEAR_OCCASION':
          if (state.phase !== 'planning') { error = 'INVALID_PHASE'; break; }
          state.hosting.plan = null; break;
        case 'PREPARE_OCCASION': {
          if (state.phase !== 'planning') { error = 'INVALID_PHASE'; break; }
          const plan = hostingPlan(state);
          if (!plan) { error = 'INVALID_OCCASION'; break; }
          state.menu = hostingMenu(state); state.layout = plan.approach.layout;
          effects.push({type: 'occasionPrepared', occasionId: plan.occasion.id, approachId: plan.approach.id}); break;
        }
        case 'PLACE_DECORATION': {
          const decoration = find('decorations', action.id);
          if (!decoration || !DISPLAY_SLOTS.includes(action.slot)) { error = 'INVALID_DECORATION'; break; }
          if (!state.hosting.owned.includes(action.id)) { error = 'NOT_OWNED'; break; }
          DISPLAY_SLOTS.forEach(slot => { if (state.hosting.displays[slot] === action.id) state.hosting.displays[slot] = null; });
          state.hosting.displays[action.slot] = action.id;
          effects.push({type: 'decoration', id: action.id, slot: action.slot}); break;
        }
        case 'CLEAR_DISPLAY':
          if (!DISPLAY_SLOTS.includes(action.slot)) { error = 'INVALID_DECORATION'; break; }
          state.hosting.displays[action.slot] = null; break;
        case 'SELECT_BRIEF':
          if (state.phase !== 'planning') { error = 'INVALID_PHASE'; break; }
          if (!state.briefs.options.some(option => option.id === action.id)) { error = 'INVALID_BRIEF'; break; }
          state.briefs.selectedId = action.id; effects.push({type: 'briefSelected', id: action.id}); break;
        case 'CLEAR_BRIEF':
          if (state.phase !== 'planning') { error = 'INVALID_PHASE'; break; }
          state.briefs.selectedId = null; break;
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
          resolveService(state, guest, action.recipeId, effects);
          state.service.index++; state.service.manual++;
          effects.push(Object.assign({type: 'serve', id: guest.characterId, recipeId: action.recipeId, usual: action.recipeId === guest.usual, match: serviceMatch(state, guest.characterId, action.recipeId)}, state.service.hosting ? {intention: guest.intention, matched: hostingMatch(state, guest, action.recipeId)} : {}));
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
          newHosting(state).owned.forEach(id => { if (!state.hosting.owned.includes(id)) { state.hosting.owned.push(id); effects.push({type: 'decorationEarned', id}); } });
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
          resetBriefs(state);
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
    // Older v6 cafés begin remembering from this update. Replaying history would invent visits.
    if (!Object.hasOwn(raw, 'relationships')) raw.relationships = newRelationships();
    const characterIds = list('characters').map(person => person.id);
    requireValue(raw.relationships && typeof raw.relationships === 'object' && !Array.isArray(raw.relationships));
    requireValue(Object.keys(raw.relationships).length === characterIds.length && Object.keys(raw.relationships).every(id => characterIds.includes(id)));
    characterIds.forEach(id => {
      const relationship = raw.relationships[id];
      requireValue(relationship && typeof relationship === 'object' && !Array.isArray(relationship) && Object.keys(relationship).length === 4 &&
        Object.keys(relationship).every(key => ['meetings', 'satisfaction', 'rememberedPreferences', 'lastServedRecipe'].includes(key)));
      requireValue(validInt(relationship.meetings) && validInt(relationship.satisfaction, 100) && relationship.satisfaction <= relationship.meetings * 3);
      requireValue(ids(relationship.rememberedPreferences, raw.recipes.concat(customIds), raw.recipes.length + customIds.length) && relationship.rememberedPreferences.length <= relationship.meetings);
      // A successful hosted discovery may broaden somebody's tastes beyond their original tags.
      requireValue(!relationship.rememberedPreferences.length || relationship.satisfaction > 0);
      requireValue(relationship.meetings === 0 ? relationship.lastServedRecipe === null && relationship.satisfaction === 0 : raw.recipes.concat(customIds).includes(relationship.lastServedRecipe));
    });
    // Hosting is additive: old cafés retain ordinary in-progress guests exactly as saved.
    if (!Object.hasOwn(raw, 'hosting')) raw.hosting = newHosting(raw);
    const host = raw.hosting;
    const hostKeys = ['plan', 'owned', 'displays', 'completed', 'last'];
    const approaches = list('occasions').flatMap(item => item.approaches);
    const validPlan = plan => plan === null || (plan && typeof plan === 'object' && !Array.isArray(plan) &&
      Object.keys(plan).length === 2 && Object.keys(plan).every(key => ['occasionId', 'approachId'].includes(key)) && !!occasionPlan(plan));
    const validDisplays = displays => displays && typeof displays === 'object' && !Array.isArray(displays) &&
      Object.keys(displays).length === DISPLAY_SLOTS.length && Object.keys(displays).every(slot => DISPLAY_SLOTS.includes(slot)) &&
      DISPLAY_SLOTS.every(slot => displays[slot] === null || host.owned.includes(displays[slot])) &&
      unique(Object.values(displays).filter(Boolean)).length === Object.values(displays).filter(Boolean).length;
    requireValue(host && typeof host === 'object' && !Array.isArray(host) && Object.keys(host).length === hostKeys.length && Object.keys(host).every(key => hostKeys.includes(key)));
    requireValue(validPlan(host.plan) && ids(host.owned, list('decorations').map(item => item.id), list('decorations').length) && validDisplays(host.displays));
    requireValue(host.completed && typeof host.completed === 'object' && !Array.isArray(host.completed) && Object.keys(host.completed).every(id => {
      const approach = approaches.find(item => item.id === id);
      return approach && validInt(host.completed[id]) && host.completed[id] > 0 && host.owned.includes(approach.decorationId);
    }));
    requireValue(Object.values(host.completed).reduce((sum, count) => sum + count, 0) <= raw.daysRun);
    const storySouvenirs = newHosting(raw).owned;
    requireValue(host.owned.every(id => { const decoration = find('decorations', id); return host.completed[decoration.approachId] || storySouvenirs.includes(id); }));
    requireValue((Object.keys(host.completed).length === 0) === (host.last === null));
    const validHostingResult = result => {
      if (result === null) return true;
      if (!result || typeof result !== 'object' || Array.isArray(result) || Object.keys(result).length !== 7 ||
        Object.keys(result).some(key => !['occasionId', 'approachId', 'date', 'day', 'decorationId', 'newDecoration', 'served'].includes(key))) return false;
      const plan = occasionPlan(result);
      if (!plan || result.decorationId !== plan.approach.decorationId || !host.owned.includes(result.decorationId) || !host.completed[result.approachId] ||
        typeof result.newDecoration !== 'boolean' || !validInt(result.day) || result.day < 1 || result.day > raw.day) return false;
      try { if (parseDate(result.date).getTime() > parseDate(raw.date).getTime()) return false; } catch (_) { return false; }
      return Array.isArray(result.served) && result.served.length === plan.approach.guestIds.length && result.served.every((guest, index) =>
        guest && typeof guest === 'object' && !Array.isArray(guest) && Object.keys(guest).length === 4 &&
        Object.keys(guest).every(key => ['characterId', 'recipeId', 'intention', 'matched'].includes(key)) &&
        guest.characterId === plan.approach.guestIds[index] && guest.intention === plan.approach.intentions[index] &&
        raw.recipes.concat(customIds).includes(guest.recipeId) && typeof guest.matched === 'boolean');
    };
    requireValue(validHostingResult(host.last));
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
    // Additive v6 fields: older saves gain an optional board, never a fabricated reward.
    if (!Object.hasOwn(raw, 'briefs')) resetBriefs(raw);
    if (!Object.hasOwn(raw, 'keepsakes')) raw.keepsakes = [];
    const validBriefReference = option => {
      if (!option || typeof option !== 'object' || Array.isArray(option) || !BRIEF_STAMPS.some(stamp => stamp.kind === option.kind) || option.id !== option.kind + ':' + option.target) return false;
      if (['warm', 'cool', 'familiar', 'sharing'].includes(option.kind)) return validInt(option.target, 2) && option.target > 0 && allRecipes(raw).filter(r => (r.tags || []).includes(option.kind)).length >= option.target;
      if (option.kind === 'variety') return validInt(option.target, 4) && option.target > 0 && unique(allRecipes(raw).flatMap(r => r.tags || [])).length >= option.target;
      if (option.kind === 'regular') { const person = find('characters', option.target); return !!person && raw.recipes.concat(customIds).includes(person.usual); }
      return !!find(option.kind === 'room' ? 'layouts' : 'suppliers', option.target);
    };
    const brief = raw.briefs;
    requireValue(brief && typeof brief === 'object' && !Array.isArray(brief) && brief.date === raw.date && Object.keys(brief).every(key => ['date', 'options', 'selectedId'].includes(key)));
    requireValue(Array.isArray(brief.options) && brief.options.length === 3 && unique(brief.options.map(option => option && option.kind)).length === 3 && brief.options.every(option => validBriefReference(option) && Object.keys(option).every(key => ['id', 'kind', 'target'].includes(key))));
    requireValue(brief.selectedId === null || brief.options.some(option => option.id === brief.selectedId));
    requireValue(Array.isArray(raw.keepsakes) && raw.keepsakes.length <= BRIEF_STAMPS.length && unique(raw.keepsakes.map(stamp => stamp && stamp.kind)).length === raw.keepsakes.length);
    raw.keepsakes.forEach(stamp => {
      requireValue(stamp && BRIEF_STAMPS.some(item => item.kind === stamp.kind) && validInt(stamp.count) && stamp.count > 0 && Object.keys(stamp).every(key => ['kind', 'date', 'count'].includes(key)));
      parseDate(stamp.date);
    });
    const validBriefSnapshot = (snapshot, settled) => {
      if (snapshot === null) return true;
      if (!validBriefReference(snapshot) || !validInt(snapshot.progress, 128) || !validInt(snapshot.targetCount, 4) || snapshot.targetCount < 1) return false;
      if (Object.keys(snapshot).some(key => !['id', 'kind', 'target', 'progress', 'targetCount', 'ready', 'completed', 'settled', 'rewardEarned'].includes(key))) return false;
      const targetCount = ['warm', 'cool', 'familiar', 'sharing', 'variety'].includes(snapshot.kind) ? snapshot.target : 1;
      const ready = snapshot.progress >= targetCount;
      return snapshot.targetCount === targetCount && snapshot.ready === ready && snapshot.settled === settled && snapshot.completed === (settled && ready) && snapshot.rewardEarned === (settled && ready ? briefDefinition(raw, snapshot).rewardCash : 0);
    };
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
      if (!Object.hasOwn(service, 'hosting')) service.hosting = null;
      const hosted = service.hosting;
      requireValue(hosted === null || (hosted && typeof hosted === 'object' && !Array.isArray(hosted) && Object.keys(hosted).length === 3 &&
        Object.keys(hosted).every(key => ['occasionId', 'approachId', 'displays'].includes(key)) && !!occasionPlan(hosted) && validDisplays(hosted.displays) &&
        host.plan && host.plan.occasionId === hosted.occasionId && host.plan.approachId === hosted.approachId));
      requireValue(hosted !== null || host.plan === null);
      const guestCount = hosted ? occasionPlan(hosted).approach.guestIds.length : 4;
      requireValue(Array.isArray(service.guests) && service.guests.length === guestCount && validInt(service.index, guestCount) && validInt(service.manual, guestCount) && service.manual <= service.index);
      requireValue(service.guests.every(g => g && find('characters', g.characterId) && service.menu.includes(g.recommended) && (g.servedRecipe === null || service.menu.includes(g.servedRecipe))));
      if (hosted) service.guests.forEach((guest, index) => {
        const {approach} = occasionPlan(hosted); const person = find('characters', guest.characterId);
        requireValue(Object.keys(guest).length === 11 && Object.keys(guest).every(key => ['id', 'characterId', 'usual', 'name', 'descendant', 'personId', 'recommended', 'servedRecipe', 'intention', 'rememberedAtOpen', 'matchRecipes'].includes(key)));
        requireValue(guest.characterId === approach.guestIds[index] && guest.intention === approach.intentions[index] &&
          guest.id === raw.day + ':' + index && guest.usual === person.usual &&
          guest.name && ['en', 'ar'].every(lang => typeof guest.name[lang] === 'string' && guest.name[lang].length <= 100) &&
          typeof guest.descendant === 'boolean' && typeof guest.personId === 'string' && guest.personId.length <= 100 &&
          ids(guest.rememberedAtOpen, raw.relationships[guest.characterId].rememberedPreferences, raw.recipes.length + customIds.length) &&
          ids(guest.matchRecipes, service.menu, service.menu.length));
        const relationship = Object.assign({}, raw.relationships[guest.characterId], {rememberedPreferences: guest.rememberedAtOpen});
        const atOpening = Object.assign({}, raw, {relationships: Object.assign({}, raw.relationships, {[guest.characterId]: relationship})});
        const expectedMatches = service.menu.filter(id => intentionMatch(atOpening, guest.characterId, guest.intention, id));
        requireValue(JSON.stringify(guest.matchRecipes) === JSON.stringify(expectedMatches));
        const expectedRecommendation = service.menu.slice().sort((a, b) => hostingScore(atOpening, guest.characterId, guest.intention, b, approach.tags) - hostingScore(atOpening, guest.characterId, guest.intention, a, approach.tags) || a.localeCompare(b))[0];
        requireValue(guest.recommended === expectedRecommendation);
      });
      requireValue(service.guests.every((g, index) => index < service.index ? g.servedRecipe !== null : g.servedRecipe === null));
      requireValue(validForecast(service.forecast));
      if (!Object.hasOwn(service, 'brief')) service.brief = null;
      requireValue(validBriefSnapshot(service.brief, raw.phase === 'closed'));
      requireValue(service.brief ? service.brief.id === brief.selectedId : brief.selectedId === null);
      if (service.brief) {
        const expected = briefProgress(raw, brief.options.find(option => option.id === brief.selectedId), service);
        requireValue(expected.progress === service.brief.progress && expected.targetCount === service.brief.targetCount && expected.ready === service.brief.ready);
      }
      if (raw.phase === 'closed') requireValue(validForecast(raw.lastDay) && raw.lastDay.day === raw.day && service.index === guestCount);
    } else requireValue(raw.service === null);
    if (raw.lastDay !== null) {
      requireValue(validForecast(raw.lastDay));
      if (!Object.hasOwn(raw.lastDay, 'brief')) raw.lastDay.brief = null;
      if (!Object.hasOwn(raw.lastDay, 'hosting')) raw.lastDay.hosting = null;
      requireValue(validHostingResult(raw.lastDay.hosting));
      if (raw.lastDay.hosting) requireValue(raw.lastDay.hosting.date === raw.lastDay.date && raw.lastDay.hosting.day === raw.lastDay.day && JSON.stringify(raw.lastDay.hosting) === JSON.stringify(host.last));
      if (raw.phase === 'closed') {
        requireValue(!!raw.service.hosting === !!raw.lastDay.hosting);
        if (raw.service.hosting) {
          const served = raw.service.guests.map(guest => ({characterId: guest.characterId, recipeId: guest.servedRecipe, intention: guest.intention, matched: hostingMatch(raw, guest, guest.servedRecipe)}));
          requireValue(raw.lastDay.hosting.approachId === raw.service.hosting.approachId && JSON.stringify(raw.lastDay.hosting.served) === JSON.stringify(served));
        }
      }
      requireValue(validBriefSnapshot(raw.lastDay.brief, true));
      if (raw.phase === 'closed') requireValue(JSON.stringify(raw.lastDay.brief) === JSON.stringify(raw.service.brief));
    }
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
    resetBriefs(state);
    memory(state, 'legacy-import', {en: 'Your original café history and possessions are preserved in the family archive.', ar: 'حُفظ تاريخ مقهاك الأصلي ومقتنياته في أرشيف العائلة.'}, {kind: 'family'});
    record(state, 'imported', {date});
    return validate(state);
  }
  return Object.freeze({VERSION, SAVE_FORMAT, STAFF, BRIEF_STAMPS, RELATIONSHIP_LEVELS, DISPLAY_SLOTS, hostingText, hostingPlan, hostingMenu, hostingMatch, dailyBriefs, briefStatus, relationshipStatus, serviceMatch, newGame, dispatch, forecast, availableStories, currentGuest, allRecipes, recipe, personStatus,
    validate, exportSave, importSave, migrateLegacy, advanceDate, seasonFor});
}));
