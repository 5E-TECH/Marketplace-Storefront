import type { Metadata } from "next";
import { CheckoutContent } from "@/components/checkout-content";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Buyurtmani rasmiylashtirish" };
export default function CheckoutPage() { return <><Header/><main><Container><CheckoutContent/></Container></main><Footer/></>; }
