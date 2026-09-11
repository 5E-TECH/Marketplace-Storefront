import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

export async function until(check, description, timeout = 20000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const value = await check();
    if (value) return value;
    await delay(100);
  }
  throw new Error(`Timed out: ${description}`);
}

export async function checkoutBrowser() {
  const profile = await mkdtemp(join(tmpdir(), 'elchi-checkout-chrome-'));
  const chrome = spawn(process.env.CHROME_PATH ?? 'google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  let spawnError;
  let socket;
  const pending = new Map();
  const close = async () => {
    for (const request of pending.values()) request.reject(new Error('Browser closed'));
    socket?.close();
    chrome.kill();
    await delay(300);
    await rm(profile, { recursive: true, force: true });
  };
  chrome.on('error', (error) => { spawnError = error; });
  try {
    const port = await until(async () => {
      if (spawnError) throw spawnError;
      return (await readFile(join(profile, 'DevToolsActivePort'), 'utf8').catch(() => '')).split('\n')[0];
    }, 'Chrome startup');
    const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
    socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }); });
    let sequence = 0;
    const exceptions = [];
    socket.addEventListener('message', (event) => {
      const data = JSON.parse(event.data);
      if (data.method === 'Runtime.exceptionThrown') exceptions.push(data.params.exceptionDetails.exception?.description ?? data.params.exceptionDetails.text);
      const request = pending.get(data.id);
      if (!request) return;
      pending.delete(data.id);
      if (data.error) request.reject(new Error(data.error.message)); else request.resolve(data.result);
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 10000);
      pending.set(id, { resolve: (value) => { clearTimeout(timer); resolve(value); }, reject: (error) => { clearTimeout(timer); reject(error); } });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async (expression) => {
      const value = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (value.exceptionDetails) throw new Error(value.exceptionDetails.exception?.description ?? value.exceptionDetails.text);
      return value.result.value;
    };
    await send('Runtime.enable');
    await send('Page.enable');
    return { send, evaluate, close, exceptions };
  } catch (error) { await close(); throw error; }
}
