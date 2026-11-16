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
  assert.match(html, /href="\/mockXato"/);
});

check('POST /api/clicks → 201 clickId', async () => {
  const response = await fetch(`${base}/api/clicks`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: CODE, variant: 's3', sub1: 'abc' }) });
  assert.equal(response.status, 201);
  assert.match((await response.json()).clickId, /^mock-s3-/);
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
