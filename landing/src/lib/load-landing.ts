import { unstable_cache } from "next/cache";
import { cache } from "react";
import { sortRegions } from "./address";
import { getLanding, getRegionTree } from "./backend";
import { readConfig } from "./config";
import type { LandingPage, RegionGroup } from "./contract";

export type Loaded = { ok: true; page: LandingPage | null } | { ok: false };

/**
 * Sotuvchi sahifasi statik (SF-03): har kod va variant uchun HTML bir marta yasaladi va shu muddatda
 * qayta generatsiya qilinadi [taklif 60 s] — narx yoki holat o‘zgarsa, sahifa bir daqiqada yangilanadi.
 * Sahifa so‘rov sarlavhalari, cookie va query string o‘qimaydi: kesh variant yo‘li bo‘yicha (`/v/s1/…`, `/v/s3/…`).
 */
export const LANDING_REVALIDATE = 60;
/** Viloyat va tumanlar ro‘yxati kam o‘zgaradi: 5 daqiqa [taklif]; bo‘sh ro‘yxat xato hisoblanadi (forma-20). */
export const REGIONS_REVALIDATE = 300;

/**
 * `GET /landing/:code`. Backendga mijoz IP si uzatilmaydi: so‘rov har tashrifda emas, sahifa yasalganda ketadi.
 * Backend xatosi sahifada serverda ko‘rsatiladi (xato-1): Next’ning `error.tsx` i faqat brauzerda chiziladi.
 */
export const loadLanding = cache(async (code: string): Promise<Loaded> => {
  try {
    return { ok: true, page: await getLanding(code, {}, readConfig(), fetch, LANDING_REVALIDATE) };
  } catch (error) {
    console.error(`landing ${code}:`, (error as Error).message);
    return { ok: false };
  }
});

/**
 * Viloyat va tuman ro‘yxati Next keshida 5 daqiqa — faqat muvaffaqiyatli (bo‘sh bo‘lmagan) javob: xato yoki bo‘sh
 * ro‘yxat `getRegionTree` da xato tashlaydi va keshga yozilmaydi. Ichidagi so‘rov `no-store` — kesh doirasida
 * statik sahifani dinamik qilmaydi. Kalit: mock rejimida sahifa kodi (`mockRoyxat`), haqiqiyda bitta ro‘yxat.
 */
const cachedRegionTree = unstable_cache(async (key: string) => sortRegions(await getRegionTree(key)), ["landing-regions"], { revalidate: REGIONS_REVALIDATE });

/** Formadagi viloyat va tuman ro‘yxati (SF-06). Yuklanmasa — null: forma-20 holati (dinamik sahifalarda). */
export async function loadRegions(code: string): Promise<RegionGroup[] | null> {
  try {
    const regions = await cachedRegionTree(readConfig().mock ? code : "");
    return regions.length ? regions : null;
  } catch (error) {
    console.error(`regions ${code}:`, (error as Error).message);
    return null;
  }
}
