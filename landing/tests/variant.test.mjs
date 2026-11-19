import assert from 'node:assert/strict';
import test from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';

const v = loadTypeScript('src/lib/variant.ts');

test('variantlar faqat s1 va s3 (BE-25: CreateLandingClickDto.variant)', () => {
  assert.deepEqual([...v.VARIANTS], ['s1', 's3']);
  assert.equal(v.isVariant('s1'), true);
  assert.equal(v.isVariant('s3'), true);
  for (const bad of ['s2', 'S1', '', undefined, null, 1]) assert.equal(v.isVariant(bad), false);
});

test('bo‘linish aniq 50/50: 256 bayt qiymatining yarmi s1, yarmi s3 (SF-01)', () => {
  const counts = { s1: 0, s3: 0 };
  for (let byte = 0; byte < 256; byte += 1) counts[v.variantFromByte(byte)] += 1;
  assert.deepEqual(counts, { s1: 128, s3: 128 });
});

test('TC5: sintetik tashriflarda Web Crypto bilan bo‘linish 50/50 ga yaqin', () => {
  // 200 000 tashrif; ±1% chegara ~9 standart og‘ish — tasodifan yiqilmaydi. Chegara test uchun, biznes qoidasi emas.
  const visits = 200_000;
  let s1 = 0;
  for (let i = 0; i < visits; i += 1) if (v.pickVariant() === 's1') s1 += 1;
  const share = s1 / visits;
  assert.ok(share > 0.49 && share < 0.51, `s1 ulushi ${share}`);
});

test('cookie’dagi to‘g‘ri variant saqlanadi, yangi cookie yozilmaydi', () => {
  const never = () => { throw new Error('tasodif chaqirilmasligi kerak'); };
  assert.deepEqual(v.resolveVariant('s3', never), { variant: 's3', assigned: false });
  assert.deepEqual(v.resolveVariant('s1', never), { variant: 's1', assigned: false });
});

test('cookie yo‘q yoki buzuq — yangi tanlov va cookie yoziladi', () => {
  assert.deepEqual(v.resolveVariant(undefined, () => 0), { variant: 's1', assigned: true });
  assert.deepEqual(v.resolveVariant('s2', () => 1), { variant: 's3', assigned: true });
  assert.deepEqual(v.resolveVariant('', () => 7), { variant: 's3', assigned: true });
});

test('cookie 30 kun (TZ 01, 9-qoida), HttpOnly, SameSite=Lax, butun domen', () => {
  assert.equal(v.VARIANT_COOKIE_MAX_AGE, 2_592_000);
  assert.deepEqual(v.variantCookieOptions(true), { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 2_592_000 });
  assert.equal(v.variantCookieOptions(false).secure, false);
});
