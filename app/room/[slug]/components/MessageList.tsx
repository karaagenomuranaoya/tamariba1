'use client';

import { useEffect, useRef } from 'react';
import { Message } from '../types';

type Props = {
  messages: Message[];
  onImageClick: (url: string) => void;
  onReplyClick: (message: Message) => void; // 追加
  onCloseMenu: () => void;
};

const isImageExpired = (createdAt: string) => {
  const created = new Date(createdAt).getTime();
  return new Date().getTime() - created > 24 * 60 * 60 * 1000;
};

export default function MessageList({ messages, onImageClick, onReplyClick, onCloseMenu }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 親メッセージ（トップレベルの投稿）のみを抽出して表示
  const rootMessages = messages.filter((m) => !m.parent_id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [rootMessages.length]); // rootMessagesの変更でスクロール

  // 特定のメッセージに対する返信数をカウントする関数
  const getReplyCount = (parentId: string) => {
    return messages.filter((m) => m.parent_id === parentId).length;
  };

  return (
    <div
      className="flex-1 overflow-y-auto p-3 space-y-4 bg-slate-50 scroll-smooth"
      onClick={onCloseMenu}
    >
      {rootMessages.map((msg) => {
        const replyCount = getReplyCount(msg.id);
        
        return (
          <div key={msg.id} className="group flex flex-col items-start max-w-[95%] relative">
            <div className="flex items-baseline gap-2 mb-1 ml-1">
              <span className="text-xs font-bold text-gray-600 truncate max-w-[150px]">
                {msg.nickname}
              </span>
              <span className="text-[10px] text-gray-400">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex items-end gap-2 w-full">
              {/* Message Bubble */}
              <div className="flex-1 min-w-0">
                {msg.content && (
                  <div className="bg-white px-3.5 py-2.5 rounded-2xl rounded-tl-none shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-gray-100 text-[15px] leading-relaxed text-gray-800 break-words whitespace-pre-wrap">
                    {msg.content}
                  </div>
                )}

                {msg.image_url && (
                  <div className={`ml-1 ${msg.content ? 'mt-1.5' : 'mt-0'}`}>
                    {isImageExpired(msg.created_at) ? (
                      <div className="bg-gray-100 p-4 rounded text-[10px] text-gray-400 border border-dashed border-gray-300">
                        🚫 画像期限切れ
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={msg.image_url}
                        alt="posted"
                        onClick={() => onImageClick(msg.image_url!)}
                        className="rounded-xl border border-gray-100 max-h-60 object-contain bg-white cursor-pointer hover:opacity-95 transition-opacity"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Reply Button (右側にちょろっと矢印) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReplyClick(msg);
                }}
                className="shrink-0 mb-1 p-1.5 rounded-full text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors flex items-center gap-1"
                aria-label="返信"
              >
                 {replyCount > 0 ? (
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-blue-500">{replyCount}</span>
                         {/* 返信ありの場合: 青色で目立たせる */}
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-blue-400">
                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm.53 5.47a.75.75 0 00-1.06 0l-3 3a.75.75 0 000 1.06l3 3a.75.75 0 101.06-1.06l-1.72-1.72h5.69c1.19 0 2.155.877 2.244 2.036l.006.104V15a.75.75 0 001.5 0v-1.11c0-1.884-1.428-3.447-3.262-3.633l-.159-.007H10.81l1.72-1.72a.75.75 0 000-1.06z" clipRule="evenodd" />
                        </svg>
                    </div>
                 ) : (
                    // 返信なしの場合: グレーで控えめに
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 -scale-x-100">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                    </svg>
                 )}
              </button>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} className="h-2" />
    </div>
  );
}