import { NextResponse, type NextRequest } from "next/server";
import { classifyPath, LANDING_CACHE_CONTROL, NOT_FOUND_PATH, VARIANT_HEADER } from "@/lib/routing";
import { cryptoRandomByte, resolveVariant, VARIANT_COOKIE, variantCookieOptions, type RandomByte } from "@/lib/variant";

/** Ichki yo‘l: `nextUrl` nusxasi — Next uni ichki rewrite deb biladi (boshqa hostga proksi qilmaydi). */
const internalUrl = (request: NextRequest, pathname: string) => {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return url;
};

export function handle(request: NextRequest, random: RandomByte = cryptoRandomByte): NextResponse {
  const route = classifyPath(request.nextUrl.pathname);

  // Ichki variant yo‘llari tashqaridan ochilmaydi: aks holda havolaga `/v/s3/…` yozib variantni tanlash mumkin bo‘lardi.
  if (route.kind === "internal") return NextResponse.rewrite(internalUrl(request, NOT_FOUND_PATH));

  // Variant sarlavhasini faqat shu middleware qo‘yadi: mijoz yuborgani har doim olib tashlanadi.
  const headers = new Headers(request.headers);
  headers.delete(VARIANT_HEADER);
  if (route.kind !== "landing") return NextResponse.next({ request: { headers } });

  const { variant, assigned } = resolveVariant(request.cookies.get(VARIANT_COOKIE)?.value, random);
  headers.set(VARIANT_HEADER, variant);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Cache-Control", LANDING_CACHE_CONTROL);
  if (assigned) response.cookies.set(VARIANT_COOKIE, variant, variantCookieOptions(request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https"));
  return response;
}

export function middleware(request: NextRequest) {
  return handle(request);
}

export const config = {
  // API va Next fayllari variantga bog‘liq emas. /healthz ham middleware’dan o‘tadi — mijoz yuborgan
  // variant sarlavhasi olib tashlansin (aks holda config rewrite uni sotuvchi sahifasiga aylantirardi).
  matcher: ["/((?!api/|_next/|favicon\\.ico$).*)"],
};
