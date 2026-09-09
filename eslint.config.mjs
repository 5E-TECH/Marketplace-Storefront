import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  { ignores: [".next/**", ".next-dev/**", "node_modules/**", "next-env.d.ts", "src/generated/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/api.ts", "src/generated/**"],
    rules: {
      "no-restricted-syntax": ["error", {
        selector: "CallExpression[callee.name='fetch'], CallExpression[callee.property.name='fetch']",
        message: "Backend so‘rovlari uchun @/lib/api ichidagi apiRequest ishlating.",
      }],
    },
  },
];

export default config;
