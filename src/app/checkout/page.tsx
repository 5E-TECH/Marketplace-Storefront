import type { Metadata } from "next";
import { CheckoutContent } from "@/components/checkout-content";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Buyurtmani rasmiylashtirish" };
export default function CheckoutPage() { return <main><Container><CheckoutContent/></Container></main>; }
