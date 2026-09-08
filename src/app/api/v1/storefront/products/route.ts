import { NextRequest } from "next/server";
import { handleStorefrontProducts } from "@/lib/storefront-products-handler";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) { return handleStorefrontProducts(request); }
