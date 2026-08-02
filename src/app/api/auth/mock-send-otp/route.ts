import { NextResponse } from "next/server";
import { setOtp } from "@/lib/otp-store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phone = body?.phone;

  if (!phone || typeof phone !== "string" || !phone.trim()) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  const normalizedPhone = phone.trim();

  // Debug: log env vars to verify they are not undefined
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log("[mock-send-otp] NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl);
  console.log(
    "[mock-send-otp] SUPABASE_SERVICE_ROLE_KEY:",
    serviceRoleKey
      ? `${serviceRoleKey.slice(0, 8)}... (length: ${serviceRoleKey.length})`
      : "undefined"
  );

  // Generate a 6-digit mock OTP
  const code = String(Math.floor(100000 + Math.random() * 900000));

  // Store the OTP in the Supabase `otps` table (persists across hot-reloads)
  try {
    await setOtp(normalizedPhone, code);
  } catch (err) {
    // Log the exact error cause to the terminal for debugging
    console.error("[mock-send-otp] Failed to store OTP:");
    console.error(
      "  message:",
      err instanceof Error ? err.message : String(err)
    );
    console.error("  cause:", err instanceof Error ? err.cause : "N/A");
    if (err instanceof Error && err.cause instanceof Error) {
      console.error("  cause.message:", err.cause.message);
      console.error(
        "  cause.code:",
        (err.cause as NodeJS.ErrnoException).code
      );
    }
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to store OTP",
        cause: err instanceof Error ? String(err.cause) : undefined,
      },
      { status: 500 }
    );
  }

  // In a real app, this would send an SMS. For the mock flow,
  // we return the code in the response so the UI can display it.
  return NextResponse.json({
    message: "OTP sent (mock)",
    // Dev-only: expose the code so the user can enter it
    devCode: code,
    expiresIn: 300,
  });
}
