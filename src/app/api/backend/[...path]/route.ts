import { NextRequest, NextResponse } from "next/server";
import { proxyBackend } from "@/lib/backend-proxy";

type Context = { params: Promise<{ path: string[] }> };
// Only expose operations used by this storefront. Backend remains responsible for authorization.
const routes: [RegExp, string[]][] = [
  [/^\/categories$/, ["GET"]],
  [/^\/regions$/, ["GET"]],
  [/^\/regions\/[^/]+\/districts$/, ["GET"]],
  [/^\/storefront\/products(?:\/[^/]+)?$/, ["GET"]],
  [/^\/storefront\/shops\/[^/]+\/products$/, ["GET"]],
  [/^\/storefront\/shops\/[^/]+$/, ["GET"]],
  [/^\/products(?:\/[^/]+)?$/, ["GET", "POST", "PATCH", "DELETE"]],
  [/^\/products\/[^/]+\/variants(?:\/[^/]+)?$/, ["GET", "POST", "PATCH", "DELETE"]],
  [/^\/auth\/login$/, ["POST"]],
  [/^\/cart$/, ["GET"]],
  [/^\/cart\/items$/, ["POST"]],
  [/^\/cart\/items\/[^/]+$/, ["PATCH", "DELETE"]],
  [/^\/cart\/merge$/, ["POST"]],
  [/^\/checkout$/, ["POST"]],
  [/^\/checkout\/delivery-preview$/, ["POST"]],
  [/^\/checkout\/[^/]+\/confirm$/, ["POST"]],
  [/^\/orders\/[^/]+\/tracking$/, ["GET"]],
  [/^\/favorites$/, ["GET"]],
  [/^\/favorites\/[^/]+$/, ["POST", "DELETE"]],
  [/^\/favorites\/[^/]+\/check$/, ["GET"]],
  [/^\/guest\/merge$/, ["POST"]],
];
async function handle(request: NextRequest, context: Context) {
  const segments = (await context.params).path;
  if (segments.some((part) => !part || /[\\/]/.test(part) || part === "." || part === "..")) return NextResponse.json({ message: "Yo‘l noto‘g‘ri" }, { status: 400 });
  const path = `/${segments.map(encodeURIComponent).join("/")}`;
  const match = routes.find(([pattern]) => pattern.test(path));
  if (!match) return NextResponse.json({ message: "Endpoint topilmadi" }, { status: 404 });
  if (!match[1].includes(request.method)) return NextResponse.json({ message: "Usul qo‘llab-quvvatlanmaydi" }, { status: 405, headers: { Allow: match[1].join(", ") } });
  return proxyBackend(request, path);
}
export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
