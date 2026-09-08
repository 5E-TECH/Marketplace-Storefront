import { NextRequest } from "next/server";
import { proxyBackend } from "@/lib/backend-proxy";

// Eski frontend buildlari uchun alias; backend endpointi `/guest/merge`.
export function POST(request: NextRequest) { return proxyBackend(request, "/guest/merge"); }
