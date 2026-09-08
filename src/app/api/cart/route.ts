import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/backend-proxy";

export const dynamic = "force-dynamic";
export function GET(request: NextRequest) { return proxyBackend(request, "/cart"); }
