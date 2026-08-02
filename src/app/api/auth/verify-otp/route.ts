import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phone = body?.phone;
  const code = body?.code;

  if (!phone || typeof phone !== "string" || !phone.trim()) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  if (!code || typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }

  const normalizedPhone = phone.trim();
  const normalizedCode = code.trim();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    phone: normalizedPhone,
    token: normalizedCode,
    type: "sms",
  });

  if (error) {
    return NextResponse.json(
      { error: "الكود ماشي صحيح ولا سالا الوقت ديالو" },
      { status: 400 }
    );
  }

  // Auth session is now stored in secure, HTTP-only cookies managed by
  // @supabase/ssr. The middleware automatically reads them via getUser().
  return NextResponse.json({
    user: {
      id: data.user?.id ?? "",
      phone: data.user?.phone ?? normalizedPhone,
    },
  });
}