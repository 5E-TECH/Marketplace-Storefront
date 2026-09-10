#!/usr/bin/env node
/**
 * Backend OpenAPI sxemasini shu repoga ko'chiradi.
 *
 * Ilgari bu qo'lda `cp` bilan qilinardi va shuning uchun kontrakt jimgina
 * eskirib qolardi — masalan backend'ga `/admin/team` qo'shilganda ikkala
 * frontend ham eski nusxada ishlayverdi.
 *
 *   node scripts/sync-contract.mjs                 # ../Elchi-Marketplace dan
 *   BACKEND_REPO=/path/to/repo node scripts/...    # boshqa joydan
 *   node scripts/sync-contract.mjs --check         # farq bo'lsa xato beradi
 *
 * Backend tomonda sxema `npm run build:all && npm run contract:export` bilan
 * yangilanadi; u yerda ham CI darvozasi bor, ya'ni `docs/openapi.json`
 * hech qachon eskirmaydi.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const backendRepo = process.env.BACKEND_REPO ?? resolve(root, '../Elchi-Marketplace');
const source = resolve(backendRepo, 'docs/openapi.json');
const destination = resolve(root, 'contract/openapi.json');
const check = process.argv.includes('--check');

let incoming;
try {
  incoming = await readFile(source, 'utf8');
} catch {
  console.error(`Backend sxemasi topilmadi: ${source}`);
  console.error('BACKEND_REPO bilan boshqa yo‘l ko‘rsating yoki backend repo‘sini yoningizga klonlang.');
  process.exit(1);
}

const current = await readFile(destination, 'utf8').catch(() => '');
if (current === incoming) {
  console.log('Kontrakt allaqachon backend bilan bir xil.');
  process.exit(0);
}

if (check) {
  const paths = (json) => {
    try {
      return Object.keys(JSON.parse(json).paths ?? {});
    } catch {
      return [];
    }
  };
  const before = new Set(paths(current));
  const after = new Set(paths(incoming));
  const added = [...after].filter((p) => !before.has(p));
  const removed = [...before].filter((p) => !after.has(p));
  console.error('Kontrakt backenddan orqada qolgan.');
  if (added.length) console.error(`  Yangi yo‘llar: ${added.join(', ')}`);
  if (removed.length) console.error(`  O‘chirilgan yo‘llar: ${removed.join(', ')}`);
  if (!added.length && !removed.length) console.error('  Yo‘llar bir xil, sxema ichi (maydonlar) o‘zgargan.');
  console.error('Tuzatish: npm run api:sync && npm run api:generate');
  process.exit(1);
}

await writeFile(destination, incoming);
console.log(`Kontrakt yangilandi: ${destination}`);
console.log('Endi tiplarni qayta yarating: npm run api:generate');
