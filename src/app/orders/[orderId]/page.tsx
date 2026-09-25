import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { OrderTrackingContent } from "@/components/order-tracking-content";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = { title: "Buyurtma holati", description: "Buyurtmangizning yetkazish holatini kuzating.", robots: privateRobots };

export default async function OrderTrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <main><Container><OrderTrackingContent orderId={orderId}/></Container></main>;
}
