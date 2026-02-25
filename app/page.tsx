'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Message } from './types';

// Components
import Header from './components/Header';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import ImageViewer from './components/ImageViewer';
import ReplyModal from './components/ReplyModal';

// 定数: ルーム名はコード固定
const ROOM_NAME = 'たまりば';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeThread, setActiveThread] = useState<Message | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // 画像を持つメッセージのみ抽出
  const imageMessages = messages.filter(m => m.image_url);

  // 1. メッセージ取得 & リアルタイム購読
  useEffect(() => {
    // 過去ログ取得
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('tm_messages')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (data) setMessages(data);
      setLoading(false);
    };
    fetchMessages();

    // リアルタイム受信 (room_idフィルタを削除)
    const channel = supabase.channel('global_chat')
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'tm_messages' }, 
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => { 
        supabase.removeChannel(channel); 
    };
  }, []);

  // Viewer Handlers
  const openViewer = (url: string) => {
    const index = imageMessages.findIndex(m => m.image_url === url);
    if (index !== -1) setViewerIndex(index);
  };

  const nextImage = () => {
    if (viewerIndex === null) return;
    setViewerIndex((prev) => (prev! + 1) % imageMessages.length);
  };

  const prevImage = () => {
    if (viewerIndex === null) return;
    setViewerIndex((prev) => (prev! - 1 + imageMessages.length) % imageMessages.length);
  };

  if (loading) return <div className="flex items-center justify-center h-dvh text-gray-500 bg-gray-50">読み込み中...</div>;

  return (
    <div className="flex flex-col h-dvh bg-gray-100">
      <Header roomName={ROOM_NAME} />

      <MessageList 
        messages={messages} 
        onImageClick={openViewer} 
        onReplyClick={(msg) => setActiveThread(msg)} 
      />

      {/* roomId を渡す必要がなくなりました */}
      <ChatInput />

      {activeThread && (
        <ReplyModal 
            parentMessage={activeThread}
            allMessages={messages}
            onClose={() => setActiveThread(null)}
        />
      )}

      {viewerIndex !== null && imageMessages[viewerIndex] && (
        <ImageViewer
          imageUrl={imageMessages[viewerIndex].image_url!}
          nickname={imageMessages[viewerIndex].nickname}
          currentIndex={viewerIndex}
          total={imageMessages.length}
          onClose={() => setViewerIndex(null)}
          onNext={nextImage}
          onPrev={prevImage}
        />
      )}
    </div>
  );
}