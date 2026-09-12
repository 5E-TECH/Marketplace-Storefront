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

test('cart mutations reuse the returned CartDto without a redundant cart refetch', async () => {
  const calls = [];
  const cartResponse = { id: 'cart-1', items: [{ id: 'row-1', productId: 1, variantId: 'v', shopId: 3, quantity: 2, product }] };
  const { cartService } = loadTypeScript('src/services/cart.service.ts', {
    '@/lib/api': {
      ApiError: class ApiError extends Error {},
      apiRequest: async (path, options) => { calls.push([path, options?.method]); return cartResponse; },
    },
  });
  const added = await cartService.add({ product, variantId: 'v', quantity: 2 });
  const updated = await cartService.update('row-1', 3);
  const removed = await cartService.remove('row-1');
  assert.deepEqual(calls.map(([path]) => path), ['/cart/items', '/cart/items/row-1', '/cart/items/row-1']);
  assert.equal(calls.some(([path]) => path === '/cart'), false);
  assert.equal(added.items[0].quantity, 2);
  assert.equal(updated.id, 'cart-1');
  assert.equal(removed.id, 'cart-1');
});

test('repeated cart refreshes reuse product metadata instead of sending N+1 requests', async () => {
  let productRequests = 0;
  const { cartService } = loadTypeScript('src/services/cart.service.ts', {
    '@/lib/api': {
      ApiError: class ApiError extends Error {},
      apiRequest: async (path) => {
        if (path === '/cart') return { items: [{ id: 'row-1', productId: 1, variantId: 'v1', shopId: '3', quantity: 1, unitPriceSnapshot: 90 }] };
        productRequests++;
        return { ...product, image: '/product.jpg', description: '', category: 'Test', rating: 0, reviews: 0, variants: [{ id: 'v1', price: 90 }], shop: { id: 3, name: 'Seller' } };
      },
    },
  });
  const cart = await cartService.get();
  await cartService.get();
  assert.equal(cart.items[0].shopId, '3');
  assert.equal(productRequests, 1);
});

test('cart items are grouped by seller and keep each seller subtotal', () => {
  const { groupCartItems } = loadTypeScript('src/lib/cart-groups.ts');
  const items = [
    { id: 'a', productId: 1, shopId: 3, product: { ...product, shop: { id: 99, name: 'A' } }, quantity: 2 },
    { id: 'b', productId: 2, shopId: 4, product: { ...product, id: 2, price: 50, shop: { id: 99, name: 'B' } }, quantity: 1 },
  ];
  assert.deepEqual(groupCartItems(items).map(({ id, name, subtotal }) => ({ id, name, subtotal })), [
    { id: '3', name: 'A', subtotal: 200 },
    { id: '4', name: 'B', subtotal: 50 },
  ]);
});

test('successful login merge keeps the guest identity until merge completes, then refreshes cart state', async (t) => {
  const calls = [];
  const originalWindow = globalThis.window;
  globalThis.window = { dispatchEvent: (event) => calls.push(['event', event.type]) };
  if (typeof globalThis.CustomEvent === 'undefined') globalThis.CustomEvent = class CustomEvent { constructor(type) { this.type = type; } };
  t.after(() => { if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow; });
  const { guestService } = loadTypeScript('src/services/guest.service.ts', {
    '@/lib/api': { apiRequest: async (path, options) => { calls.push(['request', path, options]); return { merged: true }; } },
    '@/lib/access-token': {
      setAccessToken: (token) => calls.push(['token', token]),
      rotateGuestSessionId: () => calls.push(['rotate']),
    },
  });
  await guestService.mergeAfterAuth('access-token');
  assert.deepEqual(calls, [
    ['request', '/guest/merge', { method: 'POST', headers: { Authorization: 'Bearer access-token' } }],
    ['token', 'access-token'],
    ['rotate'],
    ['event', 'elchi:guest-merged'],
  ]);
});

test('failed guest merge does not discard the guest identity or persist the token', async () => {
  const calls = [];
  const { guestService } = loadTypeScript('src/services/guest.service.ts', {
    '@/lib/api': { apiRequest: async () => { calls.push('request'); throw new Error('merge failed'); } },
    '@/lib/access-token': { setAccessToken: () => calls.push('token'), rotateGuestSessionId: () => calls.push('rotate') },
  });
  await assert.rejects(guestService.mergeAfterAuth('access-token'), /merge failed/);
  assert.deepEqual(calls, ['request']);
});

test('real login merges the current guest cart before saving the authenticated session', async (t) => {
  const calls = [];
  const stored = new Map();
  const originalStorage = globalThis.localStorage;
  const originalWindow = globalThis.window;
  globalThis.window = {};
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key) => stored.get(key), setItem: (key, value) => stored.set(key, value), removeItem: (key) => stored.delete(key) } });
  t.after(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: originalStorage });
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
  });
  const { authService } = loadTypeScript('src/services/auth.service.ts', {
    '@/lib/api': { apiRequest: async (path, options) => { calls.push(['login', path, options.body]); return { accessToken: 'token' }; } },
    '@/services/guest.service': { guestService: { mergeAfterAuth: async (token) => calls.push(['merge', token]) } },
  });
  const session = await authService.login('+998901234567', 'password');
  assert.deepEqual(calls, [['login', '/auth/login', { phone: '+998901234567', password: 'password' }], ['merge', 'token']]);
  assert.equal(session.authenticated, true);
  assert.equal(authService.getSession().phone, '+998901234567');
});

test('clearing an order snapshot does not refetch and delete newly added items', async () => {
  const calls = [];
  const { cartService } = loadTypeScript('src/services/cart.service.ts', {
    '@/lib/api': { apiRequest: async (...args) => { calls.push(args); } },
  });
  await cartService.clear({ items: [{ id: 'original' }] });
  assert.deepEqual(calls, [['/cart/items/original', { method: 'DELETE' }]]);
});

test('checkout previews delivery, creates a backend order and confirms COD before saving it locally', async (t) => {
  const stored = new Map();
  const calls = [];
  const originalStorage = globalThis.localStorage;
  const originalWindow = globalThis.window;
  globalThis.window = {};
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key) => stored.get(key), setItem: (key, value) => stored.set(key, value) } });
  t.after(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: originalStorage });
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
  });
  const { orderService } = loadTypeScript('src/services/order.service.ts', {
    '@/lib/api': { apiRequest: async (path, options) => {
      calls.push([path, options]);
      if (path === '/checkout/delivery-preview') return { subtotal: 100, deliveryFee: 20, totalAmount: 120, packages: [{ shopId: '3' }] };
      if (path === '/checkout') return { orderId: 'order-42' };
    } },
    './cart.service': { cartService: { get: async () => ({ items: [{ id: 'a', product, quantity: 1, shopId: '3' }] }), clear: async () => ({ items: [] }) } },
  });
  const address = { recipientName: 'Ali', phone: '+998901234567', address: 'Toshkent shahar', regionId: '10', districtId: '101' };
  const order = await orderService.create(address, 'request-1');
  assert.equal(order.id, 'order-42');
  assert.equal(order.total, 120);
  assert.deepEqual(calls.map(([path]) => path), ['/checkout/delivery-preview', '/checkout', '/checkout/order-42/confirm']);
  assert.equal(calls[1][1].headers['Idempotency-Key'], 'request-1');
  assert.deepEqual(calls[1][1].body, { paymentMethod: 'cod', address });
  assert.equal((await orderService.list()).length, 1);
});

test('an unconfirmed backend order is not reported as successful or removed from cart', async (t) => {
  let cleared = false;
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
    '@/lib/api': { apiRequest: async (path) => { if (path === '/checkout') return { id: 'order-7' }; if (path.includes('/confirm')) throw new Error('confirm failed'); } },
    './cart.service': { cartService: { get: async () => ({ items: [{ id: 'a', product, quantity: 1, shopId: '3' }] }), clear: async () => { cleared = true; } } },
  });
  const address = { recipientName: 'Ali', phone: '+998901234567', address: 'Toshkent shahar', regionId: '10', districtId: '101' };
  await assert.rejects(orderService.create(address, 'request-2', { subtotal: 100, deliveryFee: 0, totalAmount: 100, packages: [] }), /confirm failed/);
  assert.equal(cleared, false);
  assert.equal((await orderService.list()).length, 0);
});

test('buyer and guest tracking use the public order endpoint and normalize Elchi statuses', async () => {
  const calls = [];
  const { orderService, normalizeOrderStatus } = loadTypeScript('src/services/order.service.ts', {
    '@/lib/api': { apiRequest: async (path, options) => {
      calls.push([path, options]);
      return { orderId: 'order/42', orderStatus: 'in-transit', estimatedDeliveryAt: '2026-09-13T10:00:00Z', shipments: [{ shipmentId: 7, shopId: 3, shipmentStatus: 'out_for_delivery', trackingUrl: 'https://elchi.test/7' }] };
    } },
    './cart.service': { cartService: {} },
  });
  const tracking = await orderService.track('order/42');
  assert.deepEqual(calls, [['/orders/order%2F42/tracking', { method: 'GET' }]]);
  assert.equal(tracking.status, 'Yo‘lda');
  assert.equal(tracking.packages[0].status, 'Yo‘lda');
  assert.equal(tracking.packages[0].id, '7');
  assert.equal(normalizeOrderStatus('delivered'), 'Yetkazildi');
  assert.equal(normalizeOrderStatus('cancelled'), 'Bekor qilindi');
});

test('tracking rejects an empty or oversized order id before calling backend', async () => {
  let called = false;
  const { orderService } = loadTypeScript('src/services/order.service.ts', {
    '@/lib/api': { apiRequest: async () => { called = true; } },
    './cart.service': { cartService: {} },
  });
  await assert.rejects(orderService.track('   '), /raqami noto‘g‘ri/);
  await assert.rejects(orderService.track('x'.repeat(129)), /raqami noto‘g‘ri/);
  assert.equal(called, false);
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

test('catalog query keeps shareable filters and only accepts backend sort values', () => {
  const { catalogHref, parseCatalogQuery } = loadTypeScript('src/lib/catalog-query.ts');
  assert.deepEqual(parseCatalogQuery({ search: '  iphone  ', sort: 'price:asc', page: '3', minPrice: '100' }, 'phones'), {
    search: 'iphone', categoryId: 'phones', minPrice: 100, maxPrice: undefined, sort: 'price:asc', page: 3, limit: 20,
  });
  assert.equal(parseCatalogQuery({ sort: 'price:drop table', page: '-4' }).sort, 'createdAt:desc');
  assert.equal(parseCatalogQuery({ sort: 'price:drop table', page: '-4' }).page, 1);
  assert.equal(catalogHref('/katalog/telefonlar', { search: 'iphone 16', sort: 'price:asc', page: 3, limit: 20 }, { page: 2 }), '/katalog/telefonlar?search=iphone+16&sort=price%3Aasc&page=2#products');
});

test('category service uses backend slugs and finds nested categories', async () => {
  const response = [{ id: '1', name: 'Elektronika', slug: 'elektronika', parentId: null, iconUrl: null, sortOrder: 0, isActive: true, children: [
    { id: '7', name: 'Mobil telefonlar', slug: 'mobil-telefonlar', parentId: '1', iconUrl: null, sortOrder: 0, isActive: true, children: [] },
  ] }];
  const { categoryService, findCategoryBySlug } = loadTypeScript('src/services/category.service.ts', {
    '@/config/env': { env: { apiUrl: 'https://example.test/api/v1', useMockData: false } },
    '@/generated/api-validators': { validateCategoryTreeDto: () => true },
    '@/lib/api': { apiRequest: async () => response },
  });
  const categories = await categoryService.list();
  assert.equal(categories.source, 'api');
  assert.equal(findCategoryBySlug(categories.data, 'mobil-telefonlar').id, '7');
});
