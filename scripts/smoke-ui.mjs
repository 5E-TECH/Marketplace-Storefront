import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const base = process.env.UI_TEST_URL ?? "http://127.0.0.1:3001";
const routes = ["/", "/?sort=price%3Aasc&page=2", "/qidiruv?q=AirBeat&sort=price%3Aasc", "/qidiruv?q=__missing_product__", "/katalog", "/katalog/audio?sort=price%3Aasc", "/cart", "/checkout", "/favorites", "/product/demo-headphones", "/login", "/register", "/forgot-password", "/profile", "/profile/orders", "/ui-kit"];
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

  await send("Page.navigate", { url: `${base}/qidiruv?q=AirBeat&minPrice=900000&maxPrice=1000000&sort=price%3Aasc` });
  await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('.product-card'))"), "search results");
  const searchState = await evaluate(`({
    q: new URLSearchParams(location.search).get("q"),
    heading: document.querySelector(".search-page-heading h1")?.textContent.trim(),
    input: document.querySelector("#header-search")?.value,
    activeSort: document.querySelector(".sort-control [aria-current=page]")?.textContent.trim(),
    products: document.querySelectorAll(".product-card").length,
    names: [...document.querySelectorAll(".product-card h3")].map(element => element.textContent.trim()),
    prices: [...document.querySelectorAll(".product-card .price strong")].map(element => Number(element.textContent.replace(/\\D/g, ""))),
    minPrice: document.querySelector(".search-filters [name=minPrice]")?.value,
    maxPrice: document.querySelector(".search-filters [name=maxPrice]")?.value,
    filterSort: document.querySelector(".search-filters [name=sort]")?.value,
    clearPrice: document.querySelector(".search-filters a")?.getAttribute("href"),
    newestHref: document.querySelector(".sort-control a:first-child")?.getAttribute("href"),
  })`);
  assert.equal(searchState.q, "AirBeat");
  assert.match(searchState.heading, /AirBeat/);
  assert.equal(searchState.input, "AirBeat");
  assert.equal(searchState.activeSort, "Arzondan qimmatga");
  assert.ok(searchState.products > 0, "TC1: matching search must render at least one product");
  assert.ok(searchState.names.every(name => /AirBeat/i.test(name)), "Search page must only show matching products");
  assert.deepEqual(searchState.prices, [...searchState.prices].sort((left, right) => left - right), "TC4: search results must respect selected price sorting");
  assert.ok(searchState.prices.every(price => price >= 900000 && price <= 1000000), "Search filters must constrain product prices");
  assert.deepEqual([searchState.minPrice, searchState.maxPrice], ["900000", "1000000"]);
  assert.equal(searchState.filterSort, "price:asc");
  assert.equal(searchState.clearPrice, "/qidiruv?q=AirBeat&sort=price%3Aasc#products");
  assert.equal(searchState.newestHref, "/qidiruv?q=AirBeat&minPrice=900000&maxPrice=1000000#products");

  await send("Page.navigate", { url: `${base}/qidiruv?q=__missing_product__` });
  await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('.catalog-empty'))"), "empty search results");
  const emptySearch = await evaluate(`({
    message: document.querySelector(".catalog-empty h3")?.textContent.trim(),
    alternatives: document.querySelectorAll(".search-alternatives .product-card").length,
  })`);
  assert.deepEqual(emptySearch, { message: "Mahsulot topilmadi", alternatives: 4 });

  await send("Page.navigate", { url: `${base}/` });
  await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('#header-search'))"), "search input");
  await evaluate("document.querySelector('#header-search').focus()");
  await send("Input.insertText", { text: "QA" });
  await until(() => evaluate("Boolean(document.querySelector('.search-suggestions [role=option]'))"), "search suggestions");
  assert.match(await evaluate("document.querySelector('.search-suggestions [role=option]')?.textContent"), /QA/i);

  if (process.env.UI_AUTH_LIVE === "true") {
    const suffix = String(Date.now()).slice(-9);
    const phone = `+998${suffix}`;
    const password = `TcBuyer!${suffix.slice(-4)}`;
    await send("Page.navigate", { url: `${base}/register` });
    await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('form input[name=name]'))"), "register form");
    await evaluate(`(() => { const form=[...document.forms].find(item => item.querySelector('[name=name]')); form.elements.name.value='TC Buyer'; form.elements.phone.value=${JSON.stringify(phone)}; form.elements.password.value=${JSON.stringify(password)}; form.elements.passwordConfirm.value=${JSON.stringify(password)}; form.requestSubmit(); })()`);
    await until(() => evaluate("location.pathname === '/profile' && /TC Buyer/.test(document.querySelector('main')?.textContent ?? '')"), "TC1 register buyer profile");
    const firstGuestId = await evaluate("localStorage.getItem('guest_session_id')");
    await evaluate("document.querySelector('button[class*=logout]').click()");
    await until(() => evaluate("Boolean(document.querySelector('a[href=\"/login\"]'))"), "logout");
    assert.deepEqual(await evaluate(`({ token: localStorage.getItem('access_token'), session: localStorage.getItem('elchi_auth_v1'), guestChanged: localStorage.getItem('guest_session_id') !== ${JSON.stringify(firstGuestId)} })`), { token: null, session: null, guestChanged: true });
    await send("Page.navigate", { url: `${base}/login` });
    await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('form input[name=password]'))"), "login form");
    await evaluate(`(() => { const form=[...document.forms].find(item => item.querySelector('[name=password]')); form.elements.phone.value=${JSON.stringify(phone)}; form.elements.password.value=${JSON.stringify(password)}; form.requestSubmit(); })()`);
    await until(() => evaluate("location.pathname === '/profile' && /TC Buyer/.test(document.querySelector('main')?.textContent ?? '')"), "TC2 login account");
    await send("Page.navigate", { url: `${base}/profile/orders` });
    await until(() => evaluate("document.readyState === 'complete' && (/Buyurtmalar hali yo‘q/.test(document.querySelector('main')?.textContent ?? '') || Boolean(document.querySelector('.orders-list')))"), "TC3 buyer orders");
    await send("Page.navigate", { url: `${base}/profile` });
    await until(() => evaluate("Boolean(document.querySelector('button[class*=logout]'))"), "authenticated profile");
    await evaluate("document.querySelector('button[class*=logout]').click()");
    await until(() => evaluate("localStorage.getItem('access_token') === null && localStorage.getItem('elchi_auth_v1') === null"), "TC4 cleared session");
  }

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
  await send("Page.navigate", { url: `${base}/product/demo-headphones#reviews` });
  await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('#reviews'))"), "product reviews");
  const reviewState = await evaluate(`({
    heading: document.querySelector("#reviews-title")?.textContent.trim(),
    rating: document.querySelector(".reviews-score")?.textContent.trim(),
    reviews: document.querySelectorAll("#reviews .reviews-list article").length,
    guestRestriction: document.querySelector(".review-form-card")?.textContent.includes("Sharh yozish uchun"),
    formVisible: Boolean(document.querySelector(".review-form-card form")),
  })`);
  assert.deepEqual(reviewState, { heading: "Xaridorlar sharhlari", rating: "4.5", reviews: 2, guestRestriction: true, formVisible: false });

  await evaluate("localStorage.setItem('access_token', 'demo-buyer-token'); location.reload()");
  await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('.review-form-card form'))"), "purchased buyer review form");
  await evaluate(`(() => {
    document.querySelector('.review-rating-input button[aria-label="5 yulduz"]').click();
    const form = document.querySelector('.review-form-card form');
    form.querySelector('textarea').value = 'Smoke test fikri';
    form.querySelector('textarea').dispatchEvent(new Event('input', { bubbles: true }));
    form.requestSubmit();
  })()`);
  await until(() => evaluate("document.querySelector('.review-form-card .form-success')?.textContent.includes('qabul qilindi')"), "purchased buyer review submission");
  await evaluate("localStorage.removeItem('access_token')");

  await send("Page.navigate", { url: `${base}/product/demo-watch#reviews` });
  await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('#reviews .state-panel'))"), "empty product reviews");
  assert.equal(await evaluate("document.querySelector('#reviews .state-panel h2')?.textContent.trim()"), "Hali sharhlar yo‘q");
  console.log(`PASS: search TC1-TC4; review TC1-TC4;${process.env.UI_AUTH_LIVE === "true" ? " account TC1, TC2, TC4;" : ""} guest checkout TC3 regression; SSR catalog, pagination and empty state; slug category and URL filters; ${routes.length} routes at 375px without horizontal overflow.`);
} finally {
  socket?.close();
  chrome.kill();
  await delay(300);
  await rm(profile, { recursive: true, force: true });
}
