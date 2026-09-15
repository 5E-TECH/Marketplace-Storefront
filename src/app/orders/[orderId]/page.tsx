import type { Metadata } from "next";
import { Container } from "@/components/ui";
import { OrderTrackingContent } from "@/components/order-tracking-content";

export async function generateMetadata({ params }: { params: Promise<{ orderId: string }> }): Promise<Metadata> {
  const { orderId } = await params;
  return { title: "Buyurtma holati", description: "Buyurtmangizning yetkazish holatini kuzating.", alternates: { canonical: `/orders/${encodeURIComponent(orderId)}` } };
}

export default async function OrderTrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <main><Container><OrderTrackingContent orderId={orderId}/></Container></main>;
}
