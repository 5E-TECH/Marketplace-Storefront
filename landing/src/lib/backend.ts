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

/**
 * api-gateway har 2xx javobni qobiqqa o‘raydi: `{ statusCode, message, data }` (`TransformInterceptor`,
 * marketplace `docs/API_CONTRACT.md` §1.3). Do‘kon sayti ham `data` ni oladi (`../src/lib/api.ts`).
 * Qobiqsiz javob ham qabul qilinadi (`rawResponse` bilan qaytgan yo‘llar).
 */
export async function readData<T>(response: Response): Promise<T> {
  const body = (await response.json()) as unknown;
  if (body && typeof body === "object" && "data" in body && "statusCode" in body) return (body as { data: T }).data;
  return body as T;
}

/**
 * Mijoz IP manzili o‘zgartirilmay uzatiladi (do‘kon proksisidagi kabi, `src/lib/backend-proxy.ts`).
 * Har so‘rovda kerak: api-gateway `ThrottlerGuard` limitini IP bo‘yicha hisoblaydi (`app.module.ts`,
 * `RATE_LIMIT_MAX` sukuti 300 / daqiqa). IP siz hamma tashrif landing konteynerining bitta IP siga yozilib, limitga tez yetadi.
 */
function clientHeaders(client: ClientHeaders, extra: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { accept: "application/json", ...extra };
  if (client.forwardedFor) headers["x-forwarded-for"] = client.forwardedFor;
  if (client.userAgent) headers["user-agent"] = client.userAgent;
  return headers;
}

/** `GET /landing/:code`. 404 — bunday sotuvchi sahifasi yo‘q (null). Boshqa javoblar — BackendError. */
export async function getLanding(code: string, client: ClientHeaders = {}, config: ServerConfig = readConfig(), fetcher: Fetcher = fetch): Promise<LandingPage | null> {
  if (config.mock) return mockGetLanding(code);
  const response = await call(`/landing/${encodeURIComponent(code)}`, { headers: clientHeaders(client, {}) }, config, fetcher);
  if (response.status === 404) return null;
  if (!response.ok) throw new BackendError(`GET /landing → ${response.status}`, response.status);
  const page = await readData<LandingPage | null>(response);
  if (!page || typeof page !== "object" || typeof page.code !== "string") throw new BackendError("GET /landing: sahifa ma’lumoti yo‘q", response.status);
  return page;
}

/** `POST /clicks`. */
export async function createClick(body: CreateLandingClick, client: ClientHeaders = {}, config: ServerConfig = readConfig(), fetcher: Fetcher = fetch): Promise<LandingClickCreated> {
  if (config.mock) return mockCreateClick(body);
  const headers = clientHeaders(client, { "content-type": "application/json" });
  const response = await call("/clicks", { method: "POST", headers, body: JSON.stringify(body) }, config, fetcher);
  if (!response.ok) throw new BackendError(`POST /clicks → ${response.status}`, response.status);
  const created = await readData<LandingClickCreated | null>(response);
  if (!created || (typeof created.clickId !== "string" && typeof created.clickId !== "number")) throw new BackendError("POST /clicks: clickId yo‘q", response.status);
  return { clickId: String(created.clickId) };
}
