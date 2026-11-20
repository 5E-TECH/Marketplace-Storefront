/**
 * Tekshiruv skriptlari uchun: build qilingan ilovani mock backend bilan ko‘taradi yoki `SMOKE_URL` dagi
 * tayyor serverni ishlatadi (CI da Docker konteyneri). `smoke.mjs` dagi bilan bir xil yo‘l.
 */
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

const freePort = () => new Promise((resolve, reject) => {
  const server = createServer();
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => { const { port } = server.address(); server.close(() => resolve(port)); });
});

async function waitFor(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { if ((await fetch(url)).ok) return; } catch { /* hali ko‘tarilmagan */ }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`${url} ${timeoutMs} ms ichida javob bermadi`);
}

export async function startServer() {
  const ready = process.env.SMOKE_URL?.replace(/\/+$/, '');
  if (ready) {
    await waitFor(`${ready}/healthz`, 30_000);
    return { base: ready, stop: () => {} };
  }
  const port = await freePort();
  const base = `http://localhost:${port}`;
  const child = spawn(process.execPath, [path.join(root, 'node_modules/next/dist/bin/next'), 'start', '-p', String(port)], {
    cwd: root, env: { ...process.env, MOCK_API: 'true', NEXT_PUBLIC_SUPPORT_PHONE: '' }, stdio: ['ignore', 'ignore', 'inherit'],
  });
  await waitFor(`${base}/healthz`, 30_000);
  return { base, stop: () => child.kill() };
}
