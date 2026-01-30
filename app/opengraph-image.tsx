import { ImageResponse } from 'next/og';

// OGPのサイズ設定（推奨サイズ）
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  // 日本語フォント（Noto Sans JP）をGoogle Fontsから取得
  const fontData = await fetch(
    new URL('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&display=swap', import.meta.url)
  ).then((res) => res.text());
  
  // CSSファイルからフォントファイルのURLを抽出してfetch
  const fontUrl = fontData.match(/src: url\((.+)\) format\('woff2'\)/)?.[1];
  
  if (!fontUrl) {
    throw new Error('Failed to load font');
  }

  const fontBuffer = await fetch(fontUrl).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc', // bg-gray-50
          backgroundImage: 'radial-gradient(circle at 25px 25px, #e2e8f0 2%, transparent 0%), radial-gradient(circle at 75px 75px, #e2e8f0 2%, transparent 0%)',
          backgroundSize: '100px 100px',
        }}
      >
        {/* ロゴ部分 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              fontSize: 120,
              fontWeight: 700,
              color: '#2563EB', // blue-600
              letterSpacing: '-0.05em',
            }}
          >
            たまりば
          </div>
        </div>

        {/* キャッチコピー */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: '#4B5563', // gray-600
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          URLひとつで、匿名・クローズド・気兼ねなし
        </div>

        {/* サブテキスト */}
        <div
          style={{
            marginTop: '40px',
            fontSize: 32,
            color: '#9CA3AF', // gray-400
            backgroundColor: '#fff',
            padding: '10px 30px',
            borderRadius: '50px',
            border: '2px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          🌙 毎日AM3:00に全員解散
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Noto Sans JP',
          data: fontBuffer,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  );
}