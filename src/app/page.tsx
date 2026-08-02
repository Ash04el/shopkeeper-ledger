import { redirect } from "next/navigation";
import { getMockSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getMockSession();

  redirect(session ? "/dashboard" : "/login");
}