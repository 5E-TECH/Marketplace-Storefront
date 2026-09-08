import { env } from "@/config/env";

export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

type Options = Omit<RequestInit, "body"> & { body?: unknown; params?: Record<string, string | number | undefined>; next?: { revalidate?: number; tags?: string[] }; timeoutMs?: number };

export async function apiClient<T>(path: string, options: Options = {}): Promise<T> {
  if (!env.apiUrl) throw new ApiError(0, "API_URL sozlanmagan");
  const { body, params, headers, timeoutMs = env.apiTimeoutMs, ...init } = options;
  const url = new URL(`${env.apiUrl}${path}`);
  Object.entries(params ?? {}).forEach(([key, value]) => value !== undefined && url.searchParams.set(key, String(value)));
  let response: Response;
  const requestHeaders = new Headers(headers);
  if (body !== undefined && !requestHeaders.has("Content-Type")) requestHeaders.set("Content-Type", "application/json");
  try {
    response = await fetch(url, {
      ...init,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: requestHeaders,
      signal: init.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    throw new ApiError(0, timedOut ? "API javob berish vaqti tugadi" : "API bilan aloqa yo‘q", error);
  }
  const contentType = response.headers.get("content-type") ?? "";
  const data = response.status === 204 ? undefined : contentType.includes("application/json") ? await response.json().catch(() => undefined) : await response.text().catch(() => undefined);
  const details = data && typeof data === "object" ? data as Record<string, unknown> : undefined;
  if (!response.ok) throw new ApiError(response.status, typeof details?.message === "string" ? details.message : `So‘rov bajarilmadi (${response.status})`, data);
  return data as T;
}
