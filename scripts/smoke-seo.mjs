import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const storefront = (process.env.SEO_STOREFRONT_URL ?? "https://elchimarket.uz").replace(/\/+$/, "");
const canonicalBase = (process.env.SEO_CANONICAL_URL ?? storefront).replace(/\/+$/, "");
const admin = process.env.SEO_ADMIN_URL?.replace(/\/+$/, "");
const productId = process.env.SEO_PRODUCT_ID ?? "6";
const shopSlug = process.env.SEO_SHOP_SLUG ?? "qa-seller-4925281-4925281";

const get = async (url) => {
  const response = await fetch(url, { redirect: "follow" });
  const body = await response.text();
  assert.equal(response.status, 200, `${url} HTTP ${response.status}`);
  return body;
};
const metaContent = (html, name) => html.match(new RegExp(`<meta name="${name}" content="([^"]+)"\\s*/?>`))?.[1];
const assertIndexablePage = (html, route) => {
  assert.doesNotMatch(html, /<meta name="robots" content="[^"]*noindex/i, `TC5: ${route} sahifasida noindex bo‘lmasligi kerak`);
  assert.ok(html.match(/<title>([^<]+)<\/title>/)?.[1], `TC3: ${route} sahifasida title kerak`);
  assert.ok(metaContent(html, "description"), `TC3: ${route} sahifasida description kerak`);
};

const home = await get(storefront);
assert.match(home, /class="product-card"/, "TC2: katalog SSR HTML ichida bo‘lishi kerak");
assert.match(home, /<meta name="robots" content="index, follow"\s*\/?>/, "TC3: storefront index, follow bo‘lishi kerak");
assert.match(home, /<link rel="canonical" href="https?:\/\/[^\"]+\/?"\s*\/?>/, "Bosh sahifada absolute canonical kerak");
assert.match(home, /<meta property="og:image" content="https?:\/\/[^\"]+\/og-default\.png"\s*\/?>/, "Standart ulashish rasmi kerak");
assertIndexablePage(home, "/");

const storefrontRobots = await get(`${storefront}/robots.txt`);
assert.match(storefrontRobots, /User-Agent: \*[\s\S]*Allow: \//i, "TC3: storefront robots katalogni ochishi kerak");
assert.doesNotMatch(storefrontRobots, /Disallow: \/(?:product|dokon)/, "Mahsulot va do‘kon sahifalari robotsda yopilmasligi kerak");

const sitemap = await get(`${storefront}/sitemap.xml`);
assert.match(sitemap, new RegExp(`<loc>${canonicalBase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/product/${productId}</loc>`), "Sitemap mahsulotni o‘z ichiga olishi kerak");
assert.match(sitemap, new RegExp(`<loc>${canonicalBase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/dokon/${shopSlug}</loc>`), "Sitemap do‘konni o‘z ichiga olishi kerak");

const product = await get(`${storefront}/product/${encodeURIComponent(productId)}`);
assertIndexablePage(product, `/product/${productId}`);
assert.match(product, /<meta property="og:title" content="[^"]+"\s*\/?>/, "TC4: og:title kerak");
assert.match(product, /<meta property="og:description" content="[^"]*\d[\d ]* so‘m[^"]*"\s*\/?>/, "TC4: og:description ichida narx kerak");
assert.match(product, /<meta property="og:image" content="https?:\/\/[^\"]+"\s*\/?>/, "TC4: absolute og:image kerak");
assert.match(product, new RegExp(`<link rel="canonical" href="${canonicalBase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/product/${productId}"\\s*/?>`), "Mahsulot canonical manzili kerak");
assert.match(product, /<script type="application\/ld\+json">[^<]*"@type":"Product"[^<]*"priceCurrency":"UZS"[^<]*"availability":"https:\/\/schema\.org\/(?:InStock|OutOfStock)"[^<]*<\/script>/, "Google Product JSON-LD narx va mavjudlik bilan kerak");

const shop = await get(`${storefront}/dokon/${encodeURIComponent(shopSlug)}`);
assertIndexablePage(shop, `/dokon/${shopSlug}`);
assert.match(shop, /<h1>[^<]+<\/h1>/, "Do‘kon SSR HTML ichida nom bilan chiqishi kerak");
assert.match(shop, new RegExp(`<link rel="canonical" href="${canonicalBase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/dokon/${shopSlug}"\\s*/?>`), "Do‘kon canonical manzili kerak");
assert.match(shop, /<meta property="og:title" content="[^"]+"\s*\/?>/, "Do‘kon ulashish teglari kerak");

const staticRoutes = ["/katalog", "/qidiruv", "/cart", "/checkout", "/favorites", "/login", "/register", "/forgot-password", "/profile", "/profile/orders", "/orders/seo-test", "/api-test", "/ui-kit"];
const staticPages = await Promise.all(staticRoutes.map(async (route) => [route, await get(`${storefront}${route}`)]));
for (const [route, html] of staticPages) assertIndexablePage(html, route);
const metadataPairs = staticPages.map(([route, html]) => `${route}\u0000${html.match(/<title>([^<]+)<\/title>/)?.[1]}\u0000${metaContent(html, "description")}`);
assert.equal(new Set(metadataPairs.map((value) => value.split("\u0000").slice(1).join("\u0000"))).size, metadataPairs.length, "TC3: har statik sahifada o‘z title va description juftligi bo‘lishi kerak");

if (admin) {
  const adminResponse = await fetch(`${admin}/`);
  const xRobots = adminResponse.headers.get("x-robots-tag") ?? "";
  const { stdout: adminDom } = await run(process.env.CHROME_PATH ?? "google-chrome", [
    "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage",
    "--virtual-time-budget=7000", "--dump-dom", `${admin}/`,
  ], { maxBuffer: 8 * 1024 * 1024 });
  assert.match(adminDom, /id="login-title"/, "TC1: admin domen login sahifasini ochishi kerak");
  assert.match(adminDom, /id="phone"/, "TC1: login telefon maydoni kerak");
  assert.match(adminDom, /id="password"/, "TC1: login parol maydoni kerak");
  assert.ok(/noindex/i.test(xRobots) || /<meta name="robots" content="[^"]*noindex/i.test(adminDom), "TC3: kabinet header yoki meta orqali noindex bo‘lishi kerak");
}

console.log(`PASS SEO: ${storefront} SSR/index/canonical/sitemap; product ${productId} Open Graph va JSON-LD; shop ${shopSlug}.${admin ? ` ${admin} login/noindex.` : ""}`);
