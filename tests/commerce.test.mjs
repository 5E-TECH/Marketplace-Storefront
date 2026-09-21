import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTypeScript } from './load-typescript.mjs';

const product = { id: 1, name: 'Telefon', price: 100, colors: ['black'], images: [] };

test('featured shops are normalized and API failure stays isolated', async () => {
  const calls = [];
  const baseMocks = { '@/config/env': { env: { apiUrl: 'https://api.test/api/v1' } }, '@/generated/api-validators': {} };
  const service = loadTypeScript('src/services/product.service.ts', {
    ...baseMocks,
    '@/lib/api': { ApiError: class ApiError extends Error {}, apiRequest: async (path, options) => { calls.push([path, options]); return { items: [{ id: 7, name: 'Baraka', slug: 'baraka-market', logoUrl: '/media/baraka.png', description: 'Saralangan mahsulotlar', rating: '4.8', productsCount: 23 }] }; } },
  }).productService;
  assert.deepEqual(await service.featuredShops(), [{ id: 7, name: 'Baraka', slug: 'baraka-market', logoUrl: 'https://api.test/media/baraka.png', description: 'Saralangan mahsulotlar', bannerUrl: undefined, address: undefined, rating: 4.8, productCount: 23 }]);
  assert.equal(calls[0][0], '/storefront/shops/featured');
  assert.deepEqual(calls[0][1], { next: { revalidate: 30 } });

  const unavailable = loadTypeScript('src/services/product.service.ts', {
    ...baseMocks,
    '@/lib/api': { ApiError: class ApiError extends Error {}, apiRequest: async () => { throw new Error('502'); } },
  }).productService;
  assert.deepEqual(await unavailable.featuredShops(), []);
});

test('featured shops block is conditional and links cards to the shop slug', () => {
  const source = fs.readFileSync(new URL('../src/components/home-sections.tsx', import.meta.url), 'utf8');
  assert.match(source, /if \(!shops\.length\) return null/);
  assert.match(source, /Tavsiya etilgan do‘konlar/);
  assert.match(source, /\/dokon\/\$\{encodeURIComponent\(shop\.slug\)\}/);
  assert.match(source, /shop\.productCount/);
});

test('catalog pagination exposes direct page links without client-side load more', () => {
  const { paginationItems } = loadTypeScript('src/lib/pagination.ts');
  assert.deepEqual(paginationItems(5, 1), [1, 2, 3, 4, 5]);
  assert.deepEqual(paginationItems(20, 10), [1, 'ellipsis', 10, 'ellipsis', 20]);
  assert.deepEqual(paginationItems(20, 20), [1, 'ellipsis', 18, 19, 20]);
});

test('reviews normalize the live backend page contract', () => {
  const { normalizeReviews } = loadTypeScript('src/services/review.service.ts', {
    '@/generated/api-validators': {}, '@/lib/api': {}, '@/lib/access-token': {},
  });
  const result = normalizeReviews({ items: [{ id: '9', rating: 5, comment: 'Zo‘r', createdAt: '2026-09-15T10:00:00Z', user: { name: 'Ali' } }], rating: 4.8, total: 1, page: 1, limit: 5, totalPages: 1 });
  assert.deepEqual(result.items[0], { id: '9', rating: 5, comment: 'Zo‘r', createdAt: '2026-09-15T10:00:00Z', authorName: 'Ali' });
  assert.equal(result.rating, 4.8);
});

test('review creation sends only the backend CreateReviewDto fields', async () => {
  const calls = [];
  const { reviewService } = loadTypeScript('src/services/review.service.ts', {
    '@/generated/api-validators': {},
    '@/lib/api': { apiRequest: async (...args) => calls.push(args) },
    '@/lib/access-token': { authHeaders: () => ({ Authorization: 'Bearer buyer' }), getAccessToken: () => 'buyer' },
  });
  await reviewService.create('6', { orderItemId: ' 31 ', rating: 5, comment: ' Yaxshi ' });
  assert.deepEqual(calls, [['/storefront/products/6/reviews', { method: 'POST', headers: { Authorization: 'Bearer buyer' }, body: { orderItemId: '31', rating: 5, comment: 'Yaxshi' } }]]);
});

test('review form eligibility includes only delivered matching order items', async () => {
  const response = { items: [
    { orderId: 'done', orderStatus: 'DELIVERED', createdAt: '2026-09-15T10:00:00Z', subtotal: 1, deliveryFee: 0, totalAmount: 1, items: [{ id: '31', productId: '6', name: 'A', quantity: 1, unitPrice: 1 }, { id: '32', productId: '7', name: 'B', quantity: 1, unitPrice: 1 }] },
    { orderId: 'new', orderStatus: 'CONFIRMED', createdAt: '2026-09-15T10:00:00Z', subtotal: 1, deliveryFee: 0, totalAmount: 1, items: [{ id: '33', productId: '6', name: 'A', quantity: 1, unitPrice: 1 }] },
  ], total: 2, page: 1, limit: 100, totalPages: 1 };
  const { reviewService } = loadTypeScript('src/services/review.service.ts', {
    '@/generated/api-validators': { validateBuyerOrdersPageDto: () => true },
    '@/lib/api': { apiRequest: async () => response },
    '@/lib/access-token': { authHeaders: () => ({ Authorization: 'Bearer buyer' }), getAccessToken: () => 'buyer' },
  });
  assert.deepEqual(await reviewService.reviewableItems('6'), [{ orderItemId: '31', orderId: 'done' }]);
});

test('guest and non-purchaser cannot obtain a reviewable order item', async () => {
  let requests = 0;
  const guest = loadTypeScript('src/services/review.service.ts', {
    '@/config/env': { env: {} },
    '@/generated/api-validators': { validateBuyerOrdersPageDto: () => true },
    '@/lib/api': { apiRequest: async () => { requests++; } },
    '@/lib/access-token': { authHeaders: () => ({}), getAccessToken: () => null },
  }).reviewService;
  assert.deepEqual(await guest.reviewableItems('6'), []);
  assert.equal(requests, 0);

  const buyer = loadTypeScript('src/services/review.service.ts', {
    '@/config/env': { env: {} },
    '@/generated/api-validators': { validateBuyerOrdersPageDto: () => true },
    '@/lib/api': { apiRequest: async () => ({ items: [{ orderId: 'new', orderStatus: 'CONFIRMED', createdAt: '2026-09-15T10:00:00Z', subtotal: 1, deliveryFee: 0, totalAmount: 1, items: [{ id: '33', productId: '6', name: 'A', quantity: 1, unitPrice: 1 }] }], total: 1, page: 1, limit: 100, totalPages: 1 }) },
    '@/lib/access-token': { authHeaders: () => ({ Authorization: 'Bearer buyer' }), getAccessToken: () => 'buyer' },
  }).reviewService;
  assert.deepEqual(await buyer.reviewableItems('6'), []);
});

test('invalid review rating never reaches the backend', async () => {
  let requests = 0;
  const { reviewService } = loadTypeScript('src/services/review.service.ts', {
    '@/config/env': { env: {} },
    '@/generated/api-validators': {},
    '@/lib/api': { apiRequest: async () => { requests++; } },
    '@/lib/access-token': { authHeaders: () => ({ Authorization: 'Bearer buyer' }), getAccessToken: () => 'buyer' },
  });
  for (const rating of [0, 6, 1.5, NaN]) await assert.rejects(reviewService.create('6', { orderItemId: '31', rating }));
  assert.equal(requests, 0);
});

test('product image URLs only allow local assets and the configured marketplace media host', () => {
  const { getSafeImageSrc } = loadTypeScript('src/lib/product-storage.ts');
  assert.equal(getSafeImageSrc('/placeholder-product.svg'), '/placeholder-product.svg');
  assert.equal(getSafeImageSrc('https://api.elchimarket.uz/media/products/phone.jpg'), 'https://api.elchimarket.uz/media/products/phone.jpg');
  assert.equal(getSafeImageSrc('https://untrusted.example/track.jpg'), '/placeholder-product.svg');
  assert.equal(getSafeImageSrc('javascript:alert(1)'), '/placeholder-product.svg');
});

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

test('favorites unwrap FavoriteDto.product and request every page', async () => {
  const calls = [];
  const favorite = (id) => ({ id: `favorite-${id}`, userId: null, sessionId: 'guest', productId: String(id), product: { ...product, id, name: `Product ${id}`, image: '/product.jpg', description: '', category: 'Test', rating: 0, reviews: 0 }, createdAt: '2026-09-15T10:00:00Z' });
  const { favoritesService } = loadTypeScript('src/services/favorites.service.ts', {
    '@/lib/api': { apiRequest: async (path, options) => { calls.push([path, options.params]); return options.params.page === 1 ? { items: [favorite(1)], total: 2, page: 1, limit: 100, totalPages: 2 } : { items: [favorite(2)], total: 2, page: 2, limit: 100, totalPages: 2 }; } },
  });
  const favorites = await favoritesService.list();
  assert.deepEqual(favorites.map((item) => item.name), ['Product 1', 'Product 2']);
  assert.deepEqual(calls, [['/favorites', { page: 1, limit: 100 }], ['/favorites', { page: 2, limit: 100 }]]);
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

test('buyer registration uses the backend contract and merges the guest cart before saving the session', async (t) => {
  const calls = [];
  const stored = new Map();
  const originalStorage = globalThis.localStorage;
  const originalWindow = globalThis.window;
  globalThis.window = { dispatchEvent: () => {} };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key) => stored.get(key), setItem: (key, value) => stored.set(key, value), removeItem: (key) => stored.delete(key) } });
  t.after(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: originalStorage });
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
  });
  const { authService } = loadTypeScript('src/services/auth.service.ts', {
    '@/lib/api': { apiRequest: async (path, options) => { calls.push([path, options]); return { accessToken: 'buyer-token', user: { id: '7', name: 'Ali', phone: '+998901234567' } }; } },
    '@/lib/access-token': { getAccessToken: () => null },
    '@/services/guest.service': { guestService: { mergeAfterAuth: async (token) => calls.push(['merge', token]) } },
  });
  const session = await authService.register({ name: ' Ali ', phone: '+998901234567', password: 'Secret123' });
  assert.deepEqual(calls, [
    ['/auth/register', { method: 'POST', body: { name: 'Ali', phone: '+998901234567', password: 'Secret123', role: 'BUYER' } }],
    ['merge', 'buyer-token'],
  ]);
  assert.deepEqual({ userId: session.userId, name: session.name, phone: session.phone }, { userId: '7', name: 'Ali', phone: '+998901234567' });
});

test('password recovery and profile updates match backend request bodies', async (t) => {
  const calls = [];
  const stored = new Map([['elchi_auth_v1', JSON.stringify({ phone: '+998901234567', verifiedAt: 'now', authenticated: true })]]);
  const originalStorage = globalThis.localStorage;
  const originalWindow = globalThis.window;
  globalThis.window = { dispatchEvent: () => {} };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key) => stored.get(key), setItem: (key, value) => stored.set(key, value), removeItem: (key) => stored.delete(key) } });
  t.after(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: originalStorage });
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
  });
  const { authService } = loadTypeScript('src/services/auth.service.ts', {
    '@/lib/api': { apiRequest: async (path, options) => { calls.push([path, options.body]); return path === '/auth/profile' ? { id: '7', name: 'Vali', phone: '+998909876543' } : undefined; } },
    '@/lib/access-token': { authHeaders: () => ({ Authorization: 'Bearer token' }), getAccessToken: () => 'token' },
    '@/services/guest.service': { guestService: {} },
  });
  await authService.forgotPassword('+998901234567');
  await authService.resetPassword('+998901234567', '123456', 'NewSecret123');
  const session = await authService.updateProfile({ name: 'Vali', phone: '+998909876543' });
  assert.deepEqual(calls, [
    ['/auth/forgot-password', { phone: '+998901234567' }],
    ['/auth/reset-password', { phone: '+998901234567', code: '123456', newPassword: 'NewSecret123' }],
    ['/auth/profile', { name: 'Vali', phone: '+998909876543' }],
  ]);
  assert.equal(session.name, 'Vali');
});

test('clearing an order snapshot does not refetch and delete newly added items', async () => {
  const calls = [];
  const { cartService } = loadTypeScript('src/services/cart.service.ts', {
    '@/lib/api': { apiRequest: async (...args) => { calls.push(args); } },
  });
  await cartService.clear({ items: [{ id: 'original' }] });
  assert.deepEqual(calls, [['/cart/items/original', { method: 'DELETE' }]]);
});

test('checkout hududlari backend region va district endpointlaridan olinadi', async () => {
  const calls = [];
  const { locationService } = loadTypeScript('src/services/location.service.ts', {
    '@/lib/api': { apiRequest: async (...args) => { calls.push(args); return []; } },
  });
  await locationService.regions();
  await locationService.districts('region/1');
  assert.deepEqual(calls.map(([path]) => path), ['/regions', '/regions/region%2F1/districts']);
});

test('guest checkout without an account previews delivery, creates an order and confirms COD', async (t) => {
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
  const address = { recipientName: 'Ali', phone: '+998901234567', address: 'Toshkent shahri, Chilonzor tumani, Bunyodkor ko‘chasi 1' };
  const order = await orderService.create(address, 'request-1');
  assert.equal(order.id, 'order-42');
  assert.equal(order.total, 120);
  assert.deepEqual(calls.map(([path]) => path), ['/checkout/delivery-preview', '/checkout', '/checkout/order-42/confirm']);
  assert.equal(calls[1][1].headers['Idempotency-Key'], 'request-1');
  assert.deepEqual(calls[1][1].body, { paymentMethod: 'cod', address });
  assert.equal((await orderService.list()).length, 1);
});

test('online checkout stays pending, skips COD confirmation and requests a provider redirect', async (t) => {
  const stored = new Map();
  const calls = [];
  const originalStorage = globalThis.localStorage;
  const originalWindow = globalThis.window;
  globalThis.window = { location: { origin: 'https://shop.test' } };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key) => stored.get(key), setItem: (key, value) => stored.set(key, value) } });
  t.after(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: originalStorage });
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
  });
  const { orderService } = loadTypeScript('src/services/order.service.ts', {
    '@/lib/api': { apiRequest: async (path, options) => {
      calls.push([path, options]);
      if (path === '/checkout') return { orderId: 'online-1' };
      if (path === '/payments') return { redirectUrl: 'https://checkout.payme.uz/order-1' };
      if (path.includes('/tracking')) return { orderId: 'online-1', payment: { provider: 'PAYME', status: 'PAID' } };
    } },
    '@/lib/access-token': { authHeaders: () => ({}), getAccessToken: () => null },
    './cart.service': { cartService: { get: async () => ({ items: [{ id: 'a', product, quantity: 1, shopId: '3' }] }), clear: async () => ({ items: [] }) } },
  });
  const address = { recipientName: 'Ali', phone: '+998901234567', address: 'Toshkent shahri, Chilonzor tumani', regionId: '10', districtId: '101' };
  const order = await orderService.create(address, 'online-request', { subtotal: 100, deliveryFee: 20, totalAmount: 120, packages: [] }, 'payme');
  assert.equal(order.paymentStatus, 'PENDING');
  assert.equal(order.paymentProvider, 'PAYME');
  assert.deepEqual(calls.map(([path]) => path), ['/checkout']);
  assert.deepEqual(calls[0][1].body, { paymentMethod: 'online', address });
  assert.equal(await orderService.startPayment(order), 'https://checkout.payme.uz/order-1');
  assert.equal(calls[1][1].body.returnUrl, 'https://shop.test/checkout/payment/return?orderId=online-1');
  assert.deepEqual(await orderService.paymentStatus('online-1'), { status: 'PAID', provider: 'PAYME', reason: undefined });
  assert.equal(JSON.parse(stored.get('elchi_orders_v1'))[0].paymentStatus, 'PAID');
});

test('TC1 paid result renders success, order number and order link', () => {
  const Icon = (props) => React.createElement('i', props);
  const { PaymentResultView } = loadTypeScript('src/components/payment-return-content.tsx', {
    'next/link': { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) },
    'lucide-react': { CheckCircle2: Icon, CircleX: Icon, Clock3: Icon, RefreshCw: Icon, TriangleAlert: Icon },
    '@/services/order.service': { orderService: {} },
  });
  const html = renderToStaticMarkup(React.createElement(PaymentResultView, { orderId: 'order/42', status: 'PAID', order: null, onCheck() {}, onRetry() {} }));
  assert.match(html, /To‘lov muvaffaqiyatli/);
  assert.match(html, /BUYURTMA #order\/42/);
  assert.match(html, /href="\/orders\/order%2F42"[^>]*>Buyurtmaga qaytish<\/a>/);
});

test('TC2 cancelled result renders failure reason and retry action', () => {
  const Icon = (props) => React.createElement('i', props);
  const { PaymentResultView } = loadTypeScript('src/components/payment-return-content.tsx', {
    'next/link': { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) },
    'lucide-react': { CheckCircle2: Icon, CircleX: Icon, Clock3: Icon, RefreshCw: Icon, TriangleAlert: Icon },
    '@/services/order.service': { orderService: {} },
  });
  const order = { id: 'order-7', payment: 'card', paymentProvider: 'CLICK', paymentStatus: 'CANCELLED' };
  const html = renderToStaticMarkup(React.createElement(PaymentResultView, { orderId: order.id, status: 'CANCELLED', order, reason: 'Foydalanuvchi to‘lovni bekor qildi', onCheck() {}, onRetry() {} }));
  assert.match(html, /To‘lov bekor qilindi/);
  assert.match(html, /Foydalanuvchi to‘lovni bekor qildi/);
  assert.match(html, /<button[^>]*>Qayta to‘lash<\/button>/);
  assert.match(html, /href="\/orders\/order-7"[^>]*>Buyurtmaga qaytish<\/a>/);
});

test('guest request headers contain a session id without authorization', async (t) => {
  const stored = new Map();
  const originalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;
  const originalWindow = globalThis.window;
  globalThis.window = {};
  const storage = { getItem: (key) => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value), removeItem: (key) => stored.delete(key) };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: storage });
  t.after(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: originalStorage });
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: originalSessionStorage });
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
  });
  const { sessionHeaders } = loadTypeScript('src/lib/access-token.ts');
  const headers = sessionHeaders();
  assert.equal('Authorization' in headers, false);
  assert.match(headers['X-Session-Id'], /^[a-zA-Z0-9_-]+$/);
});

test('logout calls backend then clears tokens, profile session and rotates guest identity', async (t) => {
  const calls = [];
  const stored = new Map([['access_token', 'buyer-token'], ['elchi_auth_v1', '{"authenticated":true}'], ['guest_session_id', 'guest-before']]);
  const originalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;
  const originalWindow = globalThis.window;
  globalThis.window = { dispatchEvent: (event) => calls.push(['event', event.type]) };
  const storage = { getItem: (key) => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value), removeItem: (key) => stored.delete(key) };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: storage });
  t.after(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: originalStorage });
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: originalSessionStorage });
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
  });
  const access = loadTypeScript('src/lib/access-token.ts');
  const { authService } = loadTypeScript('src/services/auth.service.ts', {
    '@/lib/api': { apiRequest: async (path, options) => calls.push(['request', path, options]) },
    '@/lib/access-token': access,
    '@/services/guest.service': { guestService: {} },
  });
  await authService.logout();
  assert.equal(stored.has('access_token'), false);
  assert.equal(stored.has('elchi_auth_v1'), false);
  assert.notEqual(stored.get('guest_session_id'), 'guest-before');
  assert.deepEqual(calls[0], ['request', '/auth/logout', { method: 'POST', headers: { Authorization: 'Bearer buyer-token' } }]);
  assert.deepEqual(calls.slice(1), [['event', 'elchi:auth-changed'], ['event', 'elchi:guest-merged']]);
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

test('tracking adapter normalizes a mocked response and refreshes the saved order status', async (t) => {
  const calls = [];
  const stored = new Map([['elchi_orders_v1', JSON.stringify([{ id: 'order/42', status: 'Qabul qilindi' }])]]);
  const originalStorage = globalThis.localStorage;
  const originalWindow = globalThis.window;
  globalThis.window = {};
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key) => stored.get(key), setItem: (key, value) => stored.set(key, value) } });
  t.after(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: originalStorage });
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
  });
  const { orderService, normalizeOrderStatus } = loadTypeScript('src/services/order.service.ts', {
    '@/lib/api': { apiRequest: async (path, options) => {
      calls.push([path, options]);
      return { orderId: 'order/42', orderStatus: 'in-transit', estimatedDeliveryAt: '2026-09-13T10:00:00Z', shipments: [{ shipmentId: 7, shopId: 3, shipmentStatus: 'out_for_delivery', trackingUrl: 'https://elchi.test/7' }] };
    } },
    '@/lib/access-token': { authHeaders: () => ({ Authorization: 'Bearer buyer-token' }), getAccessToken: () => 'buyer-token' },
    './cart.service': { cartService: {} },
  });
  const tracking = await orderService.track('order/42');
  assert.deepEqual(calls, [['/orders/order%2F42/tracking', { method: 'GET', headers: { Authorization: 'Bearer buyer-token' } }]]);
  assert.equal(tracking.status, 'Yo‘lda');
  assert.equal(tracking.packages[0].status, 'Yo‘lda');
  assert.equal(tracking.packages[0].id, '7');
  assert.equal(JSON.parse(stored.get('elchi_orders_v1'))[0].status, 'Yo‘lda');
  assert.equal(normalizeOrderStatus('delivered'), 'Yetkazildi');
  assert.equal(normalizeOrderStatus('cancelled'), 'Bekor qilindi');
});

test('authenticated buyer order history comes from backend and keeps unsynced local orders', async (t) => {
  const stored = new Map([['elchi_orders_v1', JSON.stringify([{ id: 'local-2', createdAt: '2026-09-14T10:00:00Z', status: 'Qabul qilindi', customer: {}, items: [], subtotal: 20, delivery: 0, total: 20, payment: 'cash' }])]]);
  const originalStorage = globalThis.localStorage;
  const originalWindow = globalThis.window;
  globalThis.window = {};
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key) => stored.get(key), setItem: (key, value) => stored.set(key, value) } });
  t.after(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: originalStorage });
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
  });
  const calls = [];
  const { orderService } = loadTypeScript('src/services/order.service.ts', {
    '@/lib/api': { apiRequest: async (path, options) => { calls.push([path, options]); return { items: [{ orderId: 'remote-1', createdAt: '2026-09-15T10:00:00Z', orderStatus: 'DELIVERED', subtotal: 100, deliveryFee: 10, totalAmount: 110, items: [{ productId: '7', name: 'Telefon', quantity: 2, unitPrice: 50 }] }], total: 1, page: 1, limit: 20, totalPages: 1 }; } },
    '@/lib/access-token': { getAccessToken: () => 'buyer-token', authHeaders: () => ({ Authorization: 'Bearer buyer-token' }) },
    './cart.service': { cartService: {} },
  });
  const result = await orderService.listForCurrentBuyer();
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], '/orders');
  assert.deepEqual({ method: calls[0][1].method, headers: calls[0][1].headers, params: calls[0][1].params }, { method: 'GET', headers: { Authorization: 'Bearer buyer-token' }, params: { page: 1, limit: 20 } });
  assert.equal(typeof calls[0][1].validate, 'function');
  assert.deepEqual(result.orders.map((order) => order.id), ['remote-1', 'local-2']);
  assert.equal(result.orders[0].status, 'Yetkazildi');
  assert.equal(result.orders[0].items[0].product.name, 'Telefon');
  assert.equal(result.error, undefined);
});

test('guest order history remains local and does not call buyer endpoint', async () => {
  let requests = 0;
  const { orderService } = loadTypeScript('src/services/order.service.ts', {
    '@/lib/api': { apiRequest: async () => { requests++; } },
    '@/lib/access-token': { getAccessToken: () => null, authHeaders: () => ({}) },
    './cart.service': { cartService: {} },
  });
  assert.deepEqual(await orderService.listForCurrentBuyer(), { orders: [] });
  assert.equal(requests, 0);
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

test('tracking rejects a response that does not match the buyer tracking contract', async () => {
  const { orderService } = loadTypeScript('src/services/order.service.ts', {
    '@/lib/api': { apiRequest: async () => ({ orderId: '42', orderStatus: 'CONFIRMED' }) },
    './cart.service': { cartService: {} },
  });
  await assert.rejects(orderService.track('42'), /tracking javobini noto‘g‘ri/);
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
    '@/config/env': { env: { apiUrl: 'https://example.test' } },
    '@/lib/api': { ApiError, apiRequest: async () => { throw new ApiError(status); } },
  });
  await assert.rejects(productService.getById(1), { status: 503 });
  status = 404;
  assert.equal(await productService.getById(1), null);
});

test('catalog query keeps shareable filters and only accepts backend sort values', () => {
  const { catalogHref, parseCatalogQuery } = loadTypeScript('src/lib/catalog-query.ts');
  assert.deepEqual(parseCatalogQuery({ search: '  iphone  ', sort: 'price:asc', page: '3', minPrice: '100' }, 'phones'), {
    search: 'iphone', categoryId: 'phones', minPrice: 100, maxPrice: undefined, sort: 'price:asc', page: 3, limit: 10,
  });
  assert.equal(parseCatalogQuery({ sort: 'price:drop table', page: '-4' }).sort, 'createdAt:desc');
  assert.equal(parseCatalogQuery({ sort: 'price:drop table', page: '-4' }).page, 1);
  assert.equal(parseCatalogQuery({ q: '  telefon  ', search: 'ignored' }).search, 'telefon');
  assert.equal(catalogHref('/katalog/telefonlar', { search: 'iphone 16', sort: 'price:asc', page: 3, limit: 20 }, { page: 2 }), '/katalog/telefonlar?search=iphone+16&sort=price%3Aasc&page=2#products');
  assert.equal(catalogHref('/qidiruv', { search: 'iphone 16', minPrice: 100, sort: 'price:asc', page: 1, limit: 20 }), '/qidiruv?q=iphone+16&minPrice=100&sort=price%3Aasc#products');
});

test('search suggestions use the dedicated backend endpoint and reject malformed payloads', async () => {
  const calls = [];
  let response = { items: [{ productId: '6', title: 'Telefon', shopName: 'Do‘kon', price: 10000, imageUrl: null }] };
  const { searchService } = loadTypeScript('src/services/search.service.ts', {
    '@/lib/api': { apiRequest: async (path, options) => { calls.push([path, options.params]); return response; } },
  });
  assert.deepEqual(await searchService.suggest(' telefon '), [{ id: '6', name: 'Telefon', shopName: 'Do‘kon', price: 10000, image: undefined }]);
  assert.deepEqual(calls, [['/storefront/search', { q: 'telefon', page: 1, limit: 6 }]]);
  assert.deepEqual(await searchService.suggest('a'), []);
  response = { wrong: [] };
  await assert.rejects(searchService.suggest('telefon'), /takliflarini noto‘g‘ri/);
});

test('category service uses backend slugs and finds nested categories', async () => {
  const response = [{ id: '1', name: 'Elektronika', slug: 'elektronika', parentId: null, iconUrl: null, sortOrder: 0, isActive: true, children: [
    { id: '7', name: 'Mobil telefonlar', slug: 'mobil-telefonlar', parentId: '1', iconUrl: null, sortOrder: 0, isActive: true, children: [] },
  ] }];
  const { categoryService, findCategoryBySlug } = loadTypeScript('src/services/category.service.ts', {
    '@/config/env': { env: { apiUrl: 'https://example.test/api/v1' } },
    '@/generated/api-validators': { validateCategoryTreeDto: () => true },
    '@/lib/api': { apiRequest: async () => response },
  });
  const categories = await categoryService.list();
  assert.equal(categories.source, 'api');
  assert.equal(findCategoryBySlug(categories.data, 'mobil-telefonlar').id, '7');
});
