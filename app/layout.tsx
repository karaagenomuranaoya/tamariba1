import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL 
  ? process.env.NEXT_PUBLIC_SITE_URL 
  : "https://tamariba1.vercel.app"; // 開発環境用フォールバック
export const metadata: Metadata = {
  // ★ここが重要: これがないとOGP画像のURLが相対パスになり、SNSで表示されません
  metadataBase: new URL(siteUrl),

  title: "たまりば",
  description: "URLひとつで、匿名・クローズド・気兼ねなし",
  
  // ファイルベース(opengraph-image.jpeg)を使う場合でも、
  // 明示的にデフォルト設定を書いておくと確実です
  openGraph: {
    title: "たまりば",
    description: "URLひとつで、匿名・クローズド・気兼ねなし",
    url: siteUrl,
    siteName: "たまりば",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "たまりば",
    description: "URLひとつで、匿名・クローズド・気兼ねなし",
  },
};

// ★ここを追加：スマホでの拡大を完全に無効化する設定
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // これで「絶対拡大禁止」になります
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}