import type { CheckoutAddress } from "@/services/checkout.service";
import type { CheckoutDistrict, CheckoutRegion } from "@/services/location.service";
import type { CartItem } from "@/types/commerce";

export type CheckoutForm = { name: string; phone: string; regionId: string; districtId: string; street: string };
export type CheckoutFormErrors = Partial<Record<keyof CheckoutForm, string>>;
export const emptyCheckoutForm: CheckoutForm = { name: "", phone: "", regionId: "", districtId: "", street: "" };

export function validateCheckoutForm(form: CheckoutForm, regions: CheckoutRegion[], districts: CheckoutDistrict[]): CheckoutFormErrors {
  const errors: CheckoutFormErrors = {};
  if (form.name.trim().length < 2 || form.name.trim().length > 100) errors.name = "Ism-familiya 2–100 ta belgidan iborat bo‘lishi kerak.";
  if (!/^\+998\d{9}$/.test(form.phone.trim())) errors.phone = "Telefonni +998901234567 formatida kiriting.";
  const region = regions.find((item) => item.id === form.regionId);
  if (!region) errors.regionId = "Viloyatni tanlang.";
  if (!region || !districts.some((item) => item.id === form.districtId && item.regionId === region.id)) errors.districtId = "Tanlangan viloyatdagi tumanni tanlang.";
  if (form.street.trim().length < 5 || form.street.trim().length > 300) errors.street = "Ko‘cha, uy va xonadonni to‘liq kiriting (5–300 ta belgi).";
  return errors;
}

export function checkoutAddress(form: CheckoutForm, regions: CheckoutRegion[], districts: CheckoutDistrict[]): CheckoutAddress {
  const region = regions.find((item) => item.id === form.regionId);
  const district = districts.find((item) => item.id === form.districtId && item.regionId === form.regionId);
  if (!region || !district) throw new Error("Viloyat va tumanni qayta tanlang.");
  return {
    recipientName: form.name.trim(), phone: form.phone.trim(),
    regionId: region.id,
    districtId: district.id,
    address: [region.name, district.name, form.street.trim()].join(", "),
  };
}

export function checkoutCartSignature(items: CartItem[]): string {
  return JSON.stringify(items.map((item) => [item.id, String(item.productId), String(item.variantId ?? ""), item.quantity, item.product.price]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))));
}
