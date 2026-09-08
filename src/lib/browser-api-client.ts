import { getAccessToken, sessionHeaders } from "@/lib/access-token";

export class BrowserApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) { super(message); this.name = "BrowserApiError"; }
}

const object = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};

export async function browserApiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers({ Accept: "application/json", ...sessionHeaders() });
  if (options.body) headers.set("Content-Type", "application/json");
  new Headers(options.headers).forEach((value, key) => headers.set(key, value));
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    headers,
    signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000),
  });
  const data = response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) {
    const rawMessage = object(data).message;
    const message = Array.isArray(rawMessage) ? rawMessage.join(", ") : typeof rawMessage === "string" ? rawMessage : `API so‘rovi bajarilmadi (${response.status})`;
    if (response.status === 401 && getAccessToken() && typeof window !== "undefined") window.dispatchEvent(new CustomEvent("elchi:auth-expired"));
    throw new BrowserApiError(response.status, message, data);
  }
  return data as T;
}
