"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/#products");
  };

  return <button className="back-button" type="button" onClick={goBack} aria-label="Oldingi sahifaga qaytish"><ArrowLeft/><span>Ortga</span></button>;
}
