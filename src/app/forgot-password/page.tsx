import type { Metadata } from "next";
import { AuthContent } from "@/components/auth-content";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Parolni tiklash", description: "Elchi Market akkauntingiz parolini tiklang.", alternates: { canonical: "/forgot-password" } };
export default function ForgotPasswordPage() { return <main><Container><AuthContent mode="forgot"/></Container></main>; }
