import { NextResponse } from "next/server";
import { createMockSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phone = body?.phone;

  if (!phone || typeof phone !== "string" || !phone.trim()) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  try {
    const session = await createMockSession(phone.trim());
    return NextResponse.json({ session });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}