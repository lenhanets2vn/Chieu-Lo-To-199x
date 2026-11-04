import React from 'react';

export interface FloatingEmoteItem {
  id: string;
  senderName: string;
  emoji: string;
  label: string;
  xPercent: number; // 15% to 85% horizontal placement
  createdAt: number;
}

interface FloatingEmoteCanvasProps {
  emotes: FloatingEmoteItem[];
}

export const FloatingEmoteCanvas: React.FC<FloatingEmoteCanvasProps> = ({ emotes }) => {
  if (!emotes.length) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-40 overflow-hidden"
      aria-hidden="true"
    >
      {emotes.map((item) => (
        <div
          key={item.id}
          className="absolute bottom-12 flex flex-col items-center animate-float-up opacity-0"
          style={{
            left: `${item.xPercent}%`,
            animation: 'floatingRise 2.8s cubic-bezier(0.2, 0.8, 0.3, 1) forwards'
          }}
        >
          {/* Sender Nickname Badge */}
          <span className="text-[10px] bg-black/75 text-amber-200 px-2 py-0.5 rounded-full border border-amber-600/80 font-mono shadow mb-1 whitespace-nowrap">
            {item.senderName}
          </span>
          {/* Big Floating Emoji */}
          <span className="text-4xl sm:text-5xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] transform hover:scale-125 transition-transform">
            {item.emoji}
          </span>
        </div>
      ))}
      <style>{`
        @keyframes floatingRise {
          0% {
            transform: translateY(0) scale(0.6);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translateY(-40px) scale(1.15);
          }
          30% {
            transform: translateY(-90px) scale(1.0);
          }
          60% {
            opacity: 0.95;
            transform: translateY(-220px) translateX(12px) scale(1.05);
          }
          85% {
            opacity: 0.6;
            transform: translateY(-360px) translateX(-10px) scale(0.95);
          }
          100% {
            opacity: 0;
            transform: translateY(-480px) scale(0.8);
          }
        }
      `}</style>
    </div>
  );
};
