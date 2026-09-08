const rawApiUrl = (process.env.API_BASE_URL ?? process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL)?.replace(/\/$/, "") ?? "";

export const env = {
  apiUrl: rawApiUrl,
  apiTimeoutMs: Number(process.env.API_TIMEOUT_MS) || 10_000,
  useMockData: process.env.USE_MOCK_DATA === "true",
} as const;
