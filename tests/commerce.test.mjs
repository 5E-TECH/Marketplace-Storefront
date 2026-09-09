import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';

const product = { id: 1, name: 'Telefon', price: 100, colors: ['black'], images: [] };

test('null prices fall back to a valid sale price; zero stays zero', () => {
  const { normalizeApiProduct } = loadTypeScript('src/lib/normalize-product.ts');
  assert.equal(normalizeApiProduct({ ...product, price: null, salePrice: '250' }).price, 250);
  assert.equal(normalizeApiProduct({ ...product, price: 0, salePrice: '250' }).price, 0);
});

test('cart totals use the selected variant price and normalize invalid quantities', async () => {
  const { cartService, cartTotals } = loadTypeScript('src/services/cart.service.ts', {
    '@/lib/api': { apiRequest: async () => ({ items: [
      { id: 'a', product, variant: { id: 'v', price: '250' }, quantity: 2 },
      { id: 'b', product, unitPrice: 0, quantity: Infinity },
    ] }) },
  });
  const cart = await cartService.get();
  assert.equal(cart.items[0].product.price, 250);
  assert.equal(cart.items[1].quantity, 1);
  assert.deepEqual(cartTotals(cart.items), { quantity: 3, subtotal: 500 });
});

test('invalid cart quantities never reach the backend', async () => {
  let requests = 0;
  const { cartService } = loadTypeScript('src/services/cart.service.ts', {
    '@/lib/api': { apiRequest: async () => { requests++; } },
  });
  for (const quantity of [0, -1, 1.5, Infinity, NaN]) {
    await assert.rejects(cartService.add({ product, variantId: 'v', quantity }));
    await assert.rejects(cartService.update('a', quantity));
  }
  assert.equal(requests, 0);
});

test('clearing an order snapshot does not refetch and delete newly added items', async () => {
  const calls = [];
  const { cartService } = loadTypeScript('src/services/cart.service.ts', {
    '@/lib/api': { apiRequest: async (...args) => { calls.push(args); } },
  });
  await cartService.clear({ items: [{ id: 'original' }] });
  assert.deepEqual(calls, [['/cart/items/original', { method: 'DELETE' }]]);
});

test('a saved order remains successful if cart cleanup fails', async (t) => {
  const stored = new Map();
  const originalStorage = globalThis.localStorage;
  const originalWindow = globalThis.window;
  globalThis.window = {};
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key) => stored.get(key), setItem: (key, value) => stored.set(key, value) } });
  t.after(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: originalStorage });
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
  });
  const { orderService } = loadTypeScript('src/services/order.service.ts', {
    './cart.service': { cartService: { get: async () => ({ items: [{ id: 'a', product, quantity: 1 }] }), clear: async () => { throw new Error('offline'); } }, cartTotals: () => ({ subtotal: 100 }) },
  });
  const order = await orderService.create({ name: 'Ali', phone: '+998901234567', address: 'Toshkent' }, 'cash', 0);
  assert.ok(order.warning);
  assert.equal((await orderService.list()).length, 1);
});

test('API client preserves Headers authorization when sending JSON', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    assert.equal(init.headers.get('Authorization'), 'Bearer test');
    assert.equal(init.headers.get('Content-Type'), 'application/json');
    assert.equal(init.body, '{"name":"test"}');
    return Response.json({ ok: true });
  });
  const { apiRequest } = loadTypeScript('src/lib/api.ts', { '@/config/env': { env: { apiUrl: 'https://example.test/api/v1', apiTimeoutMs: 1000 } } });
  assert.deepEqual(await apiRequest('/products', { method: 'POST', body: { name: 'test' }, headers: new Headers({ Authorization: 'Bearer test' }) }), { ok: true });
});

test('product outages are not reported as missing products', async () => {
  class ApiError extends Error { constructor(status) { super('backend failure'); this.status = status; } }
  let status = 503;
  const { productService } = loadTypeScript('src/services/product.service.ts', {
    '@/config/env': { env: { apiUrl: 'https://example.test', useMockData: false } },
    '@/lib/api': { ApiError, apiRequest: async () => { throw new ApiError(status); } },
  });
  await assert.rejects(productService.getById(1), { status: 503 });
  status = 404;
  assert.equal(await productService.getById(1), null);
});
