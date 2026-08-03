import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customerId = params.id;

  // Fetch the customer to get current balance
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, user_id")
    .eq("id", customerId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (customerError || !customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Get current balance via RPC
  const { data: balanceData, error: rpcError } = await supabase
    .rpc("get_customer_balance", { customer_id: customerId });

  const balance = rpcError ? 0 : Number(balanceData ?? 0);

  // Insert a reminder log row
  const { data: reminder, error: insertError } = await supabase
    .from("reminders_log")
    .insert({
      customer_id: customerId,
      user_id: user.id,
      balance_at_reminder: balance,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ reminder }, { status: 201 });
}