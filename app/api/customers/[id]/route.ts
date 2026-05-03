import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import { readSession } from "@/lib/session";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const body = await req.json();
  const supabase = getServiceClient();

  // 対象のcustomerを取得し権限チェック
  const { data: existing, error: fetchErr } = await supabase
    .from("bath_customers")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (fetchErr || !existing) return NextResponse.json({ error: "見つかりません" }, { status: 404 });

  if (!session.isAdmin && existing.store_id !== session.storeUuid) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const updates: any = {};
  if (typeof body.contracted === "boolean") {
    updates.contracted = body.contracted;
    updates.contracted_at = body.contracted ? new Date().toISOString() : null;
  }
  if (typeof body.name === "string") updates.name = body.name.trim();
  if (typeof body.gender === "string" || body.gender === null) updates.gender = body.gender;
  if (typeof body.age_group === "string" || body.age_group === null) updates.age_group = body.age_group;
  if (typeof body.age === "number" || body.age === null) updates.age = body.age;
  if (typeof body.notes === "string" || body.notes === null) updates.notes = body.notes;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "更新項目がありません" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("bath_customers")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, customer: data });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const supabase = getServiceClient();
  const { data: existing } = await supabase
    .from("bath_customers")
    .select("store_id")
    .eq("id", params.id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  if (!session.isAdmin && existing.store_id !== session.storeUuid) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { error } = await supabase.from("bath_customers").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
