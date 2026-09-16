// Renders brand/guidelines.html to guidelines.pdf, and the colour swatch sheets.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = '/home/user/engabdullaalmulla-dev/brand';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1123, height: 794 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('requestfailed', r => errs.push('404 ' + r.url().split('/').slice(-2).join('/')));
  await p.goto('file://' + ROOT + '/guidelines.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);

  // any page whose content runs past its box is a layout bug, not a scroll
  const over = await p.evaluate(() => {
    const out = [];
    document.querySelectorAll('.page').forEach((el, i) => {
      const pb = el.querySelector('.pb');
      if (pb && pb.scrollHeight > pb.clientHeight + 2)
        out.push({ page: i + 1, overflow: pb.scrollHeight - pb.clientHeight,
                   title: (el.querySelector('.ph-l') || {}).textContent });
    });
    return out;
  });
  console.log('pages:', await p.evaluate(() => document.querySelectorAll('.page').length));
  console.log('overflowing:', JSON.stringify(over, null, 1));
  console.log(errs.length ? 'ERRORS: ' + [...new Set(errs)].join(' | ') : 'no errors');

  await p.pdf({ path: ROOT + '/guidelines.pdf', width: '297mm', height: '210mm',
                printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });

  // the swatch sheets, from the same tokens.json the book is built from
  const sw = await b.newPage({ viewport: { width: 1100, height: 1400 }, deviceScaleFactor: 2 });
  sw.on('pageerror', e => errs.push('swatch ' + e.message));
  await sw.goto('file://' + ROOT + '/assets/colour/swatches.html', { waitUntil: 'networkidle' });
  await sw.evaluate(() => document.fonts.ready);
  await sw.waitForTimeout(400);
  const ids = await sw.evaluate(() => [...document.querySelectorAll('.sheet')].map(e => e.id));
  for (const id of ids)
    await sw.locator('#' + id).screenshot({ path: ROOT + '/assets/colour/' + id + '.png' });
  console.log('swatch sheets:', ids.join(', '));
  await b.close();
})();
