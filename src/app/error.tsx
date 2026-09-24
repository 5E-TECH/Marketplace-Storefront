"use client";

import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Button, Container, StatePanel } from "@/components/ui";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main><Container><StatePanel kind="error" title="Sahifani ochib bo‘lmadi" description="Server hozir javob bermayapti. Internet aloqasini tekshirib, birozdan keyin qayta urinib ko‘ring." action={<Button onClick={reset}><RefreshCw/> Qayta urinish</Button>}/></Container></main>;
}
