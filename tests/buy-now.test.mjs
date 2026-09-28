import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { loadTypeScript } from './load-typescript.mjs';

const { buyNowHref, readBuyNowTarget, buyNowSelection } = loadTypeScript('src/lib/cart-selection.ts');

test('“Buyurtma berish” checkout havolasi mahsulot va variantni uzatadi', () => {
  assert.equal(buyNowHref(140, '139'), '/checkout?product=140&variant=139');
  assert.equal(buyNowHref('a b', undefined), '/checkout?product=a+b');
  assert.deepEqual(readBuyNowTarget('?product=140&variant=139'), { productId: '140', variantId: '139' });
  assert.deepEqual(readBuyNowTarget('?product=140'), { productId: '140', variantId: undefined });
  assert.equal(readBuyNowTarget(''), null, 'parametr bo‘lmasa oddiy checkout');
  assert.equal(readBuyNowTarget(`?product=${'x'.repeat(200)}`), null, 'haddan uzun qiymat e’tiborsiz');
});

test('tez xaridda faqat shu mahsulot (va variant) tanlanadi, qolganlari savatda qoladi', () => {
  const items = [
    { id: 'row-1', productId: 140, variantId: 139, quantity: 1 },
    { id: 'row-2', productId: 140, variantId: 200, quantity: 2 },
    { id: 'row-3', productId: 7, variantId: 70, quantity: 1 },
  ];
  assert.deepEqual(buyNowSelection(items, { productId: '140', variantId: '139' }), ['row-1']);
  assert.deepEqual(buyNowSelection(items, { productId: '140' }), ['row-1', 'row-2']);
  assert.deepEqual(buyNowSelection(items, { productId: '999' }), []);
});

test('kartada va mahsulot sahifasida “Buyurtma berish” checkout’ni shu mahsulot bilan ochadi', () => {
  const card = fs.readFileSync(new URL('../src/components/product-card.tsx', import.meta.url), 'utf8');
  assert.match(card, /data-testid="product-card-buy"/);
  assert.match(card, /router\.push\(href\)/);
  assert.match(card, /buyNowHref\(product\.id, variant\.id\)/);
  const detail = fs.readFileSync(new URL('../src/components/product-detail.tsx', import.meta.url), 'utf8');
  assert.match(detail, /router\.push\(buyNowHref\(product\.id, selectedVariant\.id\)\)/);
  assert.doesNotMatch(detail, /router\.push\("\/checkout"\)/, 'butun savat bilan checkout’ga o‘tmasligi kerak');
  assert.match(detail, /cartItem\.quantity !== quantity\) await cart\.update/, 'savatdagi miqdor ustiga qo‘shilmaydi');
  const checkout = fs.readFileSync(new URL('../src/components/checkout-content.tsx', import.meta.url), 'utf8');
  assert.match(checkout, /readBuyNowTarget\(window\.location\.search\)/);
  assert.match(checkout, /Butun savatni rasmiylashtirish/);
});

test('savat yuklanmaguncha kartadagi qo‘shish va tez xarid kutadi (miqdor ikkilanmaydi)', () => {
  const card = fs.readFileSync(new URL('../src/components/product-card.tsx', import.meta.url), 'utf8');
  assert.match(card, /const busy = pending \|\| !cart\.ready;/);
  assert.equal(card.match(/disabled=\{busy \|\| !variant\}/g)?.length, 2, '“+” va “Buyurtma berish” ikkalasi ham kutadi');
  const provider = fs.readFileSync(new URL('../src/providers/cart-provider.tsx', import.meta.url), 'utf8');
  assert.match(provider, /void refresh\(\)\.finally\(\(\) => \{ if \(active\) setReady\(true\); \}\)/, 'birinchi yuklanish (xato bo‘lsa ham) tugagach ready');
});
