import type { LandingPagePrice, WhereDeliver } from "./contract";

/**
 * Narx bloki (holat-matnlari.md «2. Sums», narx-1…4). Jami = tovar + yetkazish.
 * Bepul (narx-4): ikkala yetkazish haqi 0 — radio, {MARKAZ} va eshikkacha qatori yo‘q.
 * Rejim nomlari («qisman», «bepul», «ustama») mijozga ko‘rinmaydi (holat-matnlari.md:322).
 */
export interface PriceView { product: number; center: number; address: number; free: boolean }

export const priceView = (price: LandingPagePrice): PriceView => ({
  product: price.salePrice,
  center: price.centerDeliveryFee,
  address: price.addressDeliveryFee,
  free: price.centerDeliveryFee === 0 && price.addressDeliveryFee === 0,
});

export const deliveryFee = (view: PriceView, where: WhereDeliver): number =>
  view.free ? 0 : where === "ADDRESS" ? view.address : view.center;

export const totalFor = (view: PriceView, where: WhereDeliver): number => view.product + deliveryFee(view, where);

/** Forma va havoladagi qiymat: faqat `ADDRESS` eshikkacha, qolgani — sukut «Markazgacha» (sf-tizim:263). */
export const parseWhere = (value: unknown): WhereDeliver => (value === "ADDRESS" ? "ADDRESS" : "CENTER");
