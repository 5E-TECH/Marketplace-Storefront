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

test('cart rows are grouped by seller and each seller subtotal is calculated', () => {
  const { groupCartItemsBySeller } = loadTypeScript('src/lib/cart-groups.ts');
  const items = [
    { id: 'a', product: { ...product, shop: { id: 'shop-1', name: 'Elchi Tech' } }, quantity: 2 },
    { id: 'b', product: { ...product, price: 50, shop: { id: 'shop-2', name: 'Moda' } }, quantity: 1 },
    { id: 'c', product: { ...product, price: 25, shop: { id: 'shop-1', name: 'Elchi Tech' } }, quantity: 4 },
  ];
  const groups = groupCartItemsBySeller(items);
  assert.deepEqual(groups.map(({ name, items: rows, subtotal }) => ({ name, ids: rows.map((item) => item.id), subtotal })), [
    { name: 'Elchi Tech', ids: ['a', 'c'], subtotal: 300 },
    { name: 'Moda', ids: ['b'], subtotal: 50 },
  ]);
});

test('successful login merges the existing guest cart before saving the session', async (t) => {
  const stored = new Map();
  const events = [];
  const previousStorage = globalThis.localStorage;
  const previousWindow = globalThis.window;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key) => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value), removeItem: (key) => stored.delete(key) } });
  globalThis.window = { dispatchEvent: (event) => events.push(event.type) };
  t.after(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: previousStorage });
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
  });
  const calls = [];
  const { authService } = loadTypeScript('src/services/auth.service.ts', {
    '@/generated/api-validators': { validateLoginSuccessResponseDto: () => true },
    '@/lib/api': { apiRequest: async (path, options) => { calls.push([path, options.body]); return { accessToken: 'signed-token' }; } },
    '@/lib/access-token': { getAccessToken: () => 'signed-token', clearAccessToken: () => {}, rotateGuestSessionId: () => 'new-guest' },
    '@/services/guest.service': { guestService: { mergeAfterAuth: async (token) => calls.push(['/guest/merge', token]) } },
  });
  const session = await authService.login('+998901234567', 'password');
  assert.deepEqual(calls, [['/auth/login', { phone: '+998901234567', password: 'password' }], ['/guest/merge', 'signed-token']]);
  assert.equal(JSON.parse(stored.get('elchi_auth_v1')).phone, session.phone);
  assert.deepEqual(events, ['elchi:auth-changed']);
});

test('failed guest merge clears the new token and preserves the guest session for retry', async () => {
  const calls = [];
  const previousWindow = globalThis.window;
  globalThis.window = { dispatchEvent: () => {} };
  try {
    const { guestService } = loadTypeScript('src/services/guest.service.ts', {
      '@/lib/api': { apiRequest: async () => { throw new Error('offline'); } },
      '@/lib/access-token': {
        setAccessToken: (token) => calls.push(['set', token]),
        clearAccessToken: () => calls.push(['clear']),
        rotateGuestSessionId: () => calls.push(['rotate']),
      },
    });
    await assert.rejects(guestService.mergeAfterAuth('signed-token'), /offline/);
    assert.deepEqual(calls, [['set', 'signed-token'], ['clear']]);
  } finally { if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow; }
});

test('successful guest merge rotates the consumed session and refreshes storefront state', async () => {
  const calls = [];
  const previousWindow = globalThis.window;
  globalThis.window = { dispatchEvent: (event) => calls.push(['event', event.type]) };
  try {
    const { guestService } = loadTypeScript('src/services/guest.service.ts', {
      '@/lib/api': { apiRequest: async (path, options) => calls.push(['request', path, options.headers.Authorization]) },
      '@/lib/access-token': {
        setAccessToken: (token) => calls.push(['set', token]),
        clearAccessToken: () => calls.push(['clear']),
        rotateGuestSessionId: () => calls.push(['rotate']),
      },
    });
    await guestService.mergeAfterAuth('signed-token');
    assert.deepEqual(calls, [
      ['set', 'signed-token'],
      ['request', '/guest/merge', 'Bearer signed-token'],
      ['rotate'],
      ['event', 'elchi:guest-merged'],
    ]);
  } finally { if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow; }
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

test('product links use the backend slug and fall back to an SEO-safe name', () => {
  const { productPath, productSlug } = loadTypeScript('src/lib/product-url.ts');
  assert.equal(productPath({ name: 'Ignored name', slug: 'iphone-16-pro' }), '/mahsulot/iphone-16-pro');
  assert.equal(productSlug({ name: 'AirBeat Pro simsiz quloqchin' }), 'airbeat-pro-simsiz-quloqchin');
});
