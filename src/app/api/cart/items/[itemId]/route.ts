import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/backend-proxy";

type Context = { params: Promise<{ itemId: string }> };
export async function PATCH(request: NextRequest, { params }: Context) { return proxyBackend(request, `/cart/items/${encodeURIComponent((await params).itemId)}`); }
export async function DELETE(request: NextRequest, { params }: Context) { return proxyBackend(request, `/cart/items/${encodeURIComponent((await params).itemId)}`); }
