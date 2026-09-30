import type { Metadata } from "next";
import { ReturnsContent } from "@/components/returns-content";
import { Container } from "@/components/ui";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = { title: "Qaytarishlarim", description: "Elchi Market’dagi qaytarish so‘rovlaringiz va ularning holati.", robots: privateRobots };
export default function ReturnsPage() { return <main><Container><ReturnsContent/></Container></main>; }
