import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const base = process.env.API_TEST_URL ?? 'http://127.0.0.1:3001';
const response = await fetch(`${base}/api-test`);
const html = await response.text();
assert.equal(response.status, 200);
assert.ok(html.includes('data-testid="ssr-success"'), 'SSR must load and validate the real backend catalog');
const proxyResponse = await fetch(`${base}/api/backend/storefront/products?limit=5`);
assert.equal(proxyResponse.status, 200);
const raw = await proxyResponse.json();
const catalog = raw.data ?? raw;
assert.ok(catalog.items.length > 0, 'Acceptance requires real backend products');
for (const product of catalog.items) assert.ok(html.includes(product.name));

const profile = await mkdtemp(join(tmpdir(), 'elchi-api-browser-'));
const chrome = spawn(process.env.CHROME_PATH ?? 'google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
let socket;
let spawnError;
chrome.on('error', (error) => { spawnError = error; });
async function until(check, description) {
  const deadline = Date.now() + 25_000;
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError;
    const value = await check();
    if (value) return value;
    await delay(200);
  }
  throw new Error(`Timed out: ${description}`);
}
try {
  const port = await until(async () => (await readFile(join(profile, 'DevToolsActivePort'), 'utf8').catch(() => '')).split('\n')[0], 'Chrome startup');
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json());
  socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
  let sequence = 0;
  const pending = new Map();
  const exceptions = [];
  socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    if (data.method === 'Runtime.exceptionThrown') exceptions.push(data.params.exceptionDetails.text);
    if (pending.has(data.id)) { const { resolve, reject } = pending.get(data.id); pending.delete(data.id); if (data.error) reject(new Error(data.error.message)); else resolve(data.result); }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const deadline = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 10_000);
    pending.set(id, { resolve: (value) => { clearTimeout(deadline); resolve(value); }, reject: (error) => { clearTimeout(deadline); reject(error); } });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true })).result.value;
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Page.navigate', { url: `${base}/api-test` });
  const success = "document.querySelector('[data-testid=browser-success]')?.textContent";
  console.log('Browser:', await until(() => evaluate(success), 'browser catalog'));
  for (const product of catalog.items) assert.ok(await evaluate(`document.body.textContent.includes(${JSON.stringify(product.name)})`));
  await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await evaluate("document.querySelector('button').click()");
  const error = await until(() => evaluate("document.querySelector('[data-testid=browser-error]')?.textContent"), 'offline error');
  assert.ok(error.includes('network'), error);
  await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await evaluate("document.querySelector('button').click()");
  await until(() => evaluate(success), 'recovery after offline');
  assert.deepEqual(exceptions, []);
  console.log(`PASS: SSR, proxy and Chrome loaded ${catalog.items.length} real products; offline and recovery passed.`);
} finally {
  socket?.close();
  chrome.kill();
  await delay(500);
  await rm(profile, { recursive: true, force: true });
}
