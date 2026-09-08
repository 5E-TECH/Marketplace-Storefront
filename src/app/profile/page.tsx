import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ProfileContent } from "@/components/profile-content";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "Shaxsiy kabinet" };
export default function ProfilePage() { return <><Header/><main><Container><ProfileContent/></Container></main><Footer/></>; }
