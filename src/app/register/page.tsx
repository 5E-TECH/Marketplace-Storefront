import type { Metadata } from "next";
import { AuthContent } from "@/components/auth-content";
import { Container } from "@/components/ui";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = { title: "Ro‘yxatdan o‘tish", description: "Elchi Market’da xaridor akkauntini oching.", robots: privateRobots };
export default function RegisterPage() { return <main><Container><AuthContent mode="register"/></Container></main>; }
