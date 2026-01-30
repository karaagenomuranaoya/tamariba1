import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: Props) {
  const { slug } = await params;

  // ★修正: こちらもCDNから直接取得
  const fontData = await fetch(
    new URL('https://unpkg.com/@fontsource/noto-sans-jp@5.0.19/files/noto-sans-jp-all-700-normal.woff', import.meta.url)
  ).then((res) => res.arrayBuffer());

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
          backgroundColor: '#eff6ff',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            right: '-200px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: '#dbeafe',
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
            background: '#dbeafe',
            opacity: 0.5,
          }}
        />

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
          data: fontData,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  );
}