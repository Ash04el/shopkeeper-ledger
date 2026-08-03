import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function PATCH(
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

  let body: {
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

  const { amount, type, description, category, article_name } = body;

  if (amount !== undefined && (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0)) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 });
  }

  if (type !== undefined && type !== "credit" && type !== "payment") {
    return NextResponse.json({ error: "type must be 'credit' or 'payment'" }, { status: 400 });
  }

  // Verify the transaction belongs to the authenticated user
  const { data: existing, error: fetchError } = await supabase
    .from("transactions")
    .select("id, user_id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (amount !== undefined) updates.amount = amount;
  if (type !== undefined) updates.type = type;
  if (description !== undefined) updates.description = description || null;
  if (category !== undefined) updates.category = category || null;
  if (article_name !== undefined) updates.article_name = article_name || null;

  const { data: transaction, error } = await supabase
    .from("transactions")
    .update(updates)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/customers");

  return NextResponse.json({ transaction });
}