import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { root } from './load-typescript.mjs';

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full) : /\.(ts|tsx|css)$/.test(entry.name) ? [full] : [];
});
const sources = walk(path.join(root, 'src')).map((file) => ({ file: path.relative(root, file), text: fs.readFileSync(file, 'utf8') }));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

test('do‘kon kodiga bog‘liq emas: hamma importlar landing/ ichida (SF-01 qabul mezoni)', () => {
  for (const { file, text } of sources) {
    for (const [, specifier] of text.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
      if (!specifier.startsWith('.')) continue;
      const resolved = path.resolve(root, path.dirname(file), specifier);
      assert.ok(resolved.startsWith(`${root}${path.sep}`), `${file}: ${specifier} landing/ dan tashqariga chiqadi`);
    }
  }
});

test('provayderlar yo‘q: context, savat, sevimlilar, mijoz tokeni yo‘q (SF-01)', () => {
  for (const { file, text } of sources) {
    assert.doesNotMatch(text, /createContext|Provider\b/, `${file}: provayder`);
    assert.doesNotMatch(text, /localStorage|access[_-]?token/i, `${file}: mijoz tokeni`);
  }
});

test('TC2: sotuvchi sahifasida savat va sevimlilar so‘rovlari yo‘q', () => {
  for (const { file, text } of sources) assert.doesNotMatch(text, /\/(?:cart|favorites)\b/, file);
});

test('bog‘liqliklar minimal: faqat next, react, react-dom', () => {
  assert.deepEqual(Object.keys(pkg.dependencies).sort(), ['next', 'react', 'react-dom']);
});

test('noindex: X-Robots-Tag sarlavhasi va meta robots', () => {
  const config = fs.readFileSync(path.join(root, 'next.config.ts'), 'utf8');
  assert.match(config, /X-Robots-Tag", value: "noindex, nofollow"/);
  const layout = fs.readFileSync(path.join(root, 'src/app/layout.tsx'), 'utf8');
  assert.match(layout, /robots: \{ index: false, follow: false/);
});
