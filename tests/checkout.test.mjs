import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';

const { ApiError } = loadTypeScript('src/lib/api.ts');
const { normalizeDeliveryQuote, readOrderId, checkoutErrorMessage } = loadTypeScript('src/services/checkout.service.ts', { '@/lib/api': { ApiError } });
const { checkoutAddress, validateCheckoutForm, checkoutCartSignature } = loadTypeScript('src/lib/checkout-form.ts');
const regions = [{ id: '1', name: 'Toshkent shahri' }, { id: '3', name: 'Andijon' }];
const districts = [{ id: '2', regionId: '1', name: 'Chilonzor' }];
const form = { name: '  Ali Valiyev ', phone: '+998901234567', regionId: '1', districtId: '2', street: '  Test ko‘chasi, 10-uy  ' };

// These response examples cover the untyped portion of the backend contract.
test('delivery sums every seller package and accepts an explicit free quote', () => {
  assert.deepEqual(normalizeDeliveryQuote({ packages: [{ shopId: 'a', deliveryFee: '12000' }, { shopId: 'b', fee: 18000 }] }), {
    total: 30000, packages: [{ shopId: 'a', fee: 12000 }, { shopId: 'b', fee: 18000 }],
  });
  assert.equal(normalizeDeliveryQuote({ totalDeliveryFee: 0 }).total, 0);
  assert.equal(normalizeDeliveryQuote({ total: 30000, packages: [{ fee: 30000 }] }).total, 30000);
  assert.equal(normalizeDeliveryQuote({ subtotal: 23456, deliveryFee: 0, totalAmount: 23456, packages: [{ shopId: '1', itemsCount: 1, subtotal: 23456, deliveryFee: 0, totalAmount: 23456 }] }).total, 0);
});

test('missing, partial, invalid and inconsistent delivery quotes cannot enable checkout', () => {
  for (const data of [null, {}, [], { total: -1 }, { total: false }, { total: '' }, { total: Infinity }, { packages: [{ fee: 10000 }, {}] }, { total: 100, packages: [{ fee: 200 }] }]) {
    assert.throws(() => normalizeDeliveryQuote(data), { kind: 'invalid_response' });
  }
});

test('checkout validates recipient, Uzbekistan phone and district membership', () => {
  assert.deepEqual(validateCheckoutForm(form, regions, districts), {});
  for (const [field, value] of [['name', ' '], ['name', 'a'.repeat(101)], ['phone', '+99890'], ['regionId', 'unknown'], ['districtId', 'unknown'], ['street', ' a '], ['street', 'a'.repeat(301)]]) {
    assert.ok(validateCheckoutForm({ ...form, [field]: value }, regions, districts)[field], `${field}: ${value}`);
  }
  assert.ok(validateCheckoutForm({ ...form, regionId: '3' }, regions, districts).districtId);
});

test('checkout sends real location IDs and a readable full address', () => {
  assert.deepEqual(checkoutAddress(form, regions, districts), { recipientName: 'Ali Valiyev', phone: '+998901234567', regionId: '1', districtId: '2', address: 'Toshkent shahri, Chilonzor, Test ko‘chasi, 10-uy' });
  assert.throws(() => checkoutAddress({ ...form, districtId: 'wrong' }, regions, districts), /qayta tanlang/);
});

test('quantity, price and variant changes invalidate quotes even with the same number of rows', () => {
  const rows = [{ id: 'row', productId: 'p', variantId: 'v', quantity: 1, product: { price: 100 } }];
  const initial = checkoutCartSignature(rows);
  assert.notEqual(checkoutCartSignature([{ ...rows[0], quantity: 2 }]), initial);
  assert.notEqual(checkoutCartSignature([{ ...rows[0], product: { price: 200 } }]), initial);
  assert.notEqual(checkoutCartSignature([{ ...rows[0], variantId: 'v2' }]), initial);
});

test('blank or invalid order IDs are rejected; supported backend IDs are read', () => {
  for (const value of [{}, { id: '' }, { orderId: ' ' }, { id: NaN }, { id: false }, { id: -1 }]) assert.equal(readOrderId(value), null);
  assert.equal(readOrderId({ orderId: '77' }), '77');
  assert.equal(readOrderId({ salesOrderId: 78 }), '78');
});

test('checkout errors explain stock, address and network failures', () => {
  assert.match(checkoutErrorMessage(new ApiError(409, 'Conflict', { errorCode: 'INSUFFICIENT_STOCK' })), /qoldig‘i/);
  assert.match(checkoutErrorMessage(new ApiError(422, 'Invalid district')), /manzili noto‘g‘ri/);
  assert.match(checkoutErrorMessage(new ApiError(0, 'timeout', undefined, 'timeout')), /Server javobi/);
  assert.match(checkoutErrorMessage(new ApiError(500, 'Internal error')), /Server javobi/);
});

const attempt = () => ({ version: 1, key: 'same-key', scope: 'guest-a', phase: 'creating', payload: { paymentMethod: 'cod', address: checkoutAddress(form, regions, districts) }, receipt: { id: '', customer: {}, items: [], total: 100 } });

test('create then confirm uses the same order and checkpoints its ID before confirming', async () => {
  const calls = [];
  const { submitCheckoutAttempt } = loadTypeScript('src/lib/checkout-attempt.ts', {
    '@/services/checkout.service': { checkoutService: { create: async (payload, key) => { calls.push(['create', payload, key]); return '77'; }, confirm: async (id) => calls.push(['confirm', id]) } },
  });
  const input = attempt();
  const result = await submitCheckoutAttempt(input, (value) => calls.push(['checkpoint', value.receipt.id]));
  assert.equal(result.phase, 'confirmed');
  assert.deepEqual(calls, [['create', input.payload, 'same-key'], ['checkpoint', '77'], ['confirm', '77']]);
});

test('failed confirmation resumes after reload without creating another order, even with an empty cart', async (t) => {
  const stored = new Map();
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: (key) => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value), removeItem: (key) => stored.delete(key) } });
  t.after(() => { if (previous) Object.defineProperty(globalThis, 'sessionStorage', previous); else delete globalThis.sessionStorage; });
  let creates = 0;
  let confirmations = 0;
  const { submitCheckoutAttempt, saveCheckoutAttempt, readCheckoutAttempt } = loadTypeScript('src/lib/checkout-attempt.ts', {
    '@/services/checkout.service': { checkoutService: {
      create: async () => { creates++; return '77'; },
      confirm: async (id) => { assert.equal(id, '77'); if (++confirmations === 1) throw new ApiError(0, 'timeout', undefined, 'timeout'); },
    } },
  });
  await assert.rejects(submitCheckoutAttempt(attempt(), saveCheckoutAttempt), { kind: 'timeout' });
  const restored = readCheckoutAttempt('guest-a');
  assert.equal(restored.phase, 'confirming');
  const completed = await submitCheckoutAttempt(restored, saveCheckoutAttempt);
  assert.equal(completed.phase, 'confirmed');
  assert.equal(creates, 1);
  assert.equal(confirmations, 2);
  assert.equal(readCheckoutAttempt('guest-b'), null);
});

test('lost create response retries the exact same payload and idempotency key', async () => {
  const calls = [];
  const { submitCheckoutAttempt } = loadTypeScript('src/lib/checkout-attempt.ts', {
    '@/services/checkout.service': { checkoutService: {
      create: async (...args) => { calls.push(args); if (calls.length === 1) throw new ApiError(0, 'offline', undefined, 'network'); return '77'; },
      confirm: async () => {},
    } },
  });
  const input = attempt();
  await assert.rejects(submitCheckoutAttempt(input, () => {}));
  await submitCheckoutAttempt(input, () => {});
  assert.deepEqual(calls[0], calls[1]);
});

test('already confirmed attempt does not create or confirm again', async () => {
  const { submitCheckoutAttempt } = loadTypeScript('src/lib/checkout-attempt.ts', {
    '@/services/checkout.service': { checkoutService: { create: () => assert.fail(), confirm: () => assert.fail() } },
  });
  const input = { ...attempt(), phase: 'confirmed' };
  assert.equal(await submitCheckoutAttempt(input, () => assert.fail()), input);
});

test('definitive validation rejection allows correction but uncertain server outcomes keep the attempt', () => {
  const { checkoutWasRejected } = loadTypeScript('src/lib/checkout-attempt.ts', { '@/lib/api': { ApiError } });
  assert.equal(checkoutWasRejected(new ApiError(422, 'Invalid address')), true);
  assert.equal(checkoutWasRejected(new ApiError(409, 'Insufficient stock')), true);
  for (const error of [new ApiError(500, 'error'), new ApiError(409, 'idempotency conflict'), new ApiError(0, 'timeout', undefined, 'timeout'), new ApiError(200, 'invalid', undefined, 'invalid_response')]) assert.equal(checkoutWasRejected(error), false);
});

test('checkout create forwards a stable key and confirms with a safely encoded ID', async () => {
  const calls = [];
  const { checkoutService } = loadTypeScript('src/services/checkout.service.ts', {
    '@/lib/api': { ApiError, apiRequest: async (...args) => { calls.push(args); return { orderId: '77' }; } },
  });
  const input = attempt();
  assert.equal(await checkoutService.create(input.payload, input.key), '77');
  await checkoutService.confirm('77/1');
  assert.equal(calls[0][1].headers['Idempotency-Key'], 'same-key');
  assert.equal(calls[1][0], '/checkout/77%2F1/confirm');
});

test('Next proxy preserves guest/auth identity and the idempotency key all the way upstream', async () => {
  const { NextRequest } = await import('next/server.js');
  const { proxyBackend } = loadTypeScript('src/lib/backend-proxy.ts', {
    '@/lib/api': { ApiError, apiResponse: async (path, options) => {
      assert.equal(path, '/checkout');
      assert.equal(options.headers.get('idempotency-key'), 'same-key');
      assert.equal(options.headers.get('x-session-id'), 'guest-a');
      assert.equal(options.headers.get('authorization'), 'Bearer signed-token');
      assert.deepEqual(JSON.parse(options.body), attempt().payload);
      return Response.json({ orderId: '77' }, { status: 201 });
    } },
  });
  const response = await proxyBackend(new NextRequest('http://localhost/api/backend/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'same-key', 'X-Session-Id': 'guest-a', Authorization: 'Bearer signed-token' }, body: JSON.stringify(attempt().payload) }), '/checkout');
  assert.equal(response.status, 201);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
});
