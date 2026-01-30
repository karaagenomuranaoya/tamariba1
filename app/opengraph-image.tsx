import { ImageResponse } from 'next/og';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  // ★修正: URLを正しいファイルパス（japaneseサブセット）に変更し、安定したJSDelivrを使用
  const fontData = await fetch(
    'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.19/files/noto-sans-jp-japanese-700-normal.woff'
  ).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch font');
    return res.arrayBuffer();
  });

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
          backgroundColor: '#f8fafc',
          backgroundImage: 'radial-gradient(circle at 25px 25px, #e2e8f0 2%, transparent 0%), radial-gradient(circle at 75px 75px, #e2e8f0 2%, transparent 0%)',
          backgroundSize: '100px 100px',
        }}
      >
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
              color: '#2563EB',
              letterSpacing: '-0.05em',
            }}
          >
            たまりば
          </div>
        </div>

        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: '#4B5563',
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          URLひとつで、匿名・クローズド・気兼ねなし
        </div>

        <div
          style={{
            marginTop: '40px',
            fontSize: 32,
            color: '#9CA3AF',
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
          data: fontData,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  );
}