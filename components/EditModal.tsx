"use client";

import { useState } from "react";
import type { Customer } from "@/lib/types";
import { GENDER_OPTIONS, AGE_GROUP_OPTIONS } from "@/lib/types";

export default function EditModal({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) {
  const [name, setName] = useState(customer.name);
  const [gender, setGender] = useState(customer.gender || "");
  const [ageGroup, setAgeGroup] = useState(customer.age_group || "");
  const [age, setAge] = useState(customer.age != null ? String(customer.age) : "");
  const [notes, setNotes] = useState(customer.notes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          gender: gender || null,
          age_group: ageGroup || null,
          age: age ? Number(age) : null,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "更新失敗");
      else onClose();
    } catch {
      setError("通信エラー");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!confirm(`「${customer.name}」を削除しますか？この操作は元に戻せません。`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "削除失敗");
      } else {
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-slate-800">顧客情報を編集</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">
            ×
          </button>
        </div>
        <form onSubmit={onSave} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">氏名</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">性別</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none"
              >
                <option value="">選択</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">年代</label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none"
              >
                <option value="">選択</option>
                {AGE_GROUP_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">年齢</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">メモ</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 outline-none"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onDelete}
              disabled={loading}
              className="px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200"
            >
              削除
            </button>
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
