#!/usr/bin/env node
/**
 * SF-03 TC3 — e2e: brauzerda (JS bilan) manzilli forma → «Rahmat» → Lead pikseli, S1 va S3 da.
 * Tizimdagi Chrome (`playwright-core`, `channel: 'chrome'`, brauzer yuklanmaydi; CI: `npm i --no-save playwright-core@1.64.1`).
 * Sotuvchi piksel skriptlari (Meta, TikTok) tarmoqqa chiqmaydi — bo‘sh skript beriladi, chaqiriqlar navbatda qoladi.
 * Tekshiriladi: Lead bir marta, eventID = lid ID (Meta va TikTok bir xil); qayta yuklanganda Lead yo‘q (TC3 SF-02).
 */
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { startServer } from './serve.mjs';

const CODE = 'mockPiksel';
const server = await startServer();
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: process.env.CI ? ['--no-sandbox'] : [] });

async function leadEvents(page) {
  return page.evaluate(() => ({
    meta: (window.fbq?.queue ?? []).filter((call) => call[0] === 'track' && call[1] === 'Lead').map((call) => call[3]?.eventID),
    tiktok: (Array.isArray(window.ttq) ? window.ttq : []).filter((call) => call[0] === 'track' && call[1] === 'SubmitForm').map((call) => call[3]?.event_id),
  }));
}

async function scenario(variant) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addCookies([{ name: 'elchi_variant', value: variant, url: server.base }]);
  await context.route(/connect\.facebook\.net|analytics\.tiktok\.com/, (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  const page = await context.newPage();
  await page.goto(`${server.base}/${CODE}?sub1=abc&utm_source=fb`);
  assert.equal(await page.locator('.lp').getAttribute('data-variant'), variant);
  assert.deepEqual(await leadEvents(page), { meta: [], tiktok: [] }, 'mahsulot sahifasida Lead yo‘q');

  if (variant === 's3') {
    await page.locator('#s3-order button[type=submit]').click();
    await page.waitForURL(`**/${CODE}/buyurtma**`);
  }
  await page.locator('#viloyat').waitFor(); // gidratsiya: JS bilan viloyat → tuman
  await page.fill('#ism', 'Aziza');
  await page.fill('#telefon', '901234567');
  await page.selectOption('#viloyat', '1726');
  await page.selectOption('#tuman', '1726266');
  await page.fill('#manzil', 'Navoiy ko‘chasi, 12-uy');
  await page.check('#rozilik');
  await page.locator('#lead-form button[type=submit]').click();
  await page.waitForURL(`**/${CODE}/rahmat`);
  await page.getByText('Rahmat, Aziza!').waitFor();
  await page.waitForFunction(() => (window.fbq?.queue ?? []).some((call) => call[1] === 'Lead'));

  const events = await leadEvents(page);
  assert.equal(events.meta.length, 1, 'Meta Lead bir marta');
  assert.match(events.meta[0], /^\d+$/, 'eventID — lid ID');
  assert.deepEqual(events.tiktok, events.meta, 'TikTok event_id — o‘sha lid ID');

  await page.reload();
  await page.getByText('Rahmat, Aziza!').waitFor();
  await page.waitForFunction(() => (window.fbq?.queue ?? []).some((call) => call[1] === 'PageView'));
  assert.deepEqual(await leadEvents(page), { meta: [], tiktok: [] }, 'qayta yuklanganda Lead yuborilmaydi');
  await context.close();
  return events.meta[0];
}

let failed = 0;
try {
  for (const variant of ['s1', 's3']) {
    try {
      const leadId = await scenario(variant);
      console.log(`ok - ${variant}: manzilli forma → «Rahmat» → Lead (eventID ${leadId}), qayta yuklanganda yo‘q`);
    } catch (error) {
      failed += 1;
      console.error(`not ok - ${variant}: ${error.message}`);
    }
  }
} finally {
  await browser.close();
  server.stop();
}
if (failed) process.exit(1);
console.log('\ne2e: S1 va S3 o‘tdi');
