import { readFile, writeFile } from 'node:fs/promises';
import openapiTS, { astToString, COMMENT_HEADER } from 'openapi-typescript';
import Ajv from 'ajv';
import ts from 'typescript';
import standaloneCode from 'ajv/dist/standalone/index.js';

const root = new URL('../', import.meta.url);
const contract = JSON.parse(await readFile(new URL('contract/openapi.json', root), 'utf8'));
const types = COMMENT_HEADER + astToString(await openapiTS(contract, { emptyObjectsUnknown: true, defaultNonNullable: false,
  transform(schema) {
    if (schema.type === 'object' && !schema.properties && schema.additionalProperties === undefined && !schema.allOf && !schema.oneOf && !schema.anyOf) return ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);
  } }));

// Nest's snapshot marks unspecified/nullable primitive fields as empty objects.
// Match openapi-typescript's emptyObjectsUnknown option instead of inventing types.
function jsonSchema(value) {
  if (Array.isArray(value)) return value.map(jsonSchema);
  if (!value || typeof value !== 'object') return value;
  const { nullable, ...schema } = value;
  delete schema.example;
  for (const key of Object.keys(schema)) schema[key] = jsonSchema(schema[key]);
  if (schema.type === 'object' && !schema.properties && schema.additionalProperties === undefined) delete schema.type;
  if (nullable && (schema.type || schema.allOf || schema.oneOf || schema.anyOf || schema.$ref)) return { anyOf: [schema, { type: 'null' }] };
  return schema;
}
const names = ['StorefrontProductDto', 'StorefrontProductsPageDto', 'StorefrontShopPageDto', 'CategoryTreeDto', 'ProductDto', 'MyProductsPageDto', 'ProductVariantDto', 'CartDto', 'FavoritesPageDto', 'BuyerOrdersPageDto'];
const ajv = new Ajv({ strict: false, validateFormats: false, code: { source: true, esm: true, lines: true } });
ajv.addSchema({ $id: 'elchi', components: { schemas: jsonSchema(contract.components.schemas) } });
const exports = {};
for (const name of names) {
  const id = `elchi#/components/schemas/${name}`;
  ajv.getSchema(id);
  exports[`validate${name}`] = id;
}
const validators = '// Generated from contract/openapi.json. Do not edit.\n' + standaloneCode(ajv, exports);
const declarations = '// Generated from contract/openapi.json. Do not edit.\nimport type { components } from "./api-types";\n' + names.map(name => `export declare const validate${name}: (value: unknown) => value is components["schemas"]["${name}"];`).join('\n') + '\n';
for (const [filename, content] of Object.entries({ 'api-types.ts': types, 'api-validators.js': validators, 'api-validators.d.ts': declarations })) {
  const destination = new URL(`src/generated/${filename}`, root);
  if (process.argv.includes('--check')) {
    const current = await readFile(destination, 'utf8').catch(() => '');
    if (current !== content) throw new Error(`${filename} eskirgan. npm run api:generate buyrug‘ini bajaring.`);
  } else await writeFile(destination, content);
}
console.log(process.argv.includes('--check') ? 'OpenAPI artifacts are current.' : 'Generated OpenAPI types and response validators.');
