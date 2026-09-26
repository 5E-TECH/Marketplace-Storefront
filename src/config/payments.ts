import type { PaymentMethod } from "@/types/commerce";

export type OnlinePaymentMethod = Exclude<PaymentMethod, "cod">;

const KNOWN_ONLINE_METHODS: OnlinePaymentMethod[] = ["payme", "click"];

/** "payme,click" ko'rinishidagi qiymatdan faqat ma'lum usullar olinadi; tartib doim bir xil. */
export const parseOnlinePaymentMethods = (value: string | undefined): OnlinePaymentMethod[] => {
  const wanted = new Set((value ?? "").split(",").map((item) => item.trim().toLowerCase()).filter(Boolean));
  return KNOWN_ONLINE_METHODS.filter((method) => wanted.has(method));
};

/**
 * Checkout'da ko'rsatiladigan online to'lov usullari. Backend Payme/Click kalitlari bilan
 * `POST /payments` javobida `redirectUrl` qaytara boshlaguncha bo'sh qoldiriladi — aks holda
 * xaridor to'lab bo'lmaydigan buyurtma yaratadi. Yoqish: `NEXT_PUBLIC_ONLINE_PAYMENTS=payme,click`
 * va qayta build (qiymat build paytida bundle'ga yoziladi).
 */
export const onlinePaymentMethods = parseOnlinePaymentMethods(process.env.NEXT_PUBLIC_ONLINE_PAYMENTS);
