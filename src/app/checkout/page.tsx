import type { Metadata } from "next";
import { CheckoutContent } from "@/components/checkout-content";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Buyurtmani rasmiylashtirish", description: "Elchi Market buyurtmasi uchun yetkazish ma’lumotlarini kiriting.", alternates: { canonical: "/checkout" } };
export default function CheckoutPage() { return <main><Container><CheckoutContent/></Container></main>; }
