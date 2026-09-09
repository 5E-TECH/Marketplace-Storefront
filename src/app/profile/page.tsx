import type { Metadata } from "next";
import { ProfileContent } from "@/components/profile-content";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Shaxsiy kabinet" };
export default function ProfilePage() { return <main><Container><ProfileContent/></Container></main>; }
