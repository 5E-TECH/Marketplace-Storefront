import type { Metadata } from "next";
import { apiRequest, ApiError } from "@/lib/api";
import { validateStorefrontProductsPageDto } from "@/generated/api-validators";
import { ApiTestClient } from "./test-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "API tekshiruvi", robots: { index: false, follow: false } };

export default async function ApiTestPage() {
  let catalog;
  let error = "";
  try {
    // Deliberately bypass USE_MOCK_DATA: this page verifies the configured backend.
    catalog = await apiRequest("/storefront/products", { params: { page: 1, limit: 5 }, validate: validateStorefrontProductsPageDto });
  } catch (caught) {
    error = caught instanceof ApiError ? `${caught.kind} (${caught.status}): ${caught.message}` : "Katalog yuklanmadi";
  }
  return <main className="container" style={{ paddingBlock: 40 }}>
    <h1>Backend ulanishini tekshirish</h1>
    <section aria-labelledby="ssr-title" style={{ marginBlock: 24 }}>
      <h2 id="ssr-title">Server (SSR)</h2>
      {error ? <p role="alert" data-testid="ssr-error">{error}</p> : <>
        <p data-testid="ssr-success">Backenddan {catalog!.total} ta mahsulot. Javob kontrakt tekshiruvidan o‘tdi.</p>
        <ul>{catalog!.items.map((product) => <li key={product.id}>{product.name} — {product.price} so‘m</li>)}</ul>
      </>}
    </section>
    <ApiTestClient/>
  </main>;
}
