import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';

const t = loadTypeScript('src/lib/tracking.ts');

test('havola parametrlari shartnoma maydonlariga o‘giriladi (SF-02 TC4: ?sub1=abc&utm_source=fb)', () => {
  const search = '?sub1=abc&sub5=e&utm_source=fb&utm_medium=cpc&utm_campaign=c1&utm_content=k&utm_term=t&fbclid=IwAR1&boshqa=x&sub1x=y';
  assert.deepEqual(t.trackingFromQuery(search), {
    sub1: 'abc', sub5: 'e', utmSource: 'fb', utmMedium: 'cpc', utmCampaign: 'c1', utmContent: 'k', utmTerm: 't', fbclid: 'IwAR1',
  });
});

test('bo‘sh parametrlar yuborilmaydi', () => {
  assert.deepEqual(t.trackingFromQuery('?sub1=&utm_source=%20'), {});
});

test('klik: kod, variant, parametrlar va Meta cookie’lari', () => {
  const click = t.buildClick('k7Qm2x', 's3', '?sub2=b', 'a=1; _fbp=fb.1.1700000000.123; _fbc=fb.1.1700000000.IwAR1');
  assert.deepEqual(click, { code: 'k7Qm2x', variant: 's3', sub2: 'b', fbp: 'fb.1.1700000000.123', fbc: 'fb.1.1700000000.IwAR1' });
  assert.deepEqual(t.buildClick('k7Qm2x', 's1', '', ''), { code: 'k7Qm2x', variant: 's1' });
});

test('serverda faqat shartnomadagi maydonlar qoladi; kodsiz klik rad etiladi', () => {
  assert.deepEqual(t.sanitizeClick({ code: ' k7Qm2x ', variant: 's1', sub1: 'a', ip: '1.2.3.4', clickId: 'x', utmSource: 5 }), { code: 'k7Qm2x', variant: 's1', sub1: 'a' });
  assert.deepEqual(t.sanitizeClick({ code: 'k7Qm2x', variant: 's2' }), { code: 'k7Qm2x' });
  for (const bad of [null, 'x', {}, { code: '' }, { code: 1 }]) assert.equal(t.sanitizeClick(bad), null);
});

test('backend DTO uzunlik chegaralari: uzun ixtiyoriy maydon tashlanadi, klik saqlanadi', () => {
  const click = t.sanitizeClick({ code: 'k7Qm2x', sub1: 'a'.repeat(255), sub2: 'a'.repeat(256), fbclid: 'f'.repeat(512), fbc: `fb.1.1700000000000.${'f'.repeat(512)}`, utmContent: 'u'.repeat(300) });
  assert.deepEqual(Object.keys(click).sort(), ['code', 'fbclid', 'sub1']);
  assert.equal(t.sanitizeClick({ code: 'k'.repeat(33) }), null);
  assert.equal(t.sanitizeClick({ code: 'k'.repeat(32) }).code.length, 32);
});

test('variant: HttpOnly cookie ustun, tanadagi qiymat faqat cookie bo‘lmasa', () => {
  assert.equal(t.sanitizeClick({ code: 'k7Qm2x', variant: 's3' }, 's1').variant, 's1');
  assert.equal(t.sanitizeClick({ code: 'k7Qm2x', variant: 's3' }, undefined).variant, 's3');
  assert.equal(t.sanitizeClick({ code: 'k7Qm2x', variant: 's3' }, 'buzuq').variant, 's3');
});
