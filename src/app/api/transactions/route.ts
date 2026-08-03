import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    customer_id?: string;
    amount?: number;
    type?: string;
    description?: string;
    category?: string;
    article_name?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { customer_id, amount, type, description, category, article_name } = body;

  if (!customer_id || typeof customer_id !== "string") {
    return NextResponse.json({ error: "customer_id is required" }, { status: 400 });
  }

  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
  }

  if (type !== "credit" && type !== "payment") {
    return NextResponse.json({ error: "type must be 'credit' or 'payment'" }, { status: 400 });
  }

  if (description !== undefined && typeof description !== "string") {
    return NextResponse.json({ error: "description must be a string" }, { status: 400 });
  }

  if (category !== undefined && typeof category !== "string") {
    return NextResponse.json({ error: "category must be a string" }, { status: 400 });
  }

  if (article_name !== undefined && typeof article_name !== "string") {
    return NextResponse.json({ error: "article_name must be a string" }, { status: 400 });
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

  const { data: transaction, error } = await supabase
    .from("transactions")
    .insert({
      customer_id,
      user_id: user.id,
      amount,
      type,
      description: description ?? null,
      category: category ?? null,
      article_name: article_name ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/api/customers");

  return NextResponse.json({ transaction }, { status: 201 });
}