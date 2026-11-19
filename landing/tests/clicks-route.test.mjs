import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';

const { BackendError } = loadTypeScript('src/lib/backend.ts');

function routeWith(createClick) {
  const calls = [];
  const { POST } = loadTypeScript('src/app/api/clicks/route.ts', {
    '@/lib/backend': { BackendError, createClick: async (...args) => { calls.push(args); return createClick(...args); } },
  });
  return { POST, calls };
}

const post = (body, headers = {}) => new Request('http://landing.test/api/clicks', {
  method: 'POST', headers: { 'content-type': 'application/json', host: 'landing.test', ...headers }, body: typeof body === 'string' ? body : JSON.stringify(body),
});

test('TC4: klik variant bilan backendga ketadi, mijoz IP va user agenti bilan', async (t) => {
  t.mock.method(console, 'error', () => {});
  const { POST, calls } = routeWith(async () => ({ clickId: '90311' }));
  const response = await POST(post({ code: 'k7Qm2x', variant: 's3', sub1: 'abc', utmSource: 'fb', ortiqcha: 'x' }, { 'x-forwarded-for': '203.0.113.7', 'user-agent': 'UA' }));
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { clickId: '90311' });
  assert.deepEqual(calls[0][0], { code: 'k7Qm2x', variant: 's3', sub1: 'abc', utmSource: 'fb' });
  assert.deepEqual(calls[0][1], { forwardedFor: '203.0.113.7', userAgent: 'UA' });
});

test('noto‘g‘ri tana — 400, backend chaqirilmaydi', async () => {
  const { POST, calls } = routeWith(async () => ({ clickId: 'x' }));
  assert.equal((await POST(post('{buzuq'))).status, 400);
  assert.equal((await POST(post({ variant: 's1' }))).status, 400);
  assert.equal(calls.length, 0);
});

test('backend 501/500 — 502, backend 400 — 400; sahifa baribir ishlaydi', async (t) => {
  t.mock.method(console, 'error', () => {});
  for (const [status, expected] of [[501, 502], [500, 502], [400, 400]]) {
    const { POST } = routeWith(async () => { throw new BackendError('x', status); });
    const response = await POST(post({ code: 'k7Qm2x', variant: 's1' }));
    assert.equal(response.status, expected);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
});

test('boshqa saytdan soxta klik rad etiladi: text/plain (sendBeacon), cross-site, boshqa Origin', async () => {
  const { POST, calls } = routeWith(async () => ({ clickId: 'x' }));
  const body = { code: 'k7Qm2x', variant: 's3' };
  assert.equal((await POST(post(body, { 'content-type': 'text/plain;charset=UTF-8' }))).status, 403);
  assert.equal((await POST(post(body, { 'sec-fetch-site': 'cross-site' }))).status, 403);
  assert.equal((await POST(post(body, { origin: 'https://boshqa.example' }))).status, 403);
  assert.equal(calls.length, 0);
  assert.equal((await POST(post(body, { 'sec-fetch-site': 'same-origin', origin: 'http://landing.test' }))).status, 201);
});

test('variant: sahifa ko‘rsatgan variant ketadi (ikki tab cookie’ni almashtirgan bo‘lsa ham); tanada yo‘q bo‘lsa — cookie’dan', async () => {
  const { POST, calls } = routeWith(async () => ({ clickId: 'x' }));
  await POST(post({ code: 'k7Qm2x', variant: 's3' }, { cookie: 'a=1; elchi_variant=s1' }));
  assert.equal(calls[0][0].variant, 's3');
  await POST(post({ code: 'k7Qm2x' }, { cookie: 'a=1; elchi_variant=s1' }));
  assert.equal(calls[1][0].variant, 's1');
});

test('proksi orqasida: X-Forwarded-Host ro‘yxati va standart port bilan haqiqiy klik o‘tadi', async () => {
  const { POST } = routeWith(async () => ({ clickId: 'x' }));
  const body = { code: 'k7Qm2x', variant: 's1' };
  const sameSite = { 'sec-fetch-site': 'same-origin', origin: 'https://sotuv.example' };
  assert.equal((await POST(post(body, { ...sameSite, 'x-forwarded-host': 'sotuv.example, ichki.proksi' }))).status, 201);
  assert.equal((await POST(post(body, { ...sameSite, 'x-forwarded-host': 'SOTUV.example:443' }))).status, 201);
  assert.equal((await POST(post(body, { ...sameSite, 'x-forwarded-host': 'sotuv.example:8443' }))).status, 403);
  assert.equal((await POST(post(body, { ...sameSite, 'x-forwarded-host': 'boshqa.example, sotuv.example' }))).status, 403);
});

test('katta tana — 413, backend chaqirilmaydi', async () => {
  const { POST, calls } = routeWith(async () => ({ clickId: 'x' }));
  const big = { code: 'k7Qm2x', sub1: 'x'.repeat(30_000) };
  assert.equal((await POST(post(big))).status, 413);
  assert.equal((await POST(post({ code: 'k7Qm2x' }, { 'content-length': '999999' }))).status, 413);
  assert.equal(calls.length, 0);
});
