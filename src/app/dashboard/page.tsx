import { redirect } from "next/navigation";
import { getMockSession } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getMockSession();

  if (!session) {
    redirect("/login");
  }

  return <DashboardClient phone={session.phone} />;
}