import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

function withStorage(t, entries = []) {
  const stored = new Map(entries);
  const originalWindow = globalThis.window;
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  globalThis.window = {};
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key) => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value), removeItem: (key) => stored.delete(key) } });
  t.after(() => {
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage); else delete globalThis.localStorage;
  });
  return stored;
}

const remoteOrder = (id) => ({ orderId: id, createdAt: '2026-09-15T10:00:00Z', orderStatus: 'CONFIRMED', paymentMethod: 'cod', subtotal: 100, deliveryFee: 10, totalAmount: 110, items: [{ id: `i-${id}`, productId: '7', name: 'Telefon', quantity: 1, unitPrice: 100, imageUrl: null, sellerOrderStatus: 'PENDING' }] });

test('xaridor buyurtmalari barcha sahifalardan olinadi (eng yangi 20 ta bilan cheklanmaydi)', async (t) => {
  withStorage(t);
  const pages = [];
  const { orderService } = loadTypeScript('src/services/order.service.ts', {
    '@/lib/api': { apiRequest: async (path, options) => { pages.push(options.params.page); return { items: [remoteOrder(`o-${options.params.page}`)], total: 3, page: options.params.page, limit: 50, totalPages: 3 }; } },
    '@/lib/access-token': { getAccessToken: () => 'token', hasAuthSession: () => true, authHeaders: () => ({ Authorization: 'Bearer token' }) },
    './cart.service': { cartService: {} },
  });
  const { orders } = await orderService.listForCurrentBuyer();
  assert.deepEqual(pages.sort(), [1, 2, 3]);
  assert.deepEqual(orders.map((order) => order.id), ['o-1', 'o-2', 'o-3']);
});

test('buyurtma tafsilotlari backenddan (GET /orders/:id) olinadi, brauzer nusxasiga bog‘liq emas', async (t) => {
  withStorage(t);
  let requested;
  const { orderService } = loadTypeScript('src/services/order.service.ts', {
    '@/lib/api': { apiRequest: async (path) => { requested = path; return { id: '42', buyerName: 'Ali', status: 'CONFIRMED', paymentMethod: 'cod', totalAmount: 475000, deliveryFee: 25000, deliveryAddress: 'Toshkent, Amir Temur 1', createdAt: '2026-09-14T10:00:00Z', updatedAt: '2026-09-14T10:30:00Z', sellerOrders: [{ id: '31', shopId: '15', subtotal: 450000, deliveryFee: 25000, status: 'PENDING', items: [{ productId: '88', productName: 'Telefon', variantId: '5', quantity: 2, unitPrice: 225000, lineTotal: 450000 }] }] }; } },
    '@/lib/access-token': { authHeaders: () => ({}), hasAuthSession: () => false },
    './cart.service': { cartService: {} },
  });
  const details = await orderService.details('42');
  assert.equal(requested, '/orders/42');
  assert.deepEqual(details, { id: '42', buyerName: 'Ali', address: 'Toshkent, Amir Temur 1', total: 475000, deliveryFee: 25000, items: [{ key: '88:5', name: 'Telefon', quantity: 2, lineTotal: 450000 }] });
  const route = read('src/app/api/backend/[...path]/route.ts');
  assert.match(route, /\[\/\^\\\/orders\\\/\[\^\/\]\+\$\/, \["GET"\]\]/, 'proxy GET /orders/:id ga ruxsat beradi');
  const tracking = read('src/components/order-tracking-content.tsx');
  assert.match(tracking, /orderService\.details\(orderId\)/);
  assert.doesNotMatch(tracking, /\{order\.customer\.name\} · \{order\.customer\.phone\}/, 'bo‘sh “ · ” qatori chiqmaydi');
});

test('logout brauzerdagi buyurtma nusxalarini (shaxsiy ma’lumot) o‘chiradi', (t) => {
  const stored = withStorage(t, [['elchi_orders_v1', '[{"id":"1"}]']]);
  const { orderService } = loadTypeScript('src/services/order.service.ts', { '@/lib/api': { apiRequest: async () => ({}) }, './cart.service': { cartService: {} } });
  orderService.forgetLocal();
  assert.equal(stored.has('elchi_orders_v1'), false);
  assert.match(read('src/services/auth.service.ts'), /clearSession\(\): void \{[\s\S]*?orderService\.forgetLocal\(\);/);
});

test('kategoriya sahifasi faqat haqiqiy kichik kategoriyalarni ko‘rsatadi', () => {
  const source = read('src/components/storefront-home.tsx');
  assert.match(source, /\{category\.children\.length > 0 && <CategoryGrid categories=\{category\.children\}\/>\}/);
  assert.doesNotMatch(source, /category\.children\.length \? category\.children : categories/);
});

test('reyting bitta kasr bilan, noma’lum sharhlar soni “(0)” bo‘lib chiqmaydi; posilkalar soni o‘ylab topilmaydi', () => {
  const card = read('src/components/product-card.tsx');
  assert.match(card, /product\.rating\.toFixed\(1\)/);
  assert.match(card, /product\.reviews > 0 && <span>\(\{product\.reviews\}\)<\/span>/);
  assert.match(read('src/components/product-detail.tsx'), /\(reviews\.error \? product\.rating : reviews\.rating\)\.toFixed\(1\)/);
  assert.doesNotMatch(read('src/components/checkout-content.tsx'), /packages\.length \|\| 1/);
});

test('/api-test diagnostika sahifasi production’da yopiq', () => {
  assert.match(read('src/app/api-test/page.tsx'), /process\.env\.NODE_ENV === "production" && process\.env\.ENABLE_API_TEST !== "1"\) notFound\(\)/);
});

test('sahifalangan ro‘yxatda 2-sahifa sarlavhasi 1-sahifani takrorlamaydi', () => {
  const { pagedTitle } = loadTypeScript('src/lib/seo.ts', { '@/lib/catalog-query': loadTypeScript('src/lib/catalog-query.ts') });
  assert.equal(pagedTitle('UyBozor', {}), 'UyBozor');
  assert.equal(pagedTitle('UyBozor', { page: '1' }), 'UyBozor');
  assert.equal(pagedTitle('UyBozor', { page: '2' }), 'UyBozor — 2-sahifa');
  for (const file of ['src/app/(home)/page.tsx', 'src/app/katalog/[slug]/page.tsx', 'src/app/dokon/[slug]/page.tsx']) assert.match(read(file), /pagedTitle\(/, file);
});

test('yetkazish narxini hisoblash yiqilsa “manzil to‘liq kiritilgach” deb chalg‘itilmaydi', () => {
  const source = read('src/components/checkout-content.tsx');
  assert.match(source, /setPreviewFailed\(true\); setError\(errorMessage\(caught, "Yetkazib berish narxini hisoblab bo‘lmadi"\)\)/);
  assert.match(source, /previewFailed \? "Yetkazish narxini hisoblab bo‘lmadi/);
});

test('bo‘sh yoki xato holatdagi shaxsiy sahifalarda ham bitta h1 bor', () => {
  assert.match(read('src/components/ui/state-panel.tsx'), /const Heading = headingLevel === 1 \? "h1" : "h2";/);
  for (const file of ['cart-content', 'checkout-content', 'favorites-content', 'orders-content', 'order-tracking-content']) assert.doesNotMatch(read(`src/components/${file}.tsx`), /return <StatePanel (?!headingLevel=\{1\})/, file);
});
