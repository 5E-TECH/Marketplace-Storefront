import type { Metadata } from "next";
import { OrderSearchContent } from "@/components/order-search-content";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Buyurtmani kuzatish" };
export default function TrackOrderPage() { return <main><Container><OrderSearchContent/></Container></main>; }
