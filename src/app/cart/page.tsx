import type { Metadata } from "next";
import { CartContent } from "@/components/cart-content";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Savatcha" };
export default function CartPage() { return <main><Container><CartContent/></Container></main>; }
