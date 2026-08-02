import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Server-only client that uses the service role key to bypass RLS.
// Data isolation is enforced in the app layer by filtering on user_id
// from the mock session cookie.
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Detect placeholder values and throw a clear, actionable error
  // so developers know to replace them with real credentials.
  if (
    !supabaseUrl ||
    !serviceRoleKey ||
    supabaseUrl.includes("your-project-ref") ||
    serviceRoleKey.includes("your-service-role-key")
  ) {
    throw new Error(
      "Supabase credentials are not configured. " +
        "Please replace the placeholder values in .env.local with your real " +
        "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. " +
        `Current URL: ${supabaseUrl ?? "undefined"}`
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
