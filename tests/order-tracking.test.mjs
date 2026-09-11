import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';

class ApiError extends Error {
  constructor(status, message, details, kind = status === 404 ? 'not_found' : 'http') { super(message); this.status = status; this.details = details; this.kind = kind; }
}

const load = (request = async () => {}) => loadTypeScript('src/services/order-tracking.service.ts', {
  '@/lib/api': { ApiError, apiRequest: request },
});

test('tracking adapter maps backend and Elchi delivery statuses', () => {
  const { normalizeOrderStatus } = load();
  assert.deepEqual(normalizeOrderStatus('CONFIRMED').step, 'received');
  assert.deepEqual(normalizeOrderStatus('SHIPMENT_CREATED').step, 'preparing');
  assert.deepEqual(normalizeOrderStatus('ON_THE_ROAD').step, 'on_the_way');
  assert.deepEqual(normalizeOrderStatus('DELIVERED').step, 'delivered');
  assert.deepEqual(normalizeOrderStatus('CANCELLED').step, 'cancelled');
  assert.throws(() => normalizeOrderStatus('UNKNOWN_STATE'), /holati/);
});

test('tracking response requires the requested order and accepts nested shipment data', () => {
  const { normalizeTrackedOrder } = load();
  assert.deepEqual(normalizeTrackedOrder({ order: { salesOrderId: '77', status: 'CONFIRMED' }, shipment: { status: 'ON_THE_ROAD', estimatedDeliveryAt: '2026-10-12T12:00:00.000Z', trackingUrl: 'https://elchi.uz/track/77' } }, '77'), {
    id: '77', rawStatus: 'ON_THE_ROAD', status: 'Yo‘lda', step: 'on_the_way', estimatedDeliveryAt: '2026-10-12T12:00:00.000Z', updatedAt: undefined, trackingUrl: 'https://elchi.uz/track/77',
  });
  assert.equal(normalizeTrackedOrder({ orderId: 77, status: 'CONFIRMED' }, '77').id, '77');
  assert.throws(() => normalizeTrackedOrder({ id: 'another', status: 'CONFIRMED' }, '77'), /Boshqa buyurtma/);
});

test('tracking safely encodes order IDs and merges live fields into the saved receipt', async () => {
  const calls = [];
  const { orderTrackingService, mergeTrackedOrder } = load(async (path) => { calls.push(path); return { id: '77/1', status: 'DELIVERED', updatedAt: '2026-10-12T13:00:00.000Z' }; });
  const tracking = await orderTrackingService.get('77/1');
  assert.deepEqual(calls, ['/orders/77%2F1/tracking']);
  const order = { id: '77/1', status: 'Yangi', items: [] };
  assert.equal(mergeTrackedOrder(order, tracking).status, 'Yetkazildi');
});
