import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTypeScript } from './load-typescript.mjs';

// Do'kon sahifasi: /dokon/<slug> — logo, nom, tavsif, reyting, filtr/saralash,
// faqat o'sha do'kon mahsulotlari, topilmasa/faol bo'lmasa tushunarli xabar.
const shop = { id: '15', ownerUserId: '42', name: 'Ali Market', slug: 'ali-market', status: 'ACTIVE', description: 'Telefon va aksessuarlar', logoUrl: 'https://cdn.example.com/ali.png', rating: 4.8 };
const item = (id, shopId) => ({ id, shopId, name: `Mahsulot ${id}`, price: 100000, images: [], shop: { id: shopId, name: shopId === '15' ? 'Ali Market' : 'Boshqa', slug: shopId === '15' ? 'ali-market' : 'boshqa' }, category: { id: '7', name: 'Telefonlar' } });
const link = { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) };
const image = { __esModule: true, default: ({ src, alt, width, height }) => React.createElement('img', { src, alt, width, height }) };

// `@/components/ui` papka (index.ts) — test yuklagichi uchun oldindan yuklab beriladi.
const uiMocks = { 'next/link': link, 'next/image': image };
const ui = loadTypeScript('src/components/ui/index.ts', uiMocks);

class ApiError extends Error {
  constructor(status) { super(`HTTP ${status}`); this.status = status; }
}

function loadService(apiRequest) {
  return loadTypeScript('src/services/product.service.ts', {
    '@/config/env': { env: { apiUrl: 'https://api.test/api/v1' } },
    // Generatsiya qilingan DTO tekshiruvi alohida sinaladi; bu yerda do'kon filtri tekshiriladi.
    '@/generated/api-validators': { validateStorefrontProductDto: () => true },
    '@/lib/api': { ApiError, apiRequest },
  }).productService;
}

test('do‘kon sahifasi faqat o‘sha do‘kon mahsulotlarini ko‘rsatadi va filtr/saralashni backendga uzatadi', async () => {
  const calls = [];
  const service = loadService(async (path, options) => {
    calls.push([path, options.params]);
    return { shop, products: { items: [item('1', '15'), item('2', '99'), item('3', '15')], total: 3, page: 1, limit: 10 } };
  });
  const result = await service.getShop('ali-market', { search: 'iphone', minPrice: 1000, maxPrice: 5000000, sort: 'price:asc', page: 1, limit: 10 });
  assert.equal(calls[0][0], '/storefront/shops/ali-market');
  assert.deepEqual(calls[0][1], { search: 'iphone', minPrice: 1000, maxPrice: 5000000, sort: 'price:asc', page: 1, limit: 10 });
  assert.equal(result.shop.name, 'Ali Market');
  assert.equal(result.shop.rating, 4.8);
  // Boshqa do'kon mahsuloti (2) ko'rinmaydi.
  assert.deepEqual(result.catalog.data.map((product) => String(product.id)), ['1', '3']);
  assert.equal(result.catalog.total, 2);
});

test('topilmagan yoki faol bo‘lmagan do‘kon (backend 404) — sahifa emas, notFound', async () => {
  const service = loadService(async () => { throw new ApiError(404); });
  assert.equal(await service.getShop('yopilgan-dokon'), null);
  // Boshqa xatolar yashirilmaydi (xato sahifasi), 404 bilan adashtirilmaydi.
  const failing = loadService(async () => { throw new ApiError(500); });
  await assert.rejects(failing.getShop('ali-market'), /HTTP 500/);
});

test('do‘kon topilmasa tushunarli xabar va katalogga havola chiqadi', () => {
  const Icon = (props) => React.createElement('i', props);
  const { default: ShopNotFound, metadata } = loadTypeScript('src/app/dokon/[slug]/not-found.tsx', {
    'next/link': link,
    'lucide-react': { Store: Icon },
    '@/components/ui': ui,
  });
  const html = renderToStaticMarkup(React.createElement(ShopNotFound));
  assert.match(html, /Do‘kon topilmadi/);
  assert.match(html, /do‘kon hozircha faol emas/);
  assert.match(html, /href="\/katalog"/);
  assert.equal(metadata.robots.index, false);
});

function renderShop(shopValue, query) {
  const { ShopStorefront } = loadTypeScript('src/components/storefront-home.tsx', {
    'next/link': link,
    'next/image': image,
    './product-grid': { ProductGrid: () => null },
    './ui': ui,
    '@/components/ui': ui,
    './banner-carousel': { BannerCarousel: () => null },
    '@/lib/product-storage': { getSafeImageSrc: (value) => value },
  });
  const catalog = { data: [], total: 0, page: 1, limit: 10, totalPages: 1, source: 'api' };
  return renderToStaticMarkup(React.createElement(ShopStorefront, { shop: shopValue, query, catalog }));
}

test('do‘kon sarlavhasida logo, nom, tavsif va reyting; do‘kon ichida qidiruv va narx filtri bor', () => {
  const html = renderShop({ id: '15', name: 'Ali Market', slug: 'ali-market', description: 'Telefon va aksessuarlar', logoUrl: 'https://cdn.example.com/ali.png', rating: 4.8 }, { page: 1, sort: 'price:asc', search: 'iphone', minPrice: 1000 });
  assert.match(html, /<img src="https:\/\/cdn\.example\.com\/ali\.png"/);
  assert.match(html, /<h1>Ali Market<\/h1>/);
  assert.match(html, /Telefon va aksessuarlar/);
  assert.match(html, /<b>4\.8<\/b> reyting/);
  // Filtr formasi shu do'kon yo'liga yuboriladi, joriy qiymatlar saqlanadi.
  assert.match(html, /<form[^>]*action="\/dokon\/ali-market"/);
  assert.match(html, /Do‘kon ichida qidirish/);
  assert.match(html, /name="search"[^>]*value="iphone"/);
  assert.match(html, /name="minPrice"[^>]*value="1000"/);
  assert.match(html, /name="sort" value="price:asc"/);
  assert.match(html, /href="\/dokon\/ali-market"[^>]*>Tozalash</);
});

test('reytingsiz yangi do‘kon uchun "Hali baholanmagan" chiqadi', () => {
  const html = renderShop({ id: '16', name: 'Yangi Market', slug: 'yangi-market', rating: 0 }, { page: 1, sort: 'createdAt:desc' });
  assert.match(html, /Hali baholanmagan/);
  assert.doesNotMatch(html, /reyting<\/p>/);
});

test('mahsulot sahifasida do‘kon nomi bosilsa do‘kon sahifasi ochiladi', () => {
  const source = fs.readFileSync(new URL('../src/components/product-information.tsx', import.meta.url), 'utf8');
  assert.match(source, /<h3>\{product\.shop\.slug \? <Link href=\{`\/dokon\/\$\{encodeURIComponent\(product\.shop\.slug\)\}`\}>\{product\.shop\.name\}<\/Link>/);
});
