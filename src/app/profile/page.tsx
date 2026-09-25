import type { Metadata } from "next";
import { ProfileContent } from "@/components/profile-content";
import { Container } from "@/components/ui";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = { title: "Shaxsiy kabinet", description: "Elchi Market profilingiz va akkaunt sozlamalari.", robots: privateRobots };
export default function ProfilePage() { return <main><Container><ProfileContent/></Container></main>; }
