import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';

const backend = loadTypeScript('src/lib/backend.ts');
const { mockLanding, MOCK_CODE, MOCK_FAILING_CODE } = loadTypeScript('src/lib/mock.ts');

const live = { apiUrl: 'http://api.test/api/v1', apiTimeoutMs: 1000, mock: false };
const mock = { ...live, mock: true };

const recorder = (status, body) => {
  const calls = [];
  const fetcher = async (url, init) => { calls.push({ url, init }); return new Response(body === undefined ? null : JSON.stringify(body), { status }); };
  return { calls, fetcher };
};

test('GET /landing/:code — 200 ma’lumot qaytaradi, kod URL’ga xavfsiz yoziladi', async () => {
  const { calls, fetcher } = recorder(200, mockLanding);
  assert.deepEqual(await backend.getLanding('a b', live, fetcher), mockLanding);
  assert.equal(calls[0].url, 'http://api.test/api/v1/landing/a%20b');
  assert.equal(calls[0].init.cache, 'no-store');
});

test('TC3: backend 404 — sahifa yo‘q (null)', async () => {
  const { fetcher } = recorder(404, { message: 'Not Found' });
  assert.equal(await backend.getLanding('nomalum', live, fetcher), null);
});

test('backend 501 (BE-11 hali yo‘q) yoki 500 — BackendError, sahifada xato-1', async () => {
  for (const status of [500, 501, 503]) {
    const { fetcher } = recorder(status, { message: 'x' });
    await assert.rejects(backend.getLanding('k7Qm2x', live, fetcher), (error) => error instanceof backend.BackendError && error.status === status);
  }
});

test('tarmoq xatosi va sozlanmagan API_BASE_URL — BackendError', async () => {
  await assert.rejects(backend.getLanding('k7Qm2x', live, async () => { throw new TypeError('fetch failed'); }), backend.BackendError);
  await assert.rejects(backend.getLanding('k7Qm2x', { ...live, apiUrl: '' }, async () => { throw new Error('chaqirilmasligi kerak'); }), backend.BackendError);
});

test('POST /clicks — tana, mijoz IP va user agenti o‘zgartirilmay uzatiladi', async () => {
  const { calls, fetcher } = recorder(201, { clickId: '90311' });
  const created = await backend.createClick({ code: 'k7Qm2x', variant: 's3', sub1: 'a' }, { forwardedFor: '203.0.113.7, 172.18.0.5', userAgent: 'Mozilla/5.0 Test' }, live, fetcher);
  assert.deepEqual(created, { clickId: '90311' });
  assert.equal(calls[0].url, 'http://api.test/api/v1/clicks');
  assert.equal(calls[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].init.body), { code: 'k7Qm2x', variant: 's3', sub1: 'a' });
  assert.equal(calls[0].init.headers['x-forwarded-for'], '203.0.113.7, 172.18.0.5');
  assert.equal(calls[0].init.headers['user-agent'], 'Mozilla/5.0 Test');
});

test('POST /clicks — backend xatosi BackendError bo‘ladi', async () => {
  const { fetcher } = recorder(501, { message: 'BE-11' });
  await assert.rejects(backend.createClick({ code: 'k7Qm2x' }, {}, live, fetcher), (error) => error.status === 501);
});

test('mock: ma’lum kod, noma’lum kod, xato kodi va klik', async () => {
  const never = async () => { throw new Error('mock rejimida backend chaqirilmaydi'); };
  assert.equal((await backend.getLanding(MOCK_CODE, mock, never)).product.name, 'Simsiz quloqchinlar');
  assert.equal(await backend.getLanding('nomalum', mock, never), null);
  await assert.rejects(backend.getLanding(MOCK_FAILING_CODE, mock, never));
  assert.match((await backend.createClick({ code: MOCK_CODE, variant: 's1' }, {}, mock, never)).clickId, /^mock-s1-/);
});

test('mock narxlari holat-matnlari.md «Qisman (sukut)» qatoriga teng: 262 000 / 30 000 / 50 000', () => {
  assert.deepEqual(mockLanding.price, { salePrice: 262_000, centerDeliveryFee: 30_000, addressDeliveryFee: 50_000 });
});

test('sozlamalar: mock faqat MOCK_API=true bilan, timeout sukuti 10 000 ms', () => {
  const { readConfig } = loadTypeScript('src/lib/config.ts');
  assert.deepEqual(readConfig({}), { apiUrl: '', apiTimeoutMs: 10_000, mock: false });
  assert.deepEqual(readConfig({ API_BASE_URL: 'http://localhost:3000/api/v1/', API_TIMEOUT_MS: '2500', MOCK_API: 'true' }), { apiUrl: 'http://localhost:3000/api/v1', apiTimeoutMs: 2500, mock: true });
  assert.equal(readConfig({ MOCK_API: '1' }).mock, false);
});
