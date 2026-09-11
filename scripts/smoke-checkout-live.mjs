import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Explicit test credentials/recipient are required: this creates a real COD order.
const required = ['CHECKOUT_API_URL', 'CHECKOUT_TEST_PRODUCT_ID', 'CHECKOUT_TEST_VARIANT_ID', 'CHECKOUT_TEST_NAME', 'CHECKOUT_TEST_PHONE', 'CHECKOUT_TEST_ADDRESS'];
for (const name of required) assert.ok(process.env[name], `${name} is required (use a test seller/product/recipient).`);
const api = process.env.CHECKOUT_API_URL.replace(/\/$/, '');
const storefront = (process.env.CHECKOUT_STOREFRONT_URL ?? 'http://127.0.0.1:3001').replace(/\/$/, '');
const sellerToken = await (async () => {
  if (process.env.CHECKOUT_SELLER_TOKEN_FILE) return (await readFile(process.env.CHECKOUT_SELLER_TOKEN_FILE, 'utf8')).trim();
  assert.ok(process.env.CHECKOUT_SELLER_PHONE && process.env.CHECKOUT_SELLER_PASSWORD_FILE, 'Provide CHECKOUT_SELLER_TOKEN_FILE or seller phone + password file.');
  const password = (await readFile(process.env.CHECKOUT_SELLER_PASSWORD_FILE, 'utf8')).trim();
  const response = await fetch(`${api}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: process.env.CHECKOUT_SELLER_PHONE, password }), signal: AbortSignal.timeout(20000) });
  const parsed = await response.json();
  assert.ok(response.ok, `Seller login failed: HTTP ${response.status}`);
  const data = parsed?.data ?? parsed;
  const token = data?.accessToken ?? data?.access_token ?? data?.token;
  assert.ok(typeof token === 'string' && token, 'Seller login did not return an access token.');
  return token;
})();
const session = `checkout-acceptance-${crypto.randomUUID()}`;
const key = crypto.randomUUID();
const address = {
  recipientName: process.env.CHECKOUT_TEST_NAME,
  phone: process.env.CHECKOUT_TEST_PHONE,
  address: process.env.CHECKOUT_TEST_ADDRESS,
  ...(process.env.CHECKOUT_TEST_REGION_ID ? { regionId: process.env.CHECKOUT_TEST_REGION_ID } : {}),
  ...(process.env.CHECKOUT_TEST_DISTRICT_ID ? { districtId: process.env.CHECKOUT_TEST_DISTRICT_ID } : {}),
};
assert.match(address.phone, /^\+998\d{9}$/);
async function request(base, path, { method = 'GET', body, seller = false, headers = {} } = {}) {
  const response = await fetch(`${base}${path}`, {
    method, headers: { 'Content-Type': 'application/json', ...(seller ? { Authorization: `Bearer ${sellerToken}` } : { 'X-Session-Id': session }), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(20000),
  });
  const text = await response.text();
  const parsed = text ? JSON.parse(text) : undefined;
  assert.ok(response.ok, `${method} ${path}: HTTP ${response.status}; ${parsed?.message ?? 'request failed'}`);
  return parsed?.data ?? parsed;
}
// Read seller access before creating anything.
await request(api, '/seller/orders?limit=1', { seller: true });
let orderId;
try {
  await request(`${storefront}/api/backend`, '/cart/items', { method: 'POST', body: { productId: process.env.CHECKOUT_TEST_PRODUCT_ID, variantId: process.env.CHECKOUT_TEST_VARIANT_ID, quantity: 1 } });
  const quote = await request(`${storefront}/api/backend`, '/checkout/delivery-preview', { method: 'POST', body: { address } });
  assert.ok(quote && typeof quote === 'object', 'Delivery quote is missing');
  const created = await request(`${storefront}/api/backend`, '/checkout', { method: 'POST', body: { paymentMethod: 'cod', address }, headers: { 'Idempotency-Key': key } });
  orderId = created?.orderId ?? created?.id ?? created?.salesOrderId;
  assert.ok(orderId, 'Backend did not return an order ID');
  console.log(`Created test sales order: ${orderId}`);
  await request(`${storefront}/api/backend`, `/checkout/${encodeURIComponent(orderId)}/confirm`, { method: 'POST' });
  let found;
  for (let page = 1; page <= 20 && !found; page++) {
    const orders = await request(api, `/seller/orders?limit=100&page=${page}`, { seller: true });
    assert.ok(Array.isArray(orders.items), 'Seller orders response is invalid');
    found = orders.items.find((item) => String(item.salesOrderId) === String(orderId));
    if (page >= orders.totalPages) break;
  }
  assert.ok(found, `Confirmed order ${orderId} was not found in the supplied seller account`);
  console.log(`PASS: guest checkout through storefront proxy; sales order ${orderId} is visible as seller order ${found.id} (${found.status}).`);
  console.log('The test order remains in the seller cabinet; cancel it there after review.');
} finally {
  // Only remove leftover test cart rows. Never silently cancel a confirmed order.
  try {
    const cart = await request(`${storefront}/api/backend`, '/cart');
    for (const item of cart?.items ?? []) await request(`${storefront}/api/backend`, `/cart/items/${encodeURIComponent(item.id)}`, { method: 'DELETE' });
  } catch { console.error('Test cart cleanup could not be verified.'); }
}
