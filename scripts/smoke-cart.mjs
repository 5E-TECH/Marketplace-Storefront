import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const base = process.env.CART_TEST_URL ?? "http://127.0.0.1:3002";
const profile = await mkdtemp(join(tmpdir(), "elchi-cart-browser-"));
const chrome = spawn(process.env.CHROME_PATH ?? "google-chrome", ["--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
let socket;
let spawnError;
chrome.on("error", (error) => { spawnError = error; });

async function until(check, description) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError;
    const value = await check();
    if (value) return value;
    await delay(150);
  }
  throw new Error(`Timed out: ${description}`);
}

try {
  const port = await until(async () => (await readFile(join(profile, "DevToolsActivePort"), "utf8").catch(() => "")).split("\n")[0], "Chrome startup");
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
  socket = new WebSocket(targets.find((target) => target.type === "page").webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  let sequence = 0;
  const pending = new Map();
  const exceptions = [];
  const cartPatches = [];
  const productDetailGets = [];
  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.method === "Runtime.exceptionThrown") exceptions.push(data.params.exceptionDetails.text);
    if (data.method === "Network.requestWillBeSent" && data.params.request.method === "PATCH" && /\/cart\/items\//.test(data.params.request.url)) cartPatches.push(data.params.request);
    if (data.method === "Network.requestWillBeSent" && data.params.request.method === "GET" && /\/api\/backend\/storefront\/products\/[^/?]+/.test(data.params.request.url)) productDetailGets.push(data.params.request);
    const request = pending.get(data.id);
    if (!request) return;
    pending.delete(data.id);
    if (data.error) request.reject(new Error(data.error.message)); else request.resolve(data.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const deadline = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 10_000);
    pending.set(id, { resolve: (value) => { clearTimeout(deadline); resolve(value); }, reject: (error) => { clearTimeout(deadline); reject(error); } });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value;
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
  await send("Page.navigate", { url: base });
  await until(() => evaluate("document.readyState === 'complete' && Boolean([...document.querySelectorAll('[data-testid=product-card-add]')].find((button) => !button.disabled))"), "enabled cart button");
  assert.equal(await evaluate("Boolean(document.querySelector('.cart-drawer'))"), false, "Cart drawer must not be rendered");
  await until(() => evaluate("Boolean([...document.querySelectorAll('.product-card .favorite')].find((button) => !button.disabled))"), "hydrated favorite button");
  await evaluate("[...document.querySelectorAll('.product-card .favorite')].find((button) => !button.disabled).click()");
  await until(() => evaluate("document.querySelector('.header-favorite span')?.textContent === '1'"), "optimistic favorite count");
  await evaluate("document.querySelector('.header-favorite').click()");
  await until(() => evaluate("location.pathname === '/favorites' && Boolean(document.querySelector('.favorites-grid .product-card'))"), "guest favorites page");
  await until(() => evaluate("!document.querySelector('.favorites-grid .favorite')?.disabled"), "favorite remove button");
  await evaluate("document.querySelector('.favorites-grid .favorite').click()");
  await until(() => evaluate("Boolean(document.querySelector('.state-panel--empty'))"), "favorite cleanup");
  if (process.env.UI_AUTH_LIVE === "true") {
    await send("Page.navigate", { url: base });
    await until(() => evaluate("Boolean([...document.querySelectorAll('.product-card .favorite')].find((button) => !button.disabled))"), "favorite before registration");
    await evaluate("[...document.querySelectorAll('.product-card .favorite')].find((button) => !button.disabled).click()");
    await until(() => evaluate("document.querySelector('.header-favorite span')?.textContent === '1'"), "guest favorite before merge");
    const suffix = String(Date.now()).slice(-9);
    const phone = `+998${suffix}`;
    const password = `TcFavorite!${suffix.slice(-4)}`;
    await send("Page.navigate", { url: `${base}/register` });
    await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('form input[name=name]'))"), "register form");
    await evaluate(`(() => { const form=[...document.forms].find(item => item.querySelector('[name=name]')); form.elements.name.value='Favorites TC Buyer'; form.elements.phone.value=${JSON.stringify(phone)}; form.elements.password.value=${JSON.stringify(password)}; form.elements.passwordConfirm.value=${JSON.stringify(password)}; form.requestSubmit(); })()`);
    await until(() => evaluate("location.pathname === '/profile'"), "registration and guest merge");
    await send("Page.navigate", { url: `${base}/favorites` });
    await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('.favorites-grid .product-card'))"), "favorite retained after login");
    assert.equal(await evaluate("document.querySelector('.header-favorite span')?.textContent"), "1", "Merged account must retain the guest favorite");
    await until(() => evaluate("!document.querySelector('.favorites-grid .favorite')?.disabled"), "merged favorite cleanup button");
    await evaluate("document.querySelector('.favorites-grid .favorite').click()");
    await until(() => evaluate("Boolean(document.querySelector('.state-panel--empty'))"), "merged favorite cleanup");
  }
  await send("Page.navigate", { url: base });
  await until(() => evaluate("document.readyState === 'complete' && Boolean([...document.querySelectorAll('[data-testid=product-card-add]')].find((button) => !button.disabled))"), "catalog after favorites");
  await evaluate("[...document.querySelectorAll('[data-testid=product-card-add]')].find((button) => !button.disabled).click()");
  assert.equal(await until(() => evaluate("document.querySelector('[data-testid=product-card-stepper] b')?.textContent"), "inline quantity stepper"), "1");
  productDetailGets.length = 0;
  await send("Page.reload");
  await until(() => evaluate("document.readyState === 'complete' && document.querySelector('[data-testid=product-card-stepper] b')?.textContent === '1'"), "cart restore without N+1 product requests");
  assert.equal(productDetailGets.length, 0, "Catalog data must hydrate cart products without one GET per cart item");
  const patchCountBefore = cartPatches.length;
  await evaluate(`(async () => {
    for (let count = 2; count <= 5; count += 1) {
      document.querySelector('[data-testid=product-card-stepper] button:last-child').click();
      await new Promise(requestAnimationFrame);
    }
  })()`);
  await until(() => evaluate("document.querySelector('[data-testid=product-card-stepper] b')?.textContent === '5'"), "optimistic quantity increase");
  assert.equal(cartPatches.length, patchCountBefore, "Rapid clicks must update UI without an immediate request per click");
  await until(() => cartPatches.length === patchCountBefore + 1, "debounced cart synchronization");
  assert.equal(cartPatches.length, patchCountBefore + 1, "Four rapid clicks must be collapsed into one PATCH");
  assert.equal(await evaluate("document.querySelector('.floating-cart')?.getAttribute('href')"), "/cart");
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.floating-cart')).position"), "fixed");
  await evaluate("document.querySelector('.floating-cart').click()");
  await until(() => evaluate("location.pathname === '/cart' && Boolean(document.querySelector('[data-testid=cart-item]'))"), "full cart page");
  assert.equal(await evaluate("document.querySelector('[data-testid=cart-item] .quantity b')?.textContent"), "5");
  assert.ok(await evaluate("Boolean(document.querySelector('.order-summary'))"));
  assert.ok(await evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth"), "Mobile cart must not overflow horizontally");
  await evaluate("document.querySelector('.order-summary a[href=\"/checkout\"]').click()");
  await until(() => evaluate("location.pathname === '/checkout' && Boolean(document.querySelector('[name=region]'))"), "checkout address form");
  await evaluate(`(() => {
    const values = { recipientName: 'Test Xaridor', phone: '+998901234567', region: 'Toshkent shahri', district: 'Chilonzor tumani', street: 'Bunyodkor ko‘chasi 1' };
    for (const [name, value] of Object.entries(values)) {
      const field = document.querySelector('[name=' + name + ']');
      const prototype = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, 'value').set.call(field, value);
      field.dispatchEvent(new Event('input', { bubbles: true }));
    }
  })()`);
  await until(() => evaluate("/Yetkazish avtomatik hisoblandi/.test(document.querySelector('.delivery-preview-status')?.textContent ?? '')"), "automatic delivery preview");
  assert.equal(await evaluate("document.querySelector('[name=regionId], [name=districtId]')"), null, "Checkout must not expose technical IDs");
  await send("Page.navigate", { url: `${base}/cart` });
  await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('[data-testid=cart-item]'))"), "cart after delivery preview");
  await until(() => evaluate("!document.querySelector('[data-testid=cart-item] button[aria-label=\"O‘chirish\"]')?.disabled"), "cart actions ready");
  await evaluate("document.querySelector('[data-testid=cart-item] button[aria-label=\"O‘chirish\"]').click()");
  await until(() => evaluate("!document.querySelector('[data-testid=cart-item]')"), "cart cleanup");
  assert.deepEqual(exceptions, []);
  console.log(`PASS: favorite TC1 add, TC2 list, TC3 remove${process.env.UI_AUTH_LIVE === "true" ? ", TC4 guest-to-account merge" : ""}; floating cart; optimistic quantity; four rapid clicks -> one PATCH; no cart N+1; automatic delivery preview without technical IDs; totals and cleanup.`);
} finally {
  socket?.close();
  chrome.kill();
  await delay(300);
  await rm(profile, { recursive: true, force: true });
}
