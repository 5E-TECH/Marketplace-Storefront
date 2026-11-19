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

/** api-gateway qobig‘i (TransformInterceptor): `{ statusCode, message, data }`. */
const wrapped = (data, statusCode = 200) => ({ statusCode, message: 'OK', data });

test('GET /landing/:code — 200 ma’lumot qaytaradi (gateway qobig‘idan), kod URL’ga xavfsiz yoziladi', async () => {
  const { calls, fetcher } = recorder(200, wrapped(mockLanding));
  assert.deepEqual(await backend.getLanding('a b', {}, live, fetcher), mockLanding);
  assert.equal(calls[0].url, 'http://api.test/api/v1/landing/a%20b');
  assert.equal(calls[0].init.cache, 'no-store');
});

test('GET /landing ham mijoz IP va user agenti bilan — backend limiti IP bo‘yicha (ThrottlerGuard)', async () => {
  const { calls, fetcher } = recorder(200, mockLanding);
  await backend.getLanding('k7Qm2x', { forwardedFor: '203.0.113.7', userAgent: 'UA' }, live, fetcher);
  assert.equal(calls[0].init.headers['x-forwarded-for'], '203.0.113.7');
  assert.equal(calls[0].init.headers['user-agent'], 'UA');
  const bare = recorder(200, mockLanding);
  await backend.getLanding('k7Qm2x', {}, live, bare.fetcher);
  assert.equal(bare.calls[0].init.headers['x-forwarded-for'], undefined);
});

test('TC3: backend 404 — sahifa yo‘q (null)', async () => {
  const { fetcher } = recorder(404, { message: 'Not Found' });
  assert.equal(await backend.getLanding('nomalum', {}, live, fetcher), null);
});

test('backend 500, 501 yoki 503 — BackendError, sahifada xato-1', async () => {
  for (const status of [500, 501, 503]) {
    const { fetcher } = recorder(status, { message: 'x' });
    await assert.rejects(backend.getLanding('k7Qm2x', {}, live, fetcher), (error) => error instanceof backend.BackendError && error.status === status);
  }
});

test('tarmoq xatosi va sozlanmagan API_BASE_URL — BackendError', async () => {
  await assert.rejects(backend.getLanding('k7Qm2x', {}, live, async () => { throw new TypeError('fetch failed'); }), backend.BackendError);
  await assert.rejects(backend.getLanding('k7Qm2x', {}, { ...live, apiUrl: '' }, async () => { throw new Error('chaqirilmasligi kerak'); }), backend.BackendError);
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
  assert.equal((await backend.getLanding(MOCK_CODE, {}, mock, never)).product.name, 'Simsiz quloqchinlar');
  assert.equal(await backend.getLanding('nomalum', {}, mock, never), null);
  await assert.rejects(backend.getLanding(MOCK_FAILING_CODE, {}, mock, never));
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

const leadBody = { code: 'k7Qm2x', name: 'Aziza', phone: '+998901234567', consentVersion: '2026-11-16', variant: 's3', sub1: 'abc' };

test('POST /leads — 201: lid ID (piksel eventID si) va dublikat belgisi; tana, IP va user agent uzatiladi', async () => {
  const { calls, fetcher } = recorder(201, wrapped({ leadId: '7001', duplicate: true }, 201));
  const result = await backend.createLead(leadBody, { forwardedFor: '203.0.113.7', userAgent: 'UA' }, live, fetcher);
  assert.deepEqual(result, { kind: 'created', leadId: '7001', duplicate: true });
  assert.equal(calls[0].url, 'http://api.test/api/v1/leads');
  assert.equal(calls[0].init.method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].init.body), leadBody);
  assert.equal(calls[0].init.headers['x-forwarded-for'], '203.0.113.7');
  assert.equal(calls[0].init.headers['user-agent'], 'UA');
});

test('POST /leads — 400 maydonlar, 404, 409 LANDING_NOT_OPEN; boshqasi BackendError', async () => {
  const invalid = recorder(400, { statusCode: 400, message: ['phone O‘zbekiston operator kodi bilan bo‘lishi kerak'], errorCode: 'VALIDATION_ERROR', details: [{ field: 'phone', error: 'x' }, { field: 'phone', error: 'y' }] });
  assert.deepEqual(await backend.createLead(leadBody, {}, live, invalid.fetcher), { kind: 'invalid', fields: ['phone'], messages: ['phone O‘zbekiston operator kodi bilan bo‘lishi kerak'] });
  assert.deepEqual(await backend.createLead(leadBody, {}, live, recorder(404, { message: 'x' }).fetcher), { kind: 'notFound' });
  assert.deepEqual(await backend.createLead(leadBody, {}, live, recorder(409, { errorCode: 'LANDING_NOT_OPEN' }).fetcher), { kind: 'notOpen' });
  for (const [status, body] of [[409, { errorCode: 'BOSHQA' }], [500, {}], [503, undefined], [201, {}], [201, wrapped(null, 201)]]) {
    await assert.rejects(backend.createLead(leadBody, {}, live, recorder(status, body).fetcher), (error) => error instanceof backend.BackendError);
  }
});

test('mock lid: ma’lum kod — raqamli ID, noma’lum — 404, «Xato Sinov» — server xatosi', async () => {
  const created = await backend.createLead(leadBody, {}, mock);
  assert.equal(created.kind, 'created');
  assert.match(created.leadId, /^\d+$/);
  assert.deepEqual(await backend.createLead({ ...leadBody, code: 'boshqa' }, {}, mock), { kind: 'notFound' });
  await assert.rejects(backend.createLead({ ...leadBody, name: 'Xato Sinov' }, {}, mock));
});

test('gateway qobig‘i: GET /landing va POST /clicks `data` ni oladi; qobiqsiz javob ham; bo‘sh `data` — BackendError', async () => {
  assert.deepEqual(await backend.getLanding('k7Qm2x', {}, live, recorder(200, mockLanding).fetcher), mockLanding);
  await assert.rejects(backend.getLanding('k7Qm2x', {}, live, recorder(200, wrapped(null)).fetcher), (error) => error instanceof backend.BackendError);
  assert.deepEqual(await backend.createClick({ code: 'k7Qm2x' }, {}, live, recorder(201, wrapped({ clickId: '90311' }, 201)).fetcher), { clickId: '90311' });
  assert.deepEqual(await backend.createClick({ code: 'k7Qm2x' }, {}, live, recorder(201, { clickId: 90311 }).fetcher), { clickId: '90311' });
  await assert.rejects(backend.createClick({ code: 'k7Qm2x' }, {}, live, recorder(201, wrapped({})).fetcher), (error) => error instanceof backend.BackendError);
});
