import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';

// C4.2 Qaytarish: xaridor so'rovi, ro'yxat va holat. Jonli kontrakt shakllari.
const item = (overrides = {}) => ({ id: '1', orderItemId: '66', productId: '7', variantId: '6', productName: 'Telefon g‘ilofi', imageUrl: null, quantity: 1, unitPrice: 45000, lineTotal: 45000, ...overrides });
const request = (overrides = {}) => ({ id: '1', orderId: '62', sellerOrderId: '63', shopId: '4', shopName: 'Ali Market', buyerName: 'Aziza', status: 'SUBMITTED', reason: 'DEFECTIVE', comment: 'Ekranda chiziq bor', paymentMethod: 'cod', requestedAmount: 45000, refundedAmount: null, restocked: null, decisionComment: null, decidedAt: null, refundedAt: null, createdAt: '2026-09-28T10:00:00.000Z', updatedAt: '2026-09-28T10:00:00.000Z', items: [item()], ...overrides });
const page = (items) => ({ items, total: items.length, page: 1, limit: 50, totalPages: 1 });
const order = (items) => ({ orderId: '62', createdAt: '2026-09-20T10:00:00.000Z', orderStatus: 'FULFILLED', paymentMethod: 'cod', paymentProvider: null, paymentStatus: null, subtotal: 135000, deliveryFee: 0, totalAmount: 135000, items });
const orderItem = (overrides = {}) => ({ id: '66', productId: '7', name: 'Telefon g‘ilofi', quantity: 2, unitPrice: 45000, imageUrl: null, sellerOrderStatus: 'DELIVERED', ...overrides });

function loadService(respond, { signedIn = true } = {}) {
  const calls = [];
  const { returnService, returnReasonLabel, returnSteps, RETURN_STATUS_LABELS } = loadTypeScript('src/services/return.service.ts', {
    // Haqiqiy apiRequest kabi: javob generatsiya qilingan validator bilan tekshiriladi.
    '@/lib/api': { apiRequest: async (path, options) => {
      calls.push([path, options]);
      const payload = await respond(path, options);
      if (options.validate && !options.validate(payload)) throw new Error('Backend javobi OpenAPI kontraktiga mos emas');
      return payload;
    } },
    '@/lib/access-token': { authHeaders: () => (signedIn ? { Authorization: 'Bearer buyer' } : {}), hasAuthSession: () => signedIn },
  });
  return { returnService, returnReasonLabel, returnSteps, RETURN_STATUS_LABELS, calls };
}

test('qaytarish so‘rovi POST /orders/:id/returns ga kontrakt tanasi bilan ketadi, javob massiv', async () => {
  const { returnService, calls } = loadService(async () => ({ items: [request(), request({ id: '2', shopId: '5', shopName: 'Baraka', sellerOrderId: '64' })] }));
  const created = await returnService.create('62', { items: [{ orderItemId: '66', quantity: 1 }, { orderItemId: '67', quantity: 0 }], reason: 'DEFECTIVE', comment: '  Ekranda chiziq bor ' });
  assert.equal(calls[0][0], '/orders/62/returns');
  assert.equal(calls[0][1].method, 'POST');
  assert.equal(calls[0][1].headers.Authorization, 'Bearer buyer');
  // Miqdori 0 tovar yuborilmaydi, izoh qirqiladi.
  assert.deepEqual(calls[0][1].body, { items: [{ orderItemId: '66', quantity: 1 }], reason: 'DEFECTIVE', comment: 'Ekranda chiziq bor' });
  // Turli do'kon tovarlari — har posilka uchun alohida so'rov.
  assert.deepEqual(created.map((value) => value.shopName), ['Ali Market', 'Baraka']);
});

test('noto‘g‘ri so‘rov backendga yetib bormaydi: tovar tanlanmagan, “Boshqa” izohsiz, uzun izoh, login yo‘q', async () => {
  const { returnService, calls } = loadService(async () => ({ items: [request()] }));
  await assert.rejects(returnService.create('62', { items: [], reason: 'DEFECTIVE' }), /tovarni tanlang/);
  await assert.rejects(returnService.create('62', { items: [{ orderItemId: '66', quantity: 1 }], reason: 'OTHER', comment: '   ' }), /izoh yozing/);
  await assert.rejects(returnService.create('62', { items: [{ orderItemId: '66', quantity: 1 }], reason: 'BROKEN' }), /sababini tanlang/);
  await assert.rejects(returnService.create('62', { items: [{ orderItemId: '66', quantity: 1 }], reason: 'CHANGED_MIND', comment: 'x'.repeat(501) }), /500 belgidan/);
  assert.equal(calls.length, 0);
  const guest = loadService(async () => ({ items: [] }), { signedIn: false });
  await assert.rejects(guest.returnService.create('62', { items: [{ orderItemId: '66', quantity: 1 }], reason: 'DEFECTIVE' }), /akkauntingizga kiring/);
  assert.equal(guest.calls.length, 0);
  // "Boshqa" izoh bilan — yuboriladi.
  await returnService.create('62', { items: [{ orderItemId: '66', quantity: 1 }], reason: 'OTHER', comment: 'Rangi boshqa' });
  assert.deepEqual(calls[0][1].body.reason, 'OTHER');
});

test('muddat o‘tgan yoki boshqa 400 xabari backend matni bilan qaytadi', async () => {
  const { returnService } = loadService(async () => { throw new Error('Qaytarish muddati o‘tgan: yetkazilganiga 10 kundan oshdi'); });
  await assert.rejects(returnService.create('62', { items: [{ orderItemId: '66', quantity: 1 }], reason: 'DEFECTIVE' }), /muddati o‘tgan/);
});

test('buyurtma sahifasi: faqat DELIVERED tovarlar, faol so‘rovdagi miqdor ayiriladi, rad etilgani hisobga olinmaydi', async () => {
  const { returnService, calls } = loadService(async (path) => {
    if (path === '/orders') return { items: [order([orderItem(), orderItem({ id: '67', name: 'Zaryadlovchi', quantity: 1, sellerOrderStatus: 'ON_THE_ROAD' }), orderItem({ id: '68', name: 'Quloqchin', quantity: 1 })]), { ...order([]), orderId: '70' }], total: 2, page: 1, limit: 100, totalPages: 1 };
    if (path === '/returns') return page([request({ items: [item({ orderItemId: '66', quantity: 1 })] }), request({ id: '3', status: 'REJECTED', items: [item({ orderItemId: '68', quantity: 1 })] }), request({ id: '4', orderId: '70' })]);
  });
  const { returnable, requests } = await returnService.forOrder('62');
  // 66: 2 ta olingan, 1 tasi faol so'rovda → 1 qoldi. 67 yo'lda — yo'q. 68 rad etilgan — to'liq qaytarsa bo'ladi.
  assert.deepEqual(returnable.map((value) => [value.orderItemId, value.available]), [['66', 1], ['68', 1]]);
  assert.deepEqual(requests.map((value) => value.id), ['1', '3']);
  assert.deepEqual(calls.map(([path, options]) => [path, options.params]), [['/orders', { page: 1, limit: 100 }], ['/returns', { page: 1, limit: 50, status: undefined }]]);
});

test('so‘rovlar ro‘yxati yuklanmasa ham qaytariladigan tovarlar chiqadi; mehmonda so‘rov yuborilmaydi', async () => {
  const { returnService } = loadService(async (path) => {
    if (path === '/orders') return { items: [order([orderItem()])], total: 1, page: 1, limit: 100, totalPages: 1 };
    throw new Error('502');
  });
  const { returnable, requests } = await returnService.forOrder('62');
  assert.deepEqual(returnable.map((value) => value.available), [2]);
  assert.deepEqual(requests, []);
  const guest = loadService(async () => { throw new Error('chaqirilmasligi kerak'); }, { signedIn: false });
  assert.deepEqual(await guest.returnService.forOrder('62'), { returnable: [], requests: [] });
  assert.equal(guest.calls.length, 0);
});

test('so‘rov sahifasi tarixi eskidan yangiga tartiblanadi; kontraktga mos bo‘lmagan javob rad etiladi', async () => {
  const history = [
    { fromStatus: 'SUBMITTED', toStatus: 'APPROVED', actorRole: 'SELLER', comment: null, createdAt: '2026-09-28T12:00:00.000Z' },
    { fromStatus: null, toStatus: 'SUBMITTED', actorRole: 'BUYER', comment: 'Ekranda chiziq bor', createdAt: '2026-09-28T10:00:00.000Z' },
  ];
  const { returnService, calls, RETURN_STATUS_LABELS, returnReasonLabel } = loadService(async () => ({ ...request({ status: 'APPROVED' }), history }));
  const detail = await returnService.get('1');
  assert.equal(calls[0][0], '/returns/1');
  assert.deepEqual(detail.history.map((entry) => entry.toStatus), ['SUBMITTED', 'APPROVED']);
  assert.equal(RETURN_STATUS_LABELS.REFUNDED, 'Pul qaytarildi');
  assert.equal(returnReasonLabel('OTHER'), 'Boshqa');
  const broken = loadService(async () => ({ ...request(), status: 'LOST', history: [] }));
  await assert.rejects(broken.returnService.get('1'), /kontraktiga mos emas/);
});

test('bosqichlar: “ko‘rib chiqish” o‘tkazib yuborilsa ko‘rsatilmaydi, o‘tilgan bo‘lsa saqlanadi', () => {
  const { returnSteps } = loadService(async () => undefined);
  const entry = (toStatus) => ({ fromStatus: null, toStatus, actorRole: 'SELLER', comment: null, createdAt: '2026-09-28T10:00:00.000Z' });
  assert.deepEqual(returnSteps({ status: 'SUBMITTED', history: [entry('SUBMITTED')] }), { steps: ['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REFUNDED'], current: 0 });
  assert.deepEqual(returnSteps({ status: 'APPROVED', history: [entry('SUBMITTED'), entry('APPROVED')] }), { steps: ['SUBMITTED', 'APPROVED', 'REFUNDED'], current: 1 });
  assert.deepEqual(returnSteps({ status: 'REFUNDED', history: [entry('SUBMITTED'), entry('IN_REVIEW'), entry('APPROVED'), entry('REFUNDED')] }), { steps: ['SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REFUNDED'], current: 3 });
});

test('sana-vaqt Toshkent bo‘yicha: kun almashishi to‘g‘ri, SSR va clientda bir xil', () => {
  const { formatDateTime, formatDate } = loadTypeScript('src/lib/format.ts');
  // 20:30 UTC — Toshkentda ertasi kun 01:30.
  assert.equal(formatDateTime('2026-09-28T20:30:00.000Z'), '29.09.2026, 01:30');
  assert.equal(formatDateTime('2026-09-28T10:05:00.000Z'), '28.09.2026, 15:05');
  assert.equal(formatDateTime('noto‘g‘ri'), '—');
  // Mavjud formatDate o'zgarmagan (boshqa sahifalar unga tayanadi).
  assert.equal(formatDate('2026-09-28T10:05:00.000Z'), '28.09.2026');
});
