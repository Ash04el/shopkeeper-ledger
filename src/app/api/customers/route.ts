import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CustomerWithBalance } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Read optional query parameter: ?archived=true to include archived customers
  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("archived") === "true";

  // Fetch from the customer_balances view with security_invoker = true
  // RLS is enforced by the view; we additionally filter by user_id for defense-in-depth
  let query = supabase
    .from("customer_balances")
    .select("*")
    .eq("user_id", user.id);

  // Strict filter: when archived=true, show ONLY archived; otherwise, show ONLY active
  query = query.eq("is_archived", includeArchived);

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map view rows to CustomerWithBalance type
  const customers: CustomerWithBalance[] = (data ?? []).map(
    (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      row: any
    ) => ({
      id: row.customer_id,
      user_id: row.user_id,
      name: row.name,
      phone: row.phone,
      note: row.note,
      is_archived: row.is_archived,
      created_at: row.created_at,
      balance: Number(row.balance ?? 0),
    })
  );

  return NextResponse.json({ customers });
}