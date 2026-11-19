#!/usr/bin/env node
/**
 * Build qilingan ilovani ishga tushirib, HTTP orqali tekshiradi (mock backend bilan).
 * `SMOKE_URL` berilsa, o‘sha manzildagi tayyor serverni tekshiradi (CI da Docker konteyneri — TC1).
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const CODE = 'k7Qm2x';

const freePort = () => new Promise((resolve, reject) => {
  const server = createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => { const { port } = server.address(); server.close(() => resolve(port)); });
});

async function waitFor(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { if ((await fetch(url)).ok) return; } catch { /* hali ko‘tarilmagan */ }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`${url} ${timeoutMs} ms ichida javob bermadi`);
}

let child;
let base = process.env.SMOKE_URL?.replace(/\/+$/, '');
if (!base) {
  const port = await freePort();
  base = `http://localhost:${port}`;
  child = spawn(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'start', '-p', String(port)], {
    cwd: root, env: { ...process.env, MOCK_API: 'true', NEXT_PUBLIC_SUPPORT_PHONE: '' }, stdio: ['ignore', 'ignore', 'inherit'],
  });
}

const get = (pathname, cookie) => fetch(`${base}${pathname}`, { redirect: 'manual', headers: cookie ? { cookie } : {} });
const variantCookie = (response) => {
  for (const cookie of response.headers.getSetCookie()) {
    const match = /^elchi_variant=(s1|s3);(.*)$/i.exec(cookie);
    if (match) return match;
  }
  return null;
};
const shownVariant = (html) => /data-page="landing" data-variant="(s1|s3)"/.exec(html)?.[1];

const checks = [];
const check = (name, fn) => checks.push({ name, fn });

check('/healthz → 200, backendsiz', async () => {
  const response = await get('/healthz');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok', service: 'landing' });
});

check('TC4: cookie yo‘q → variant tanlandi, 30 kunlik HttpOnly cookie, sahifa o‘sha variantda, noindex', async () => {
  const response = await get(`/${CODE}`);
  assert.equal(response.status, 200);
  const cookie = variantCookie(response);
  assert.ok(cookie, 'elchi_variant cookie yozilmadi');
  assert.match(cookie[2], /Max-Age=2592000/);
  assert.match(cookie[2], /HttpOnly/i);
  assert.match(cookie[2], /SameSite=lax/i);
  const html = await response.text();
  assert.equal(shownVariant(html), cookie[1]);
  assert.match(html, /Simsiz quloqchinlar/);
  assert.match(html, /262 000 so‘m/);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
  assert.match(html, /<meta name="robots" content="noindex, nofollow"/);
  assert.doesNotMatch(response.headers.get('cache-control') ?? '', /public/);
});

check('TC4: qayta ochilganda o‘sha variant, cookie qayta yozilmaydi', async () => {
  for (const variant of ['s1', 's3']) {
    const response = await get(`/${CODE}`, `elchi_variant=${variant}`);
    assert.equal(response.status, 200);
    assert.equal(variantCookie(response), null);
    assert.equal(shownVariant(await response.text()), variant);
  }
});

check('bo‘linish: 64 yangi tashrifda ikkala variant ham chiqadi', async () => {
  const seen = new Set();
  for (let i = 0; i < 64 && seen.size < 2; i += 1) seen.add(variantCookie(await get(`/${CODE}`))?.[1]);
  assert.deepEqual([...seen].sort(), ['s1', 's3']);
});

check('TC2: sahifada savat va sevimlilar so‘rovlari yo‘q', async () => {
  const html = await (await get(`/${CODE}`, 'elchi_variant=s1')).text();
  assert.doesNotMatch(html, /\/api\/(?:cart|favorites|backend)|\/cart\b|\/favorites\b/);
});

check('TC3: noma’lum kod → 404, 404-1 matni va ochilgan havola', async () => {
  const response = await get('/nomalumKod');
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
  const html = await response.text();
  assert.match(html, /Bu havola bo‘yicha sahifa topilmadi/);
  assert.match(html, /\/nomalumKod/);
  assert.match(html, /To‘g‘ri havola ochilganda/);
  assert.doesNotMatch(html, /EQ-05|\[telefon/, 'telefon sozlanmagan — blok chiqmasligi kerak');
});

check('ichki /v/s3/<kod> tashqaridan → 404', async () => {
  assert.equal((await get(`/v/s3/${CODE}`, 'elchi_variant=s1')).status, 404);
});

check('backend xatosi → xato-1 serverda chiziladi (JS siz ham ko‘rinadi)', async () => {
  const html = await (await get('/mockXato')).text();
  assert.match(html, /Sahifani ochib bo‘lmadi/);
  // «Qayta urinish» joriy manzilni (havola parametrlari bilan) qayta ochadi.
  assert.match(html, /<a class="button button--secondary" href="">/);
});

check('POST /api/clicks → 201 clickId', async () => {
  const response = await fetch(`${base}/api/clicks`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: CODE, variant: 's3', sub1: 'abc' }) });
  assert.equal(response.status, 201);
  assert.match((await response.json()).clickId, /^mock-s3-/);
});

check('brauzer klik: Origin va Sec-Fetch-Site same-origin bilan → 201', async () => {
  const headers = { 'content-type': 'application/json', origin: base, 'sec-fetch-site': 'same-origin' };
  const response = await fetch(`${base}/api/clicks`, { method: 'POST', headers, body: JSON.stringify({ code: CODE, variant: 's1' }) });
  assert.equal(response.status, 201);
});

check('boshqa saytdan klik (text/plain, sendBeacon kabi) → 403', async () => {
  const response = await fetch(`${base}/api/clicks`, { method: 'POST', headers: { 'content-type': 'text/plain' }, body: JSON.stringify({ code: CODE, variant: 's3' }) });
  assert.equal(response.status, 403);
});

// ─── SF-02 ─────────────────────────────────────────────────────────────────────
const text = async (response) => (await response.text()).replaceAll('<!-- -->', '');
const page = async (pathname, variant) => text(await get(pathname, `elchi_variant=${variant}`));
const arizaCookie = (response) => response.headers.getSetCookie().find((value) => value.startsWith('elchi_ariza='))?.split(';')[0];

/** JS siz yuborish: sahifadagi forma (server action yashirin maydonlari bilan) oddiy POST bo‘ladi. */
async function submitWithoutJs(pathname, variant, fields) {
  const html = await (await get(pathname, `elchi_variant=${variant}`)).text();
  const form = /<form id="lead-form"[\s\S]*?<\/form>/.exec(html)?.[0];
  assert.ok(form, 'sahifada lead-form yo‘q');
  const data = new FormData();
  for (const [, name, value = ''] of form.matchAll(/<input type="hidden" name="([^"]+)"(?: value="([^"]*)")?\/>/g)) {
    data.append(name.replaceAll('&amp;', '&'), value.replaceAll('&quot;', '"').replaceAll('&amp;', '&'));
  }
  for (const [name, value] of Object.entries(fields)) data.append(name, value);
  return fetch(`${base}${pathname.split('?')[0]}`, { method: 'POST', redirect: 'manual', body: data, headers: { cookie: `elchi_variant=${variant}`, origin: base, referer: `${base}${pathname}` } });
}

check('S1: forma sahifaning o‘zida, yetkazish tanlovi, jami ikkala holati; S3: forma keyingi qadamda', async () => {
  const s1 = await page(`/${CODE}`, 's1');
  assert.match(s1, /<form id="lead-form"/);
  assert.match(s1, /name="whereDeliver" value="ADDRESS" form="lead-form"|name="whereDeliver" form="lead-form" value="ADDRESS"|form="lead-form"[^>]*value="ADDRESS"/);
  assert.match(s1, /Jami 292 000 so‘m/);
  assert.match(s1, /Eshikkacha bo‘lsa — 312 000 so‘m/);
  const s3 = await page(`/${CODE}`, 's3');
  assert.doesNotMatch(s3, /id="lead-form"/);
  assert.match(s3, /<form id="s3-order" class="buybox" action="\/k7Qm2x\/buyurtma" method="get">/);
  assert.match(s3, /Hozir hech narsa to‘lamaysiz/);
  const order = await page(`/${CODE}/buyurtma?whereDeliver=ADDRESS`, 's3');
  assert.match(order, /Ism, raqam va manzilingizni qoldiring/);
  assert.match(order, /<input type="hidden" name="variant" value="s3"\/>/);
  assert.match(order, /name="whereDeliver" checked="" value="ADDRESS"/);
  assert.equal((await get(`/${CODE}/buyurtma`, 'elchi_variant=s1')).status, 307);
});

check('TC5: JS siz forma yuborildi → 303 «Rahmat», ism va raqam cookie’da (URL da emas), Pixels ga lid ID uzatiladi', async () => {
  const response = await submitWithoutJs(`/${CODE}?sub1=abc&utm_source=fb`, 's1', { ism: 'Aziza', telefon: '90 123 45 67', rozilik: '1', whereDeliver: 'ADDRESS' });
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), `/${CODE}/rahmat`);
  const ariza = arizaCookie(response);
  assert.ok(ariza, 'elchi_ariza cookie yo‘q');
  const thanks = await text(await get(`/${CODE}/rahmat`, `elchi_variant=s1; ${ariza}`));
  assert.match(thanks, /Rahmat, Aziza!/);
  assert.match(thanks, /\+998 90 123 45 67/);
  assert.match(thanks, /Yetkazish eshikkacha/);
  assert.match(thanks, /Jami 312 000 so‘m/);
  assert.match(thanks, /\\"leadId\\":\\"\d+\\"/);
});

check('TC1: noto‘g‘ri telefon → yuborilmaydi, yozilganlar saqlanadi (forma-10)', async () => {
  const response = await submitWithoutJs(`/${CODE}`, 's1', { ism: 'Aziza', telefon: '90 123', rozilik: '1', whereDeliver: 'ADDRESS' });
  assert.equal(response.status, 200);
  assert.equal(arizaCookie(response), undefined);
  const html = await text(response);
  assert.match(html, /Arizani yuborib bo‘lmadi — 1 ta maydonni to‘g‘rilang:/);
  assert.match(html, /Raqamni to‘liq kiriting: 9 ta raqam, masalan 90\u00a0123\u00a045\u00a067/);
  assert.match(html, /value="Aziza"/);
  // Tanlangan «Eshikkacha» xatodan keyin ham tanlangan (P-1): qayta yuborishda lid eshikkacha bo‘ladi.
  assert.match(html, /<input type="radio"[^>]*name="whereDeliver"[^>]*checked=""[^>]*value="ADDRESS"/);
  assert.match(html, /Jami 312 000 so‘m/);
});

check('TC2: server xatosi → «Rahmat» yo‘q, piksel yo‘q (forma-11)', async () => {
  const response = await submitWithoutJs(`/${CODE}`, 's1', { ism: 'Xato Sinov', telefon: '901234567', rozilik: '1' });
  assert.equal(response.status, 200);
  assert.equal(arizaCookie(response), undefined);
  const html = await text(response);
  assert.match(html, /Arizangiz hali yuborilmadi/);
  assert.match(html, /Qayta yuborish/);
  assert.doesNotMatch(html, /leadId/);
});

check('dublikat (rahmat-4) va «Rahmat» cookie’siz: piksel yo‘q, sahifaga qaytadi', async () => {
  const response = await submitWithoutJs(`/${CODE}/buyurtma`, 's3', { ism: 'Aziza', telefon: '90 111 11 11', rozilik: '1' });
  assert.equal(response.headers.get('location'), `/${CODE}/rahmat`);
  assert.equal(response.status, 303);
  const thanks = await text(await get(`/${CODE}/rahmat`, `elchi_variant=s3; ${arizaCookie(response)}`));
  assert.match(thanks, /Bu tovarga arizangiz bizda bor/);
  assert.doesNotMatch(thanks, /leadId/);
  assert.equal((await get(`/${CODE}/rahmat`, 'elchi_variant=s1')).status, 307);
});

check('yashirin maydon to‘ldirilgan (forma-13): bot oddiy «Rahmat» ko‘radi, Pixels ga lid ID uzatilmaydi', async () => {
  const response = await submitWithoutJs(`/${CODE}`, 's1', { ism: 'Bot', telefon: '901234567', rozilik: '1', website: 'https://spam.example' });
  assert.equal(response.status, 303);
  const thanks = await text(await get(`/${CODE}/rahmat`, `elchi_variant=s1; ${arizaCookie(response)}`));
  assert.match(thanks, /Rahmat, Bot!/);
  assert.doesNotMatch(thanks, /leadId/);
});

check('S3 JS siz: buyurtma qadami mahsulot sahifasi havolasidagi sub va utm ni yashirin maydonda olib o‘tadi (TC4)', async () => {
  const response = await fetch(`${base}/${CODE}/buyurtma?whereDeliver=ADDRESS`, { headers: { cookie: 'elchi_variant=s3', referer: `${base}/${CODE}?sub1=abc&utm_source=fb` } });
  const html = await text(response);
  assert.match(html, /<input type="hidden" name="sub1" value="abc"\/>/);
  assert.match(html, /<input type="hidden" name="utmSource" value="fb"\/>/);
});

check('«Ommaviy oferta» havolasi sotuvchi sahifasi kodi deb qaralmaydi', async () => {
  const response = await get('/oferta', 'elchi_variant=s1');
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('set-cookie'), null);
});

check('TC7: BAD tovar — «Dori vositasi emas» S1 va S3 da; TC8: ochiq bo‘lmagan sahifada forma va xarid tugmasi yo‘q', async () => {
  for (const variant of ['s1', 's3']) assert.match(await page('/mockBad', variant), /Dori vositasi emas/);
  assert.match(await page('/mockBepul', 's1'), /Yetkazish bepul/);
  for (const [code, words] of [['mockYoq', /Vaqtincha yo‘q/], ['mockHavola', /Bu havola orqali hozir buyurtma qabul qilinmaydi/], ['mockOlingan', /Bu tovar sotuvdan olingan/]]) {
    for (const variant of ['s1', 's3']) {
      const html = await page(`/${code}`, variant);
      assert.match(html, words);
      assert.doesNotMatch(html, /lead-form|s3-order|Buyurtma berish|metaPixelId/);
    }
  }
});

let failed = 0;
try {
  await waitFor(`${base}/healthz`, 30_000);
  for (const { name, fn } of checks) {
    try { await fn(); console.log(`ok - ${name}`); } catch (error) { failed += 1; console.error(`not ok - ${name}\n  ${error.message}`); }
  }
} finally {
  child?.kill('SIGTERM');
}
console.log(`\n${checks.length - failed}/${checks.length} o‘tdi`);
process.exit(failed ? 1 : 0);
