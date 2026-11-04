import React, { useEffect, useRef } from 'react';
import { speechCaller } from './speechCaller';

/** Real spectral visualization of the current soundpack recording. No fake voice/audio. */
export function AudioSpectrum({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let animation = 0;
    const data = new Uint8Array(128);
    const paint = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      const analyser = active ? speechCaller.getAnalyser() : null;
      if (analyser) analyser.getByteFrequencyData(data);
      else data.fill(0);
      const bars = 64;
      const step = width / bars;
      const gap = Math.max(1, step * 0.32);
      for (let i = 0; i < bars; i++) {
        const freq = Math.floor(2 + (i / bars) * (i / bars) * 119);
        const amplitude = data[freq] / 255;
        const bar = Math.max(2, amplitude * (height - 5));
        ctx.fillStyle = i % 8 === 0 ? '#facc15' : '#d97706';
        ctx.fillRect(i * step + gap / 2, (height - bar) / 2, step - gap, bar);
      }
      if (active) animation = requestAnimationFrame(paint);
    };
    paint();
    return () => cancelAnimationFrame(animation);
  }, [active]);
  return <canvas ref={canvasRef} width={720} height={54} role="img" aria-label="Sóng âm theo nhạc hò đang phát" className="h-14 w-full" />;
}
