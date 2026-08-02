import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// The callback route was used by Supabase's OAuth/OTP flow.
// With mock auth, verification happens via /api/auth/mock-verify-otp,
// so this route simply redirects to the login page.
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/login`);
}