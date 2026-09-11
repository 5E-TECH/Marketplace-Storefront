import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { checkoutBrowser, until } from './checkout-browser.mjs';

// Exercise the real Next server/proxy and browser against a controlled upstream.
// This test never contacts the configured production backend or creates real orders.
const schemas = JSON.parse(await readFile(new URL('../contract/openapi.json', import.meta.url))).components.schemas;
function fixture(schema) {
  if (schema.$ref) return fixture(schemas[schema.$ref.split('/').at(-1)]);
  if (schema.nullable) return null;
  if (Object.hasOwn(schema, 'example')) return schema.example;
  if (schema.allOf) return Object.assign({}, ...schema.allOf.map(fixture));
  if (schema.enum) return schema.enum[0];
  if (schema.type === 'array') return [];
  if (schema.type === 'object') return Object.fromEntries(Object.entries(schema.properties ?? {}).map(([key, value]) => [key, fixture(value)]));
  return schema.type === 'number' ? 1 : schema.type === 'boolean' ? false : 'test';
}
const product = { ...fixture(schemas.StorefrontProductDto), id: 'p1', name: 'Checkout test mahsulot', slug: 'checkout-test-mahsulot', price: 100000, imageUrl: '/demo-product.svg', images: ['/demo-product.svg'], variants: [{ ...fixture(schemas.ProductVariantDto), id: 'v1', productId: 'p1', price: 100000, isActive: true }] };
const row = { ...fixture(schemas.CartItemDto), id: 'item-1', productId: 'p1', variantId: 'v1', shopId: 'shop-1', quantity: 1, unitPriceSnapshot: 100000, lineTotal: 100000 };
let state;
const reset = (options = {}) => { state = { rows: [structuredClone(row)], creates: [], confirms: [], previews: [], sellerOrders: [], createFailure: null, confirmFailures: 0, previewFailures: 0, previewDelay: 0, createDelay: 0, ...options }; };
reset();
const upstream = createServer(async (request, response) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = chunks.length ? JSON.parse(Buffer.concat(chunks)) : undefined;
  const path = new URL(request.url, 'http://test').pathname.replace('/api/v1', '');
  const reply = (data, status = 200) => { response.writeHead(status, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ statusCode: status, data })); };
  const fail = (message, status = 422) => { response.writeHead(status, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ message })); };
  if (path === '/cart') return reply({ ...fixture(schemas.CartDto), id: 'cart-1', items: state.rows, totalAmount: state.rows.reduce((sum, item) => sum + item.quantity * 100000, 0), totalQuantity: state.rows.reduce((sum, item) => sum + item.quantity, 0) });
  if (path === '/cart/items' && request.method === 'POST') { state.rows = [{ ...structuredClone(row), productId: body.productId, variantId: body.variantId, quantity: body.quantity }]; return reply(state.rows[0], 201); }
  if (path === '/cart/items/item-1' && request.method === 'PATCH') { state.rows[0].quantity = body.quantity; return reply(state.rows[0]); }
  if (path === '/cart/items/item-1' && request.method === 'DELETE') { state.rows = []; return reply(undefined, 204); }
  if (path === '/storefront/products') return reply({ ...fixture(schemas.StorefrontProductsPageDto), items: [product], total: 1, page: 1, limit: 20, totalPages: 1 });
  if (path === '/storefront/products/p1') return reply(product);
  if (path === '/favorites') return reply({ ...fixture(schemas.FavoritesPageDto), items: [] });
  if (path === '/regions') return reply([{ id: '1', name: 'Toshkent shahri' }, { id: '3', name: 'Andijon' }]);
  if (path === '/regions/1/districts') return reply([{ id: '2', regionId: '1', name: 'Chilonzor' }]);
  if (path === '/regions/3/districts') return reply([{ id: '31', regionId: '3', name: 'Andijon shahri' }]);
  if (path === '/checkout/delivery-preview') {
    state.previews.push({ body, headers: request.headers });
    const quantity = state.rows.reduce((sum, item) => sum + item.quantity, 0);
    if (state.previewDelay) await delay(state.previewDelay);
    if (state.previewFailures > 0) { state.previewFailures--; return fail('Server error', 503); }
    const deliveryFee = body.address.address.includes('Boshqa ko‘cha') ? 25000 : quantity * 10000;
    return reply({ packages: [{ shopId: 'shop-1', deliveryFee }] }, 201);
  }
  if (path === '/checkout') {
    state.creates.push({ body, headers: request.headers });
    if (state.createDelay) await delay(state.createDelay);
    if (!request.headers['idempotency-key'] || !request.headers['x-session-id']) return fail('Missing checkout headers', 400);
    if (state.createFailure === 'stock') { state.createFailure = null; return fail('Insufficient stock', 409); }
    if (state.createFailure === 'address') { state.createFailure = null; return fail('Invalid address', 422); }
    if (state.createFailure === 'timeout') { state.createFailure = null; return fail('Gateway timeout', 504); }
    state.rows = [];
    return reply({ orderId: 'sales-77' }, 201);
  }
  if (path === '/checkout/sales-77/confirm') {
    state.confirms.push({ headers: request.headers });
    if (state.confirmFailures > 0) { state.confirmFailures--; return fail('Gateway timeout', 504); }
    state.sellerOrders = [{ id: 'seller-77', salesOrderId: 'sales-77', status: 'CONFIRMED' }];
    return reply({ id: 'sales-77', status: 'CONFIRMED' }, 201);
  }
  if (path === '/orders/sales-77/tracking') return reply({ orderId: 'sales-77', status: state.trackingStatus ?? 'CONFIRMED', estimatedDeliveryAt: '2026-10-12T12:00:00.000Z', updatedAt: '2026-10-10T12:00:00.000Z' });
  if (path === '/seller/orders') return reply({ items: state.sellerOrders, total: state.sellerOrders.length, page: 1, limit: 20, totalPages: state.sellerOrders.length ? 1 : 0 });
  if (path === '/categories') return reply([]);
  return fail('Not found', 404);
});
await new Promise((resolve) => upstream.listen(0, '127.0.0.1', resolve));
const portFinder = createServer();
await new Promise((resolve) => portFinder.listen(0, '127.0.0.1', resolve));
const port = portFinder.address().port;
await new Promise((resolve) => portFinder.close(resolve));
const base = `http://127.0.0.1:${port}`;
const api = `http://127.0.0.1:${upstream.address().port}/api/v1`;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port), '-H', '127.0.0.1'], { env: { ...process.env, API_BASE_URL: api, NEXT_PUBLIC_API_URL: api, API_TIMEOUT_MS: '5000', USE_MOCK_DATA: 'false' }, stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = '';
server.stdout.on('data', (chunk) => { serverLog += chunk; });
server.stderr.on('data', (chunk) => { serverLog += chunk; });
let browser;
try {
  await until(async () => { if (server.exitCode !== null) throw new Error(serverLog); return fetch(`${base}/checkout`).then((response) => response.ok).catch(() => false); }, 'Next startup', 30000);
  browser = await checkoutBrowser();
  const { evaluate, send } = browser;
  const navigate = async (path = '/checkout') => {
    await send('Page.navigate', { url: 'about:blank' });
    await until(() => evaluate('location.href === "about:blank"'), 'blank page');
    await send('Page.navigate', { url: `${base}${path}` });
    await until(() => evaluate('document.readyState === "complete" && Boolean(document.querySelector(".checkout-page, .checkout-success, .cart-page"))'), 'checkout navigation');
  };
  const begin = async (options = {}) => {
    reset(options);
    await send('Page.navigate', { url: base });
    await until(() => evaluate(`location.origin === ${JSON.stringify(base)} && document.readyState === 'complete'`), 'test origin');
    await evaluate('localStorage.clear(); sessionStorage.clear()');
    await navigate();
    await until(() => evaluate('Boolean(document.querySelector("input[name=name]"))'), 'checkout form');
  };
  const field = (name, value) => evaluate(`(() => {
    const element = document.querySelector('[name=${name}]');
    const prototype = element.tagName === 'SELECT' ? HTMLSelectElement.prototype : element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, ${JSON.stringify(value)});
    element.dispatchEvent(new Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
    element.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  })()`);
  const fill = async () => {
    await field('name', 'Test Xaridor');
    await field('phone', '+998901234567');
    await field('regionId', '1');
    await until(() => evaluate('Boolean(document.querySelector("[name=districtId] option[value=\\"2\\"]"))'), 'district options');
    await field('districtId', '2');
    await field('address', 'Test ko‘chasi, 10-uy');
  };
  const ready = () => until(() => evaluate('Boolean(document.querySelector("[data-testid=delivery-price]")) && document.querySelector("[data-testid=confirm-checkout]")?.disabled === false'), 'current delivery quote');
  const click = (selector) => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const submit = async () => { await ready(); await click('[data-testid=confirm-checkout]'); };
  const success = () => until(() => evaluate('Boolean(document.querySelector("[data-testid=order-tracking]"))'), 'confirmed order page');

  reset({ rows: [] });
  await send('Page.navigate', { url: base });
  await until(() => evaluate('document.querySelector("[data-testid=product-card-add]")?.disabled === false'), 'catalog cart button');
  await click('[data-testid=product-card-add]');
  await until(() => evaluate('document.querySelector("[data-testid=product-card-stepper] b")?.textContent === "1"'), 'inline cart stepper');
  assert.equal(await evaluate('Boolean(document.querySelector(".cart-drawer"))'), false, 'Cart drawer must not exist');
  await click('[data-testid=product-card-stepper] button:last-child');
  await until(() => evaluate('document.querySelector("[data-testid=product-card-stepper] b")?.textContent === "2"'), 'inline cart increment');
  await click('[data-testid=product-card-stepper] button:first-child');
  await until(() => evaluate('document.querySelector("[data-testid=product-card-stepper] b")?.textContent === "1"'), 'inline cart decrement');
  await click('[data-testid=product-card-stepper] button:first-child');
  await until(() => evaluate('document.querySelector("[data-testid=product-card-add]")?.disabled === false'), 'inline cart removal');
  console.log('PASS cart UI: add stays on the catalog, opens no popup, and becomes a working minus/quantity/plus control.');

  await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
  await begin({ createDelay: 800 });
  await navigate('/cart');
  assert.match(await evaluate('document.querySelector("[data-testid=cart-summary]").textContent'), /Manzil tanlangach/);
  await click('[data-testid=cart-summary] a[href="/checkout"]');
  await until(() => evaluate('Boolean(document.querySelector("input[name=name]"))'), 'cart to checkout');
  await until(() => evaluate('document.querySelector("[data-testid=confirm-checkout]")?.disabled === false'), 'empty form submit');
  await click('[data-testid=confirm-checkout]');
  await until(() => evaluate('document.querySelectorAll(".field-error").length === 5'), 'required validation errors');
  assert.equal(state.previews.length, 0);
  assert.equal(state.creates.length, 0);
  console.log('PASS TC3: empty required fields show five clear errors and send no API request.');
  await fill();
  await ready();
  assert.equal(state.previews.at(-1).body.address.regionId, '1');
  assert.equal(state.previews.at(-1).body.address.districtId, '2');
  assert.match(state.previews.at(-1).body.address.address, /Toshkent shahri, Chilonzor/);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth'), true);
  if (process.env.CHECKOUT_SCREENSHOT_DIR) {
    await writeFile(`${process.env.CHECKOUT_SCREENSHOT_DIR}/checkout-mobile.png`, Buffer.from((await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })).data, 'base64'));
    await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await writeFile(`${process.env.CHECKOUT_SCREENSHOT_DIR}/checkout-desktop.png`, Buffer.from((await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })).data, 'base64'));
    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
  }
  // Two synchronous submits must still produce exactly one create.
  await evaluate('const f=document.querySelector(".checkout-layout"); f.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true})); f.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}))');
  await until(() => evaluate('Boolean(document.querySelector("[data-testid=checkout-recovery]"))'), 'pending checkout');
  assert.equal(await evaluate('[...document.querySelectorAll(".cart-item-actions button")].every(button => button.disabled)'), true, 'Cart mutations are locked while creating the order');
  await success();
  assert.equal(state.creates.length, 1);
  assert.equal(state.confirms.length, 1);
  assert.equal(state.creates[0].headers.authorization, undefined, 'Guest checkout does not require login');
  assert.equal(state.creates[0].body.paymentMethod, 'cod');
  const sellerPage = await fetch(`http://127.0.0.1:${upstream.address().port}/api/v1/seller/orders`).then((response) => response.json()).then((response) => response.data);
  assert.equal(sellerPage.items[0].salesOrderId, 'sales-77');
  assert.equal(await evaluate('JSON.parse(localStorage.getItem("elchi_orders_v1"))[0].id'), 'sales-77');
  const confirmationText = await evaluate('document.querySelector("[data-testid=order-tracking]").textContent');
  assert.match(confirmationText, /Buyurtmangiz qabul qilindi.*sales-77/is);
  console.log('PASS tracking TC1: checkout redirects to a confirmation page with the order number.');
  assert.match(confirmationText, /Checkout test mahsulot.*100 000.*Yetkazish10 000.*To‘lov summasi110 000.*Test Xaridor.*\+998901234567.*Toshkent shahri, Chilonzor/is);
  console.log('PASS tracking TC2: confirmation shows the correct items, prices, recipient and address.');
  assert.match(await evaluate('location.pathname'), /\/orders\/sales-77/);
  state.trackingStatus = 'ON_THE_ROAD';
  await click('.order-detail-card button');
  await until(() => evaluate('document.querySelector(".tracking-progress [aria-current=step]")?.textContent.includes("Yo‘lda")'), 'Elchi delivery status refresh');
  console.log('PASS tracking TC3: backend delivery status updates from accepted to on the road.');
  await send('Page.navigate', { url: `${base}/orders/sales-77` });
  await until(() => evaluate('Boolean(document.querySelector("[data-testid=order-tracking]"))'), 'guest saved order after reload');
  assert.equal(await evaluate('Boolean(localStorage.getItem("access_token"))'), false, 'Guest tracking must not require an access token');
  const reopenedText = await evaluate('document.querySelector("[data-testid=order-tracking]").textContent');
  assert.match(reopenedText, /sales-77.*Checkout test mahsulot/is);
  assert.match(reopenedText, /Yo‘lda/i);
  console.log('PASS tracking TC4: guest can reopen the saved order after a full page navigation without an access token.');
  console.log('PASS TC1/TC4/TC5: filled guest checkout creates and confirms one order; seller orders returns it.');

  await begin({ previewDelay: 600 });
  await fill();
  await ready();
  await field('address', 'Boshqa ko‘cha, 20-uy');
  assert.equal(await evaluate('Boolean(document.querySelector("[data-testid=delivery-price]"))'), false, 'Old quote disappears immediately during debounce');
  await click('[data-testid=confirm-checkout]');
  assert.equal(state.creates.length, 0, 'Old quote cannot create an order');
  await ready();
  assert.match(state.previews.at(-1).body.address.address, /Boshqa/);
  assert.match(await evaluate('document.querySelector("[data-testid=delivery-price]").textContent'), /25 000/);
  await field('regionId', '3');
  assert.equal(await evaluate('document.querySelector("[name=districtId]").value'), '');
  assert.equal(await evaluate('Boolean(document.querySelector("[data-testid=delivery-price]"))'), false);
  console.log('PASS TC2: changing the address invalidates the old quote and displays the new backend price.');

  await begin({ previewFailures: 1 });
  await fill();
  await until(() => evaluate('Boolean(document.querySelector(".delivery-error button"))'), 'quote retry');
  await click('.delivery-error button');
  await ready();
  state.rows[0].quantity = 2;
  await evaluate('window.dispatchEvent(new CustomEvent("elchi:guest-merged"))');
  await until(() => evaluate('document.querySelector("[data-testid=delivery-price]")?.textContent.includes("20 000")'), 'quantity quote recalculation');
  console.log('PASS: delivery failure retry and quantity changes recalculate the quote.');

  for (const failure of ['stock', 'address']) {
    await begin({ createFailure: failure });
    await fill();
    await submit();
    await until(() => evaluate('Boolean(document.querySelector(".checkout-forms [role=alert]"))'), `${failure} message`);
    assert.match(await evaluate('document.querySelector(".checkout-forms [role=alert]").textContent'), failure === 'stock' ? /qoldig‘i/ : /manzili noto‘g‘ri/);
    assert.equal(state.confirms.length, 0);
    await submit();
    await success();
  }
  console.log('PASS: stock/address rejection preserves editable form and can be corrected.');

  await begin({ createFailure: 'timeout' });
  await fill();
  await submit();
  await until(() => evaluate('document.querySelector("[data-testid=retry-checkout]")?.disabled === false'), 'create recovery');
  const original = state.creates[0];
  await navigate();
  await until(() => evaluate('document.querySelector("[data-testid=retry-checkout]")?.disabled === false'), 'restored attempt ready');
  await click('[data-testid=retry-checkout]');
  await success();
  assert.deepEqual(state.creates[1].body, original.body);
  assert.equal(state.creates[1].headers['idempotency-key'], original.headers['idempotency-key']);
  console.log('PASS: create timeout + reload retries the identical idempotency key and payload.');

  await begin({ confirmFailures: 1 });
  await fill();
  await submit();
  await until(() => evaluate('document.querySelector("[data-testid=retry-checkout]")?.disabled === false'), 'confirmation recovery');
  await navigate();
  assert.equal(state.rows.length, 0);
  await until(() => evaluate('document.querySelector("[data-testid=retry-checkout]")?.disabled === false'), 'restored confirmation ready');
  await click('[data-testid=retry-checkout]');
  await success();
  assert.equal(state.creates.length, 1);
  assert.equal(state.confirms.length, 2);
  console.log('PASS: confirmation timeout + empty cart + reload resumes the existing order.');

  await begin();
  await evaluate('localStorage.setItem("access_token", "signed-test-token"); localStorage.setItem("elchi_auth_v1", JSON.stringify({phone:"+998901234567",verifiedAt:new Date().toISOString()}))');
  await navigate();
  await until(() => evaluate('document.querySelector("[name=phone]")?.value === "+998901234567"'), 'signed-in phone prefill');
  await fill();
  await submit();
  await success();
  assert.equal(state.creates[0].headers.authorization, 'Bearer signed-test-token');
  assert.equal(state.confirms[0].headers.authorization, 'Bearer signed-test-token');
  console.log('PASS: signed-in checkout prefills the phone and preserves authorization through create/confirm.');

  await begin();
  await fill();
  await ready();
  await evaluate(`const original=Storage.prototype.setItem; Storage.prototype.setItem=function(key,value){if(key==='elchi_orders_v1')throw new DOMException('Quota exceeded','QuotaExceededError');return original.call(this,key,value)}`);
  await submit();
  await success();
  assert.match(await evaluate('document.querySelector("[data-testid=order-tracking]").textContent'), /tarixiga saqlanmadi/);
  assert.equal(state.creates.length, 1);
  assert.deepEqual(browser.exceptions, []);
  console.log('PASS: receipt storage failure does not turn a confirmed backend order into a failed checkout.');

  await send('Page.navigate', { url: `${base}/track-order` });
  await until(() => evaluate('Boolean(document.querySelector("[name=order-number]"))'), 'tracking search page');
  await send('Page.navigate', { url: `${base}/orders/missing-999` });
  await until(() => evaluate('Boolean(document.querySelector("[data-testid=tracking-not-found]"))'), 'missing order message');
  assert.match(await evaluate('document.querySelector("[data-testid=tracking-not-found]").textContent'), /Buyurtma topilmadi.*Raqamni tekshiring/s);
  console.log('PASS tracking: an unknown order number shows a clear not-found message.');
} finally {
  await browser?.close();
  server.kill();
  upstream.closeAllConnections();
  await new Promise((resolve) => upstream.close(resolve));
}
