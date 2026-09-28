import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';

const product = { id: 7, name: 'Mahsulot', price: 100, image: '/p.jpg', images: ['/p.jpg'], category: 'Test', rating: 0, reviews: 0, description: '', colors: [] };
const address = { recipientName: 'Ali', phone: '+998901234567', address: 'Toshkent shahar, 1-uy', regionId: '1', districtId: '11' };
const preview = { subtotal: 100, deliveryFee: 25, totalAmount: 125, packages: [] };

function withBrowserStorage(t) {
  const local = new Map();
  const session = new Map();
  const storage = (map) => ({ getItem: (key) => map.get(key) ?? null, setItem: (key, value) => map.set(key, String(value)), removeItem: (key) => map.delete(key) });
  const originalWindow = globalThis.window;
  const originals = ['localStorage', 'sessionStorage'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  globalThis.window = {};
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage(local) });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: storage(session) });
  t.after(() => {
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
    for (const [key, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  });
  return { local, session };
}

test('COD tasdiqlash yiqilsa buyurtma xatoda qaytadi, saqlanmaydi, savat tozalanmaydi; confirm() faqat tasdiqlashni takrorlaydi', async (t) => {
  const { local } = withBrowserStorage(t);
  const calls = [];
  let confirmFails = true;
  let cleared = false;
  const { orderService, OrderNotConfirmedError } = loadTypeScript('src/services/order.service.ts', {
    '@/lib/api': { apiRequest: async (path, options = {}) => {
      calls.push(`${options.method ?? 'GET'} ${path}`);
      if (path === '/checkout') return { orderId: 'o-9' };
      if (path.endsWith('/confirm')) { if (confirmFails) throw Object.assign(new Error('Tasdiqlash vaqtincha ishlamayapti'), { status: 500 }); return { id: 'o-9', status: 'CONFIRMED' }; }
      throw new Error(`kutilmagan so‘rov: ${path}`);
    } },
    './cart.service': { cartService: { get: async () => ({ items: [{ id: 'row-1', productId: 7, variantId: 70, product, quantity: 2, shopId: '3' }] }), clear: async () => { cleared = true; } } },
  });
  const error = await orderService.create(address, 'key-1', preview, 'cod').then(() => null, (caught) => caught);
  assert.ok(error instanceof OrderNotConfirmedError, 'maxsus xato: buyurtma yaratilgan, lekin tasdiqlanmagan');
  assert.equal(error.message, 'Tasdiqlash vaqtincha ishlamayapti');
  assert.equal(error.order.id, 'o-9');
  assert.equal(error.order.items[0].quantity, 2, 'buyurtma tarkibi birinchi urinishdagi savatdan');
  assert.equal(cleared, false);
  assert.equal(local.get('elchi_orders_v1'), undefined, 'tasdiqlanmagan buyurtma “Buyurtmalarim”ga yozilmaydi');

  confirmFails = false;
  calls.length = 0;
  const confirmed = await orderService.confirm(error.order);
  assert.deepEqual(calls, ['POST /checkout/o-9/confirm'], 'savat qayta yuborilmaydi — faqat tasdiqlash');
  assert.equal(confirmed.id, 'o-9');
  assert.equal(JSON.parse(local.get('elchi_orders_v1'))[0].id, 'o-9');
});

test('confirm(): oldingi tasdiqlash yetib borgan (javob yo‘qolgan) bo‘lsa holat tekshiriladi', async (t) => {
  withBrowserStorage(t);
  let status = 'CONFIRMED';
  const { orderService } = loadTypeScript('src/services/order.service.ts', {
    '@/lib/api': { apiRequest: async (path) => {
      if (path.endsWith('/confirm')) throw Object.assign(new Error('Buyurtma allaqachon tasdiqlangan'), { status: 400 });
      if (path.endsWith('/tracking')) return { orderId: 'o-5', orderStatus: status, updatedAt: '2026-09-27T10:00:00Z', shipments: [] };
      throw new Error(path);
    } },
    './cart.service': { cartService: {} },
  });
  const order = { id: 'o-5', createdAt: '2026-09-27T10:00:00Z', status: 'Qabul qilindi', items: [], subtotal: 1, delivery: 0, total: 1, payment: 'cash', customer: { name: 'A', phone: '+998901234567', address: 'x' } };
  assert.equal((await orderService.confirm(order)).id, 'o-5');
  status = 'PENDING_PAYMENT';
  await assert.rejects(orderService.confirm(order), /allaqachon tasdiqlangan/, 'hali tasdiqlanmagan bo‘lsa xato ko‘rsatiladi');
});

test('qayta qo‘shilgan savat qatorlarida xaridor olib tashlagan belgilar saqlanadi', (t) => {
  const { session } = withBrowserStorage(t);
  const { carryCartSelection, readCartSelection, saveCartSelection } = loadTypeScript('src/lib/cart-selection.ts');
  const before = [{ id: 'a', productId: 1, variantId: 10 }, { id: 'b', productId: 2, variantId: 20 }, { id: 'c', productId: 3, variantId: 30 }];
  saveCartSelection(['a', 'c'], before); // b olib tashlangan
  const after = [{ id: 'a2', productId: 1, variantId: 10 }, { id: 'b2', productId: 2, variantId: 20 }];
  carryCartSelection(before, after);
  assert.deepEqual(readCartSelection(after), ['a2'], 'b yangi id bilan ham belgisiz qoladi');
  assert.ok(session.has('elchi_cart_excluded_v2'));
});

test('Elchi holatlari (sold, settled, canceled) to‘g‘ri ko‘rinadi va bekor qilish taklif qilinmaydi', () => {
  const { normalizeOrderStatus, canCancelOrder } = loadTypeScript('src/services/order.service.ts', {
    '@/lib/api': { apiRequest: async () => ({}) }, './cart.service': { cartService: {} },
  });
  assert.equal(normalizeOrderStatus('sold'), 'Yetkazildi');
  assert.equal(normalizeOrderStatus('settled'), 'Yetkazildi');
  assert.equal(normalizeOrderStatus('canceled'), 'Bekor qilindi');
  assert.equal(canCancelOrder({ status: 'Qabul qilindi', packages: [{ status: normalizeOrderStatus('canceled') }] }), false);
  assert.equal(canCancelOrder({ status: 'Qabul qilindi', packages: [] }), true);
});

test('cookie sessiyaga o‘tishda eski (legacy) token ham o‘chadi — so‘rovlarga Authorization qo‘shilmaydi', (t) => {
  const { local, session } = withBrowserStorage(t);
  local.set('elchi_access_token', 'eski-token');
  session.set('access_token', 'yana-eski');
  const { markCookieSession, authHeaders, hasAuthSession } = loadTypeScript('src/lib/access-token.ts');
  markCookieSession();
  assert.deepEqual(authHeaders(), {});
  assert.equal(hasAuthSession(), true);
  assert.equal(local.get('cookie_session'), '1');
});

test('do‘kon sahifasi katalog bilan bir xil sahifa hajmida (2-sahifada mahsulot tushib qolmaydi)', () => {
  const { parseCatalogQuery, CATALOG_PAGE_SIZE } = loadTypeScript('src/lib/catalog-query.ts');
  assert.equal(parseCatalogQuery({}).limit, CATALOG_PAGE_SIZE);
  const page = fs.readFileSync(new URL('../src/app/dokon/[slug]/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /getShop\(slug, \{ page: 1, limit: CATALOG_PAGE_SIZE \}\)/);
  assert.doesNotMatch(page, /limit: 10\b/);
});

test('checkout: tanlov o‘zgarsa yangi Idempotency-Key, tasdiqlanmagan buyurtmani qayta tasdiqlash mumkin', () => {
  const source = fs.readFileSync(new URL('../src/components/checkout-content.tsx', import.meta.url), 'utf8');
  const wholeCart = source.slice(source.indexOf('const checkoutWholeCart'), source.indexOf('const restoreDeferred'));
  assert.match(wholeCart, /if \(pending\) return;/);
  assert.match(wholeCart, /idempotencyKey\.current = newIdempotencyKey\(\);/);
  assert.match(wholeCart, /setPreview\(null\);/);
  assert.match(source, /caught instanceof OrderNotConfirmedError/);
  assert.match(source, /orderService\.confirm\(unconfirmed\)/);
  assert.match(source, /if \(cart\.loading \|\| cart\.error \|\| selectionReady\) return;/, 'yuklanmagan savatdan tanlov hisoblanmaydi');
  assert.equal(source.match(/disabled=\{pending\} onClick=\{checkoutWholeCart\}/g)?.length, 2, 'ikkala “butun savat” tugmasi yuborish paytida o‘chiq');
});
