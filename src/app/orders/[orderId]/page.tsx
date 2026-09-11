import type { Metadata } from "next";
import { OrderTrackingContent } from "@/components/order-tracking-content";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Buyurtma holati" };
export default async function OrderTrackingPage({ params, searchParams }: { params: Promise<{ orderId: string }>; searchParams: Promise<{ placed?: string; saved?: string }> }) {
  const { orderId } = await params;
  const query = await searchParams;
  return <main><Container><OrderTrackingContent orderId={orderId} placed={query.placed === "1"} storageWarning={query.saved === "0"}/></Container></main>;
}
