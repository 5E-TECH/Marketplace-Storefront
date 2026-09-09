"use client";

import { useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api";
import { validateStorefrontProductsPageDto } from "@/generated/api-validators";
import type { StorefrontProductsResponse } from "@/types/storefront-api";

export function ApiTestClient() {
  const [catalog, setCatalog] = useState<StorefrontProductsResponse | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    apiRequest("/storefront/products", { params: { page: 1, limit: 5 }, signal: controller.signal, validate: validateStorefrontProductsPageDto })
      .then((result) => { if (!controller.signal.aborted) setCatalog(result); })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) setError(caught instanceof ApiError ? `${caught.kind} (${caught.status}): ${caught.message}` : "Katalog yuklanmadi");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  const retry = () => {
    setLoading(true);
    setError("");
    setCatalog(null);
    setAttempt((value) => value + 1);
  };
  return <section aria-labelledby="browser-title">
    <h2 id="browser-title">Brauzer</h2>
    {loading && <p role="status">Yuklanmoqda...</p>}
    {error && <p role="alert" data-testid="browser-error">{error}</p>}
    {catalog && <>
      <p data-testid="browser-success">Backenddan {catalog.total} ta mahsulot. Javob kontrakt tekshiruvidan o‘tdi.</p>
      <ul>{catalog.items.map((product) => <li key={product.id}>{product.name} — {product.price} so‘m</li>)}</ul>
    </>}
    <button className="button button--primary" disabled={loading} onClick={retry}>Qayta tekshirish</button>
  </section>;
}
