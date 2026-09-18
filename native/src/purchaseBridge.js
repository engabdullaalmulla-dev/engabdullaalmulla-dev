'use strict';

const PRODUCT_ID = 'com.almulla.cafelife.fullgame';
const REQUEST_ID = /^[A-Za-z0-9_-]{1,80}$/;
const REQUESTS = ['purchaseStatus', 'purchaseFullGame', 'restorePurchases'];
const STATUSES = ['ready', 'purchased', 'restored', 'pending', 'cancelled', 'error', 'unavailable'];
const ERRORS = ['busy', 'failed', 'unavailable', 'productUnavailable', 'storeUnavailable', 'paymentsDisabled', 'verificationFailed'];
const EMPTY = Object.freeze({ productId: PRODUCT_ID, entitled: false, verified: false, available: false, localizedPrice: null });

function parseMessage(raw) {
  if (typeof raw !== 'string' || raw.length > 1024) return null;
  let value;
  try { value = JSON.parse(raw); } catch (_) { return null; }
  if (!value || !REQUESTS.includes(value.type) || typeof value.requestId !== 'string' || !REQUEST_ID.test(value.requestId)) return null;
  // Deliberately discard caller-supplied ownership, product IDs and prices.
  return { type: value.type, requestId: value.requestId };
}

function normalize(nativeResult) {
  if (!nativeResult || nativeResult.productId !== PRODUCT_ID || !STATUSES.includes(nativeResult.status)) {
    return { ...EMPTY, status: 'error', error: 'verificationFailed' };
  }
  const verified = nativeResult.verified === true;
  const entitled = verified && nativeResult.entitled === true;
  const localizedPrice = typeof nativeResult.localizedPrice === 'string' && nativeResult.localizedPrice.length > 0
    && nativeResult.localizedPrice.length <= 100 ? nativeResult.localizedPrice : null;
  const result = { productId: PRODUCT_ID, verified, entitled, localizedPrice,
    available: nativeResult.available === true && localizedPrice !== null, status: nativeResult.status };
  if (ERRORS.includes(nativeResult.error)) result.error = nativeResult.error;
  if (result.status === 'purchased' && !entitled) { result.status = 'error'; result.error = 'verificationFailed'; }
  return result;
}

function resultScript(detail) {
  const json = JSON.stringify(detail).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `window.dispatchEvent(new CustomEvent('cafe-purchase-result',{detail:${json}}));true;`;
}

function createController(nativeModule, emit) {
  let last = { ...EMPTY, status: 'unavailable', error: 'unavailable' };
  let busy = false;
  function publish(data, value) {
    const detail = { ...value, type: data.type, requestId: data.requestId };
    emit(detail);
    return detail;
  }
  function update(value) {
    last = normalize(value);
    return publish({ type: 'purchaseStatus', requestId: 'native-update' }, last);
  }
  async function request(data) {
    if (!data || !REQUESTS.includes(data.type) || !REQUEST_ID.test(data.requestId || '')) return null;
    if (!nativeModule) return publish(data, { ...EMPTY, status: 'unavailable', error: 'unavailable' });
    const interactive = data.type !== 'purchaseStatus';
    if (interactive && busy) return publish(data, { ...last, status: 'error', error: 'busy' });
    if (interactive) busy = true;
    try {
      const method = data.type === 'purchaseStatus' ? 'getStatus' : data.type === 'purchaseFullGame' ? 'purchase' : 'restore';
      last = normalize(await nativeModule[method]());
      return publish(data, last);
    } catch (_) {
      // A bridge failure does not revoke a previously verified native result.
      return publish(data, { ...last, status: 'error', error: 'failed' });
    } finally { if (interactive) busy = false; }
  }
  return { request, update };
}

module.exports = { PRODUCT_ID, parseMessage, normalize, resultScript, createController };
