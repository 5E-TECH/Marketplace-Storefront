import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { loadTypeScript } from './load-typescript.mjs';

const schemas = JSON.parse(fs.readFileSync(new URL('../contract/openapi.json', import.meta.url))).components.schemas;
const config = { env: { apiUrl: 'https://example.test/api/v1', apiTimeoutMs: 1000 } };
const seo = { siteUrl: () => 'https://elchimarket.uz' };
const media = 'https://api.elchimarket.uz/media/marketplace-media/banners';

const banner = (overrides = {}) => ({ id: '3', title: '50% chegirma', imageUrl: `${media}/b.jpg`, linkUrl: null, sortOrder: 10, ...overrides });
const service = (mocks = {}) => loadTypeScript('src/services/banner.service.ts', { '@/config/env': config, '@/lib/seo': seo, ...mocks });
const source = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('kontraktda /storefront/banners va StorefrontBannerDto bor', () => {
  const spec = JSON.parse(source('contract/openapi.json'));
  assert.ok(spec.paths['/api/v1/storefront/banners']?.get, 'GET /storefront/banners kontraktda yo‘q');
  assert.deepEqual(
    Object.keys(schemas.StorefrontBannerDto.properties).sort(),
    ['id', 'imageUrl', 'linkUrl', 'sortOrder', 'title'],
  );
});

test('bosh sahifa bannerlarni backenddan oladi va sortOrder bo‘yicha tartiblaydi', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(url, 'https://example.test/api/v1/storefront/banners');
    return Response.json({ statusCode: 200, data: [banner({ id: '2', sortOrder: 30 }), banner({ id: '1', sortOrder: 5 })] });
  });
  const result = await service().bannerService.list();
  assert.equal(result.source, 'api');
  assert.deepEqual(result.data.map((item) => item.id), ['1', '2']);
});

test('bannerlar keshsiz olinadi — muddati tugagan banner eskirgan keshdan chiqmaydi', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.equal(options.cache, 'no-store');
    assert.equal(options.next, undefined);
    return Response.json({ statusCode: 200, data: [] });
  });
  assert.equal((await service().bannerService.list()).source, 'api');
});

test('banner so‘rovi qisqa timeout bilan — sekin API bosh sahifani ushlab turmaydi', async () => {
  let options;
  const api = { apiRequest: async (_path, value) => { options = value; return []; } };
  await service({ '@/lib/api': api }).bannerService.list();
  assert.equal(options.timeoutMs, 3000);
  assert.equal(options.cache, 'no-store');
});

test('backend yiqilsa bosh sahifa yiqilmaydi — bo‘sh ro‘yxat qaytadi', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('connect ECONNREFUSED'); });
  const result = await service().bannerService.list();
  assert.deepEqual(result.data, []);
  assert.equal(result.source, 'unavailable');
});

test('kontraktga mos kelmagan javob qabul qilinmaydi', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ statusCode: 200, data: [{ id: '3' }] }));
  assert.deepEqual((await service().bannerService.list()).data, []);
});

test('havola: faqat xavfsiz va sahifa ochadigan manzil bosiladi', () => {
  const { safeBannerHref, normalizeBanner } = service();
  const cases = {
    '/katalog/telefon': '/katalog/telefon',
    '/': '/',
    'https://instagram.com/elchimarket': 'https://instagram.com/elchimarket',
    // o'z saytimiz — ichki yo'lga aylanadi, yangi tabda ochilmaydi
    'https://elchimarket.uz/aksiya?x=1#top': '/aksiya?x=1#top',
    'https://www.elchimarket.uz/katalog': '/katalog',
    'https://elchimarket.uz': '/',
  };
  for (const [input, expected] of Object.entries(cases)) assert.equal(safeBannerHref(input), expected, input);
  for (const input of [
    'javascript:alert(1)', '//evil.example.com', '/\\evil.example.com', '/a\\b', '/katalog telefon',
    '/storefront/products?categoryId=7', '/api/backend/orders', 'https://elchimarket.uz/storefront/products',
    'katalog/telefon', 'data:text/html,x', '   ', null, undefined,
  ]) assert.equal(safeBannerHref(input), undefined, String(input));
  assert.equal(normalizeBanner(banner({ linkUrl: 'javascript:alert(1)' })).linkUrl, undefined);
});

test('ishonchsiz domendagi rasm o‘rniga zaxira rasm qo‘yiladi', () => {
  const { normalizeBanner } = service();
  assert.equal(normalizeBanner(banner()).imageUrl, `${media}/b.jpg`);
  assert.notEqual(normalizeBanner(banner({ imageUrl: 'https://evil.example.com/x.jpg' })).imageUrl, 'https://evil.example.com/x.jpg');
});

test('bo‘sh ro‘yxatda banner bloki umuman chizilmaydi', () => {
  const body = source('src/components/home-sections.tsx');
  const component = body.slice(body.indexOf('export function Banners'));
  assert.match(component.slice(0, 200), /if \(!banners\.length\) return null;/);
});

test('rasm alt bo‘sh — sarlavha ekran o‘quvchida ikki marta o‘qilmaydi', () => {
  const body = source('src/components/home-sections.tsx');
  const component = body.slice(body.indexOf('export function Banners'), body.indexOf('const categoryIds'));
  assert.match(component, /<Image src=\{getSafeImageSrc\(banner\.imageUrl\)\} alt="" fill sizes=\{sizes\}\/>/);
});

test('sizes ustunlar soniga mos: 1 banner to‘liq kenglikda xira chiqmaydi', () => {
  const body = source('src/components/home-sections.tsx');
  assert.match(body, /if \(count === 1\) return "\(max-width: 1280px\) calc\(100vw - 24px\), 1240px";/);
  assert.match(body, /data-columns=\{Math\.min\(banners\.length, 3\)\}/);
  const css = source('src/app/globals.css');
  assert.match(css, /\.home-banners\[data-columns="1"\] \{ grid-template-columns: minmax\(0, 1fr\); \}/);
  assert.match(css, /\.home-banners\[data-columns="2"\] \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/);
});

test('sarlavha ikki qator bilan cheklangan va och rasmda ham o‘qiladi', () => {
  const css = source('src/app/globals.css');
  const rule = css.match(/\.home-banner-title \{[^}]*\}/)[0];
  assert.match(rule, /-webkit-line-clamp: 2/);
  assert.match(rule, /rgba\(10,10,14,\.76\) 70%/);
});

test('bosh sahifa bannerlarni StorefrontHome ga uzatadi', () => {
  const page = source('src/app/page.tsx');
  assert.match(page, /bannerService\.list\(\)/);
  assert.match(page, /banners=\{banners\.data\}/);
  assert.match(source('src/components/storefront-home.tsx'), /<Banners banners=\{banners\}\/>/);
});

test('telefonda bitta ustun — data-columns qoidasidan ustun turadi', () => {
  const css = source('src/app/globals.css');
  const mobile = css.slice(css.indexOf('@media (max-width: 720px)'));
  assert.match(mobile, /\.home-banners, \.home-banners\[data-columns\] \{ grid-template-columns: minmax\(0, 1fr\);/);
});

test('storefront xavfsizlik sarlavhalarini o‘zi qo‘yadi (Cloudflare Caddy’siz ulanadi)', async () => {
  const { default: config, securityHeaders } = loadTypeScript('next.config.ts');
  const [rule] = await config.headers();
  assert.equal(rule.source, '/:path*');
  const headers = Object.fromEntries(securityHeaders(true).map(({ key, value }) => [key, value]));
  assert.equal(headers['X-Frame-Options'], 'DENY');
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.equal(headers['Content-Security-Policy'], "frame-ancestors 'none'");
  assert.equal(headers['Strict-Transport-Security'], 'max-age=31536000');
  // Lokal http'da HSTS yuborilmaydi.
  assert.ok(!securityHeaders(false).some(({ key }) => key === 'Strict-Transport-Security'));
});
