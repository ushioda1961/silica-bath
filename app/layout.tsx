import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "バスシリカ サンプル配布管理",
  description: "水溶性ケイ素ホワイトシリカ入浴剤「バスシリカ」のサンプル配布・成約率管理アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
