import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

// Edge Runtimeで動作させる設定
export const runtime = 'edge';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Edge内でもSupabaseを使えるようにここで初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: Props) {
  const { slug } = await params;

  // 日本語フォント取得 (Topと同じロジック)
  const fontData = await fetch(
    new URL('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700&display=swap', import.meta.url)
  ).then((res) => res.text());
  const fontUrl = fontData.match(/src: url\((.+)\) format\('woff2'\)/)?.[1];
  if (!fontUrl) throw new Error('Failed to load font');
  const fontBuffer = await fetch(fontUrl).then((res) => res.arrayBuffer());

  // ルーム名を取得
  const { data } = await supabase
    .from('tm_rooms')
    .select('name')
    .eq('slug', slug)
    .single();

  const roomName = data?.name || 'たまりば';

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
          backgroundColor: '#eff6ff', // blue-50
          position: 'relative',
        }}
      >
        {/* 装飾: 背景の円 */}
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            right: '-200px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: '#dbeafe', // blue-100
            opacity: 0.5,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: '#dbeafe', // blue-100
            opacity: 0.5,
          }}
        />

        {/* メインコンテンツカード */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white',
            padding: '60px 80px',
            borderRadius: '40px',
            boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.1)',
            border: '4px solid #fff',
            maxWidth: '900px',
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: 32,
              color: '#6B7280',
              marginBottom: '20px',
              fontWeight: 700,
            }}
          >
            チャットルームに招待されました
          </div>

          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: '#111827',
              textAlign: 'center',
              lineHeight: 1.2,
              marginBottom: '40px',
              // 長すぎる名前の場合は切り詰めるなどの処理が必要ですが、
              // CSS的には折り返されます
            }}
          >
            {roomName}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
             <div
              style={{
                backgroundColor: '#2563EB',
                color: 'white',
                padding: '16px 40px',
                borderRadius: '50px',
                fontSize: 36,
                fontWeight: 700,
              }}
            >
              参加する
            </div>
          </div>
        </div>

        {/* 下部ロゴ */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: 24,
            fontWeight: 700,
            color: '#9CA3AF',
            letterSpacing: '0.1em',
          }}
        >
          たまりば - 匿名・登録不要チャット
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