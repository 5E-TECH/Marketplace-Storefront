import type { Metadata } from "next";
import { ReturnDetailContent } from "@/components/returns-content";
import { Container } from "@/components/ui";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = { title: "Qaytarish so‘rovi", description: "Qaytarish so‘rovining holati va tarixi.", robots: privateRobots };

export default async function ReturnDetailPage({ params }: { params: Promise<{ returnId: string }> }) {
  const { returnId } = await params;
  return <main><Container><ReturnDetailContent returnId={returnId}/></Container></main>;
}
