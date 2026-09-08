import { NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";

const FORWARDED_HEADERS = ["authorization", "cookie", "accept-language", "x-session-id"] as const;

export async function proxyBackend(request: NextRequest, path: string): Promise<Response> {
  if (!env.apiUrl) return NextResponse.json({ message: "API_URL sozlanmagan" }, { status: 503 });
  const headers = new Headers({ Accept: "application/json" });
  FORWARDED_HEADERS.forEach((name) => {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  });
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
  if (body) headers.set("Content-Type", request.headers.get("content-type") ?? "application/json");
  try {
    const upstream = await fetch(`${env.apiUrl}${path}`, { method: request.method, headers, body: body || undefined, cache: "no-store", signal: AbortSignal.timeout(env.apiTimeoutMs) });
    const responseHeaders = new Headers({ "Content-Type": upstream.headers.get("content-type") ?? "application/json", "Cache-Control": "private, no-store" });
    upstream.headers.getSetCookie().forEach((cookie) => responseHeaders.append("Set-Cookie", cookie));
    return new Response(upstream.status === 204 ? null : await upstream.arrayBuffer(), { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    return NextResponse.json({ message: "Backend API bilan aloqa yo‘q", details: error instanceof Error ? error.message : undefined }, { status: 502 });
  }
}
