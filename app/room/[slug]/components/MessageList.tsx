'use client';

import { useEffect, useRef } from 'react';
import { Message } from '../types';

type Props = {
  messages: Message[];
  onImageClick: (url: string) => void;
  onCloseMenu: () => void;
};

// ユーティリティ: 画像の期限切れ判定
const isImageExpired = (createdAt: string) => {
  const created = new Date(createdAt).getTime();
  return new Date().getTime() - created > 24 * 60 * 60 * 1000;
};

export default function MessageList({ messages, onImageClick, onCloseMenu }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div
      className="flex-1 overflow-y-auto p-3 space-y-4 bg-slate-50 scroll-smooth"
      onClick={onCloseMenu}
    >
      {messages.map((msg) => (
        <div key={msg.id} className="flex flex-col items-start max-w-[90%]">
          <div className="flex items-baseline gap-2 mb-1 ml-1">
            <span className="text-xs font-bold text-gray-600 truncate max-w-[150px]">
              {msg.nickname}
            </span>
            <span className="text-[10px] text-gray-400">
              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

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
      ))}
      <div ref={messagesEndRef} className="h-2" />
    </div>
  );
}