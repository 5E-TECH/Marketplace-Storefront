import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/backend-proxy";

type Context = { params: Promise<{ productId: string }> };
export async function GET(request: NextRequest, { params }: Context) { return proxyBackend(request, `/favorites/${encodeURIComponent((await params).productId)}/check`); }
