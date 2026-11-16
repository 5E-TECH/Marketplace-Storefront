import { readConfig, type ServerConfig } from "./config";
import type { CreateLandingClick, LandingClickCreated, LandingPage } from "./contract";
import { mockCreateClick, mockGetLanding } from "./mock";

/** Backend javob bermadi yoki kutilmagan javob berdi: sahifada xato-1, klik yozilmaydi. */
export class BackendError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "BackendError";
  }
}

type Fetcher = typeof fetch;

/** Mijozning IP va user agenti: backend ularni sarlavhadan oladi (BE-25, `POST /clicks` tavsifi). */
export interface ClientHeaders { forwardedFor?: string | null; userAgent?: string | null }

function baseUrl(config: ServerConfig): string {
  if (!config.apiUrl) throw new BackendError("API_BASE_URL sozlanmagan");
  return config.apiUrl;
}

async function call(path: string, init: RequestInit, config: ServerConfig, fetcher: Fetcher): Promise<Response> {
  try {
    return await fetcher(`${baseUrl(config)}${path}`, { ...init, cache: "no-store", signal: AbortSignal.timeout(config.apiTimeoutMs) });
  } catch (error) {
    if (error instanceof BackendError) throw error;
    throw new BackendError(`backend bilan aloqa yo‘q: ${(error as Error).name}`);
  }
}

/** `GET /landing/:code`. 404 — bunday sotuvchi sahifasi yo‘q (null). Boshqa javoblar — BackendError. */
export async function getLanding(code: string, config: ServerConfig = readConfig(), fetcher: Fetcher = fetch): Promise<LandingPage | null> {
  if (config.mock) return mockGetLanding(code);
  const response = await call(`/landing/${encodeURIComponent(code)}`, { headers: { accept: "application/json" } }, config, fetcher);
  if (response.status === 404) return null;
  if (!response.ok) throw new BackendError(`GET /landing → ${response.status}`, response.status);
  return (await response.json()) as LandingPage;
}

/** `POST /clicks`. Mijoz IP manzili o‘zgartirilmay uzatiladi (do‘kon proksisidagi kabi, `src/lib/backend-proxy.ts`). */
export async function createClick(body: CreateLandingClick, client: ClientHeaders = {}, config: ServerConfig = readConfig(), fetcher: Fetcher = fetch): Promise<LandingClickCreated> {
  if (config.mock) return mockCreateClick(body);
  const headers: Record<string, string> = { accept: "application/json", "content-type": "application/json" };
  if (client.forwardedFor) headers["x-forwarded-for"] = client.forwardedFor;
  if (client.userAgent) headers["user-agent"] = client.userAgent;
  const response = await call("/clicks", { method: "POST", headers, body: JSON.stringify(body) }, config, fetcher);
  if (!response.ok) throw new BackendError(`POST /clicks → ${response.status}`, response.status);
  return (await response.json()) as LandingClickCreated;
}
