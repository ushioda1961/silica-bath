"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [storeId, setStoreId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: storeId.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "ログインに失敗しました");
      } else {
        router.push(data.isAdmin ? "/admin" : "/dashboard");
        router.refresh();
      }
    } catch (e) {
      setError("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 fade-in">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">販売店ログイン</h1>
          <p className="text-sm text-slate-500 mt-1">バスシリカ サンプル配布管理</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">店舗ID</label>
            <input
              type="text"
              required
              autoComplete="username"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
              placeholder="例: amarie"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">パスワード</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 transition text-white font-semibold py-3 rounded-xl shadow"
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-xs text-slate-400 hover:text-slate-600">
            ← トップに戻る
          </a>
        </div>
      </div>
    </main>
  );
}
