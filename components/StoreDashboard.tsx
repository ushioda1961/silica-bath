"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase-browser";
import type { Customer, Store, SessionPayload } from "@/lib/types";
import RegisterModal from "./RegisterModal";
import EditModal from "./EditModal";

type Props = {
  store: Store;
  initialCustomers: Customer[];
  session: SessionPayload;
};

export default function StoreDashboard({ store, initialCustomers, session }: Props) {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [showRegister, setShowRegister] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [filter, setFilter] = useState<"all" | "contracted" | "pending">("all");

  // Realtime購読
  useEffect(() => {
    const supabase = getBrowserClient();
    const channel = supabase
      .channel(`store-${store.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bath_customers", filter: `store_id=eq.${store.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setCustomers((prev) => [payload.new as Customer, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setCustomers((prev) =>
              prev.map((c) => (c.id === (payload.new as Customer).id ? (payload.new as Customer) : c))
            );
          } else if (payload.eventType === "DELETE") {
            setCustomers((prev) => prev.filter((c) => c.id !== (payload.old as Customer).id));
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [store.id]);

  const stats = useMemo(() => {
    const total = customers.length;
    const contracted = customers.filter((c) => c.contracted).length;
    const rate = total > 0 ? (contracted / total) * 100 : 0;
    const remaining = Math.max(0, store.max_samples - total);
    const progressPct = store.max_samples > 0 ? Math.min(100, (total / store.max_samples) * 100) : 0;
    return { total, contracted, rate, remaining, progressPct };
  }, [customers, store.max_samples]);

  const filtered = useMemo(() => {
    if (filter === "contracted") return customers.filter((c) => c.contracted);
    if (filter === "pending") return customers.filter((c) => !c.contracted);
    return customers;
  }, [customers, filter]);

  async function toggleContract(c: Customer) {
    await fetch(`/api/customers/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contracted: !c.contracted }),
    });
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800">{store.name}</h1>
            <p className="text-xs text-slate-500">バスシリカ サンプル配布管理</p>
          </div>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800">
            ログアウト
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="配布数" value={stats.total} sub={`目標 ${store.max_samples}`} color="blue" />
          <StatCard label="成約数" value={stats.contracted} color="green" />
          <StatCard
            label="成約率"
            value={`${stats.rate.toFixed(1)}%`}
            color="amber"
            highlight
          />
          <StatCard label="残り" value={stats.remaining} sub="サンプル個数" color="slate" />
        </section>

        {/* Progress Bar */}
        <section className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">配布進捗</span>
            <span className="text-sm text-slate-500">
              {stats.total} / {store.max_samples}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-400 to-primary-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${stats.progressPct}%` }}
            />
          </div>
        </section>

        {/* Actions */}
        <section className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowRegister(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-3 rounded-xl shadow pulse-glow"
          >
            ＋ サンプル配布を登録
          </button>
          <div className="ml-auto flex gap-1 bg-white border rounded-lg p-1">
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
              全て ({customers.length})
            </FilterButton>
            <FilterButton active={filter === "contracted"} onClick={() => setFilter("contracted")}>
              成約済 ({stats.contracted})
            </FilterButton>
            <FilterButton active={filter === "pending"} onClick={() => setFilter("pending")}>
              未成約 ({customers.length - stats.contracted})
            </FilterButton>
          </div>
        </section>

        {/* List */}
        <section className="bg-white rounded-2xl shadow overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              {customers.length === 0
                ? "まだ登録がありません。「＋ サンプル配布を登録」から追加してください。"
                : "該当する顧客がいません"}
            </div>
          ) : (
            <ul className="divide-y">
              {filtered.map((c) => (
                <li
                  key={c.id}
                  className={`p-4 flex items-center justify-between gap-3 fade-in ${
                    c.contracted ? "bg-green-50/40" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{c.name}</span>
                      {c.contracted && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          成約済
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                      {c.gender && <span>{c.gender}</span>}
                      {c.age_group && <span>{c.age_group}</span>}
                      {c.age != null && <span>{c.age}歳</span>}
                      <span>配布: {formatJP(c.distributed_at)}</span>
                      {c.contracted_at && <span>成約: {formatJP(c.contracted_at)}</span>}
                    </div>
                    {c.notes && <div className="text-xs text-slate-500 mt-1">📝 {c.notes}</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleContract(c)}
                      className={`text-sm font-medium px-3 py-2 rounded-lg transition ${
                        c.contracted
                          ? "bg-slate-200 hover:bg-slate-300 text-slate-700"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {c.contracted ? "成約解除" : "成約"}
                    </button>
                    <button
                      onClick={() => setEditing(c)}
                      className="text-sm text-slate-500 hover:text-slate-800 px-2 py-2"
                    >
                      編集
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}
      {editing && <EditModal customer={editing} onClose={() => setEditing(null)} />}
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
  highlight,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color: "blue" | "green" | "amber" | "slate";
  highlight?: boolean;
}) {
  const colorMap: Record<string, string> = {
    blue: "from-blue-500 to-primary-600",
    green: "from-emerald-500 to-green-600",
    amber: "from-amber-500 to-orange-500",
    slate: "from-slate-500 to-slate-700",
  };
  return (
    <div
      className={`rounded-2xl shadow p-4 text-white bg-gradient-to-br ${colorMap[color]} ${
        highlight ? "ring-4 ring-amber-200" : ""
      }`}
    >
      <div className="text-xs opacity-90">{label}</div>
      <div className="text-3xl font-bold mt-1 leading-none">{value}</div>
      {sub && <div className="text-xs opacity-75 mt-1">{sub}</div>}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-md transition ${
        active ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function formatJP(s: string) {
  const d = new Date(s);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const HH = String(d.getHours()).padStart(2, "0");
  const MM = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${HH}:${MM}`;
}
