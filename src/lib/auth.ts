import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
  buildSessionValue,
  getSession,
  type MockSession,
} from "@/lib/session";

/**
 * Reads the mock session from the cookie. Returns null if not logged in.
 */
export async function getMockSession(): Promise<MockSession | null> {
  return getSession();
}

/**
 * Creates or finds a profile for the given phone number and sets
 * the mock session cookie. Returns the session data.
 */
export async function createMockSession(phone: string) {
  const normalizedPhone = phone.trim();
  const supabase = createClient();

  // Check if a profile already exists for this phone number
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id, phone_number, shop_name")
    .eq("phone_number", normalizedPhone)
    .maybeSingle();

  let userId: string;
  let shopName: string;

  if (existingProfile) {
    userId = existingProfile.id;
    shopName = existingProfile.shop_name;
  } else {
    // Create a new profile (user_id is a generated UUID)
    userId = crypto.randomUUID();
    shopName = "المحل ديالي";
    const { error } = await supabase.from("profiles").insert({
      id: userId,
      phone_number: normalizedPhone,
      shop_name: shopName,
    });
    if (error) {
      throw new Error(error.message);
    }
  }

  // Set the mock session cookie (httpOnly, secure)
  // `cookies()` is async in Next.js 15+ and sync in 14; awaiting it is
  // safe and forward-compatible in both versions.
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    buildSessionValue({ user_id: userId, phone: normalizedPhone }),
    SESSION_COOKIE_OPTIONS
  );

  return { user_id: userId, phone: normalizedPhone };
}