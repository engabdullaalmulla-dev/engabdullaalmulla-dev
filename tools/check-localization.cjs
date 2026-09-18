#!/usr/bin/env node
/* Content parity, interpolation safety, UI key references and installed-app metadata. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.dirname(__dirname);
const strings = require('../prototype/game/i18n.js');
const content = require('../prototype/game/content.js');
const Arabic = /[\u0600-\u06ff]/;
const placeholders = text => [...text.matchAll(/\{([A-Za-z_][\w]*)\}/g)].map(match => match[1]).sort();
let pairs = 0;
function pair(en, ar, label) {
  assert.equal(typeof en, 'string', label + ': English must be a string');
  assert.equal(typeof ar, 'string', label + ': Arabic must be a string');
  assert(en.trim(), label + ': English is empty');
  assert(ar.trim() && Arabic.test(ar), label + ': Arabic text is missing');
  assert.deepEqual(placeholders(en), placeholders(ar), label + ': interpolation placeholders differ');
  pairs++;
}
for (const [key, values] of Object.entries(strings)) {
  assert(Array.isArray(values) && values.length === 2, key + ': provide [English, Arabic]');
  pair(values[0], values[1], 'interface.' + key);
}
function visit(value, location) {
  if (!value || typeof value !== 'object') return;
  if ('en' in value || 'ar' in value) { pair(value.en, value.ar, location); return; }
  for (const [key, child] of Object.entries(value)) visit(child, location + '.' + key);
}
visit(content, 'content');
const ui = fs.readFileSync(path.join(ROOT, 'prototype/game/ui.js'), 'utf8');
const used = new Set([...ui.matchAll(/\b(?:t|T)\s*\(\s*(['"])([\w.:-]+)\1/g)].map(match => match[2]));
for (const key of used) assert(Object.hasOwn(strings, key), 'UI uses missing translation: ' + key);
assert(used.size > 20, 'UI translation call audit found too few keys; check the lookup API');
const app = JSON.parse(fs.readFileSync(path.join(ROOT, 'native/app.json'), 'utf8')).expo;
assert.deepEqual(app.ios.infoPlist.CFBundleLocalizations, ['en', 'ar']);
assert.equal(app.ios.infoPlist.CFBundleAllowMixedLocalizations, true);
for (const lang of ['en', 'ar']) {
  const file = app.locales?.[lang];
  assert(file, 'Native locale metadata missing: ' + lang);
  const locale = JSON.parse(fs.readFileSync(path.join(ROOT, 'native', file), 'utf8'));
  for (const value of [locale.ios.CFBundleDisplayName, locale.ios.CFBundleName, locale.android.app_name]) {
    assert(typeof value === 'string' && value.trim(), 'Installed app name missing: ' + lang);
    if (lang === 'ar') assert(Arabic.test(value), 'Installed Arabic app name is not translated');
  }
}
console.log('Localization OK: %d English/Arabic pairs, %d literal UI keys, matching placeholders and native app names', pairs, used.size);
