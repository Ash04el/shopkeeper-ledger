import { createClient } from "@/lib/supabase/server";

/**
 * OTP storage backed by the Supabase `otps` table.
 *
 * The 5-minute validity window is enforced via the `created_at` column
 * during verification, so no explicit TTL is stored.
 */

export interface VerifyOtpResult {
  /** true when a matching, unused, non-expired OTP was found and marked used */
  valid: boolean;
  /** set when a DB-level error occurred (Supabase returned an error) */
  error?: string;
}

/**
 * Inserts a new OTP row for the given phone number.
 * Previous unused OTPs for the same phone are marked as used to
 * invalidate stale codes.
 */
export async function setOtp(phone: string, code: string): Promise<void> {
  const supabase = createClient();

  // Invalidate any previous unused OTPs for this phone
  await supabase
    .from("otps")
    .update({ is_used: true })
    .eq("phone", phone)
    .eq("is_used", false);

  // Insert the new OTP
  const { error } = await supabase.from("otps").insert({
    phone,
    otp_code: code,
  });

  if (error) {
    throw new Error(`Failed to store OTP: ${error.message}`);
  }
}

/**
 * Verifies an OTP for the given phone number.
 *
 * Returns a structured result: `{ valid, error }`. When `error` is set,
 * a DB-level failure occurred (caller should return 500). When `valid`
 * is false and `error` is unset, the OTP was invalid/expired (caller
 * should return 400). On success, the OTP is marked as used (single-use).
 */
export async function verifyOtp(
  phone: string,
  code: string
): Promise<VerifyOtpResult> {
  const supabase = createClient();

  // 5-minute window in ISO format (Supabase stores created_at as TIMESTAMPTZ)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  // Find a matching, unused OTP within the 5-minute window
  const { data, error } = await supabase
    .from("otps")
    .select("id")
    .eq("phone", phone)
    .eq("otp_code", code)
    .eq("is_used", false)
    .gte("created_at", fiveMinutesAgo)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[otp-store] select query failed:", error.message);
    return { valid: false, error: error.message };
  }

  console.log("[otp-store] select query succeeded, data:", data);

  if (!data) {
    // No matching row — invalid or expired OTP (not a DB error)
    return { valid: false };
  }

  // Mark the OTP as used (single-use)
  const { error: updateError } = await supabase
    .from("otps")
    .update({ is_used: true })
    .eq("id", data.id);

  if (updateError) {
    console.error("[otp-store] update query failed:", updateError.message);
    // Treat update failure as a DB error to prevent reuse
    return { valid: false, error: updateError.message };
  }

  console.log("[otp-store] update query succeeded for id:", data.id);
  return { valid: true };
}