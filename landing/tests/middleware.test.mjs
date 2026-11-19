import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { loadTypeScript } from './load-typescript.mjs';

const require = createRequire(import.meta.url);
const { NextRequest } = require('next/server');
const { handle } = loadTypeScript('src/middleware.ts');
const routing = loadTypeScript('src/lib/routing.ts');

const request = (path, headers = {}) => new NextRequest(`http://landing.test${path}`, { headers });
const rewriteOf = (response) => {
  const target = response.headers.get('x-middleware-rewrite');
  return target ? new URL(target).pathname : null;
};
const variantCookie = (response) => response.cookies.get('elchi_variant');
/** SF-03: variant sahifaga so‘rov sarlavhasi bilan o‘tadi (NextResponse.next({ request: { headers } })). */
const variantOf = (response) => response.headers.get(`x-middleware-request-${routing.VARIANT_HEADER}`);

test('yo‘llar: kod, ichki variant yo‘li va boshqalar', () => {
  assert.deepEqual(routing.classifyPath('/k7Qm2x'), { kind: 'landing', code: 'k7Qm2x' });
  assert.deepEqual(routing.classifyPath('/a_b-9'), { kind: 'landing', code: 'a_b-9' });
  assert.deepEqual(routing.classifyPath('/v/s1/k7Qm2x'), { kind: 'internal' });
  assert.deepEqual(routing.classifyPath('/v'), { kind: 'internal' });
  for (const other of ['/', '/robots.txt', '/a/b', '/%2e%2e', '/k7Qm2x/']) assert.deepEqual(routing.classifyPath(other), { kind: 'other' }, other);
});

test('TC4: cookie yo‘q brauzer — variant tanlanadi, 30 kunlik cookie yoziladi, sahifa o‘sha variantda', () => {
  const s1 = handle(request('/k7Qm2x'), () => 0);
  assert.equal(variantOf(s1), 's1');
  assert.equal(rewriteOf(s1), null);
  assert.equal(variantCookie(s1)?.value, 's1');
  assert.equal(variantCookie(s1)?.maxAge, 2_592_000);
  assert.equal(variantCookie(s1)?.httpOnly, true);

  const s3 = handle(request('/k7Qm2x'), () => 1);
  assert.equal(variantOf(s3), 's3');
  assert.equal(variantCookie(s3)?.value, 's3');
});

test('TC4: qayta ochilganda o‘sha variant, cookie qayta yozilmaydi', () => {
  const never = () => { throw new Error('qayta tanlanmasligi kerak'); };
  for (const variant of ['s1', 's3']) {
    const response = handle(request('/k7Qm2x', { cookie: `elchi_variant=${variant}` }), never);
    assert.equal(variantOf(response), variant);
    assert.equal(variantCookie(response), undefined);
  }
});

test('buzuq cookie — qayta tanlanadi', () => {
  const response = handle(request('/k7Qm2x', { cookie: 'elchi_variant=s2' }), () => 1);
  assert.equal(variantOf(response), 's3');
  assert.equal(variantCookie(response)?.value, 's3');
});

test('HTTPS orqasida cookie Secure bo‘ladi', () => {
  const response = handle(request('/k7Qm2x', { 'x-forwarded-proto': 'https' }), () => 0);
  assert.equal(variantCookie(response)?.secure, true);
  assert.equal(variantCookie(handle(request('/k7Qm2x'), () => 0))?.secure, false);
});

test('ichki /v/… yo‘li tashqaridan ochilmaydi — variantni havola bilan tanlab bo‘lmaydi', () => {
  const response = handle(request('/v/s3/k7Qm2x', { cookie: 'elchi_variant=s1' }), () => 0);
  assert.equal(rewriteOf(response), routing.NOT_FOUND_PATH);
  assert.equal(variantCookie(response), undefined);
});

test('SF-03: mijoz yuborgan variant sarlavhasi hech qachon o‘tmaydi; sahifa javobi umumiy keshga tushmaydi', () => {
  const forged = { [routing.VARIANT_HEADER]: 's3' };
  const landing = handle(request('/k7Qm2x', { ...forged, cookie: 'elchi_variant=s1' }), () => 1);
  assert.equal(variantOf(landing), 's1');
  assert.equal(landing.headers.get('cache-control'), routing.LANDING_CACHE_CONTROL);
  for (const path of ['/healthz', '/oferta', '/a/b', '/k7Qm2x/']) {
    const other = handle(request(path, forged), () => 0);
    assert.equal(variantOf(other), null, path);
    // Next: `x-middleware-override-headers` bor bo‘lsa, so‘rov sarlavhalari faqat ro‘yxatdagilar bilan almashtiriladi.
    assert.ok(other.headers.has('x-middleware-override-headers'), `${path}: sarlavhalar qayta yozildi`);
    assert.doesNotMatch(other.headers.get('x-middleware-override-headers') ?? '', new RegExp(routing.VARIANT_HEADER), path);
  }
  assert.equal(variantOf(handle(request('/k7Qm2x/rahmat', forged), () => 0)), 's1');
});
