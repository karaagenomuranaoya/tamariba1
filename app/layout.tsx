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
  // ベースURL（必須）
  metadataBase: new URL("https://tamariba1.vercel.app"), 

  title: "たまりば",
  description: "URLひとつで、匿名・クローズド・気兼ねなし",
  
  openGraph: {
    title: "たまりば",
    description: "URLひとつで、匿名・クローズド・気兼ねなし",
    url: "https://tamariba1.vercel.app",
    siteName: "たまりば",
    locale: "ja_JP",
    type: "website",
    // ★ここを追加：publicフォルダの画像を明示的に指定
    images: [
      {
        url: "/ogp.jpg", // publicフォルダに入れたファイル名（先頭に / をつける）
        width: 1200,
        height: 630,
        alt: "たまりば",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "たまりば",
    description: "URLひとつで、匿名・クローズド・気兼ねなし",
    // twitter側も念のため指定
    images: ["/ogp.jpg"], 
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