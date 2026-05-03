"use client";

import { useState } from "react";
import { GENDER_OPTIONS, AGE_GROUP_OPTIONS } from "@/lib/types";

export default function RegisterModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [age, setAge] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError("氏名を入力してください");
    setLoading(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
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
      if (!res.ok) {
        setError(data.error || "登録に失敗しました");
      } else {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setName("");
          setGender("");
          setAgeGroup("");
          setAge("");
          setNotes("");
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
          <h2 className="text-lg font-bold text-slate-800">サンプル配布を登録</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">
            ×
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              氏名 <span className="text-red-500">*</span>
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
              placeholder="例: 田中 花子"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">性別</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
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
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
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
            <label className="block text-sm font-medium text-slate-700 mb-1">年齢（任意）</label>
            <input
              type="number"
              min={0}
              max={120}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
              placeholder="例: 35"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">メモ（任意）</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
              placeholder="フォロー予定など"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2">
              ✓ 登録しました
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border text-slate-600 hover:bg-slate-50"
            >
              閉じる
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold"
            >
              {loading ? "登録中..." : "登録する"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
