'use client';

import { useRouter } from 'next/navigation';

type Props = {
  roomName: string;
  slug: string;
  showMenu: boolean;
  setShowMenu: (show: boolean) => void;
};

export default function Header({ roomName, slug, showMenu, setShowMenu }: Props) {
  const router = useRouter();

  return (
    <header className="bg-white px-4 py-3 shadow-sm flex justify-between items-center z-20 shrink-0 relative">
      <div className="flex items-center gap-3 overflow-hidden">
        <button onClick={() => router.push('/')} className="text-gray-400 hover:text-gray-600 p-1 -ml-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="flex flex-col">
          <h1 className="font-bold text-gray-800 text-base leading-tight truncate max-w-[180px] sm:max-w-xs">
            {roomName}
          </h1>
          <p className="text-[10px] text-gray-400 font-mono leading-none mt-0.5">ID: {slug}</p>
        </div>
      </div>

      <button
        onClick={() => setShowMenu(!showMenu)}
        className="bg-gray-50 p-2 rounded-full hover:bg-gray-200 text-gray-600 active:bg-gray-200 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>
    </header>
  );
}