'use strict';
const assert = require('node:assert/strict');
const vm = require('node:vm');
const Bridge = require('../src/saveBridge');
const tests = [];
const test = (name, run) => tests.push({ name, run });
const save = ' {"format":"cafe-life-daily","state":{"cafeName":"مقهى ☕","cash":123}}\n';
const request = { type: 'exportSave', requestId: 'export-1', filename: 'مقهاي.cafelife.json', text: save };
const asset = { uri: 'file:///cache/selected.json', name: 'My café.cafelife.json', size: Buffer.byteLength(save) };
function io(overrides = {}) {
  const calls = [];
  return Object.assign({ calls,
    sharingAvailable: async () => true,
    write: async (name, text) => { calls.push(['write', name, text]); return { uri: 'file:///cache/' + name }; },
    share: async file => { calls.push(['share', file.uri]); },
    pick: async () => ({ canceled: false, assets: [asset] }),
    size: async () => asset.size,
    read: async () => { calls.push(['read']); return save; },
    remove: async file => { calls.push(['remove', file.uri]); },
  }, overrides);
}
test('Only explicit native message types and bounded request IDs are accepted', () => {
  for (const raw of ['', 'null', '[]', 'false', '{}', '{"type":"deleteSave"}', '{"type":"pickSave","requestId":"x;evil()"}']) assert.equal(Bridge.parseMessage(raw), null);
  assert.equal(Bridge.parseMessage('{"type":"appearance","theme":"auto"}'), null);
  assert.equal(Bridge.parseMessage('{"type":"haptic","style":"heavy"}'), null);
  assert.deepEqual(Bridge.parseMessage('{"type":"language","language":"ar","evil":true}'), { type: 'language', language: 'ar' });
  assert.equal(Bridge.parseMessage(JSON.stringify(request)).text, save);
});
test('Arabic, emoji, and unpaired surrogate byte limits are measured correctly', () => {
  for (const text of ['abc', 'مقهى', '☕🙂', '\ud800', '\udc00', 'a\ud800a\udc00']) assert.equal(Bridge.utf8Bytes(text), Buffer.byteLength(text));
  assert.throws(() => Bridge.validateText('ع'.repeat(Bridge.MAX_SAVE_BYTES / 2 + 1)), error => error.code === 'tooLarge');
});
test('JSON syntax is checked without changing the complete export text', () => {
  assert.equal(Bridge.validateText(save), save);
  for (const text of ['null', '[]', 'false', '{} trailing', ' ', 42]) assert.throws(() => Bridge.validateText(text), error => error.code === 'invalidSave');
});
test('Export filenames cannot escape cache or inject markup and retain Arabic', () => {
  assert.equal(Bridge.safeFilename('../../مقهاي\u0000.cafelife.json'), 'مقهاي.cafelife.json');
  assert.equal(Bridge.safeFilename(''), 'Cafe-Life.cafelife.json');
  assert.ok(!Bridge.safeFilename('<img src=x>').includes('<'));
  assert.ok(Bridge.safeFilename('x'.repeat(500)).length < 100);
});
test('Native callback treats malicious text as inert data', () => {
  const detail = { type: 'pickSave', requestId: 'i1', status: 'selected', text: '</script>";evil();\u2028\u2029' };
  let delivered;
  vm.runInNewContext(Bridge.resultScript(detail), { window: { dispatchEvent: event => { delivered = event.detail; } }, CustomEvent: function(type, options) { assert.equal(type, 'cafe-native-result'); this.detail = options.detail; } });
  assert.equal(delivered.text, detail.text);
});
test('Native export writes exact JSON and removes only its temporary file', async () => {
  const ports = io();
  assert.deepEqual(await Bridge.exportSaveFile(request, ports), { type: 'exportSave', requestId: 'export-1', status: 'presented' });
  assert.deepEqual(ports.calls[0], ['write', 'مقهاي.cafelife.json', save]);
  assert.equal(ports.calls[1][0], 'share'); assert.equal(ports.calls[2][0], 'remove');
});
test('Unavailable sharing and invalid exports never create files', async () => {
  const ports = io({ sharingAvailable: async () => false });
  await assert.rejects(Bridge.exportSaveFile(request, ports), error => error.code === 'unavailable');
  await assert.rejects(Bridge.exportSaveFile({ ...request, text: 'bad' }, ports), error => error.code === 'invalidSave');
  assert.equal(ports.calls.length, 0);
});
test('Failed native share still cleans its temporary file', async () => {
  const ports = io({ share: async () => { throw new Error('platform failed'); } });
  await assert.rejects(Bridge.exportSaveFile(request, ports));
  assert.equal(ports.calls.at(-1)[0], 'remove');
});
test('Cancelled import does not read a file or touch game state', async () => {
  const ports = io({ pick: async () => ({ canceled: true }) });
  assert.equal((await Bridge.pickSaveFile({ requestId: 'i1' }, ports)).status, 'cancelled');
  assert.equal(ports.calls.length, 0);
});
test('Picker reported or actual files above 25 MB are rejected before reading', async () => {
  for (const actual of [false, true]) {
    const ports = io(actual ? { size: async () => Bridge.MAX_SAVE_BYTES + 1 } : { pick: async () => ({ canceled: false, assets: [{ ...asset, size: Bridge.MAX_SAVE_BYTES + 1 }] }) });
    await assert.rejects(Bridge.pickSaveFile({ requestId: 'i1' }, ports), error => error.code === 'tooLarge');
    assert.ok(ports.calls.every(call => call[0] !== 'read'));
    assert.equal(ports.calls.at(-1)[0], 'remove');
  }
});
test('Nonlocal picker URIs are rejected without reading or requesting them', async () => {
  const ports = io({ pick: async () => ({ canceled: false, assets: [{ ...asset, uri: 'https://example.invalid/save.json' }] }) });
  await assert.rejects(Bridge.pickSaveFile({ requestId: 'i1' }, ports), error => error.code === 'invalidSave');
  assert.equal(ports.calls.length, 0);
});
test('Selected text is returned for review, never applied to a game', async () => {
  const ports = io();
  const selected = await Bridge.pickSaveFile({ requestId: 'i1' }, ports);
  assert.equal(selected.status, 'selected'); assert.equal(selected.text, save);
  assert.equal(selected.requestId, 'i1'); assert.equal(selected.filename, 'My café.cafelife.json');
  assert.deepEqual(ports.calls.map(call => call[0]), ['read', 'remove']);
});
test('Internal error messages are not exposed through native results', () => {
  assert.equal(Bridge.errorResult(request, new Error('file:///private/path')).error, 'failed');
  assert.equal(Bridge.errorResult(request, { code: 'tooLarge' }).error, 'tooLarge');
});

(async () => {
  for (const { name, run } of tests) { await run(); console.log('✓ ' + name); }
  console.log(`${tests.length} native bridge checks passed.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
