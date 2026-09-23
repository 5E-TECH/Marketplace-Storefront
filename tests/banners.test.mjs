import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import { loadTypeScript } from './load-typescript.mjs';

const schemas = JSON.parse(fs.readFileSync(new URL('../contract/openapi.json', import.meta.url))).components.schemas;
const config = { env: { apiUrl: 'https://example.test/api/v1', apiTimeoutMs: 1000 } };

const banner = (overrides = {}) => ({ id: '3', title: '50% chegirma', imageUrl: 'https://api.elchimarket.uz/media/b.jpg', linkUrl: null, sortOrder: 10, ...overrides });
const service = () => loadTypeScript('src/services/banner.service.ts', { '@/config/env': config });

test('kontraktda /storefront/banners va StorefrontBannerDto bor', () => {
  const spec = JSON.parse(fs.readFileSync(new URL('../contract/openapi.json', import.meta.url)));
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
  const { bannerService } = service();
  const result = await bannerService.list();
  assert.equal(result.source, 'api');
  assert.deepEqual(result.data.map((item) => item.id), ['1', '2']);
});

test('kesh bosh sahifaning qolgan bo‘limlari bilan bir xil (30s)', async (t) => {
  t.mock.method(globalThis, 'fetch', async (_url, options) => {
    assert.deepEqual(options.next, { revalidate: 30 });
    return Response.json({ statusCode: 200, data: [] });
  });
  const { bannerService } = service();
  assert.equal((await bannerService.list()).source, 'api');
});

test('backend yiqilsa bosh sahifa yiqilmaydi — bo‘sh ro‘yxat qaytadi', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('connect ECONNREFUSED'); });
  const { bannerService } = service();
  const result = await bannerService.list();
  assert.deepEqual(result.data, []);
  assert.equal(result.source, 'unavailable');
});

test('kontraktga mos kelmagan javob qabul qilinmaydi', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ statusCode: 200, data: [{ id: '3' }] }));
  const { bannerService } = service();
  assert.deepEqual((await bannerService.list()).data, []);
});

test('xavfsiz bo‘lmagan havola bosiladigan banner yaratmaydi', () => {
  const { safeBannerHref, normalizeBanner } = service();
  assert.equal(safeBannerHref('/katalog/telefon'), '/katalog/telefon');
  assert.equal(safeBannerHref('https://elchimarket.uz/aksiya'), 'https://elchimarket.uz/aksiya');
  assert.equal(safeBannerHref('javascript:alert(1)'), undefined);
  assert.equal(safeBannerHref('//evil.example.com'), undefined);
  assert.equal(safeBannerHref('   '), undefined);
  assert.equal(safeBannerHref(null), undefined);
  assert.equal(normalizeBanner(banner({ linkUrl: 'javascript:alert(1)' })).linkUrl, undefined);
});

test('ishonchsiz domendagi rasm o‘rniga zaxira rasm qo‘yiladi', () => {
  const { normalizeBanner } = service();
  assert.equal(normalizeBanner(banner()).imageUrl, 'https://api.elchimarket.uz/media/b.jpg');
  assert.notEqual(normalizeBanner(banner({ imageUrl: 'https://evil.example.com/x.jpg' })).imageUrl, 'https://evil.example.com/x.jpg');
});

test('bo‘sh ro‘yxatda banner bloki umuman chizilmaydi', () => {
  const source = fs.readFileSync(new URL('../src/components/home-sections.tsx', import.meta.url), 'utf8');
  const body = source.slice(source.indexOf('export function Banners'));
  assert.match(body.slice(0, 200), /if \(!banners\.length\) return null;/);
});

test('bosh sahifa bannerlarni StorefrontHome ga uzatadi', () => {
  const page = fs.readFileSync(new URL('../src/app/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /bannerService\.list\(\)/);
  assert.match(page, /banners=\{banners\.data\}/);
  const home = fs.readFileSync(new URL('../src/components/storefront-home.tsx', import.meta.url), 'utf8');
  assert.match(home, /<Banners banners=\{banners\}\/>/);
});

test('telefon ekrani uchun alohida uslub bor', () => {
  const css = fs.readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');
  const mobile = css.slice(css.indexOf('@media (max-width: 720px)'));
  assert.match(mobile, /\.home-banners \{ grid-template-columns: 1fr;/);
});
