import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Container, StatePanel } from "@/components/ui";

export const metadata: Metadata = { title: "Sahifa topilmadi", robots: { index: false, follow: true } };

export default function NotFound() {
  return <main><Container><StatePanel icon={<SearchX/>} title="Bunday sahifa yo‘q" description="Havola eskirgan yoki mahsulot sotuvdan olingan bo‘lishi mumkin. Qidiruvdan foydalaning yoki katalogga qayting." action={<><Link className="button button--primary" href="/">Bosh sahifaga</Link><Link className="button button--secondary" href="/katalog">Katalog</Link></>}/></Container></main>;
}
