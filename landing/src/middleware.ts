import { NextResponse, type NextRequest } from "next/server";
import { classifyPath, LANDING_URL_HEADER, NOT_FOUND_PATH, variantPath } from "@/lib/routing";
import { cryptoRandomByte, resolveVariant, VARIANT_COOKIE, variantCookieOptions, type RandomByte } from "@/lib/variant";

/** Brauzer ochgan manzil (protokolsiz): 404-1 dagi «Siz ochgan havola». */
const openedUrl = (request: NextRequest) => {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  return `${host}${request.nextUrl.pathname}`;
};

const withLandingUrl = (request: NextRequest) => {
  const headers = new Headers(request.headers);
  headers.set(LANDING_URL_HEADER, openedUrl(request));
  return headers;
};

/** Ichki yo‘l: `nextUrl` nusxasi — Next uni ichki rewrite deb biladi (boshqa hostga proksi qilmaydi). */
const internalUrl = (request: NextRequest, pathname: string) => {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return url;
};

export function handle(request: NextRequest, random: RandomByte = cryptoRandomByte): NextResponse {
  const route = classifyPath(request.nextUrl.pathname);
  const headers = withLandingUrl(request);

  // Ichki variant yo‘llari tashqaridan ochilmaydi: aks holda havolaga `/v/s3/…` yozib variantni tanlash mumkin bo‘lardi.
  if (route.kind === "internal") return NextResponse.rewrite(internalUrl(request, NOT_FOUND_PATH), { request: { headers } });
  if (route.kind !== "landing") return NextResponse.next({ request: { headers } });

  const { variant, assigned } = resolveVariant(request.cookies.get(VARIANT_COOKIE)?.value, random);
  const response = NextResponse.rewrite(internalUrl(request, variantPath(variant, route.code, route.sub)), { request: { headers } });
  if (assigned) response.cookies.set(VARIANT_COOKIE, variant, variantCookieOptions(request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https"));
  return response;
}

export function middleware(request: NextRequest) {
  return handle(request);
}

export const config = {
  // API, Next fayllari va healthcheck variantga bog‘liq emas.
  matcher: ["/((?!api/|_next/|healthz$|favicon\\.ico$).*)"],
};
