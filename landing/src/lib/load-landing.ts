import { headers } from "next/headers";
import { cache } from "react";
import { getLanding } from "./backend";
import type { LandingPage } from "./contract";

export type Loaded = { ok: true; page: LandingPage | null } | { ok: false };

/**
 * `GET /landing/:code` — mijoz IP va user agenti bilan (`backend.ts`, limit IP bo‘yicha). Bitta so‘rovda
 * sahifa va `generateMetadata` uchun bir marta (`cache`). Backend xatosi sahifada serverda ko‘rsatiladi
 * (xato-1): Next’ning `error.tsx` i faqat brauzerda chiziladi va JS o‘chiq mijoz bo‘sh sahifa ko‘rardi.
 */
export const loadLanding = cache(async (code: string): Promise<Loaded> => {
  const incoming = await headers();
  try {
    return { ok: true, page: await getLanding(code, { forwardedFor: incoming.get("x-forwarded-for"), userAgent: incoming.get("user-agent") }) };
  } catch (error) {
    console.error(`landing ${code}:`, (error as Error).message);
    return { ok: false };
  }
});
