import type { Metadata } from "next";
import { OrdersContent } from "@/components/orders-content";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Buyurtmalarim", description: "Elchi Market buyurtmalaringiz tarixi va holati.", alternates: { canonical: "/profile/orders" } };
export default function OrdersPage() { return <main><Container><OrdersContent/></Container></main>; }
