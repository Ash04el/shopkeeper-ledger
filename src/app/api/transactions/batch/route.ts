import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { customer_id?: string; notes?: string; items?: { product_name: string; quantity: number; price: number; category_name: string }[] };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { customer_id, notes, items } = body;

  if (!customer_id || typeof customer_id !== "string") {
    return NextResponse.json({ error: "customer_id is required" }, { status: 400 });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items array is required" }, { status: 400 });
  }

  // Verify the customer belongs to the authenticated user
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("id", customer_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (customerError) {
    return NextResponse.json({ error: customerError.message }, { status: 500 });
  }

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // Build the description string from all items
  const description = items
    .map((item) => `${item.quantity}x ${item.product_name} (${item.price.toFixed(2)} درهم) [${item.category_name}]`)
    .join(" • ");

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (totalAmount <= 0) {
    return NextResponse.json({ error: "Total amount must be positive" }, { status: 400 });
  }

  // Insert a single consolidated transaction
  const { data: transaction, error } = await supabase
    .from("transactions")
    .insert({
      customer_id,
      user_id: user.id,
      amount: totalAmount,
      type: "credit",
      description: notes ? `${description} | ملاحظة: ${notes}` : description,
      category: items[0]?.category_name ?? null,
      article_name: items.map((i) => `${i.quantity}x ${i.product_name}`).join("، "),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/api/customers");

  return NextResponse.json({ transaction, total: totalAmount, itemCount: items.length }, { status: 201 });
}