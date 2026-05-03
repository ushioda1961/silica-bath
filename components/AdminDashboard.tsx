"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase-browser";
import type { Customer, Store, SessionPayload } from "@/lib/types";
import StoreSettingsModal from "./StoreSettingsModal";

type Props = {
  stores: Store[];
  initialCustomers: Customer[];
  session: SessionPayload;
};

export default function AdminDashboard({ stores: initialStores, initialCustomers, session }: Props) {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>(initialStores);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [storeFilter, setStoreFilter] = useState<string>("all");

  // Realtime: customers
  useEffect(() => {
    const supabase = getBrowserClient();
    const ch = supabase
      .channel("admin-customers")
      .on("postgres_changes", { event: "*", schema: "public", table: "bath_customers" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setCustomers((p) => [payload.new as Customer, ...p]);
        } else if (payload.eventType === "UPDATE") {
          setCustomers((p) =>
            p.map((c) => (c.id === (payload.new as Customer).id ? (payload.new as Customer) : c))
          );
        } else if (payload.eventType === "DELETE") {
          setCustomers((p) => p.filter((c) => c.id !== (payload.old as Customer).id));
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  // Realtime: stores (max_samples等の変更を反映)
  useEffect(() => {
    const supabase = getBrowserClient();
    const ch = supabase
      .channel("admin-stores")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "bath_stores" }, (payload) => {
        const updated = payload.new as Store;
        if (updated.is_admin) return;
        setStores((p) => p.map((s) => (s.id === updated.id ? updated : s)));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const totals = useMemo(() => {
    const total = customers.length;
    const contracted = customers.filter((c) => c.contracted).length;
    const rate = total > 0 ? (contracted / total) * 100 : 0;
    const totalMax = stores.reduce((acc, s) => acc + (s.max_samples || 0), 0);
    const remaining = Math.max(0, totalMax - total);
    const progressPct = totalMax > 0 ? Math.min(100, (total / totalMax) * 100) : 0;
    return { total, contracted, rate, totalMax, remaining, progressPct };
  }, [customers, stores]);

  const perStore = useMemo(() => {
    return stores.map((s) => {
      const cs = customers.filter((c) => c.store_id === s.id);
      const total = cs.length;
      const contracted = cs.filter((c) => c.contracted).length;
      const rate = total > 0 ? (contracted / total) * 100 : 0;
      return { store: s, total, contracted, rate };
    });
  }, [customers, stores]);

  const filteredCustomers = useMemo(() => {
    if (storeFilter === "all") return customers;
    return customers.filter((c) => c.store_id === storeFilter);
  }, [customers, storeFilter]);

  const demographics = useMemo(() => {
    const byGender: Record<string, { total: number; contracted: number }> = {};
    const byAge: Record<string, { total: number; contracted: number }> = {};
    for (const c of customers) {
      const g = c.gender || "未指定";
      byGender[g] = byGender[g] || { total: 0, contracted: 0 };
      byGender[g].total++;
      if (c.contracted) byGender[g].contracted++;

      const a = c.age_group || "未指定";
      byAge[a] = byAge[a] || { total: 0, contracted: 0 };
      byAge[a].total++;
      if (c.contracted) byAge[a].contracted++;
    }
    return { byGender, byAge };
  }, [customers]);

  function exportCSV() {
    const headers = ["店舗", "氏名", "性別", "年代", "年齢", "成約", "配布日時", "成約日時", "メモ"];
    const storeNameById = new Map(stores.map((s) => [s.id, s.name]));
    const rows = customers.map((c) => [
      storeNameById.get(c.store_id) || "",
      c.name,
      c.gender || "",
      c.age_group || "",
      c.age != null ? c.age : "",
      c.contracted ? "成約" : "",
      formatJP(c.distributed_at),
      c.contracted_at ? formatJP(c.contracted_at) : "",
      (c.notes || "").replaceAll("\n", " "),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ts = new Date().toISOString().slice(0, 16).replace(/[:T-]/g, "");
    a.download = `bathshilica_${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-primary-700 to-primary-600 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">総合管理</span>
              <h1 className="text-xl font-bold">バスシリカ サンプル配布管理</h1>
            </div>
            <p className="text-xs opacity-90 mt-0.5">全店舗のリアルタイム配布状況</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg"
            >
              CSV出力
            </button>
            <button onClick={logout} className="text-sm hover:underline opacity-90">
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Totals */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <BigStat label="総配布数" value={totals.total} sub={`目標 ${totals.totalMax}`} color="blue" />
          <BigStat label="総成約数" value={totals.contracted} color="green" />
          <BigStat
            label="全体成約率"
            value={`${totals.rate.toFixed(1)}%`}
            color="amber"
            highlight
          />
          <BigStat label="残り配布可能数" value={totals.remaining} color="slate" />
        </section>

        {/* Total progress bar */}
        <section className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">全体配布進捗</span>
            <span className="text-sm text-slate-500">
              {totals.total} / {totals.totalMax}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-400 to-primary-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${totals.progressPct}%` }}
            />
          </div>
        </section>

        {/* Per-store stats */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {perStore.map(({ store, total, contracted, rate }) => {
            const pct = store.max_samples > 0 ? Math.min(100, (total / store.max_samples) * 100) : 0;
            return (
              <div key={store.id} className="bg-white rounded-2xl shadow p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{store.name}</h3>
                    <p className="text-xs text-slate-400">ID: {store.store_id}</p>
                  </div>
                  <button
                    onClick={() => setEditingStore(store)}
                    className="text-xs text-primary-600 hover:underline"
                  >
                    設定
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="bg-blue-50 rounded-lg py-2">
                    <div className="text-xs text-slate-500">配布</div>
                    <div className="text-xl font-bold text-blue-700">{total}</div>
                    <div className="text-xs text-slate-400">/ {store.max_samples}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg py-2">
                    <div className="text-xs text-slate-500">成約</div>
                    <div className="text-xl font-bold text-green-700">{contracted}</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg py-2">
                    <div className="text-xs text-slate-500">成約率</div>
                    <div className="text-xl font-bold text-amber-700">{rate.toFixed(1)}%</div>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary-400 to-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </section>

        {/* Demographics */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DemoCard title="性別ごとの成約率" data={demographics.byGender} />
          <DemoCard title="年代ごとの成約率" data={demographics.byAge} />
        </section>

        {/* Customer list */}
        <section className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-slate-700">配布履歴</h3>
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="text-sm border rounded-lg px-2 py-1"
            >
              <option value="all">全店舗</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-slate-400">配布記録がありません</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left px-3 py-2">店舗</th>
                    <th className="text-left px-3 py-2">氏名</th>
                    <th className="text-left px-3 py-2">性別</th>
                    <th className="text-left px-3 py-2">年代</th>
                    <th className="text-left px-3 py-2">年齢</th>
                    <th className="text-left px-3 py-2">配布日時</th>
                    <th className="text-left px-3 py-2">成約</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.slice(0, 200).map((c) => {
                    const store = stores.find((s) => s.id === c.store_id);
                    return (
                      <tr
                        key={c.id}
                        className={`border-t ${c.contracted ? "bg-green-50/40" : ""} fade-in`}
                      >
                        <td className="px-3 py-2 text-slate-600">{store?.name || "-"}</td>
                        <td className="px-3 py-2 font-medium text-slate-800">{c.name}</td>
                        <td className="px-3 py-2 text-slate-600">{c.gender || "-"}</td>
                        <td className="px-3 py-2 text-slate-600">{c.age_group || "-"}</td>
                        <td className="px-3 py-2 text-slate-600">{c.age ?? "-"}</td>
                        <td className="px-3 py-2 text-slate-500 text-xs">{formatJP(c.distributed_at)}</td>
                        <td className="px-3 py-2">
                          {c.contracted ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              成約
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">未</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredCustomers.length > 200 && (
                <div className="text-center py-2 text-xs text-slate-400">
                  最新200件を表示しています（CSV出力で全件取得可能）
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {editingStore && (
        <StoreSettingsModal
          store={editingStore}
          onClose={() => setEditingStore(null)}
          onUpdated={(s) => {
            setStores((prev) => prev.map((p) => (p.id === s.id ? s : p)));
          }}
        />
      )}
    </main>
  );
}

function BigStat({
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
      className={`rounded-2xl shadow p-5 text-white bg-gradient-to-br ${colorMap[color]} ${
        highlight ? "ring-4 ring-amber-200" : ""
      }`}
    >
      <div className="text-xs opacity-90">{label}</div>
      <div className="text-4xl font-bold mt-1 leading-none">{value}</div>
      {sub && <div className="text-xs opacity-75 mt-1">{sub}</div>}
    </div>
  );
}

function DemoCard({
  title,
  data,
}: {
  title: string;
  data: Record<string, { total: number; contracted: number }>;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1].total - a[1].total);
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <h3 className="font-semibold text-slate-700 mb-3">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-400">データがありません</p>
      ) : (
        <div className="space-y-2">
          {entries.map(([k, v]) => {
            const rate = v.total > 0 ? (v.contracted / v.total) * 100 : 0;
            return (
              <div key={k}>
                <div className="flex items-center justify-between text-sm mb-0.5">
                  <span className="text-slate-700">{k}</span>
                  <span className="text-slate-500 text-xs">
                    {v.contracted}/{v.total} （{rate.toFixed(0)}%）
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-orange-500 h-2"
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
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
