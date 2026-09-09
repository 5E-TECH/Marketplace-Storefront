import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const base = process.env.UI_TEST_URL ?? "http://127.0.0.1:3001";
const routes = ["/", "/?sort=price%3Aasc&page=2", "/katalog", "/katalog/audio?sort=price%3Aasc", "/cart", "/checkout", "/favorites", "/product/demo-headphones", "/profile", "/profile/orders", "/ui-kit"];
const homeResponse = await fetch(base);
const homeHtml = await homeResponse.text();
assert.equal(homeResponse.status, 200);
assert.match(homeHtml, /class="product-card"/, "Product cards must be present in the SSR HTML");
assert.match(homeHtml, /href="\/katalog\//, "SSR categories must use shareable slug URLs");
assert.match(homeHtml, /Keyingi sahifa/, "SSR catalog must expose pagination when more products exist");

const emptyResponse = await fetch(`${base}/?search=__missing_product__`);
const emptyHtml = await emptyResponse.text();
assert.equal(emptyResponse.status, 200);
assert.match(emptyHtml, /Mahsulot topilmadi/, "Empty search needs an understandable SSR message");
const profile = await mkdtemp(join(tmpdir(), "elchi-ui-browser-"));
const chrome = spawn(process.env.CHROME_PATH ?? "google-chrome", [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--remote-debugging-port=0",
  `--user-data-dir=${profile}`,
  "about:blank",
], { stdio: "ignore" });

let socket;
let spawnError;
chrome.on("error", (error) => { spawnError = error; });

async function until(check, description) {
  const deadline = Date.now() + 25_000;
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
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let sequence = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    const request = pending.get(data.id);
    if (!request) return;
    pending.delete(data.id);
    if (data.error) request.reject(new Error(data.error.message));
    else request.resolve(data.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const deadline = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, 10_000);
    pending.set(id, {
      resolve: (value) => { clearTimeout(deadline); resolve(value); },
      reject: (error) => { clearTimeout(deadline); reject(error); },
    });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true })).result.value;

  await send("Runtime.enable");
  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });

  for (const route of routes) {
    await send("Page.navigate", { url: `${base}${route}` });
    await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('header.header')) && Boolean(document.querySelector('body > footer'))"), `${route} layout`);
    const result = await evaluate(`(() => {
      const root = document.documentElement;
      const header = document.querySelector("header.header");
      const footer = document.querySelector("body > footer");
      return {
        width: root.clientWidth,
        scrollWidth: root.scrollWidth,
        headerVisible: getComputedStyle(header).display !== "none",
        footerVisible: getComputedStyle(footer).display !== "none",
      };
    })()`);
    assert.equal(result.width, 375, `${route}: viewport must be 375px`);
    assert.ok(result.scrollWidth <= result.width, `${route}: horizontal overflow (${result.scrollWidth}px > ${result.width}px)`);
    assert.ok(result.headerVisible && result.footerVisible, `${route}: header and footer must be visible`);
  }

  await send("Page.navigate", { url: `${base}/katalog/audio?sort=price%3Aasc` });
  await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('.product-card'))"), "category catalog");
  const filterState = await evaluate(`({
    path: location.pathname,
    sort: new URLSearchParams(location.search).get("sort"),
    activeSort: document.querySelector(".sort-control [aria-current=page]")?.textContent.trim(),
    products: document.querySelectorAll(".product-card").length,
    prices: [...document.querySelectorAll(".product-card .price strong")].map((element) => Number(element.textContent.replace(/\\D/g, ""))),
  })`);
  assert.deepEqual({ path: filterState.path, sort: filterState.sort, activeSort: filterState.activeSort }, { path: "/katalog/audio", sort: "price:asc", activeSort: "Arzondan qimmatga" });
  assert.equal(filterState.products, 6, "Category URL must only contain matching demo products");
  assert.deepEqual(filterState.prices, [...filterState.prices].sort((left, right) => left - right), "Price sorting must change the rendered product order");

  await send("Page.navigate", { url: `${base}/?sort=price%3Aasc&page=2` });
  await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('.product-card'))"), "second catalog page");
  const pageState = await evaluate(`({
    page: new URLSearchParams(location.search).get("page"),
    sort: new URLSearchParams(location.search).get("sort"),
    pagination: document.querySelector(".catalog-pagination b")?.textContent.trim(),
    activeSort: document.querySelector(".sort-control [aria-current=page]")?.textContent.trim(),
  })`);
  assert.deepEqual(pageState, { page: "2", sort: "price:asc", pagination: "2 / 2", activeSort: "Arzondan qimmatga" });

  await send("Page.navigate", { url: `${base}/ui-kit` });
  await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('.product-card'))"), "UI kit content");
  const components = await evaluate(`(() => {
    const card = document.querySelector(".product-card");
    return {
      image: Boolean(card.querySelector("img")),
      name: Boolean(card.querySelector("h3")?.textContent.trim()),
      price: Boolean(card.querySelector(".price strong")?.textContent.trim()),
      shop: Boolean(card.querySelector(".eyebrow")?.textContent.trim()),
      empty: Boolean(document.querySelector(".state-panel--empty")),
      error: Boolean(document.querySelector(".state-panel--error")),
    };
  })()`);
  assert.deepEqual(components, { image: true, name: true, price: true, shop: true, empty: true, error: true });
  console.log(`PASS: SSR catalog, pagination and empty state; slug category and URL filters; ${routes.length} routes at 375px without horizontal overflow.`);
} finally {
  socket?.close();
  chrome.kill();
  await delay(300);
  await rm(profile, { recursive: true, force: true });
}
