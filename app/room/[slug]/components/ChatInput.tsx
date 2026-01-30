'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_NICKNAME = 'からあげ';

type Props = {
  roomId: string;
};

export default function ChatInput({ roomId }: Props) {
  const [nickname, setNickname] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ★ 追加: マウント時に保存されたニックネームを復元
  useEffect(() => {
    if (roomId) {
      const savedName = localStorage.getItem(`tamariba_nickname_${roomId}`);
      if (savedName) {
        setNickname(savedName);
      }
    }
  }, [roomId]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || !roomId) return;

    // ★ 追加: 送信時にニックネームを保存（空文字の場合もそのまま保存して、次回空欄にする）
    localStorage.setItem(`tamariba_nickname_${roomId}`, nickname);

    const finalNickname = nickname.trim() || DEFAULT_NICKNAME;
    let imageUrl = null;

    if (selectedImage) {
      setIsUploading(true);
      const fileExt = selectedImage.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${roomId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('tm-images').upload(filePath, selectedImage);
      if (uploadError) {
        alert('画像のアップロードに失敗しました');
        setIsUploading(false);
        return;
      }
      
      const { data } = supabase.storage.from('tm-images').getPublicUrl(filePath);
      imageUrl = data.publicUrl;
      setIsUploading(false);
    }

    await supabase.from('tm_messages').insert([
      {
        room_id: roomId,
        nickname: finalNickname,
        content: newMessage,
        image_url: imageUrl,
      },
    ]);

    setNewMessage('');
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  return (
    <div className="bg-white border-t border-gray-200 shrink-0 pb-safe">
      <form onSubmit={sendMessage} className="flex flex-col max-w-screen-md mx-auto">
        {selectedImage && (
          <div className="px-3 pt-3">
            <div className="flex items-center justify-between bg-blue-50 p-2 px-3 rounded-lg text-sm text-blue-800 border border-blue-100">
              <span className="truncate">{selectedImage.name}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-blue-400 hover:text-blue-600 p-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="px-3 pt-2">
          <input
            type="text"
            placeholder={`名前 (省略: ${DEFAULT_NICKNAME})`}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="text-xs text-gray-500 bg-transparent placeholder-gray-400 focus:outline-none focus:text-blue-600 py-1 w-full"
          />
        </div>

        <div className="flex gap-2 items-end px-3 pb-3 pt-1">
          <label className="shrink-0 p-2.5 text-gray-500 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-full cursor-pointer transition-colors mb-0.5">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                if (e.target.files?.[0]) setSelectedImage(e.target.files[0]);
              }}
            />
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </label>

          <textarea
            ref={textareaRef}
            placeholder="メッセージ..."
            value={newMessage}
            rows={1}
            onChange={(e) => {
              setNewMessage(e.target.value);
              adjustTextareaHeight();
            }}
            className="flex-1 p-3 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-base min-h-[44px] max-h-[150px] resize-none overflow-y-auto leading-relaxed"
          />

          <button
            type="submit"
            disabled={(!newMessage && !selectedImage) || isUploading}
            className="shrink-0 bg-blue-600 text-white p-3 rounded-full font-bold shadow-sm active:scale-95 transition-all disabled:opacity-30 disabled:active:scale-100 mb-0.5"
          >
            {isUploading ? (
              <span className="block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 translate-x-0.5 -translate-y-0.5">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}