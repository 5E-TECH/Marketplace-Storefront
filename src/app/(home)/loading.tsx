// Faqat bosh sahifa uchun: root darajasida bo'lsa notFound() sahifalari 404 o'rniga 200 qaytarardi.
import { Container, LoadingGrid } from "@/components/ui";

export default function Loading() {
  return <main className="route-loading"><Container><LoadingGrid count={8} label="Sahifa yuklanmoqda"/></Container></main>;
}
