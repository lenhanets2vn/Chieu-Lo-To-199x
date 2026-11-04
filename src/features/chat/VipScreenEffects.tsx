import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface VipScreenEffectsProps {
  activeEffect: string | null;
  onEffectEnd: () => void;
}

export const VipScreenEffects: React.FC<VipScreenEffectsProps> = ({
  activeEffect,
  onEffectEnd
}) => {
  useEffect(() => {
    if (!activeEffect) return;

    if (activeEffect === 'fireworks') {
      const duration = 2500;
      const animationEnd = Date.now() + duration;
      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          clearInterval(interval);
          onEffectEnd();
          return;
        }
        confetti({
          particleCount: 50,
          startVelocity: 30,
          spread: 360,
          origin: {
            x: Math.random(),
            y: Math.random() * 0.5
          }
        });
      }, 250);
      return () => clearInterval(interval);
    } else if (activeEffect === 'hearts') {
      const duration = 2500;
      const end = Date.now() + duration;
      const interval = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(interval);
          onEffectEnd();
          return;
        }
        confetti({
          particleCount: 35,
          shapes: ['circle'],
          colors: ['#ff1493', '#ff69b4', '#ffb6c1', '#e11d48'],
          origin: { x: Math.random(), y: 0.9 }
        });
      }, 200);
      return () => clearInterval(interval);
    } else if (activeEffect === 'piggy_coins') {
      confetti({
        particleCount: 150,
        spread: 100,
        colors: ['#ffd700', '#ffae00', '#f59e0b', '#fffbeb'],
        origin: { y: 0.2 }
      });
      const timer = setTimeout(onEffectEnd, 2000);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(onEffectEnd, 2000);
      return () => clearTimeout(timer);
    }
  }, [activeEffect, onEffectEnd]);

  if (!activeEffect) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
      {activeEffect === 'bomb' && (
        <div className="flex flex-col items-center justify-center animate-[ping_0.8s_ease-out]">
          <span className="text-8xl drop-shadow-2xl">💥</span>
          <span className="text-4xl font-black text-rose-500 font-pixel mt-2 bg-black/80 px-4 py-1 rounded border-2 border-yellow-300">
            BOOM!! BOM NỔ ĐẶT BOM 9x!
          </span>
        </div>
      )}

      {activeEffect === 'dragon' && (
        <div className="absolute w-full flex items-center justify-center animate-[bounce_1.5s_infinite]">
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-rose-600 text-white font-black font-pixel text-2xl px-6 py-3 rounded-full border-4 border-yellow-200 shadow-2xl">
            <span className="text-5xl">🐉</span>
            <span>HỎA LONG XUẤT THẾ - PHÁT TÀI PHÁT LỘC!</span>
            <span className="text-5xl">✨</span>
          </div>
        </div>
      )}

      {activeEffect === 'crown' && (
        <div className="flex flex-col items-center justify-center animate-[zoomIn_0.5s_ease-out]">
          <span className="text-8xl drop-shadow-2xl animate-bounce">👑</span>
          <span className="text-3xl font-black text-yellow-300 font-pixel mt-2 bg-black/80 px-5 py-1.5 rounded-full border-2 border-yellow-400">
            VƯƠNG MIỆN HOÀNG GIA HỘI CHỢ!
          </span>
        </div>
      )}

      {activeEffect === 'guitar_notes' && (
        <div className="flex items-center gap-3 text-6xl animate-pulse">
          <span>🎸</span>
          <span className="text-5xl animate-bounce">🎵</span>
          <span className="text-4xl animate-bounce delay-100">🎶</span>
          <span className="text-5xl animate-bounce delay-200">🎼</span>
        </div>
      )}
    </div>
  );
};
