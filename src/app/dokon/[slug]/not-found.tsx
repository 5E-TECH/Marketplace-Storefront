import type { Metadata } from "next";
import Link from "next/link";
import { Store } from "lucide-react";
import { Container, StatePanel } from "@/components/ui";

export const metadata: Metadata = { title: "Do‘kon topilmadi", robots: { index: false, follow: true } };

/** Backend faqat faol do'konni qaytaradi: topilmagan va faol bo'lmagan do'kon ikkalasi ham shu yerga tushadi. */
export default function ShopNotFound() {
  return <main><Container><StatePanel icon={<Store/>} title="Do‘kon topilmadi" description="Havola noto‘g‘ri yoki do‘kon hozircha faol emas. Boshqa do‘konlarning mahsulotlarini katalogdan topishingiz mumkin." action={<><Link className="button button--primary" href="/katalog">Katalogga o‘tish</Link><Link className="button button--secondary" href="/">Bosh sahifaga</Link></>}/></Container></main>;
}
