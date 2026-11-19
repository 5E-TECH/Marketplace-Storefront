import { readConfig, type ServerConfig } from "./config";
import type { ApiError, CreateLandingClick, CreateLead, LandingClickCreated, LandingPage, RegionGroup } from "./contract";
import { mockCreateClick, mockCreateLead, mockGetLanding, mockRegionTree } from "./mock";

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

/**
 * `revalidate` (soniya) berilsa — Next ma’lumot keshi (SF-03: statik sahifa uchun, sahifa ham shu muddatda qayta
 * generatsiya qilinadi); berilmasa — `no-store` (forma yuborish, klik).
 */
async function call(path: string, init: RequestInit, config: ServerConfig, fetcher: Fetcher, revalidate?: number): Promise<Response> {
  const caching = revalidate === undefined ? { cache: "no-store" as const } : { next: { revalidate } };
  try {
    return await fetcher(`${baseUrl(config)}${path}`, { ...init, ...caching, signal: AbortSignal.timeout(config.apiTimeoutMs) } as RequestInit);
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
export async function getLanding(code: string, client: ClientHeaders = {}, config: ServerConfig = readConfig(), fetcher: Fetcher = fetch, revalidate?: number): Promise<LandingPage | null> {
  if (config.mock) return mockGetLanding(code);
  const response = await call(`/landing/${encodeURIComponent(code)}`, { headers: clientHeaders(client, {}) }, config, fetcher, revalidate);
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

/**
 * `POST /leads` natijasi. 400 — maydonlar (backend `details[].field`), 404 — sahifa yo‘q,
 * 409 `LANDING_NOT_OPEN` — sahifa ariza qabul qilmaydi. Boshqa javob va tarmoq xatosi — BackendError
 * (forma «server xatosi» holatini ko‘rsatadi, «rahmat» va piksel yo‘q — SF-02 TC2).
 */
export type LeadResult =
  | { kind: "created"; leadId: string; duplicate: boolean }
  | { kind: "invalid"; fields: string[]; messages: string[] }
  | { kind: "notFound" }
  | { kind: "notOpen" };

const readError = async (response: Response): Promise<ApiError> => {
  try { return ((await response.json()) ?? {}) as ApiError; } catch { return {}; }
};

export async function createLead(body: CreateLead, client: ClientHeaders = {}, config: ServerConfig = readConfig(), fetcher: Fetcher = fetch): Promise<LeadResult> {
  if (config.mock) return mockCreateLead(body);
  const headers = clientHeaders(client, { "content-type": "application/json" });
  const response = await call("/leads", { method: "POST", headers, body: JSON.stringify(body) }, config, fetcher);
  if (response.ok) {
    const created = (await readData<{ leadId?: unknown; duplicate?: unknown } | null>(response)) ?? {};
    if (typeof created.leadId !== "string" && typeof created.leadId !== "number") throw new BackendError("POST /leads: leadId yo‘q", response.status);
    return { kind: "created", leadId: String(created.leadId), duplicate: created.duplicate === true };
  }
  if (response.status === 404) return { kind: "notFound" };
  const error = await readError(response);
  if (response.status === 409 && error.errorCode === "LANDING_NOT_OPEN") return { kind: "notOpen" };
  if (response.status === 400) {
    const messages = Array.isArray(error.message) ? error.message.map(String) : error.message ? [String(error.message)] : [];
    const fields = [...new Set((error.details ?? []).map((detail) => detail.field).filter((field): field is string => Boolean(field)))];
    return { kind: "invalid", fields, messages };
  }
  throw new BackendError(`POST /leads → ${response.status}`, response.status);
}

/** Ro‘yxat kam o‘zgaradi: jarayon xotirasida 1 soat [taklif]. Bo‘sh yoki xato javob keshlanmaydi. */
export const REGION_CACHE_MS = 60 * 60 * 1000;
let regionCache: { tree: RegionGroup[]; at: number } | null = null;
/** Testlar uchun. */
export const resetRegionCache = () => { regionCache = null; };

/**
 * `GET /regions/tree` — formadagi viloyat va tuman ro‘yxati (SF-06), gateway qobig‘idan (`data`).
 * Yuklanmasa yoki bo‘sh kelsa — BackendError: forma-20 holati, ariza yuborilmaydi (TC5).
 * `code` faqat mock uchun: `mockRoyxat` sahifasida ro‘yxat yuklanmaydi.
 */
export async function getRegionTree(code = "", config: ServerConfig = readConfig(), fetcher: Fetcher = fetch, revalidate?: number): Promise<RegionGroup[]> {
  if (config.mock) return mockRegionTree(code);
  if (regionCache && Date.now() - regionCache.at < REGION_CACHE_MS) return regionCache.tree;
  const response = await call("/regions/tree", { headers: { accept: "application/json" } }, config, fetcher, revalidate);
  if (!response.ok) throw new BackendError(`GET /regions/tree → ${response.status}`, response.status);
  const tree = await readData<unknown>(response);
  const usable = Array.isArray(tree) ? (tree as RegionGroup[]).filter((region) => Array.isArray(region?.districts) && region.districts.length > 0) : [];
  if (usable.length === 0) throw new BackendError("GET /regions/tree: ro‘yxat bo‘sh yoki noto‘g‘ri", response.status);
  regionCache = { tree: usable, at: Date.now() };
  return usable;
}
