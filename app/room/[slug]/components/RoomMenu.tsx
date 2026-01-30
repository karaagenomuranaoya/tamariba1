'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type Props = {
  slug: string;
  roomId: string;
  isHost: boolean;
  roomName: string;
  setRoomName: (name: string) => void;
  onClose: () => void;
};

export default function RoomMenu({ slug, roomId, isHost, roomName, setRoomName, onClose }: Props) {
  const router = useRouter();
  const [isCopied, setIsCopied] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const updateRoomName = async () => {
    const newName = prompt('新しいルーム名を入力してください', roomName);
    if (newName === null || newName === roomName) return;
    if (!newName.trim()) {
      alert('ルーム名は空にできません');
      return;
    }

    const ownerToken = localStorage.getItem(`tamariba_owner_${slug}`);
    if (!roomId || !ownerToken) return;

    const { error } = await supabase
      .from('tm_rooms')
      .update({ name: newName })
      .eq('id', roomId)
      .eq('owner_token', ownerToken);

    if (error) console.error(error);
    else setRoomName(newName);
  };

  const deleteRoom = async () => {
    if (!confirm('本当に削除しますか？\n（復元できません）')) return;
    const ownerToken = localStorage.getItem(`tamariba_owner_${slug}`);
    if (!roomId || !ownerToken) return;
    const { error } = await supabase.from('tm_rooms').delete().eq('id', roomId).eq('owner_token', ownerToken);
    if (!error) {
      localStorage.removeItem(`tamariba_owner_${slug}`);
      router.push('/');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-20 bg-black/10" onClick={onClose}></div>
      <div className="absolute top-14 right-2 w-72 bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 z-30">
        <div className="p-5 border-b border-gray-100 text-center">
          <p className="text-xs text-gray-400 mb-3">招待用QRコード</p>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${typeof window !== 'undefined' ? window.location.href : ''}`}
            alt="QR"
            className="mx-auto mb-4 w-32 h-32"
          />

          <button
            onClick={copyUrl}
            className={`w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              isCopied ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            {isCopied ? 'コピーしました' : 'URLをコピー'}
          </button>
        </div>

        {isHost ? (
          <div className="bg-gray-50">
            <button
              onClick={updateRoomName}
              className="w-full text-left p-4 text-gray-700 text-sm hover:bg-gray-100 font-medium flex items-center gap-3 border-b border-gray-100"
            >
              {/* アイコン省略（必要なら元のコードからコピーしてください） */}
              <span className="flex-1">ルーム名を変更</span>
            </button>
            <button
              onClick={deleteRoom}
              className="w-full text-left p-4 text-red-600 text-sm hover:bg-red-50 font-bold flex items-center gap-3"
            >
              <span className="flex-1">このルームを削除</span>
            </button>
          </div>
        ) : (
          <div className="p-3 text-xs text-gray-400 text-center bg-gray-50">管理者メニュー（権限なし）</div>
        )}
      </div>
    </>
  );
}