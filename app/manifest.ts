import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'なおやくん',
    short_name: 'なおやくん',
    description: 'なおやくんと一緒',
    start_url: '/',
    display: 'standalone', // これがアドレスバーを消す魔法の呪文です
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      {
        src: '/icon.png', // 後でこの画像をpublicフォルダに入れます
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}