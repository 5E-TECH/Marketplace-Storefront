import { Banknote } from "lucide-react";
import type { PaymentMethod } from "@/types/commerce";

// Provayder rangi va nomi bitta joyda: checkout, buyurtma va to'lov sahifalari shu yerdan oladi.
const brands = {
  cod: { label: "Naqd", className: "payment-brand--cod" },
  payme: { label: "payme", className: "payment-brand--payme" },
  click: { label: "click", className: "payment-brand--click" },
} as const satisfies Record<PaymentMethod, { label: string; className: string }>;

export function PaymentBrand({ method }: { method: PaymentMethod }) {
  const brand = brands[method];
  return <span className={`payment-brand ${brand.className}`} aria-hidden>
    {method === "cod" ? <Banknote/> : brand.label}
  </span>;
}
