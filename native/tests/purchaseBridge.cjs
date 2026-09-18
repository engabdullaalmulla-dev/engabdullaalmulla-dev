'use strict';
const assert = require('node:assert/strict');
const vm = require('node:vm');
const P = require('../src/purchaseBridge');
const tests = [];
const test = (name, fn) => tests.push([name, fn]);
const trial = { productId: P.PRODUCT_ID, status: 'ready', entitled: false, verified: true, available: true, localizedPrice: 'AED 19.99' };
const full = { ...trial, status: 'purchased', entitled: true };
const request = (type, requestId = 'test-1') => ({ type, requestId });

test('accepts only bounded purchase commands and strips spoofed ownership', () => {
  assert.deepEqual(P.parseMessage(JSON.stringify({ ...request('purchaseFullGame'), entitled: true, productId: 'other', localizedPrice: 'free' })), request('purchaseFullGame'));
  for (const raw of ['null', '[]', '{', JSON.stringify({ type: 'unlock', requestId: 'a' }), JSON.stringify({ type: 'purchaseStatus', requestId: 'x;alert(1)' }), ' '.repeat(1025)]) assert.equal(P.parseMessage(raw), null);
});
test('keeps the exact App Store localized price and rejects another product', () => {
  assert.equal(P.normalize({ ...trial, localizedPrice: '١٩٫٩٩ د.إ.‏' }).localizedPrice, '١٩٫٩٩ د.إ.‏');
  assert.equal(P.normalize({ ...full, productId: 'other' }).entitled, false);
});
test('only literal verified ownership unlocks', () => {
  for (const verified of [false, undefined, 'true', 1]) assert.equal(P.normalize({ ...full, verified }).entitled, false);
  assert.equal(P.normalize({ ...full, entitled: 'true' }).entitled, false);
  assert.equal(P.normalize(full).entitled, true);
});
test('a purchase success without verified entitlement is an error', () => {
  assert.equal(P.normalize({ ...full, verified: false }).status, 'error');
  assert.equal(P.normalize({ ...full, entitled: false }).error, 'verificationFailed');
});
test('missing prices cannot produce an actionable purchase', () => {
  for (const localizedPrice of [null, undefined, '', 19.99, 'a'.repeat(101)]) assert.equal(P.normalize({ ...trial, localizedPrice }).available, false);
});
test('browser and Expo Go never manufacture a purchase', async () => {
  const seen = [], controller = P.createController(null, result => seen.push(result));
  for (const type of ['purchaseStatus', 'purchaseFullGame', 'restorePurchases']) {
    const result = await controller.request(request(type));
    assert.equal(result.entitled, false); assert.equal(result.status, 'unavailable');
  }
  assert.equal(seen.length, 3);
});
test('dispatches native status, purchase and restore independently', async () => {
  const calls = [], seen = [];
  const controller = P.createController({
    getStatus: async () => { calls.push('status'); return trial; },
    purchase: async () => { calls.push('purchase'); return full; },
    restore: async () => { calls.push('restore'); return { ...full, status: 'restored' }; },
  }, value => seen.push(value));
  for (const type of ['purchaseStatus', 'purchaseFullGame', 'restorePurchases']) await controller.request(request(type, type));
  assert.deepEqual(calls, ['status', 'purchase', 'restore']);
  assert.equal(seen[2].status, 'restored'); assert.equal(seen[2].requestId, 'restorePurchases');
});
test('pending and cancellation never grant ownership', async () => {
  for (const status of ['pending', 'cancelled']) {
    const controller = P.createController({ purchase: async () => ({ ...trial, status }) }, () => {});
    const result = await controller.request(request('purchaseFullGame'));
    assert.equal(result.status, status); assert.equal(result.entitled, false);
  }
});
test('restore with no purchase is a verified empty result', async () => {
  const controller = P.createController({ restore: async () => ({ ...trial, status: 'restored' }) }, () => {});
  const result = await controller.request(request('restorePurchases'));
  assert.equal(result.status, 'restored'); assert.equal(result.verified, true); assert.equal(result.entitled, false);
});
test('serializes interactive sheets and clears its busy state', async () => {
  let finish;
  const controller = P.createController({ purchase: () => new Promise(resolve => { finish = resolve; }), restore: async () => trial }, () => {});
  const first = controller.request(request('purchaseFullGame'));
  assert.equal((await controller.request(request('restorePurchases', 'second'))).error, 'busy');
  finish(full); await first;
  assert.equal((await controller.request(request('restorePurchases', 'third'))).status, 'ready');
});
test('a transport error does not revoke previously verified ownership', async () => {
  const controller = P.createController({ getStatus: async () => { throw new Error('offline'); } }, () => {});
  controller.update(full);
  const result = await controller.request(request('purchaseStatus'));
  assert.equal(result.entitled, true); assert.equal(result.error, 'failed');
});
test('a verified native refund update revokes access without touching saves', () => {
  const seen = [], controller = P.createController({}, value => seen.push(value));
  controller.update(full); controller.update(trial);
  assert.equal(seen[0].entitled, true); assert.equal(seen[1].entitled, false);
  assert.equal(seen[1].requestId, 'native-update'); assert.equal(seen[1].type, 'purchaseStatus');
  assert.equal(Object.hasOwn(seen[1], 'save'), false);
});
test('only a native callback supplies ownership; no request grants it', async () => {
  const controller = P.createController({ getStatus: async () => trial }, () => {});
  assert.equal((await controller.request({ ...request('purchaseStatus'), entitled: true, verified: true })).entitled, false);
});
test('callback JSON cannot escape into executable source', () => {
  const detail = { ...trial, localizedPrice: '</script>\u2028\u2029"; globalThis.pwned=true;//' };
  const script = P.resultScript(detail);
  let event;
  const context = { window: { dispatchEvent: value => { event = value; } }, CustomEvent: function(type, value) { this.type = type; this.detail = value.detail; } };
  vm.runInNewContext(script, context);
  assert.equal(context.pwned, undefined);
  assert.equal(event.type, 'cafe-purchase-result'); assert.equal(event.detail.localizedPrice, detail.localizedPrice);
  assert.equal(script.includes('</script>'), false);
});

(async () => {
  for (const [name, fn] of tests) { await fn(); console.log('✓ ' + name); }
  console.log(`${tests.length} native purchase bridge checks passed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
