import type { Metadata } from "next";
import { CartContent } from "@/components/cart-content";
import { Container } from "@/components/ui";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = { title: "Savatcha", description: "Elchi Market savatchangizdagi mahsulotlar.", robots: privateRobots };
export default function CartPage() { return <main><Container><CartContent/></Container></main>; }
