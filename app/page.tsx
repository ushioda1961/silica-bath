import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 px-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-10 fade-in">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-800">バスシリカ</h1>
          <p className="text-slate-500 mt-1">サンプル配布管理システム</p>
          <p className="text-xs text-slate-400 mt-3">水溶性ケイ素ホワイトシリカ入浴剤</p>
        </div>

        <div className="mt-10 space-y-3">
          <Link
            href="/login"
            className="block w-full text-center bg-primary-600 hover:bg-primary-700 transition text-white font-semibold py-3 rounded-xl shadow"
          >
            販売店ログイン
          </Link>
          <p className="text-center text-xs text-slate-400">
            販売店IDとパスワードでログインしてください
          </p>
        </div>

        <div className="mt-10 pt-6 border-t text-center text-xs text-slate-400">
          <p>温泉（メタケイ酸が多い温泉）と同等の効果が得られる入浴剤</p>
          <p className="mt-1">4Lボトル / 1回100ml使用 / サンプル100ml配布</p>
        </div>
      </div>
    </main>
  );
}
