"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Button, Container } from "@/components/ui";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main><Container><section className="api-error"><span><AlertCircle/></span><h1>Mahsulotlarni yuklab bo‘lmadi</h1><p>Storefront API bilan aloqa yo‘q. Backend ishlayotgani va <code>API_URL</code> to‘g‘ri sozlanganini tekshiring.</p><Button onClick={reset}><RefreshCw/> Qayta urinish</Button></section></Container></main>;
}
