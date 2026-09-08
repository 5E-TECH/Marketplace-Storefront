import type { Metadata } from "next";
import { CartContent } from "@/components/cart-content";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Savatcha" };
export default function CartPage() { return <><Header/><main><Container><CartContent/></Container></main><Footer/></>; }
