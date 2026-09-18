/* Release gate. `--static` checks the bundle and shared rules without opening a browser.
 * Default mode additionally tests native-origin boot, every image decode, and save/reload
 * in Chromium. Install prerequisites in native/: npm install && npm run check:setup.
 * This gate never substitutes for VoiceOver/audio/Arabic checks on a physical iPhone.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');
const { createRequire } = require('module');
const ROOT = path.dirname(__dirname);
const ORIGIN = 'https://app.cafelife.local/';
const fail = message => { throw new Error(message); };
const assert = (condition, message) => { if (!condition) fail(message); };
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

function sourceFiles() {
  return ['prototype/cafelife.html', 'native/assets/fonts/fonts.css',
    ...fs.readdirSync(path.join(ROOT, 'prototype/game')).filter(name => /\.(?:js|css)$/.test(name)).sort().map(name => 'prototype/game/' + name),
    ...fs.readdirSync(path.join(ROOT, 'art/sprites')).filter(name => name.endsWith('.png') && !name.includes('@')).sort().map(name => 'art/sprites/' + name),
    ...['native/assets/icon.png', 'art/brand/logo.png'].filter(name => fs.existsSync(path.join(ROOT, name)))];
}
function expectedBuildId() {
  const hash = crypto.createHash('sha256');
  for (const file of sourceFiles()) { hash.update(file); hash.update(fs.readFileSync(path.join(ROOT, file))); }
  return 'cafe-life-' + hash.digest('hex').slice(0, 16);
}
function staticGate() {
  const module = read('native/src/webapp/html.js');
  const match = module.match(/export const HTML = ([\s\S]*);\s*$/);
  assert(match, 'Native bundle is missing its HTML export; run npm run webapp');
  const HTML = JSON.parse(match[1]);
  assert(/<meta[^>]+Content-Security-Policy/i.test(HTML) && HTML.includes("connect-src 'none'"), 'Native document must forbid network connections');
  assert(!/<script\b[^>]*\bsrc\s*=/i.test(HTML), 'A script was not embedded');
  const markup = HTML.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '');
  const urls = [...markup.matchAll(/<(?:link|img|source|audio)\b[^>]*\b(?:src|href)\s*=\s*(['"])(.*?)\1/gi)].map(match => match[2]);
  assert(urls.every(url => /^(?:data:|blob:|#)/.test(url)), 'A native runtime asset was not embedded');
  const scripts = [...HTML.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].map(match => ({ attrs: match[1], source: match[2] }));
  for (const [index, script] of scripts.entries()) new vm.Script(script.source, { filename: 'native-script-' + index });
  const sandbox = { console }; sandbox.window = sandbox; sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  const assets = scripts.find(script => script.source.startsWith('window.CAFE_BUILD_ID='));
  assert(assets, 'Embedded artwork and build fingerprint are missing');
  vm.runInContext(assets.source, sandbox);
  assert(sandbox.CAFE_BUILD_ID === expectedBuildId(), 'Native bundle is stale: run npm run webapp before release');
  const expectedSprites = fs.readdirSync(path.join(ROOT, 'art/sprites')).filter(name => name.endsWith('.png') && !name.includes('@'));
  assert(Object.keys(sandbox.ART_DATA || {}).length === expectedSprites.length, 'Sprite count differs from authored artwork');
  for (const name of expectedSprites) assert(sandbox.ART_DATA[name.slice(0, -4)], 'Sprite missing: ' + name);
  for (const [name, uri] of Object.entries({ ...sandbox.ART_DATA, ...sandbox.BRAND_DATA })) {
    assert(/^data:image\/webp;base64,/.test(uri), 'Unexpected image encoding: ' + name);
    const bytes = Buffer.from(uri.split(',')[1], 'base64');
    assert(bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP', 'Invalid image payload: ' + name);
  }
  assert(sandbox.BRAND_DATA?.icon && sandbox.BRAND_DATA?.logo, 'Icon and logo are required');
  const modules = {};
  for (const name of ['content', 'engine', 'audio', 'i18n', 'ui']) {
    const script = scripts.find(script => script.attrs.includes('game/' + name + '.js'));
    assert(script, 'Missing bundled game module: ' + name);
    assert(!/\b(?:fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon\s*\(|import\s*\()/m.test(script.source), 'Network API in authored game module: ' + name);
    modules[name] = script;
  }
  vm.runInContext(modules.content.source, sandbox);
  vm.runInContext(modules.engine.source, sandbox);
  const engine = sandbox.CafeEngine;
  assert(engine && typeof engine.newGame === 'function' && typeof engine.validate === 'function', 'Shared engine API did not initialise');
  const sample = engine.newGame({ name: 'Release gate', owner: 'Tester', lang: 'ar' });
  const restored = engine.importSave(engine.exportSave(sample));
  assert(JSON.stringify(engine.validate(sample)) === JSON.stringify(restored), 'Save export/import altered the validated dynasty');
  let rejected = false;
  try { engine.importSave('{"version":999,"cash":"broken"}'); } catch (_) { rejected = true; }
  assert(rejected, 'Malformed or future saves must be rejected');
  const app = read('native/App.js');
  assert(app.includes(ORIGIN) && app.includes('domStorageEnabled'), 'Native save origin/storage configuration regressed');
  assert(app.includes("ar:") && app.includes("en:"), 'Native shell must localise loading and recovery');
  const pkg = JSON.parse(read('native/package.json'));
  assert(pkg.scripts['build:testflight'].includes('npm run check'), 'TestFlight build bypasses release gate');
  return { HTML, sprites: expectedSprites.length, buildId: sandbox.CAFE_BUILD_ID };
}

async function browserGate(result) {
  let chromium;
  try { ({ chromium } = createRequire(path.join(ROOT, 'native/package.json'))('playwright')); }
  catch (_) {
    try { ({ chromium } = require('playwright')); }
    catch (_) { fail('Install browser gate dependencies: cd native && npm install && npm run check:setup'); }
  }
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 393, height: 852 }, locale: 'en-US' });
    const outbound = [], errors = [];
    await context.route('**', route => {
      const url = route.request().url();
      if (url === ORIGIN && route.request().isNavigationRequest()) return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: result.HTML });
      if (!url.startsWith('data:') && !url.startsWith('about:') && !url.startsWith('blob:')) outbound.push(url);
      return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(String(error)));
    await page.goto(ORIGIN);
    await page.waitForFunction(() => window.CafeEngine && window.CafeApp);
    const state = await page.evaluate(async () => {
      const entries = Object.entries({ ...window.ART_DATA, ...window.BRAND_DATA });
      const broken = [];
      await Promise.all(entries.map(async ([name, uri]) => {
        const img = new Image(); img.src = uri;
        try { await img.decode(); } catch (_) { broken.push(name); }
      }));
      const seed = window.CafeEngine.newGame({ name: 'Release Gate', owner: 'Tester', lang: 'ar' });
      seed.cash = 7777;
      const saveKey = window.CafeApp.SAVE_KEY || 'cafelife_daily_6';
      localStorage.setItem(saveKey, window.CafeEngine.exportSave(seed));
      return { broken, secure: window.isSecureContext, expected: window.CafeEngine.exportSave(seed), saveKey };
    });
    assert(state.secure, 'Native origin is not a secure context');
    assert(!state.broken.length, 'Images failed decode: ' + state.broken.slice(0, 8).join(', '));
    await page.reload();
    await page.waitForFunction(() => window.CafeApp && window.CafeApp.getState());
    const restored = await page.evaluate(() => ({
      state: window.CafeEngine.exportSave(window.CafeApp.getState()),
      lang: document.documentElement.lang, dir: document.documentElement.dir,
    }));
    assert(restored.state === state.expected, 'A saved dynasty did not survive native-origin relaunch');
    assert(restored.lang === 'ar' && restored.dir === 'rtl', 'Arabic save did not restore Arabic / RTL presentation');
    assert(outbound.length === 0, 'Native bundle requested runtime resources: ' + outbound.slice(0, 5).join(', '));
    assert(errors.length === 0, 'Runtime errors: ' + errors.slice(0, 5).join(' | '));
  } finally { await browser.close(); }
}

(async () => {
  const result = staticGate();
  if (!process.argv.includes('--static')) await browserGate(result);
  console.log('%s OK: %d embedded sprites, EN/AR modules, original audio, save roundtrip, %s',
    result.buildId, result.sprites, process.argv.includes('--static') ? 'static offline checks (browser gate not run)' : 'zero runtime requests, all images decoded, native-origin save relaunch');
})().catch(error => { console.error('Release gate FAILED: ' + error.message); process.exitCode = 1; });
