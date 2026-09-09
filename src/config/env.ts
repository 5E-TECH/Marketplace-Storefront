const rawApiUrl = (process.env.API_BASE_URL ?? process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL)?.trim().replace(/\/+$/, "") ?? "";
const timeout = Number(process.env.API_TIMEOUT_MS);

export const env = {
  apiUrl: rawApiUrl,
  apiTimeoutMs: Number.isSafeInteger(timeout) && timeout > 0 ? timeout : 10_000,
  useMockData: process.env.USE_MOCK_DATA === "true",
} as const;
