import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const base = process.env.UI_TEST_URL ?? "http://127.0.0.1:3001";
const homeResponse = await fetch(base);
const homeHtml = await homeResponse.text();
assert.equal(homeResponse.status, 200);
assert.match(homeHtml, /class="product-card"/, "Product cards must be present in the SSR HTML");
assert.match(homeHtml, /href="\/katalog\//, "SSR categories must use shareable slug URLs");
assert.doesNotMatch(homeHtml, /class="category-grid"/, "Home categories must not repeat below the header navigation");
assert.doesNotMatch(homeHtml, /Yana ko‘rsatish/, "Catalog must not paginate an API page again in the browser");
assert.match(homeHtml, /class="pagination-pages"/, "SSR catalog must expose numbered pagination");
const productPath = homeHtml.match(/href="(\/product\/[^"?#]+)"/)?.[1];
const categoryPath = homeHtml.match(/href="(\/katalog\/[^"?#]+)"/)?.[1];
assert.ok(productPath && categoryPath, "Backend catalog must provide product and category links");
const routes = ["/", "/?sort=price%3Aasc&page=2", "/qidiruv?q=__missing_product__", "/katalog", `${categoryPath}?sort=price%3Aasc`, "/cart", "/checkout", "/favorites", productPath, "/login", "/register", "/forgot-password", "/profile", "/profile/orders"];

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
      const floatingCart = document.querySelector(".floating-cart");
      return {
        width: root.clientWidth,
        scrollWidth: root.scrollWidth,
        headerVisible: getComputedStyle(header).display !== "none",
        footerVisible: getComputedStyle(footer).display !== "none",
        floatingCartVisible: floatingCart && getComputedStyle(floatingCart).position === "fixed",
      };
    })()`);
    assert.equal(result.width, 375, `${route}: viewport must be 375px`);
    assert.ok(result.scrollWidth <= result.width, `${route}: horizontal overflow (${result.scrollWidth}px > ${result.width}px)`);
    assert.ok(result.headerVisible && result.footerVisible, `${route}: header and footer must be visible`);
    // Savatcha va checkout sahifasida suzuvchi tugma o'sha sahifani takrorlaydi va kontentni yopadi — u yerda ko'rsatilmaydi.
    if (route === "/cart" || route === "/checkout") assert.equal(result.floatingCartVisible, null, `${route}: floating cart must be hidden on its own page`);
    else assert.equal(result.floatingCartVisible, true, `${route}: cart must remain fixed in the bottom-right corner`);
  }

  await send("Page.navigate", { url: `${base}${categoryPath}?sort=price%3Aasc` });
  await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('.product-card'))"), "category catalog");
  const filterState = await evaluate(`({
    path: location.pathname,
    sort: new URLSearchParams(location.search).get("sort"),
    activeSort: document.querySelector(".sort-control [aria-current=page]")?.getAttribute("aria-label"),
    products: document.querySelectorAll(".product-card").length,
    prices: [...document.querySelectorAll(".product-card .price strong")].map((element) => Number(element.textContent.replace(/\\D/g, ""))),
  })`);
  assert.deepEqual({ path: filterState.path, sort: filterState.sort, activeSort: filterState.activeSort }, { path: categoryPath, sort: "price:asc", activeSort: "Arzondan qimmatga" });
  assert.ok(filterState.products > 0, "Backend category must contain products");
  assert.deepEqual(filterState.prices, [...filterState.prices].sort((left, right) => left - right), "Price sorting must change the rendered product order");

  await send("Page.navigate", { url: `${base}/?sort=price%3Aasc&page=2` });
  await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('.product-card'))"), "second catalog page");
  const pageState = await evaluate(`({
    page: new URLSearchParams(location.search).get("page"),
    sort: new URLSearchParams(location.search).get("sort"),
    pagination: document.querySelector(".catalog-pagination [aria-current=page]")?.textContent.trim(),
    activeSort: document.querySelector(".sort-control [aria-current=page]")?.getAttribute("aria-label"),
  })`);
  assert.deepEqual(pageState, { page: "2", sort: "price:asc", pagination: "2", activeSort: "Arzondan qimmatga" });

  await send("Page.navigate", { url: `${base}/` });
  await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('.product-card h3'))"), "backend product name");
  const searchTerm = await evaluate("document.querySelector('.product-card h3').textContent.trim().split(/\\s+/)[0]");
  await send("Page.navigate", { url: `${base}/qidiruv?q=${encodeURIComponent(searchTerm)}&sort=price%3Aasc` });
  await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('.product-card'))"), "search results");
  const searchState = await evaluate(`({
    q: new URLSearchParams(location.search).get("q"),
    heading: document.querySelector(".search-page-heading h1")?.textContent.trim(),
    input: document.querySelector("#header-search")?.value,
    activeSort: document.querySelector(".sort-control [aria-current=page]")?.getAttribute("aria-label"),
    products: document.querySelectorAll(".product-card").length,
    names: [...document.querySelectorAll(".product-card h3")].map(element => element.textContent.trim()),
    prices: [...document.querySelectorAll(".product-card .price strong")].map(element => Number(element.textContent.replace(/\\D/g, ""))),
    minPrice: document.querySelector(".search-filters [name=minPrice]")?.value,
    maxPrice: document.querySelector(".search-filters [name=maxPrice]")?.value,
    filterSort: document.querySelector(".search-filters [name=sort]")?.value,
    clearPrice: document.querySelector(".search-filters a")?.getAttribute("href"),
    newestHref: document.querySelector(".sort-control a:first-child")?.getAttribute("href"),
  })`);
  assert.equal(searchState.q, searchTerm);
  assert.match(searchState.heading, new RegExp(searchTerm, "i"));
  assert.equal(searchState.input, searchTerm);
  assert.equal(searchState.activeSort, "Arzondan qimmatga");
  assert.ok(searchState.products > 0, "TC1: matching search must render at least one product");
  assert.ok(searchState.names.some(name => name.toLocaleLowerCase("uz").includes(searchTerm.toLocaleLowerCase("uz"))), "Search must return the selected backend product");
  assert.deepEqual(searchState.prices, [...searchState.prices].sort((left, right) => left - right), "TC4: search results must respect selected price sorting");
  assert.deepEqual([searchState.minPrice, searchState.maxPrice], ["", ""]);
  assert.equal(searchState.filterSort, "price:asc");
  assert.equal(searchState.clearPrice, undefined);
  assert.equal(searchState.newestHref, `/qidiruv?q=${encodeURIComponent(searchTerm)}#products`);

  await send("Page.navigate", { url: `${base}/qidiruv?q=__missing_product__` });
  await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('.catalog-empty'))"), "empty search results");
  const emptySearch = await evaluate(`({
    message: document.querySelector(".catalog-empty h3")?.textContent.trim(),
    alternatives: document.querySelectorAll(".search-alternatives .product-card").length,
  })`);
  assert.equal(emptySearch.message, "Mahsulot topilmadi");
  assert.ok(emptySearch.alternatives > 0 && emptySearch.alternatives <= 4);

  await send("Page.navigate", { url: `${base}/` });
  await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('#header-search'))"), "search input");
  await evaluate("document.querySelector('#header-search').focus()");
  await send("Input.insertText", { text: searchTerm });
  await until(() => evaluate("Boolean(document.querySelector('.search-suggestions [role=option]'))"), "search suggestions");
  assert.match(await evaluate("document.querySelector('.search-suggestions [role=option]')?.textContent"), new RegExp(searchTerm, "i"));

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

  await send("Page.navigate", { url: `${base}${productPath}#reviews` });
  await until(() => evaluate("document.readyState === 'complete' && Boolean(document.querySelector('#reviews'))"), "product reviews");
  const reviewState = await evaluate(`({
    heading: document.querySelector("#reviews-title")?.textContent.trim(),
    rating: document.querySelector(".reviews-score")?.textContent.trim(),
    summary: document.querySelector(".reviews-heading p")?.textContent.trim(),
    hasResult: Boolean(document.querySelector("#reviews .reviews-list, #reviews .state-panel")),
    guestRestriction: document.querySelector(".review-form-card")?.textContent.includes("Sharh yozish uchun"),
    formVisible: Boolean(document.querySelector(".review-form-card form")),
  })`);
  assert.equal(reviewState.heading, "Xaridorlar sharhlari");
  // Sharh yo'q mahsulotda "0.0" ko'rsatilmaydi — o'rniga matn chiqadi.
  if (reviewState.rating) assert.match(reviewState.rating, /^\d(?:\.\d)$/);
  else assert.equal(reviewState.summary, "Hali hech kim baho qo‘ymagan");
  assert.equal(reviewState.hasResult, true);
  assert.deepEqual({ guestRestriction: reviewState.guestRestriction, formVisible: reviewState.formVisible }, { guestRestriction: true, formVisible: false });
  console.log(`PASS: backend catalog, numbered pagination, search/filter/sort, reviews and ${routes.length} routes at 375px without horizontal overflow.`);
} finally {
  socket?.close();
  chrome.kill();
  await delay(300);
  await rm(profile, { recursive: true, force: true });
}
