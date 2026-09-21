import type { Metadata } from "next";
import { PaymentReturnContent } from "@/components/payment-return-content";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "To‘lov holati", description: "Elchi Market buyurtmasining online to‘lov holati.", robots: { index: false, follow: false } };

export default async function PaymentReturnPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const { orderId = "" } = await searchParams;
  return <main><Container><PaymentReturnContent orderId={orderId.slice(0, 128)}/></Container></main>;
}
