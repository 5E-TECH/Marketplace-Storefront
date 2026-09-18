import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { loadTypeScript } from './load-typescript.mjs';

const schemas = JSON.parse(fs.readFileSync(new URL('../contract/openapi.json', import.meta.url))).components.schemas;
function fixture(schema) {
  if (schema.$ref) return fixture(schemas[schema.$ref.split('/').at(-1)]);
  if (schema.nullable) return null;
  if (Object.hasOwn(schema, 'example')) return schema.example;
  if (schema.allOf) return Object.assign({}, ...schema.allOf.map(fixture));
  if (schema.enum) return schema.enum[0];
  if (schema.type === 'array') return [];
  if (schema.type === 'object') return Object.fromEntries(Object.entries(schema.properties ?? {}).map(([name, value]) => [name, fixture(value)]));
  return schema.type === 'number' ? 1 : schema.type === 'boolean' ? false : 'test';
}
const product = fixture(schemas.StorefrontProductDto);
const page = { items: [product], total: 1, page: 1, limit: 5, totalPages: 1 };
const config = { env: { apiUrl: 'https://example.test/api/v1', apiTimeoutMs: 1000 } };
const client = () => loadTypeScript('src/lib/api.ts', { '@/config/env': config });
const { validateStorefrontProductsPageDto } = loadTypeScript('src/generated/api-validators.js');

test('SSR uses env base, encodes query, unwraps the envelope and validates generated types', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://example.test/api/v1/storefront/products?search=a%26b&page=1');
    assert.equal(options.cache, 'no-store');
    return Response.json({ statusCode: 200, data: page });
  });
  const { apiRequest } = client();
  assert.deepEqual(await apiRequest('/storefront/products', { params: { search: 'a&b', page: 1 }, validate: validateStorefrontProductsPageDto }), page);
});

test('browser uses same-origin proxy and session headers without exposing backend URL', async (t) => {
  const previousWindow = globalThis.window;
  globalThis.window = {};
  t.after(() => { if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow; });
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/backend/storefront/products?limit=5');
    assert.equal(options.headers.get('X-Session-Id'), 'guest-test');
    assert.equal(options.headers.get('Authorization'), 'Bearer override');
    return Response.json(page);
  });
  const { apiRequest } = loadTypeScript('src/lib/api.ts', {
    '@/config/env': config,
    '@/lib/access-token': { sessionHeaders: () => ({ 'X-Session-Id': 'guest-test' }), getAccessToken: () => null },
  });
  assert.deepEqual(await apiRequest('/storefront/products', { params: { limit: 5 }, headers: new Headers({ Authorization: 'Bearer override' }), validate: validateStorefrontProductsPageDto }), page);
});

test('checkout proxy forwards guest session and idempotency headers upstream', async () => {
  let forwarded;
  const { proxyBackend } = loadTypeScript('src/lib/backend-proxy.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/api': {
      ApiError: class ApiError extends Error {},
      apiResponse: async (path, options) => { forwarded = { path, options }; return Response.json({ id: 'order-1' }, { status: 201 }); },
    },
  });
  const request = {
    method: 'POST',
    headers: new Headers({ 'X-Session-Id': 'guest-1', 'Idempotency-Key': 'request-1', 'Content-Type': 'application/json' }),
    text: async () => '{"paymentMethod":"cod"}',
    nextUrl: { searchParams: new URLSearchParams() },
  };
  const response = await proxyBackend(request, '/checkout');
  assert.equal(response.status, 201);
  assert.equal(forwarded.options.headers.get('x-session-id'), 'guest-1');
  assert.equal(forwarded.options.headers.get('idempotency-key'), 'request-1');
});

test('generic proxy explicitly allows checkout preview, create and confirm routes', async () => {
  const paths = [];
  const route = loadTypeScript('src/app/api/backend/[...path]/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/backend-proxy': { proxyBackend: async (_request, path) => { paths.push(path); return new Response(null, { status: 201 }); } },
  });
  const request = { method: 'POST' };
  await route.POST(request, { params: Promise.resolve({ path: ['checkout', 'delivery-preview'] }) });
  await route.POST(request, { params: Promise.resolve({ path: ['checkout'] }) });
  await route.POST(request, { params: Promise.resolve({ path: ['checkout', 'order-1', 'confirm'] }) });
  const getRequest = { method: 'GET' };
  await route.GET(getRequest, { params: Promise.resolve({ path: ['regions'] }) });
  await route.GET(getRequest, { params: Promise.resolve({ path: ['regions', '1', 'districts'] }) });
  await route.GET(getRequest, { params: Promise.resolve({ path: ['storefront', 'shops', 'featured'] }) });
  assert.deepEqual(paths, ['/checkout/delivery-preview', '/checkout', '/checkout/order-1/confirm', '/regions', '/regions/1/districts', '/storefront/shops/featured']);
});

test('generic proxy allows the tracking route once backend implements its contract', async () => {
  const paths = [];
  const route = loadTypeScript('src/app/api/backend/[...path]/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/backend-proxy': { proxyBackend: async (_request, path) => { paths.push(path); return Response.json({ status: 'CONFIRMED' }); } },
  });
  const response = await route.GET({ method: 'GET' }, { params: Promise.resolve({ path: ['orders', 'order-1', 'tracking'] }) });
  assert.equal(response.status, 200);
  assert.deepEqual(paths, ['/orders/order-1/tracking']);
});

test('generic proxy allows public review reads and authenticated review writes', async () => {
  const calls = [];
  const route = loadTypeScript('src/app/api/backend/[...path]/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/backend-proxy': { proxyBackend: async (request, path) => { calls.push([request.method, path]); return new Response(null, { status: 200 }); } },
  });
  const context = { params: Promise.resolve({ path: ['storefront', 'products', '6', 'reviews'] }) };
  await route.GET({ method: 'GET' }, context);
  await route.POST({ method: 'POST' }, context);
  assert.deepEqual(calls, [['GET', '/storefront/products/6/reviews'], ['POST', '/storefront/products/6/reviews']]);
});

test('offline, 404, 500 and proxy timeout produce explicit API error kinds', async (t) => {
  const { apiRequest } = client();
  const mockedFetch = t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('offline'); });
  await assert.rejects(apiRequest('/storefront/products'), { kind: 'network', status: 0 });
  mockedFetch.mock.mockImplementation(async () => new Response('not found', { status: 404 }));
  await assert.rejects(apiRequest('/storefront/products'), { kind: 'not_found', status: 404 });
  mockedFetch.mock.mockImplementation(async () => Response.json({ message: ['a', 'b'] }, { status: 500 }));
  await assert.rejects(apiRequest('/storefront/products'), { kind: 'http', status: 500, message: 'a, b' });
  mockedFetch.mock.mockImplementation(async () => Response.json({ message: 'timeout' }, { status: 504 }));
  await assert.rejects(apiRequest('/storefront/products'), { kind: 'timeout', status: 504 });
});

test('deadline includes response body and differs from user cancellation', async (t) => {
  const { apiRequest } = client();
  t.mock.method(globalThis, 'fetch', async (_url, { signal }) => ({
    status: 200,
    arrayBuffer: () => new Promise((resolve, reject) => {
      if (signal.aborted) reject(signal.reason);
      else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    }),
  }));
  await assert.rejects(apiRequest('/storefront/products', { timeoutMs: 10 }), { kind: 'timeout' });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(apiRequest('/storefront/products', { signal: controller.signal }), { kind: 'aborted' });
});

test('bad JSON, HTML success and incompatible product fields cannot silently succeed', async (t) => {
  const { apiRequest } = client();
  const mockedFetch = t.mock.method(globalThis, 'fetch', async () => new Response('{', { headers: { 'Content-Type': 'application/json' } }));
  await assert.rejects(apiRequest('/storefront/products'), { kind: 'invalid_response' });
  mockedFetch.mock.mockImplementation(async () => new Response('<html/>'));
  await assert.rejects(apiRequest('/storefront/products'), { kind: 'invalid_response' });
  mockedFetch.mock.mockImplementation(async () => Response.json({ ...page, items: [{ ...product, price: 'wrong' }] }));
  await assert.rejects(apiRequest('/storefront/products', { validate: validateStorefrontProductsPageDto }), { kind: 'invalid_response' });
  mockedFetch.mock.mockImplementation(async () => Response.json({ ...page, items: [{ id: 'only-id' }] }));
  await assert.rejects(apiRequest('/storefront/products', { validate: validateStorefrontProductsPageDto }), { kind: 'invalid_response' });
});

test('204 is accepted for mutations but rejected when a catalog is required', async (t) => {
  const { apiRequest } = client();
  t.mock.method(globalThis, 'fetch', async () => new Response(null, { status: 204 }));
  assert.equal(await apiRequest('/cart/items/1', { method: 'DELETE' }), undefined);
  await assert.rejects(apiRequest('/storefront/products', { validate: validateStorefrontProductsPageDto }), { kind: 'invalid_response' });
});

test('invalid configuration and upstream path escapes never send a request', async (t) => {
  const mockedFetch = t.mock.method(globalThis, 'fetch', async () => { throw new Error('must not fetch'); });
  const { apiRequest } = client();
  for (const path of ['https://evil.test', '//evil.test', '/%2e%2e/private', '/invalid%']) {
    await assert.rejects(apiRequest(path), { kind: 'configuration' });
  }
  const invalidClient = loadTypeScript('src/lib/api.ts', { '@/config/env': { env: { apiUrl: '', apiTimeoutMs: 1000 } } });
  await assert.rejects(invalidClient.apiRequest('/storefront/products'), { kind: 'configuration' });
  assert.equal(mockedFetch.mock.callCount(), 0);
});

test('contract cart rows keep price snapshots and resolve each product only once', async () => {
  const calls = [];
  const cartResponse = { ...fixture(schemas.CartDto), items: [
    { ...fixture(schemas.CartItemDto), id: '1', productId: product.id, unitPriceSnapshot: 125, quantity: 2 },
    { ...fixture(schemas.CartItemDto), id: '2', productId: product.id, unitPriceSnapshot: 150, quantity: 1 },
  ] };
  const { cartService, cartTotals } = loadTypeScript('src/services/cart.service.ts', { '@/lib/api': {
    apiRequest: async (path, options) => { calls.push(path); const data = path === '/cart' ? cartResponse : product; assert.ok(options.validate(data)); return data; },
    ApiError: class extends Error {},
  } });
  const cart = await cartService.get();
  assert.equal(cart.items.length, 2);
  assert.equal(cart.items[0].shopId, cartResponse.items[0].shopId);
  assert.deepEqual(cartTotals(cart.items), { quantity: 3, subtotal: 400 });
  assert.deepEqual(calls, ['/cart', `/storefront/products/${product.id}`]);
});
