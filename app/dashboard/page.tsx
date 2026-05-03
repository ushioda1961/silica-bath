import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import { getServiceClient } from "@/lib/supabase-server";
import StoreDashboard from "@/components/StoreDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (session.isAdmin) redirect("/admin");

  const supabase = getServiceClient();
  const { data: store } = await supabase
    .from("bath_stores")
    .select("*")
    .eq("id", session.storeUuid)
    .single();
  const { data: customers } = await supabase
    .from("bath_customers")
    .select("*")
    .eq("store_id", session.storeUuid)
    .order("distributed_at", { ascending: false });

  return (
    <StoreDashboard
      store={store!}
      initialCustomers={customers || []}
      session={session}
    />
  );
}
