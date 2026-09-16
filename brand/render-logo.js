// Renders the wordmark and lockup variants from render-logo.html.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = '/home/user/engabdullaalmulla-dev/brand';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1400, height: 1200 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('requestfailed', r => errs.push('404 ' + r.url().split('/').slice(-2).join('/')));
  await p.goto('file://' + ROOT + '/render-logo.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(600);
  const ids = await p.evaluate(() => [...document.querySelectorAll('.stage')].map(e => e.id));
  for (const id of ids) await p.locator('#' + id).screenshot({ path: `${ROOT}/assets/logo/${id}.png` });
  console.log('logo variants:', ids.join(', '));
  console.log(errs.length ? 'ERRORS: ' + [...new Set(errs)].join(' | ') : 'no errors');
  await b.close();
})();
