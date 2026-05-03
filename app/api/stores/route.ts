import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import { readSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("bath_stores")
    .select("id, store_id, name, max_samples, is_admin, display_order")
    .order("display_order", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ stores: data });
}
