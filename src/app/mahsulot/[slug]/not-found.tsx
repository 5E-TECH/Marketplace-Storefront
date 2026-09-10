import Link from "next/link";
import { Container, StatePanel } from "@/components/ui";

export default function ProductNotFound() {
  return <main><Container><StatePanel title="Mahsulot topilmadi" description="Bu mahsulot o‘chirilgan, sotuvdan olingan yoki havola noto‘g‘ri bo‘lishi mumkin." action={<Link className="button button--primary" href="/#products">Mahsulotlarni ko‘rish</Link>}/></Container></main>;
}
