import type { Metadata } from "next";
import { AuthContent } from "@/components/auth-content";
import { Container } from "@/components/ui";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = { title: "Kirish", description: "Elchi Market xaridor akkauntiga kiring.", robots: privateRobots };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const requested = (await searchParams).next;
  const returnTo = requested?.startsWith("/") && !requested.startsWith("//") && requested.length <= 500 ? requested : "/profile";
  return <main><Container><AuthContent mode="login" returnTo={returnTo}/></Container></main>;
}
