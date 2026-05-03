"use client";

import { useState } from "react";
import type { Store } from "@/lib/types";

export default function StoreSettingsModal({
  store,
  onClose,
  onUpdated,
}: {
  store: Store;
  onClose: () => void;
  onUpdated: (s: Store) => void;
}) {
  const [name, setName] = useState(store.name);
  const [maxSamples, setMaxSamples] = useState(String(store.max_samples));
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const body: any = {
        name: name.trim(),
        max_samples: Number(maxSamples),
      };
      if (password.trim()) body.password = password.trim();

      const res = await fetch(`/api/stores/${store.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "更新失敗");
      } else {
        onUpdated(data.store);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 800);
      }
    } catch {
      setError("通信エラー");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-slate-800">店舗設定</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">
            ×
          </button>
        </div>
        <form onSubmit={onSave} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">店舗ID（変更不可）</label>
            <input
              disabled
              value={store.store_id}
              className="w-full px-3 py-2 rounded-lg border bg-slate-50 text-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">店舗名（表示名）</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">配布目標数（最大）</label>
            <input
              type="number"
              min={1}
              max={9999}
              required
              value={maxSamples}
              onChange={(e) => setMaxSamples(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none"
            />
            <p className="text-xs text-slate-400 mt-1">推奨: 150〜240</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              パスワード変更（任意・空欄なら変更しない）
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none"
              placeholder="新しいパスワード（4文字以上）"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2">
              ✓ 保存しました
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border text-slate-600 hover:bg-slate-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold"
            >
              {loading ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
