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
  // ★ここが重要: これがないとOGP画像のURLが相対パスになり、SNSで表示されません
  metadataBase: new URL("https://tamariba.vercel.app"), 

  title: "たまりば",
  description: "URLひとつで、匿名・クローズド・気兼ねなし",
  
  // ファイル (opengraph-image.jpeg) を置いている場合、
  // 以下の設定はNext.jsが自動生成するので、基本的には書かなくて大丈夫ですが、
  // 明示的に書きたい場合は以下のようにします。
  openGraph: {
    title: "たまりば",
    description: "URLひとつで、匿名・クローズド・気兼ねなし",
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