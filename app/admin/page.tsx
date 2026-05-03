import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import { getServiceClient } from "@/lib/supabase-server";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  if (!session.isAdmin) redirect("/dashboard");

  const supabase = getServiceClient();
  const { data: stores } = await supabase
    .from("bath_stores")
    .select("*")
    .order("display_order", { ascending: true });
  const { data: customers } = await supabase
    .from("bath_customers")
    .select("*")
    .order("distributed_at", { ascending: false });

  const realStores = (stores || []).filter((s: any) => !s.is_admin);

  return (
    <AdminDashboard
      stores={realStores}
      initialCustomers={customers || []}
      session={session}
    />
  );
}
