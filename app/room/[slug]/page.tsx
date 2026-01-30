'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Message } from './types';

// Components
import Header from './components/Header';
import RoomMenu from './components/RoomMenu';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import ImageViewer from './components/ImageViewer';
import ReplyModal from './components/ReplyModal'; // 追加

export default function RoomPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const searchParams = useSearchParams();

  // Room State
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Message State
  const [messages, setMessages] = useState<Message[]>([]);
  
  // ★ 追加: 返信スレッドの状態
  const [activeThread, setActiveThread] = useState<Message | null>(null);

  // ImageViewer State
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // 画像の有効期限切れ判定
  const isImageExpired = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    return (new Date().getTime() - created) > 24 * 60 * 60 * 1000;
  };

  const imageMessages = messages.filter(m => m.image_url && !isImageExpired(m.created_at));

  // 1. ルーム情報の取得 (変更なし)
  useEffect(() => {
    const fetchRoom = async () => {
      if (!slug) return;
      
      const { data, error } = await supabase
        .from('tm_rooms')
        .select('id, name') 
        .eq('slug', slug)
        .single();
      
      if (error || !data) {
        alert('このルームは存在しないか、削除されました。');
        router.push('/');
        return;
      }
      setRoomId(data.id);
      setRoomName(data.name || 'たまりば');

      const ownerToken = localStorage.getItem(`tamariba_owner_${slug}`);
      if (ownerToken) setIsHost(true);

      if (searchParams.get('created') === 'true') {
        setShowMenu(true);
        router.replace(`/room/${slug}`);
      }
    };
    fetchRoom();
  }, [slug, router, searchParams]);

  // 2. メッセージとルーム名のリアルタイム更新 (変更なし)
  useEffect(() => {
    if (!roomId) return;
    
    // 初期ロード
    const fetchMessages = async () => {
      const { data } = await supabase.from('tm_messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true });
      if (data) setMessages(data);
      setLoading(false);
    };
    fetchMessages();

    // 購読開始
    const msgChannel = supabase.channel(`room:${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tm_messages', filter: `room_id=eq.${roomId}` }, 
      (payload) => { setMessages((prev) => [...prev, payload.new as Message]); })
      .subscribe();
    
    const roomChannel = supabase.channel(`room_meta:${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tm_rooms', filter: `id=eq.${roomId}` },
      (payload) => {
        if (payload.new && 'name' in payload.new) {
            setRoomName(payload.new.name);
        }
      })
      .subscribe();

    return () => { 
        supabase.removeChannel(msgChannel); 
        supabase.removeChannel(roomChannel);
    };
  }, [roomId]);

  // Viewer Handlers (変更なし)
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

  if (loading) return <div className="flex items-center justify-center h-dvh text-gray-500">読み込み中...</div>;

  return (
    <div className="flex flex-col h-dvh bg-gray-100">
      
      <Header 
        roomName={roomName} 
        slug={slug} 
        showMenu={showMenu} 
        setShowMenu={setShowMenu} 
      />

      {showMenu && roomId && (
        <RoomMenu 
          slug={slug}
          roomId={roomId}
          isHost={isHost}
          roomName={roomName}
          setRoomName={setRoomName}
          onClose={() => setShowMenu(false)}
        />
      )}

      {/* MessageList に onReplyClick を渡す */}
      <MessageList 
        messages={messages} 
        onImageClick={openViewer} 
        onReplyClick={(msg) => setActiveThread(msg)} 
        onCloseMenu={() => setShowMenu(false)} 
      />

      {roomId && <ChatInput roomId={roomId} />}

      {/* Reply Modal (アクティブなスレッドがある場合のみ表示) */}
      {activeThread && roomId && (
        <ReplyModal 
            roomId={roomId}
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