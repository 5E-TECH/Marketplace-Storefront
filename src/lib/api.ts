import { env } from "@/config/env";
import { getAccessToken, sessionHeaders } from "@/lib/access-token";

export type ApiErrorKind = "network" | "timeout" | "aborted" | "not_found" | "http" | "invalid_response" | "configuration";
export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown, public kind: ApiErrorKind = status === 404 ? "not_found" : "http") {
    super(message);
    this.name = "ApiError";
  }
}

export type ApiOptions<T = unknown> = Omit<RequestInit, "body"> & {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  next?: { revalidate?: number; tags?: string[] };
  timeoutMs?: number;
  validate?: (value: unknown) => value is T;
};

type TransportOptions = Omit<ApiOptions, "body" | "validate"> & { body?: BodyInit | null; server?: boolean };
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

function safePath(path: string): boolean {
  try { return path.startsWith("/") && !path.startsWith("//") && !/[\\?#]/.test(path) && !path.split("/").some((part) => [".", ".."].includes(decodeURIComponent(part))); }
  catch { return false; }
}

function requestUrl(path: string, server: boolean, params?: ApiOptions["params"]): string {
  // Callers supply backend-relative paths; never accept arbitrary upstream URLs.
  if (!safePath(path)) {
    throw new ApiError(0, "API yo‘li noto‘g‘ri", undefined, "configuration");
  }
  const query = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined) query.set(key, String(value));
  });
  let base = "/api/backend";
  if (server) {
    try {
      const url = new URL(env.apiUrl);
      if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error();
      base = url.toString().replace(/\/+$/, "");
    } catch { throw new ApiError(0, "API_BASE_URL sozlanmagan yoki noto‘g‘ri", undefined, "configuration"); }
  }
  return `${base}${path}${query.size ? `?${query}` : ""}`;
}

/** Shared transport for SSR, browser calls and Next route proxies. Body reads share the deadline. */
export async function apiResponse(path: string, options: TransportOptions = {}): Promise<Response> {
  const { params, timeoutMs = typeof window === "undefined" ? env.apiTimeoutMs : 15_000, server = typeof window === "undefined", ...init } = options;
  const url = requestUrl(path, server, params);
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) throw new ApiError(0, "API timeout noto‘g‘ri", undefined, "configuration");
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  const signal = init.signal ? AbortSignal.any([init.signal, controller.signal]) : controller.signal;
  const headers = new Headers({ Accept: "application/json" });
  if (!server) new Headers(sessionHeaders()).forEach((value, key) => headers.set(key, value));
  new Headers(init.headers).forEach((value, key) => headers.set(key, value));
  try {
    const response = await fetch(url, { ...init, cache: init.cache ?? (init.next ? undefined : "no-store"), headers, signal });
    const body = [204, 205, 304].includes(response.status) || init.method === "HEAD" ? null : await response.arrayBuffer();
    return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  } catch (error) {
    if (init.signal?.aborted) throw new ApiError(0, "So‘rov bekor qilindi", error, "aborted");
    if (timedOut) throw new ApiError(0, "Server javob berish vaqti tugadi", error, "timeout");
    throw new ApiError(0, "Internet yoki backend bilan aloqa yo‘q", error, "network");
  } finally { clearTimeout(timeout); }
}

/** JSON API entry point. Unwraps the backend envelope, then validates the payload. */
export async function apiRequest<T = unknown>(path: string, options: ApiOptions<T> = {}): Promise<T> {
  const { body, validate, ...init } = options;
  const headers = new Headers(init.headers);
  if (body !== undefined) headers.set("Content-Type", "application/json");
  const response = await apiResponse(path, { ...init, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const content = await response.text();
  let data: unknown;
  let validJson = false;
  if (content) {
    try { data = JSON.parse(content); validJson = true; } catch { /* HTTP status is still useful for non-JSON errors. */ }
  }
  if (!response.ok) {
    const error = object(data);
    const rawMessage = error.message;
    const message = typeof rawMessage === "string" ? rawMessage : Array.isArray(rawMessage) && rawMessage.every((item) => typeof item === "string") ? rawMessage.join(", ") : response.status === 404 ? "Ma’lumot topilmadi" : `Server so‘rovni bajarmadi (${response.status})`;
    if (response.status === 401 && typeof window !== "undefined" && getAccessToken()) window.dispatchEvent(new CustomEvent("elchi:auth-expired"));
    throw new ApiError(response.status, message, data, response.status === 504 ? "timeout" : response.status === 502 && error.kind === "network" ? "network" : response.status === 404 ? "not_found" : "http");
  }
  if (response.status === 204 || response.status === 205 || !content) {
    if (validate) throw new ApiError(response.status, "Backend kutilgan javobni qaytarmadi", undefined, "invalid_response");
    return undefined as T;
  }
  if (!validJson || !/\bapplication\/(?:[\w.-]+\+)?json\b/i.test(response.headers.get("content-type") ?? "")) {
    throw new ApiError(response.status, "Backend JSON javobi noto‘g‘ri", undefined, "invalid_response");
  }
  const root = object(data);
  const payload = Object.hasOwn(root, "data") ? root.data : data;
  if (validate && !validate(payload)) throw new ApiError(response.status, "Backend javobi OpenAPI kontraktiga mos emas", undefined, "invalid_response");
  return payload as T;
}
