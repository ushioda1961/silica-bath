# バスシリカ サンプル配布管理アプリ

水溶性ケイ素ホワイトシリカ入浴剤「バスシリカ」のサンプル配布・成約率をリアルタイム管理するためのアプリ。

## 機能

- 販売店ごとのログイン（店舗ID＋パスワード）
- 顧客サンプル配布登録（氏名・性別・年代・年齢・メモ）
- 成約 / 未成約のワンクリック切替
- 店舗管理画面: 自店舗の配布状況・成約率・進捗バー
- 総合管理画面（管理者専用）:
  - 全店舗の配布数・成約数・成約率（リアルタイム反映）
  - 店舗ごとの個別ステータス
  - 性別・年代別の成約率（属性分析）
  - CSV出力
  - 店舗設定（配布目標数・パスワード変更）

## 店舗構成

| 店舗ID | 表示名 | パスワード | 役割 |
|---|---|---|---|
| amarie | amarie | pass14 | 販売店 |
| akiko  | akiko  | pass14 | 販売店 |
| kayaba | kayaba | pass14 | 販売店 |
| mayumi | mayumi | pass14 | 販売店 |
| ushi   | 総合管理 | pass14 | 総合管理者 |

## 技術スタック

- Next.js 14 (App Router) / TypeScript
- Tailwind CSS
- Supabase (Postgres + Realtime)
- 認証: HttpOnly署名Cookie (jose / HS256)
- デプロイ: Vercel

## 環境変数

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SESSION_SECRET=  # 32文字以上のランダム文字列
```

## セットアップ

1. Supabaseプロジェクトを作成
2. SQL Editorで `supabase-schema.sql` を実行
3. Vercelにデプロイし環境変数を設定
