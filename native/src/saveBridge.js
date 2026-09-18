'use strict';

// Only text selected by the player crosses this bridge. The web engine remains the
// authority for save compatibility and applies it only after the import review.
const MAX_SAVE_BYTES = 25 * 1024 * 1024;
const REQUEST_ID = /^[A-Za-z0-9_-]{1,80}$/;
function failure(code) { const error = new Error(code); error.code = code; return error; }

function utf8Bytes(text, limit = MAX_SAVE_BYTES) {
  let bytes = 0;
  for (let index = 0; index < text.length; index++) {
    const point = text.charCodeAt(index);
    if (point < 0x80) bytes++;
    else if (point < 0x800) bytes += 2;
    else if (point >= 0xd800 && point <= 0xdbff && index + 1 < text.length
      && text.charCodeAt(index + 1) >= 0xdc00 && text.charCodeAt(index + 1) <= 0xdfff) { bytes += 4; index++; }
    else bytes += 3;
    if (bytes > limit) return bytes;
  }
  return bytes;
}

function validateText(text) {
  if (typeof text !== 'string' || !text.trim()) throw failure('invalidSave');
  if (text.length > MAX_SAVE_BYTES || utf8Bytes(text) > MAX_SAVE_BYTES) throw failure('tooLarge');
  let parsed;
  try { parsed = JSON.parse(text); } catch (_) { throw failure('invalidSave'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw failure('invalidSave');
  return text; // Preserve every original byte of JSON text; never reserialize it.
}

function safeFilename(value) {
  const base = typeof value === 'string' ? value.replace(/(?:\.cafelife)?\.json$/i, '') : '';
  const clean = base.replace(/[^\p{L}\p{N} _-]/gu, '').trim().slice(0, 70);
  return (clean || 'Cafe-Life') + '.cafelife.json';
}

function parseMessage(raw) {
  // JSON escaping can at most double a valid text payload's character length.
  if (typeof raw !== 'string' || raw.length > MAX_SAVE_BYTES * 2 + 8192) return null;
  let data;
  try { data = JSON.parse(raw); } catch (_) { return null; }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  if (data.type === 'ready') return { type: 'ready' };
  if (data.type === 'language' && ['en', 'ar'].includes(data.language)) return { type: 'language', language: data.language };
  if (data.type === 'appearance' && ['light', 'dark'].includes(data.theme)) return { type: 'appearance', theme: data.theme };
  if (data.type === 'haptic' && ['tap', 'success'].includes(data.style)) return { type: 'haptic', style: data.style };
  if (['exportSave', 'pickSave'].includes(data.type) && typeof data.requestId === 'string' && REQUEST_ID.test(data.requestId)) {
    return { type: data.type, requestId: data.requestId, text: data.text, filename: data.filename };
  }
  return null;
}

function resultScript(detail) {
  const json = JSON.stringify(detail).replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `window.dispatchEvent(new CustomEvent('cafe-native-result',{detail:${json}}));true;`;
}

async function exportSaveFile(data, io) {
  const text = validateText(data.text);
  if (!await io.sharingAvailable()) throw failure('unavailable');
  let file;
  try {
    file = await io.write(safeFilename(data.filename), text);
    await io.share(file);
    // The operating system does not disclose whether a share was saved or dismissed.
    return { type: 'exportSave', requestId: data.requestId, status: 'presented' };
  } finally { if (file) await io.remove(file); }
}

async function pickSaveFile(data, io) {
  const result = await io.pick();
  if (result.canceled) return { type: 'pickSave', requestId: data.requestId, status: 'cancelled' };
  const asset = result.assets?.[0];
  if (!asset || typeof asset.uri !== 'string' || !asset.uri.startsWith('file://')) throw failure('invalidSave');
  try {
    if (typeof asset.size === 'number' && asset.size > MAX_SAVE_BYTES) throw failure('tooLarge');
    const size = await io.size(asset);
    if (typeof size !== 'number' || !Number.isFinite(size) || size <= 0) throw failure('invalidSave');
    if (size > MAX_SAVE_BYTES) throw failure('tooLarge');
    const text = validateText(await io.read(asset));
    return { type: 'pickSave', requestId: data.requestId, status: 'selected', text, filename: safeFilename(asset.name) };
  } finally { await io.remove(asset); }
}

function errorResult(data, error) {
  return { type: data.type, requestId: data.requestId, status: 'error',
    error: ['tooLarge', 'invalidSave', 'unavailable', 'busy'].includes(error?.code) ? error.code : 'failed' };
}

module.exports = { MAX_SAVE_BYTES, utf8Bytes, validateText, safeFilename, parseMessage, resultScript, exportSaveFile, pickSaveFile, errorResult };
