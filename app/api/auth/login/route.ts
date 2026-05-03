import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase-server";
import { createSession, setSessionCookie } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const storeId: string = (body.storeId || "").toString().trim();
    const password: string = (body.password || "").toString();

    if (!storeId || !password) {
      return NextResponse.json({ error: "店舗IDとパスワードを入力してください" }, { status: 400 });
    }

    const supabase = getServiceClient();
    const { data: store, error } = await supabase
      .from("bath_stores")
      .select("*")
      .eq("store_id", storeId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "サーバーエラー" }, { status: 500 });
    }
    if (!store || store.password !== password) {
      return NextResponse.json({ error: "店舗IDまたはパスワードが違います" }, { status: 401 });
    }

    const token = await createSession({
      storeUuid: store.id,
      storeId: store.store_id,
      storeName: store.name,
      isAdmin: !!store.is_admin,
    });
    await setSessionCookie(token);

    return NextResponse.json({ ok: true, isAdmin: !!store.is_admin });
  } catch (e) {
    return NextResponse.json({ error: "予期せぬエラー" }, { status: 500 });
  }
}
