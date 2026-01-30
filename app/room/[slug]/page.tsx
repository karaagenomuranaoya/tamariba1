'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

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
  
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomName, setRoomName] = useState(''); // ルーム名State
  const [messages, setMessages] = useState<Message[]>([]);
  const [nickname, setNickname] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [isHost, setIsHost] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. ルーム情報取得
  useEffect(() => {
    const fetchRoom = async () => {
      if (!slug) return;
      // name も取得するように変更
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
      setRoomName(data.name || '名もなきとまり木'); // セット

      const ownerToken = localStorage.getItem(`tamariba_owner_${slug}`);
      if (ownerToken) setIsHost(true);
    };
    fetchRoom();
  }, [slug, router]);

  // 2. メッセージ取得 & リアルタイム (変更なし)
  useEffect(() => {
    if (!roomId) return;
    const fetchMessages = async () => {
      const { data } = await supabase.from('tm_messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true });
      if (data) setMessages(data);
      setLoading(false);
    };
    fetchMessages();

    // メッセージの監視
    const msgChannel = supabase.channel(`room:${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tm_messages', filter: `room_id=eq.${roomId}` }, 
      (payload) => { setMessages((prev) => [...prev, payload.new as Message]); })
      .subscribe();
    
    // ルーム情報の監視（名前が変わったらリアルタイムで反映させる！）
    const roomChannel = supabase.channel(`room_meta:${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tm_rooms', filter: `id=eq.${roomId}` },
      (payload) => {
        // 他の人が名前を変えたらここで検知して画面更新
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
    if ((!newMessage.trim() && !selectedImage) || !nickname.trim() || !roomId) return;

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
      room_id: roomId, nickname, content: newMessage, image_url: imageUrl
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

  // ルーム名変更機能（ホストのみ）
  const updateRoomName = async () => {
    const newName = prompt('新しいルーム名を入力してください', roomName);
    if (newName === null || newName === roomName) return; // キャンセルまたは変更なし
    if (!newName.trim()) { alert('ルーム名は空にできません'); return; }

    const ownerToken = localStorage.getItem(`tamariba_owner_${slug}`);
    if (!roomId || !ownerToken) return;

    const { error } = await supabase
        .from('tm_rooms')
        .update({ name: newName })
        .eq('id', roomId)
        .eq('owner_token', ownerToken);
    
    if (error) {
        alert('変更に失敗しました');
        console.error(error);
    } else {
        setRoomName(newName); // 自分の画面を即時更新
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('URLをコピーしました！');
  };

  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">読み込み中...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white p-3 shadow-sm flex justify-between items-center z-20 relative">
        <div className="flex items-center gap-2 overflow-hidden">
          <button onClick={() => router.push('/')} className="text-gray-400 hover:text-gray-600 px-1">
             &larr;
          </button>
          <div>
            {/* ルーム名表示 */}
            <h1 className="font-bold text-gray-800 text-lg leading-tight truncate max-w-[200px]">{roomName}</h1>
            <p className="text-[10px] text-gray-400 font-mono">ID: {slug}</p>
          </div>
        </div>

        <button onClick={() => setShowMenu(!showMenu)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
        </button>

        {showMenu && (
          <div className="absolute top-14 right-2 w-64 bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 text-center">
              <p className="text-xs text-gray-400 mb-2">招待用QRコード</p>
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${typeof window !== 'undefined' ? window.location.href : ''}`} alt="QR" className="mx-auto mb-2" />
              <button onClick={copyUrl} className="text-blue-600 text-sm font-bold hover:underline">URLをコピー</button>
            </div>
            
            {/* ホストメニュー */}
            {isHost ? (
              <div className="bg-gray-50">
                  <button 
                    onClick={updateRoomName}
                    className="w-full text-left p-4 text-gray-700 text-sm hover:bg-gray-100 font-medium flex items-center gap-2 border-b border-gray-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    ルーム名を変更
                  </button>
                  <button onClick={deleteRoom} className="w-full text-left p-4 text-red-600 text-sm hover:bg-red-50 font-bold flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    このルームを削除
                  </button>
              </div>
            ) : (
                <div className="p-3 text-xs text-gray-400 text-center bg-gray-50">管理者メニュー（権限なし）</div>
            )}
          </div>
        )}
      </header>

      {/* チャットエリアとフォームは変更なし */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" onClick={() => setShowMenu(false)}>
        {messages.map((msg) => (
          <div key={msg.id} className="bg-white p-3 rounded-lg shadow-sm max-w-[85%] ml-0">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs font-bold text-blue-600">{msg.nickname}</span>
              <span className="text-[10px] text-gray-400">{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            {msg.content && <div className="text-gray-800 break-words whitespace-pre-wrap mb-2">{msg.content}</div>}
            {msg.image_url && (
              <div className="mt-1">
                {isImageExpired(msg.created_at) ? (
                  <div className="bg-gray-100 p-6 rounded text-xs text-gray-400 border border-dashed border-gray-300 flex items-center justify-center">🚫 画像は期限切れです</div>
                ) : (
                   // eslint-disable-next-line @next/next/no-img-element
                  <img src={msg.image_url} alt="posted" className="rounded-md max-h-60 object-contain bg-gray-50" />
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white p-4 border-t border-gray-200">
        <form onSubmit={sendMessage} className="flex flex-col gap-2 max-w-screen-md mx-auto">
          <input type="text" placeholder="ニックネーム" value={nickname} onChange={(e) => setNickname(e.target.value)} className="text-sm p-2 border border-gray-300 rounded w-1/3 focus:outline-none focus:border-blue-500" required />
          {selectedImage && (
            <div className="flex items-center gap-2 bg-blue-50 p-2 rounded text-sm text-blue-800">
              <span>📷 画像選択中</span>
              <button type="button" onClick={() => { setSelectedImage(null); if(fileInputRef.current) fileInputRef.current.value=''; }} className="text-gray-500">✕</button>
            </div>
          )}
          <div className="flex gap-2 items-center">
            <label className="cursor-pointer p-2 text-gray-500 hover:bg-gray-100 rounded-full">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => { if (e.target.files?.[0]) setSelectedImage(e.target.files[0]); }} />
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
            </label>
            <input type="text" placeholder="メッセージ..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
            <button type="submit" disabled={(!newMessage && !selectedImage) || !nickname || isUploading} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold disabled:opacity-50">
              {isUploading ? '...' : '送信'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}