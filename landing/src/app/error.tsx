"use client";

import { useEffect } from "react";
import { PageErrorView } from "@/components/page-error-view";
import { PAGE_ERROR } from "@/lib/texts";

/**
 * Kutilmagan render xatosi uchun zaxira. Backend xatosi sahifaning o‘zida serverda
 * ko‘rsatiladi (`v/[variant]/[code]/page.tsx`), shuning uchun JS o‘chiq brauzerda ham ko‘rinadi.
 */
export default function PageError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => { console.error(error); }, [error]);
  return <PageErrorView retry={<button type="button" className="button button--secondary" onClick={() => window.location.reload()}>{PAGE_ERROR.retry}</button>} />;
}
