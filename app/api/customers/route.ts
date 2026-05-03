import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import { readSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  if (session.isAdmin) return NextResponse.json({ error: "管理者は登録できません" }, { status: 403 });

  const body = await req.json();
  const name = (body.name || "").toString().trim();
  const gender = body.gender ? body.gender.toString() : null;
  const age_group = body.age_group ? body.age_group.toString() : null;
  const age = body.age ? Number(body.age) : null;
  const notes = body.notes ? body.notes.toString() : null;

  if (!name) return NextResponse.json({ error: "氏名は必須です" }, { status: 400 });

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("bath_customers")
    .insert({
      store_id: session.storeUuid,
      name,
      gender,
      age_group,
      age,
      notes,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, customer: data });
}

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const supabase = getServiceClient();
  let query = supabase.from("bath_customers").select("*").order("distributed_at", { ascending: false });
  if (!session.isAdmin) query = query.eq("store_id", session.storeUuid);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ customers: data });
}
