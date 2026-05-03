import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import { readSession } from "@/lib/session";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  if (!session.isAdmin) return NextResponse.json({ error: "管理者のみ操作できます" }, { status: 403 });

  const body = await req.json();
  const updates: any = {};
  if (typeof body.name === "string" && body.name.trim()) updates.name = body.name.trim();
  if (typeof body.max_samples === "number" && body.max_samples > 0) updates.max_samples = body.max_samples;
  if (typeof body.password === "string" && body.password.length >= 4) updates.password = body.password;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "更新項目がありません" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("bath_stores")
    .update(updates)
    .eq("id", params.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, store: data });
}
