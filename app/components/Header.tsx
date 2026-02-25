'use client';

type Props = {
  roomName: string;
};

export default function Header({ roomName }: Props) {
  return (
    <header className="bg-white px-4 py-3 shadow-sm flex justify-center items-center z-20 shrink-0 relative border-b border-gray-100">
      <div className="text-center">
        <h1 className="font-bold text-gray-800 text-base sm:text-lg leading-tight truncate max-w-[200px] mx-auto">
          {roomName}
        </h1>
        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
          ずっと残るチャットルーム
        </p>
      </div>
    </header>
  );
}