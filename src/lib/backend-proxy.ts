import { NextRequest, NextResponse } from "next/server";
import { ApiError, apiResponse } from "@/lib/api";

const FORWARDED_HEADERS = ["authorization", "cookie", "accept-language", "x-session-id", "content-type"] as const;

export async function proxyBackend(request: NextRequest, path: string): Promise<Response> {
  const headers = new Headers();
  FORWARDED_HEADERS.forEach((name) => {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  });
  try {
    const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
    const upstream = await apiResponse(path, { method: request.method, headers, body: body || undefined, params: Object.fromEntries(request.nextUrl.searchParams), server: true });
    const responseHeaders = new Headers({ "Content-Type": upstream.headers.get("content-type") ?? "application/json", "Cache-Control": "private, no-store" });
    upstream.headers.getSetCookie().forEach((cookie) => responseHeaders.append("Set-Cookie", cookie));
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    const status = error instanceof ApiError && error.kind === "configuration" ? 503 : error instanceof ApiError && error.kind === "timeout" ? 504 : 502;
    return NextResponse.json({ message: error instanceof ApiError ? error.message : "Backend API bilan aloqa yo‘q", kind: error instanceof ApiError ? error.kind : "network" }, { status });
  }
}
