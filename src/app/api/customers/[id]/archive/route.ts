import { NextResponse } from "next/server";
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

  let body: { is_archived?: boolean };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.is_archived !== "boolean") {
    return NextResponse.json(
      { error: "is_archived must be a boolean" },
      { status: 400 }
    );
  }

  // Update the customer — RLS ensures the customer belongs to the user
  const { data: customer, error } = await supabase
    .from("customers")
    .update({ is_archived: body.is_archived })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("id, is_archived")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({ customer });
}