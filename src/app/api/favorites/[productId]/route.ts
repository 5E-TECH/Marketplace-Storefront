import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/backend-proxy";

type Context = { params: Promise<{ productId: string }> };
export async function POST(request: NextRequest, { params }: Context) { return proxyBackend(request, `/favorites/${encodeURIComponent((await params).productId)}`); }
export async function DELETE(request: NextRequest, { params }: Context) { return proxyBackend(request, `/favorites/${encodeURIComponent((await params).productId)}`); }
