import type { LandingPage } from "@/lib/contract";
import { formatSum } from "@/lib/texts";
import type { Variant } from "@/lib/variant";

/**
 * S1 «Tez buyurtma» va S3 «Ishonch bilan» shablonlari SF-02 da, DZ-02 ega tasdig‘idan keyin quriladi.
 * Hozircha ikkalasi bir xil karkas: tovar nomi va narxi. Farq faqat `data-variant` da —
 * bo‘linish va klik yozilishini sinash uchun (sinov-s1-s3.md «Tenglik»).
 */
export function LandingTemplate({ page, variant }: { page: LandingPage; variant: Variant }) {
  return (
    <main className="page" data-page="landing" data-variant={variant} data-template={page.template} data-state={page.state}>
      <h1>{page.product.name}</h1>
      <p className="price">{formatSum(page.price.salePrice)}</p>
    </main>
  );
}
