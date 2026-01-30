'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Message } from '../types';

type Props = {
  roomId: string;
  parentMessage: Message;
  allMessages: Message[]; // 全メッセージからリプライを抽出して表示
  onClose: () => void;
};

const DEFAULT_NICKNAME = 'からあげ';

export default function ReplyModal({ roomId, parentMessage, allMessages, onClose }: Props) {
  const [nickname, setNickname] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // この親メッセージに対する返信のみを抽出
  const replies = allMessages.filter((m) => m.parent_id === parentMessage.id);

  // 最新の返信が見えるようにスクロール
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [replies.length]);

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || isSending) return;

    setIsSending(true);
    const finalNickname = nickname.trim() || DEFAULT_NICKNAME;

    await supabase.from('tm_messages').insert([
      {
        room_id: roomId,
        nickname: finalNickname,
        content: replyContent,
        parent_id: parentMessage.id, // 親IDを指定
      },
    ]);

    setReplyContent('');
    setIsSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-sm font-bold text-gray-700">返信スレッド</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Thread Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white" ref={scrollRef}>
          {/* 親メッセージ（少し強調） */}
          <div className="pl-2 border-l-4 border-gray-200">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-xs font-bold text-gray-600">{parentMessage.nickname}</span>
              <span className="text-[10px] text-gray-400">
                {new Date(parentMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="text-sm text-gray-800 whitespace-pre-wrap">{parentMessage.content}</div>
            {parentMessage.image_url && (
               <div className="mt-2 text-xs text-gray-400">[画像]</div>
            )}
          </div>

          <div className="border-t border-gray-100 my-2"></div>

          {/* 返信一覧 */}
          {replies.length === 0 ? (
            <div className="text-center text-xs text-gray-400 py-4">まだ返信はありません</div>
          ) : (
            replies.map((msg) => (
              <div key={msg.id} className="flex flex-col items-start">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-bold text-blue-600">{msg.nickname}</span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="bg-blue-50 px-3 py-2 rounded-xl rounded-tl-none text-sm text-gray-800 whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reply Input */}
        <form onSubmit={sendReply} className="p-3 border-t border-gray-100 bg-gray-50">
           <input
            type="text"
            placeholder={`名前 (省略: ${DEFAULT_NICKNAME})`}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="text-xs text-gray-500 bg-transparent placeholder-gray-400 focus:outline-none mb-2 w-full px-1"
          />
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 transition-colors"
              placeholder="返信を入力..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
            <button
              type="submit"
              disabled={!replyContent || isSending}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
            >
              送信
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}