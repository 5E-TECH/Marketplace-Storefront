#!/usr/bin/env node
/**
 * Kontrakt tekshiruvi — frontend chaqirayotgan har bir endpoint backend
 * OpenAPI sxemasida hali ham mavjudligini tasdiqlaydi.
 *
 * Nega kerak: e2e testlar mock javoblar ustida ishlaydi, shuning uchun
 * backend endpointni o'chirsa yoki nomini o'zgartirsa testlar baribir yashil
 * qolardi va xato faqat productionda ko'rinardi.
 *
 * Bu tekshiruv faqat endpoint YO'Lini biladi. Javob ichidagi maydon nomi
 * o'zgarsa u sezmaydi — buning uchun `npm run api:check` va
 * generatsiya qilingan DTO validatorlari bor.
 *
 * Storefront apiRequest chaqiruvlari, HTTP usullari va lokal yo‘l konstantalari tekshiriladi.
 * Dinamik proxy transporti src/lib/backend-proxy.ts ichida alohida cheklanadi.
 *
 * Sxemani yangilash:
 *   npm run api:sync && npm run api:generate
 * (backend tomonda sxema `npm run build:all && npm run contract:export` bilan
 * yangilanadi; u yerda ham CI darvozasi bor.)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SPEC_FILE = resolve(root, 'contract/openapi.json');
const SOURCE_DIR = resolve(root, 'src');
const API_PREFIX = '/api/v1';
const PARAM = '{}';

/** `/products/{id}` va `/products/${...}` — ikkalasi ham `/products/{}` bo'ladi. */
function normalize(path) {
  return path
    .replace(/\$\{[^}]*\}/g, PARAM)
    .replace(/\{[^}]*\}/g, PARAM)
    .replace(/\/+$/, '');
}

function listSourceFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return listSourceFiles(full);
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

// Parse calls as TypeScript, including generic types and local endpoint constants.
export function collectCalls(sourceDir = SOURCE_DIR) {
  const calls = new Map();
  const unresolved = [];
  for (const file of listSourceFiles(sourceDir)) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const constants = new Map();
    function visitConstants(node) {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
        constants.set(node.name.text, node.initializer);
      }
      ts.forEachChild(node, visitConstants);
    }
    visitConstants(source);
    function paths(node, seen = new Set()) {
      if (!node) return [];
      if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [node.text];
      if (ts.isConditionalExpression(node)) return [...paths(node.whenTrue, seen), ...paths(node.whenFalse, seen)];
      if (ts.isTemplateExpression(node)) {
        return [node.head.text + node.templateSpans.map(span => {
          const values = paths(span.expression, seen);
          return (values.length === 1 ? values[0] : PARAM) + span.literal.text;
        }).join('')];
      }
      if (ts.isIdentifier(node) && !seen.has(node.text)) {
        return paths(constants.get(node.text), new Set([...seen, node.text]));
      }
      return [];
    }
    function visit(node) {
      if (ts.isCallExpression(node)) {
        const expression = node.expression;
        const isApi = ts.isIdentifier(expression) && expression.text === 'apiRequest';
        if (isApi) {
          let method = 'GET';
          if (node.arguments[1] && ts.isObjectLiteralExpression(node.arguments[1])) {
            const property = node.arguments[1].properties.find(item => ts.isPropertyAssignment(item) && item.name.getText(source).replace(/['"]/g, '') === 'method');
            if (property) method = paths(property.initializer)[0]?.toUpperCase() ?? 'UNRESOLVED';
          }
          const endpoints = paths(node.arguments[0]);
          if (!endpoints.length || endpoints.some(path => !path.startsWith('/'))) unresolved.push(file.slice(root.length + 1));
          for (const endpoint of endpoints.filter(path => path.startsWith('/'))) {
            const key = `${method} ${API_PREFIX}${normalize(endpoint)}`;
            if (!calls.has(key)) calls.set(key, []);
            calls.get(key).push(file.slice(root.length + 1));
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  if (unresolved.length) throw new Error(`Endpointni aniqlab bo‘lmadi: ${unresolved.join(', ')}`);
  return calls;
}

export function collectSpec(specFile = SPEC_FILE) {
  const spec = JSON.parse(readFileSync(specFile, 'utf8'));
  const known = new Set();

  for (const [path, operations] of Object.entries(spec.paths ?? {})) {
    for (const method of Object.keys(operations)) {
      known.add(`${method.toUpperCase()} ${normalize(path)}`);
    }
  }

  return known;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const calls = collectCalls();
  const known = collectSpec();
  const missing = [...calls.keys()].filter((key) => !known.has(key)).sort();

  console.log(
    `Kontrakt: ${calls.size} ta endpoint chaqiruvi, sxemada ${known.size} ta operatsiya.`,
  );

  if (missing.length > 0) {
    console.error('\nSxemada topilmagan endpointlar:');
    for (const key of missing) {
      console.error(`  ✗ ${key}`);
      for (const file of calls.get(key)) console.error(`      ${file}`);
    }
    console.error(
      '\nBackend kontrakti o‘zgargan bo‘lsa contract/openapi.json ni yangilang,' +
        '\naks holda frontend chaqiruvini to‘g‘rilang.',
    );
    process.exit(1);
  }

  console.log('Barcha chaqiruvlar backend sxemasiga mos. ✓');

}
