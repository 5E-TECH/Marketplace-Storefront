import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { OrdersContent } from "@/components/orders-content";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Buyurtmalarim" };
export default function OrdersPage() { return <><Header/><main><Container><OrdersContent/></Container></main><Footer/></>; }
