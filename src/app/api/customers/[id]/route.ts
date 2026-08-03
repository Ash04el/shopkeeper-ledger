import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the customer belongs to the authenticated user
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (customerError) {
    return NextResponse.json({ error: customerError.message }, { status: 500 });
  }

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Delete associated transactions first
  const { error: txError } = await supabase
    .from("transactions")
    .delete()
    .eq("customer_id", params.id)
    .eq("user_id", user.id);

  if (txError) {
    return NextResponse.json({ error: txError.message }, { status: 500 });
  }

  // Delete associated reminders
  const { error: reminderError } = await supabase
    .from("reminders_log")
    .delete()
    .eq("customer_id", params.id)
    .eq("user_id", user.id);

  if (reminderError) {
    return NextResponse.json({ error: reminderError.message }, { status: 500 });
  }

  // Delete the customer
  const { error: deleteError } = await supabase
    .from("customers")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/customers");
  revalidatePath("/api/customers");

  return NextResponse.json({ success: true });
}