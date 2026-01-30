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

export const metadata: Metadata = {
  // ★ここを追加：本番環境のURLを設定してください
  // ローカル開発中は http://localhost:3000 でOKですが、
  // Vercel等にデプロイしたらそのURLに変更するか、process.env.NEXT_PUBLIC_BASE_URL等を使います
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://tamariba1.vercel.app/:3000'),

  title: "たまりば",
  description: "URLひとつで、匿名・クローズド・気兼ねなし",
  
  // ★追加: デフォルトのOGP設定（個別ページがない場合のフォールバック）
  openGraph: {
    title: "たまりば",
    description: "URLひとつで、匿名・クローズド・気兼ねなし",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
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