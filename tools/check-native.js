/* Release gate for the native bundle.
 *
 * Three things have to hold before a build is worth sending to TestFlight, and all three
 * have failed in this family of app before:
 *
 *   1. The bundle fetches nothing. A stray remote font or sprite works perfectly on every
 *      machine it is tested on and breaks in aeroplane mode, which is the one situation
 *      nobody tests.
 *   2. Every sprite is there and decodes.
 *   3. A dynasty survives a relaunch. The game keeps thirty years of a café in localStorage,
 *      and localStorage on a null origin is written, read back fine all session, and gone on
 *      the next launch -- so this is checked at the same https origin App.js uses, never at
 *      file:// or about:blank.
 *
 * Run: NODE_PATH=<playwright> node tools/check-native.js
 */
const { chromium } = require('playwright');
const ORIGIN = 'https://app.cafelife.local/';

(async () => {
  const { HTML } = await import('file://' + process.cwd() + '/native/src/webapp/html.js');
  const fails = [];
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 } });

  const outbound = [];
  await ctx.route('**', route => {
    const url = route.request().url();
    if (url.startsWith(ORIGIN)) return route.fulfill({
      status: 200, contentType: 'text/html; charset=utf-8', body: HTML });
    if (!url.startsWith('data:') && !url.startsWith('about:')) outbound.push(url);
    return route.abort();
  });

  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(ORIGIN);
  await page.waitForTimeout(1500);

  const state = await page.evaluate(async () => {
    const names = Object.keys(ART_DATA);
    const decodes = await Promise.all(names.map(n => new Promise(res => {
      const i = new Image(); i.onload = () => res(true); i.onerror = () => res(false);
      i.src = ART_DATA[n];
    })));
    G = NEW(); G.year = 2011; G.cash = 7777; G.seats = 14;
    regState('noor').met = true;
    save();
    return { sprites: names.length, broken: names.filter((_, i) => !decodes[i]),
             secure: window.isSecureContext };
  });

  await page.reload();
  await page.waitForTimeout(1200);
  const restored = await page.evaluate(() => {
    const p = load();
    return p && p.year === 2011 && p.cash === 7777 && p.seats === 14
             && !!(p.regs && p.regs.noor && p.regs.noor.met);
  });

  if (outbound.length) fails.push('bundle fetches at runtime: ' + outbound.slice(0, 3).join(', '));
  if (state.sprites !== 140) fails.push('expected 140 sprites, found ' + state.sprites);
  if (state.broken.length) fails.push('sprites that do not decode: ' + state.broken.slice(0, 5).join(', '));
  if (!state.secure) fails.push('not a secure context -- localStorage will not persist');
  if (!restored) fails.push('a saved dynasty did not survive a relaunch');
  if (errors.length) fails.push('page errors: ' + errors.slice(0, 2).join(' | '));

  await browser.close();
  if (fails.length) { console.error('FAILED\n - ' + fails.join('\n - ')); process.exit(1); }
  console.log('native bundle OK — %d sprites, nothing fetched, save survives relaunch',
              state.sprites);
})();
