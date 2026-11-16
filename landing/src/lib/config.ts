/**
 * Server sozlamalari. Lokal backend: `http://localhost:3000/api/v1`; prod manzili
 * (`https://api.elchimarket.uz`) lokalda ishlatilmaydi (repo-taqsimot.md, «Boshlashdan oldin» 1).
 */
export interface ServerConfig {
  apiUrl: string;
  apiTimeoutMs: number;
  mock: boolean;
}

export function readConfig(source: Record<string, string | undefined> = process.env): ServerConfig {
  const timeout = Number(source.API_TIMEOUT_MS);
  return {
    apiUrl: (source.API_BASE_URL ?? "").trim().replace(/\/+$/, ""),
    // Sukut do‘kon saytidagi bilan bir xil: `src/config/env.ts`, 10 000 ms.
    apiTimeoutMs: Number.isSafeInteger(timeout) && timeout > 0 ? timeout : 10_000,
    mock: source.MOCK_API === "true",
  };
}
