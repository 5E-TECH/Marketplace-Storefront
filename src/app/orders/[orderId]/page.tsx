import { Container } from "@/components/ui";
import { OrderTrackingContent } from "@/components/order-tracking-content";

export default async function OrderTrackingPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return <main><Container><OrderTrackingContent orderId={orderId}/></Container></main>;
}
