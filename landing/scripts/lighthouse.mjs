#!/usr/bin/env node
/**
 * SF-03 tezlik byudjeti (TZ T8: sotuvchi sahifasi 1.5 s): Lighthouse mobil profili — sekin 4G
 * (150 ms RTT, 1.6 Mbit/s, 4× sekin CPU) — S1 va S3 da LCP ≤ 1500 ms. Byudjet buzilsa — chiqish kodi 1 (CI qizil).
 *
 * O‘lchov usuli `devtools` [taklif]: Chrome tarmoq va CPU ni haqiqatan sekinlashtiradi, LCP brauzerda o‘lchanadi.
 * Lighthouse’ning sukutdagi `simulate` usuli (Lantern) bu sahifada ~2.2 s beradi: lokal o‘lchovda sahifa JS
 * yuklangandan keyin chiziladi, shuning uchun u butun React/Next JS ini (~130 KB) LCP ga qo‘shadi — aslida
 * rasm va matn JS ni kutmaydi (SSR, CSS HTML ichida). Ikkala raqam PR da.
 * Har variant 3 marta o‘lchanadi, mediana olinadi (devtools usuli o‘zgaruvchan). Birinchi so‘rov sahifani statik
 * keshga yozadi (ISR) — o‘lchov keshdagi sahifada. Chrome — tizimdagi; Lighthouse `npx` bilan, versiya qotirilgan.
 */
import { execFileSync } from 'node:child_process';
import { startServer } from './serve.mjs';

const LCP_BUDGET_MS = 1500;
const RUNS = Number(process.env.LIGHTHOUSE_RUNS ?? 3);
const LIGHTHOUSE = 'lighthouse@12.8.2';
const CODE = process.env.LIGHTHOUSE_CODE ?? 'k7Qm2x';

function measure(url, cookie) {
  const raw = execFileSync('npx', ['--yes', LIGHTHOUSE, url, '--quiet', '--only-categories=performance', '--throttling-method=devtools',
    '--output=json', '--output-path=stdout', `--extra-headers=${JSON.stringify({ Cookie: cookie })}`,
    '--chrome-flags=--headless=new --no-sandbox --disable-gpu'], { maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
  const report = JSON.parse(raw.toString());
  const value = (id) => report.audits[id]?.numericValue;
  return { lcp: value('largest-contentful-paint'), fcp: value('first-contentful-paint'), cls: value('cumulative-layout-shift'), kb: value('total-byte-weight') / 1024 };
}

/** ISR keshini isitish. Lighthouse ishlagan paytda bo‘sh qolgan keep-alive ulanish uzilgan bo‘lishi mumkin — qayta urinish. */
async function warm(url, cookie) {
  for (let attempt = 1; ; attempt += 1) {
    try { await (await fetch(url, { headers: { cookie } })).arrayBuffer(); return; } catch (error) { if (attempt >= 3) throw error; }
  }
}

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

const server = await startServer();
let failed = 0;
try {
  for (const variant of ['s1', 's3']) {
    const url = `${server.base}/${CODE}`;
    const cookie = `elchi_variant=${variant}`;
    await warm(url, cookie);
    const runs = Array.from({ length: RUNS }, () => measure(url, cookie));
    const lcp = Math.round(median(runs.map((run) => run.lcp)));
    const line = `${variant}: LCP ${lcp} ms (o‘lchovlar: ${runs.map((run) => Math.round(run.lcp)).join(', ')}), FCP ${Math.round(median(runs.map((run) => run.fcp)))} ms, CLS ${median(runs.map((run) => run.cls)).toFixed(3)}, ${Math.round(runs[0].kb)} KB`;
    if (lcp <= LCP_BUDGET_MS) console.log(`ok - ${line}`);
    else { failed += 1; console.error(`not ok - ${line} — byudjet ${LCP_BUDGET_MS} ms`); }
  }
} finally {
  server.stop();
}
if (failed) process.exit(1);
console.log(`\nLCP ≤ ${LCP_BUDGET_MS} ms: S1 va S3`);
