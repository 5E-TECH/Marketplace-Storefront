# Backend contract

`openapi.json` is an unchanged snapshot of the Elchi Marketplace API 0.1 contract found at `../Marketplace-FrontEnd/contract/openapi.json` on 2026-09-08. Keep the snapshot under version control; replace it with the backend's updated contract when the API changes.

```sh
npm run api:generate
npm run api:check
```

`api:generate` uses openapi-typescript for TypeScript declarations and Ajv standalone generation for response validators. Generated artifacts contain no timestamps and are committed in `src/generated`. `api:check` regenerates in memory and fails if any artifact is stale; CI runs it through `npm run check`.

## Known contract gaps

The snapshot describes several primitive or free-form fields (`description`, nullable prices, image URLs, attributes, pagination query parameters) as empty `object` schemas. Actual public product responses use strings, numbers and null in these fields. The generator represents unspecified objects as `unknown` and leaves their runtime value unconstrained; consumers narrow these values before use. It does not infer types from example values or modify the source contract. Explicitly specified object properties, required fields, arrays, enums and numeric types remain validated. Ajv format checking is disabled; date-time formats are not enforced.

The live API also wraps successful payloads in `{ statusCode, message, data }`. `lib/api.ts` unwraps that envelope before applying the generated payload validator. Bare payloads are supported too. These gaps should be corrected in the backend OpenAPI generator; changing this snapshot alone would conceal the discrepancy.

DTO types are aliases of generated schemas. UI domain types in `src/types/commerce.ts` describe the rendered view and remain separate.
