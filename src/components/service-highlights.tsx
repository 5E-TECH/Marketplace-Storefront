import { Banknote, PackageSearch, Truck, Undo2 } from "lucide-react";
import { Container } from "./ui";

/**
 * Bosh sahifadagi xarid afzalliklari. Faqat haqiqatan ishlayotgan xizmatlar: yetkazish narxi checkout'da
 * hisoblanadi, to'lov — qabul qilganda (v1 COD), kuzatish va qaytarish (backend `RETURN_WINDOW_DAYS`, standart 10).
 */
const items = [
  { icon: Truck, title: "O‘zbekiston bo‘ylab yetkazish", text: "Narxi manzilga qarab hisoblanadi" },
  { icon: Banknote, title: "Qabul qilganda to‘lash", text: "Naqd yoki kuryer terminali orqali" },
  { icon: PackageSearch, title: "Buyurtmani kuzatish", text: "Har bir bosqich ko‘rinib turadi" },
  { icon: Undo2, title: "Oson qaytarish", text: "Yetkazilgach 10 kun ichida" },
] as const;

export function ServiceHighlights() {
  return <Container><ul className="service-highlights" aria-label="Elchi Market afzalliklari">
    {items.map(({ icon: Icon, title, text }) => <li key={title}><span aria-hidden><Icon/></span><div><b>{title}</b><small>{text}</small></div></li>)}
  </ul></Container>;
}
