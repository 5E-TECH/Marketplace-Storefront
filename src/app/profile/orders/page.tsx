import type { Metadata } from "next";
import { OrdersContent } from "@/components/orders-content";
import { Container } from "@/components/ui";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = { title: "Buyurtmalarim", description: "Elchi Market buyurtmalaringiz tarixi va holati.", robots: privateRobots };
export default function OrdersPage() { return <main><Container><OrdersContent/></Container></main>; }
