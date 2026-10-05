import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTypeScript } from './load-typescript.mjs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

function withBrowser(t, { document } = {}) {
  const stored = new Map();
  const originals = Object.fromEntries(['window', 'localStorage', 'document'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.defineProperty(globalThis, 'window', { configurable: true, writable: true, value: { addEventListener: () => {} } });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key) => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, String(value)), removeItem: (key) => stored.delete(key) } });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: document ?? { readyState: 'complete', querySelector: () => null } });
  t.after(() => {
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  });
  return stored;
}

test('savat mahsulotlari brauzerda saqlanadi: sahifa yangilanganda har mahsulot uchun GET ketmaydi', async (t) => {
  const stored = withBrowser(t);
  let productRequests = 0;
  const api = {
    ApiError: class ApiError extends Error {},
    apiRequest: async (path) => {
      if (path === '/cart') return { items: [{ id: 'row-1', productId: 9, variantId: 'v9', shopId: '3', quantity: 2, unitPriceSnapshot: 90 }] };
      productRequests++;
      return { id: 9, name: 'Asal', price: 90, images: [] };
    },
  };
  const load = () => loadTypeScript('src/services/cart.service.ts', { '@/lib/api': api }).cartService;
  assert.equal((await load().get()).items[0].product.name, 'Asal');
  assert.equal(productRequests, 1);
  // Yangi modul — sahifa qayta yuklangandek: xotira keshi bo'sh, brauzer nusxasi bor.
  const reloaded = await load().get();
  assert.equal(reloaded.items[0].product.name, 'Asal');
  assert.equal(reloaded.items[0].product.price, 90, 'narx baribir savatdagi snapshot’dan');
  assert.equal(productRequests, 1, 'saqlangan mahsulot uchun backendga qayta GET ketmaydi');
  // 30 daqiqadan eski nusxa ishlatilmaydi.
  const saved = JSON.parse(stored.get('elchi_cart_products_v1'));
  saved['9'].savedAt -= 31 * 60_000;
  stored.set('elchi_cart_products_v1', JSON.stringify(saved));
  await load().get();
  assert.equal(productRequests, 2);
});

test('savatdan chiqqan mahsulot brauzer nusxasidan ham o‘chadi', async (t) => {
  const stored = withBrowser(t);
  let items = [{ id: 'row-1', productId: 9, variantId: 'v9', shopId: '3', quantity: 1, unitPriceSnapshot: 90 }];
  const { cartService } = loadTypeScript('src/services/cart.service.ts', {
    '@/lib/api': { ApiError: class ApiError extends Error {}, apiRequest: async (path) => path === '/cart' ? { items } : { id: 9, name: 'Asal', images: [] } },
  });
  await cartService.get();
  assert.deepEqual(Object.keys(JSON.parse(stored.get('elchi_cart_products_v1'))), ['9']);
  items = [];
  await cartService.get();
  assert.deepEqual(JSON.parse(stored.get('elchi_cart_products_v1')), {});
});

test('Googlebot, Yandex va Telegram metadata’ni <head> ichida oladi; rasmlar WebP va uzoq keshda', () => {
  const { default: config } = loadTypeScript('next.config.ts');
  for (const userAgent of ['Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)', 'TelegramBot (like TwitterBot)', 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)']) {
    assert.ok(config.htmlLimitedBots.test(userAgent), userAgent);
  }
  assert.equal(config.htmlLimitedBots.test('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36'), false, 'oddiy brauzer metadata’ni oqim bilan oladi');
  assert.deepEqual(config.images.formats, ['image/webp']);
  assert.ok(config.images.minimumCacheTTL >= 24 * 60 * 60);
});

test('kategoriya va do‘kon ro‘yxati JSON-LD’da sahifa tartibi bilan, sahifa yo‘li BreadcrumbList bilan', () => {
  const seo = loadTypeScript('src/lib/seo.ts', { '@/lib/catalog-query': loadTypeScript('src/lib/catalog-query.ts') });
  const list = seo.productListLd('Choy', '/katalog/choy', [{ id: 5, name: 'Qora choy' }, { id: 'a b', name: 'Ko‘k choy' }], 20);
  assert.equal(list['@type'], 'CollectionPage');
  assert.deepEqual(list.mainEntity.itemListElement.map((item) => [item.position, item.url]), [[21, seo.absoluteUrl('/product/5')], [22, seo.absoluteUrl('/product/a%20b')]]);
  const crumbs = seo.breadcrumbLd([{ name: 'Bosh sahifa', path: '/' }, { name: 'Choy', path: '/katalog/choy' }]);
  assert.deepEqual(crumbs.itemListElement.map((item) => [item.position, item.item]), [[1, seo.absoluteUrl('/')], [2, seo.absoluteUrl('/katalog/choy')]]);
  for (const file of ['src/app/katalog/[slug]/page.tsx', 'src/app/dokon/[slug]/page.tsx']) assert.match(read(file), /productListLd\(/, file);
});

test('mahsulot sahifasi: sarlavhada narx, o‘xshash mahsulotlar asosiy kontentni ushlab turmaydi', () => {
  const page = read('src/app/product/[id]/page.tsx');
  assert.match(page, /`\$\{product\.name\} — narxi \$\{price\} so‘m`/);
  assert.match(page, /<Suspense fallback=\{null\}><SimilarProducts product=\{product\}\/><\/Suspense>/);
  const metadata = page.slice(page.indexOf('export async function generateMetadata'), page.indexOf('async function SimilarProducts'));
  assert.doesNotMatch(metadata, /listByShop|productService\.list\(/, 'metadata o‘xshash mahsulotlarni kutmaydi');
  assert.match(page, /reviewService\.list\(id, reviewPage, 5, 3000\)/, 'sekin sharhlar sahifani 3 soniyadan ortiq ushlamaydi');
  assert.match(read('src/components/product-reviews.tsx'), /IntersectionObserver/, 'xarid tekshiruvi faqat sharh bloki yaqinlashganda');
});

test('savat qatorida yagona “Default” variant ko‘rsatilmaydi, haqiqiy variant nomi ko‘rsatiladi', () => {
  const Stub = () => null;
  const { CartItemRow } = loadTypeScript('src/components/cart-item-row.tsx', {
    'next/link': { __esModule: true, default: ({ href, children }) => React.createElement('a', { href }, children) },
    'next/image': { __esModule: true, default: () => null },
    'lucide-react': { Trash2: Stub },
    './ui': { FavoriteButton: Stub, Price: Stub, QuantityStepper: Stub },
  });
  const render = (variants, variantId) => renderToStaticMarkup(React.createElement(CartItemRow, {
    item: { id: 'r', productId: 1, variantId, shopId: 1, quantity: 1, color: '', product: { id: 1, name: 'Futbolka', image: '/x.png', images: [], price: 1, colors: [], variants } },
    selected: true, onSelect: () => {}, onUpdate: async () => {}, onRemove: async () => {},
  }));
  assert.doesNotMatch(render([{ id: 'v1', name: 'Default', attributes: {} }], 'v1'), /Variant:/);
  assert.match(render([{ id: 'v1', name: 'S', attributes: {} }, { id: 'v2', name: 'M', attributes: {} }], 'v2'), /Variant: (<!-- -->)?M/);
});
