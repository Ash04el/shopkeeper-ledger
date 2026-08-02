import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getMockSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createClient();

  const session = await getMockSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; phone?: string | null };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, phone } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  if (phone !== undefined && phone !== null && phone !== "") {
    if (typeof phone !== "string") {
      return NextResponse.json({ error: "phone must be a string" }, { status: 400 });
    }
    if (!/^(\+212|00212|0)?[5-7]\d{8}$/.test(phone.trim())) {
      return NextResponse.json(
        { error: "رقم الهاتف ماشي صحيح. جرب: 06XXXXXXXX أو +2126XXXXXXXX" },
        { status: 400 }
      );
    }
  }

  const { data: customer, error } = await supabase
    .from("customers")
    .insert({
      user_id: session.user_id,
      name: name.trim(),
      phone: phone?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/api/customers");

  return NextResponse.json({ customer }, { status: 201 });
}