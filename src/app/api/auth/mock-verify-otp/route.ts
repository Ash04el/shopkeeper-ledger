import { NextResponse } from "next/server";
import { verifyOtp, type VerifyOtpResult } from "@/lib/otp-store";
import { createMockSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const phone = body?.phone;
    const code = body?.code;

    if (!phone || typeof phone !== "string" || !phone.trim()) {
      return NextResponse.json(
        { error: "phone is required" },
        { status: 400 }
      );
    }

    if (!code || typeof code !== "string" || !code.trim()) {
      return NextResponse.json(
        { error: "code is required" },
        { status: 400 }
      );
    }

    const normalizedPhone = phone.trim();
    const normalizedCode = code.trim();

    console.log("[mock-verify-otp] Verifying OTP for phone:", normalizedPhone);

    // Verify the OTP against the Supabase `otps` table
    // (checks phone + code + is_used=false + created_at within 5 minutes)
    const result: VerifyOtpResult = await verifyOtp(
      normalizedPhone,
      normalizedCode
    );

    if (result.error) {
      // DB-level failure (Supabase error) — log and return 500
      console.error("[mock-verify-otp] DB error during verifyOtp:");
      console.error("  message:", result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    if (!result.valid) {
      // Invalid or expired OTP — return a clear 400 instead of crashing
      console.warn(
        "[mock-verify-otp] OTP invalid/expired for phone:",
        normalizedPhone
      );
      return NextResponse.json(
        { error: "الكود ماشي صحيح ولا سالا الوقت ديالو" },
        { status: 400 }
      );
    }

    console.log(
      "[mock-verify-otp] OTP verified successfully for phone:",
      normalizedPhone
    );

    // Create the mock session (creates profile if needed + sets cookie)
    const session = await createMockSession(normalizedPhone);
    console.log(
      "[mock-verify-otp] Session created for user_id:",
      session.user_id
    );

    return NextResponse.json({ session });
  } catch (error) {
    // Catch-all: return 500 with error.message + error.stack
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("[mock-verify-otp] Unhandled error:");
    console.error("  message:", message);
    if (stack) console.error("  stack:", stack);
    return NextResponse.json({ error: message, stack }, { status: 500 });
  }
}