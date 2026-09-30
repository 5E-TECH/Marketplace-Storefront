import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';

// Xaridor bildirishnomalari (NotificationsPageDto) va qaytarish sahifasiga yo'naltirish.
const notification = (overrides = {}) => ({ id: '11', type: 'return_approved', title: 'Qaytarish tasdiqlandi', body: '#62 buyurtma', isRead: false, data: { returnId: '1', orderId: '62', status: 'APPROVED' }, createdAt: '2026-09-28T10:00:00.000Z', ...overrides });

function loadService(respond, { signedIn = true } = {}) {
  const calls = [];
  const events = [];
  const originalWindow = globalThis.window;
  globalThis.window = { dispatchEvent: (event) => events.push(event.type) };
  const loaded = loadTypeScript('src/services/notification.service.ts', {
    '@/lib/api': { apiRequest: async (path, options) => {
      calls.push([path, options]);
      const payload = await respond(path, options);
      if (options.validate && !options.validate(payload)) throw new Error('Backend javobi OpenAPI kontraktiga mos emas');
      return payload;
    } },
    '@/lib/access-token': { authHeaders: () => ({ Authorization: 'Bearer buyer' }), hasAuthSession: () => signedIn },
  });
  return { ...loaded, calls, events, restore: () => { if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow; } };
}

test('ro‘yxat kontrakt bo‘yicha olinadi, header faqat o‘qilmaganlar sonini so‘raydi', async (t) => {
  const { notificationService, calls, restore } = loadService(async () => ({ items: [notification()], total: 3, unreadCount: 2, page: 1, limit: 20 }));
  t.after(restore);
  const page = await notificationService.list();
  assert.equal(page.items[0].title, 'Qaytarish tasdiqlandi');
  assert.deepEqual(calls[0][1].params, { page: 1, limit: 20 });
  assert.equal(await notificationService.unreadCount(), 2);
  assert.deepEqual(calls[1][1].params, { page: 1, limit: 1 });
});

test('o‘qilgan qilish PATCH bilan ketadi va header hisoblagichini yangilash hodisasi chiqadi', async (t) => {
  const { notificationService, calls, events, restore } = loadService(async () => null);
  t.after(restore);
  await notificationService.markRead('11');
  await notificationService.markAllRead();
  assert.deepEqual(calls.map(([path, options]) => [options.method, path]), [['PATCH', '/notifications/11/read'], ['PATCH', '/notifications/read-all']]);
  assert.deepEqual(events, ['elchi:notifications-changed', 'elchi:notifications-changed']);
  await assert.rejects(notificationService.markRead('  '), /raqami noto‘g‘ri/);
});

test('qaytarish bildirishnomasi so‘rov sahifasiga olib boradi, boshqa turlar va buzuq data — hech qayerga', async (t) => {
  const { notificationHref, restore } = loadService(async () => null);
  t.after(restore);
  assert.equal(notificationHref(notification()), '/profile/returns/1');
  assert.equal(notificationHref(notification({ type: 'return_refunded', data: { returnId: 7 } })), '/profile/returns/7');
  assert.equal(notificationHref(notification({ type: 'shop_approved', data: {} })), undefined);
  assert.equal(notificationHref(notification({ data: null })), undefined);
});

test('mehmon uchun bildirishnoma so‘ralmaydi; kontraktga mos bo‘lmagan javob rad etiladi', async (t) => {
  const guest = loadService(async () => { throw new Error('chaqirilmasligi kerak'); }, { signedIn: false });
  t.after(guest.restore);
  assert.equal(await guest.notificationService.unreadCount(), 0);
  await assert.rejects(guest.notificationService.list(), /akkauntingizga kiring/);
  assert.equal(guest.calls.length, 0);
  const broken = loadService(async () => ({ items: [{ id: '1' }], total: 1, unreadCount: 1, page: 1, limit: 20 }));
  await assert.rejects(broken.notificationService.list(), /kontraktiga mos emas/);
  broken.restore();
});
