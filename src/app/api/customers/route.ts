import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMockSession } from "@/lib/auth";
import type { CustomerWithBalance } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();

  const session = await getMockSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all customers for the user (without transactions)
  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, user_id, name, phone, note, created_at")
    .eq("user_id", session.user_id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch balances in parallel using the Postgres RPC function
  // This avoids pulling all transactions into JS for aggregation
  const customersWithBalance: CustomerWithBalance[] = await Promise.all(
    (customers ?? []).map(
      async (c: {
        id: string;
        user_id: string;
        name: string;
        phone: string | null;
        note: string | null;
        created_at: string;
      }) => {
        const { data: balanceData, error: rpcError } = await supabase
          .rpc("get_customer_balance", { customer_id: c.id });

        const balance = rpcError ? 0 : Number(balanceData ?? 0);

        return {
          id: c.id,
          user_id: c.user_id,
          name: c.name,
          phone: c.phone,
          note: c.note,
          created_at: c.created_at,
          balance,
        };
      }
    )
  );

  return NextResponse.json({ customers: customersWithBalance });
}