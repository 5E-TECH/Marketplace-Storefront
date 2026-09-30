import type { Metadata } from "next";
import { NotificationsContent } from "@/components/notifications-content";
import { Container } from "@/components/ui";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = { title: "Bildirishnomalar", description: "Qaytarish so‘rovlari va buyurtmalar bo‘yicha xabarlaringiz.", robots: privateRobots };
export default function NotificationsPage() { return <main><Container><NotificationsContent/></Container></main>; }
