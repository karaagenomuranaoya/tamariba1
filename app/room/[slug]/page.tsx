'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// ▼▼▼ デフォルトニックネームの設定 ▼▼▼
const DEFAULT_NICKNAME = 'からあげ'; 
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

type Message = {
  id: string;
  nickname: string;
  content: string;
  created_at: string;
  image_url?: string | null;
};

export default function RoomPage() {
  const { slug } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [nickname, setNickname] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [isHost, setIsHost] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. 初期化処理
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

  // 2. メッセージ監視
  useEffect(() => {
    if (!roomId) return;
    const fetchMessages = async () => {
      const { data } = await supabase.from('tm_messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true });
      if (data) setMessages(data);
      setLoading(false);
    };
    fetchMessages();

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isImageExpired = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    return (new Date().getTime() - created) > 24 * 60 * 60 * 1000;
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalNickname = nickname.trim() || DEFAULT_NICKNAME;

    if ((!newMessage.trim() && !selectedImage) || !roomId) return;

    let imageUrl = null;
    if (selectedImage) {
      setIsUploading(true);
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${roomId}/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('tm-images').upload(filePath, selectedImage);
      if (uploadError) { alert('UP失敗'); setIsUploading(false); return; }
      const { data } = supabase.storage.from('tm-images').getPublicUrl(filePath);
      imageUrl = data.publicUrl;
      setIsUploading(false);
    }

    await supabase.from('tm_messages').insert([{
      room_id: roomId, nickname: finalNickname, content: newMessage, image_url: imageUrl
    }]);
    setNewMessage(''); setSelectedImage(null); if(fileInputRef.current) fileInputRef.current.value='';
  };

  const deleteRoom = async () => {
    if (!confirm('本当に削除しますか？')) return;
    const ownerToken = localStorage.getItem(`tamariba_owner_${slug}`);
    if (!roomId || !ownerToken) return;
    const { error } = await supabase.from('tm_rooms').delete().eq('id', roomId).eq('owner_token', ownerToken);
    if (!error) { localStorage.removeItem(`tamariba_owner_${slug}`); router.push('/'); }
  };

  const updateRoomName = async () => {
    const newName = prompt('新しいルーム名を入力してください', roomName);
    if (newName === null || newName === roomName) return;
    if (!newName.trim()) { alert('ルーム名は空にできません'); return; }

    const ownerToken = localStorage.getItem(`tamariba_owner_${slug}`);
    if (!roomId || !ownerToken) return;

    const { error } = await supabase.from('tm_rooms').update({ name: newName }).eq('id', roomId).eq('owner_token', ownerToken);
    if (error) console.error(error); else setRoomName(newName);
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (loading) return <div className="flex items-center justify-center h-dvh text-gray-500">読み込み中...</div>;

  return (
    // ★ h-screen から h-dvh に変更 (スマホのアドレスバー対策)
    <div className="flex flex-col h-dvh bg-gray-100">
      
      {/* ヘッダー */}
      <header className="bg-white px-4 py-3 shadow-sm flex justify-between items-center z-20 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={() => router.push('/')} className="text-gray-400 hover:text-gray-600 p-1 -ml-1">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          </button>
          <div className="flex flex-col">
            <h1 className="font-bold text-gray-800 text-base leading-tight truncate max-w-[180px] sm:max-w-xs">{roomName}</h1>
            <p className="text-[10px] text-gray-400 font-mono leading-none mt-0.5">ID: {slug}</p>
          </div>
        </div>

        <button onClick={() => setShowMenu(!showMenu)} className="bg-gray-50 p-2 rounded-full hover:bg-gray-200 text-gray-600 active:bg-gray-200 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
        </button>

        {/* メニュー (変更なし) */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-20 bg-black/10" onClick={() => setShowMenu(false)}></div>
            <div className="absolute top-14 right-2 w-72 bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 z-30">
              <div className="p-5 border-b border-gray-100 text-center">
                <p className="text-xs text-gray-400 mb-3">招待用QRコード</p>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${typeof window !== 'undefined' ? window.location.href : ''}`} alt="QR" className="mx-auto mb-4 w-32 h-32" />
                
                <button 
                  onClick={copyUrl} 
                  className={`w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${isCopied ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                >
                  {isCopied ? 'コピーしました' : 'URLをコピー'}
                </button>
              </div>
              
              {isHost ? (
                <div className="bg-gray-50">
                    <button onClick={updateRoomName} className="w-full text-left p-4 text-gray-700 text-sm hover:bg-gray-100 font-medium flex items-center gap-3 border-b border-gray-100">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                      ルーム名を変更
                    </button>
                    <button onClick={deleteRoom} className="w-full text-left p-4 text-red-600 text-sm hover:bg-red-50 font-bold flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      このルームを削除
                    </button>
                </div>
              ) : (
                  <div className="p-3 text-xs text-gray-400 text-center bg-gray-50">管理者メニュー（権限なし）</div>
              )}
            </div>
          </>
        )}
      </header>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 bg-slate-50 scroll-smooth" onClick={() => setShowMenu(false)}>
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col items-start max-w-[90%]">
             <div className="flex items-baseline gap-2 mb-1 ml-1">
              <span className="text-xs font-bold text-gray-600 truncate max-w-[150px]">{msg.nickname}</span>
              <span className="text-[10px] text-gray-400">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div className="bg-white px-3.5 py-2.5 rounded-2xl rounded-tl-none shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-gray-100 text-[15px] leading-relaxed text-gray-800 break-words whitespace-pre-wrap">
              {msg.content}
            </div>
            {msg.image_url && (
              <div className="mt-1.5 ml-1">
                {isImageExpired(msg.created_at) ? (
                  <div className="bg-gray-100 p-4 rounded text-[10px] text-gray-400 border border-dashed border-gray-300">🚫 画像期限切れ</div>
                ) : (
                   // eslint-disable-next-line @next/next/no-img-element
                  <img src={msg.image_url} alt="posted" className="rounded-xl border border-gray-100 max-h-60 object-contain bg-white" />
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* 入力エリア (スマホ最適化) */}
      <div className="bg-white border-t border-gray-200 shrink-0 pb-safe">
        <form onSubmit={sendMessage} className="flex flex-col max-w-screen-md mx-auto">
          
          {/* 画像選択中の表示 */}
          {selectedImage && (
            <div className="px-3 pt-3">
              <div className="flex items-center justify-between bg-blue-50 p-2 px-3 rounded-lg text-sm text-blue-800 border border-blue-100">
                <span className="flex items-center gap-2 truncate">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v1.69c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-1.69l2.25-2.25 1.503 1.503a.75.75 0 001.06 0l1.75-1.75 3.181 3.181a.75.75 0 001.206-.525V5.25a.75.75 0 00-.75-.75H3.25a.75.75 0 00-.75.75v5.81z" clipRule="evenodd" /></svg>
                  {selectedImage.name}
                </span>
                <button type="button" onClick={() => { setSelectedImage(null); if(fileInputRef.current) fileInputRef.current.value=''; }} className="text-blue-400 hover:text-blue-600 p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                </button>
              </div>
            </div>
          )}

          {/* 上段: ニックネーム入力 (目立たなく、でも押しやすく) */}
          <div className="px-3 pt-2">
             <input 
              type="text" 
              placeholder={`名前 (省略: ${DEFAULT_NICKNAME})`}
              value={nickname} 
              onChange={(e) => setNickname(e.target.value)} 
              className="text-xs text-gray-500 bg-transparent placeholder-gray-400 focus:outline-none focus:text-blue-600 py-1 w-full" 
            />
          </div>

          {/* 下段: メイン入力周り */}
          <div className="flex gap-2 items-end px-3 pb-3 pt-1">
            {/* 画像ボタン */}
            <label className="shrink-0 p-2.5 text-gray-500 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-full cursor-pointer transition-colors mb-0.5">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => { if (e.target.files?.[0]) setSelectedImage(e.target.files[0]); }} />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
            </label>
            
            {/* テキストエリア (text-baseでiOSズーム防止) */}
            <input 
              type="text" 
              placeholder="メッセージ..." 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)} 
              className="flex-1 p-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-base min-h-[44px]"
            />
            
            {/* 送信ボタン */}
            <button 
              type="submit" 
              disabled={(!newMessage && !selectedImage) || isUploading} 
              className="shrink-0 bg-blue-600 text-white p-3 rounded-full font-bold shadow-sm active:scale-95 transition-all disabled:opacity-30 disabled:active:scale-100 mb-0.5"
            >
              {isUploading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 translate-x-0.5 -translate-y-0.5"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}