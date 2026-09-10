import { notFound, permanentRedirect } from "next/navigation";
import { productPath } from "@/lib/product-url";
import { productService } from "@/services/product.service";

export default async function LegacyProductPage({ params }: { params: Promise<{ id: string }> }) {
  const product = await productService.getById((await params).id);
  if (!product) notFound();
  permanentRedirect(productPath(product));
}
