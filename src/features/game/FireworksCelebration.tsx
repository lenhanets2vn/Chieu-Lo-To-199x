import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { audioSynthesizer } from '../audio/audioSynthesizer';

interface FireworksCelebrationProps {
  isWinnerUser?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  decay: number;
  gravity: number;
  flicker: boolean;
}

interface Rocket {
  x: number;
  y: number;
  targetY: number;
  vx: number;
  vy: number;
  color: string;
  trail: { x: number; y: number; alpha: number }[];
  exploded: boolean;
}

const FESTIVAL_COLORS = [
  '#FFD700', // Gold
  '#FF1744', // Red
  '#00E676', // Emerald Green
  '#FF9100', // Neon Orange
  '#D500F9', // Magenta Violet
  '#00E5FF', // Cyan
  '#FFFF00', // Bright Yellow
  '#FF4081', // Pink
  '#FFFFFF'  // Pure White
];

export const FireworksCelebration: React.FC<FireworksCelebrationProps> = ({ isWinnerUser = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    // 1. Play festive firecracker sounds
    audioSynthesizer.playFirecrackerCelebration();
    const soundTimer = setTimeout(() => {
      audioSynthesizer.playFirecrackerCelebration();
    }, 1200);

    // 2. Multi-stage confetti fireworks cannon bursts
    const endCelebrationTime = Date.now() + 6500;
    const confettiColors = ['#ff0055', '#ffbe0b', '#3a86ff', '#8338ec', '#fb5607', '#00f5d4', '#ffffff'];

    const confettiInterval = setInterval(() => {
      const timeLeft = endCelebrationTime - Date.now();
      if (timeLeft <= 0) {
        clearInterval(confettiInterval);
        return;
      }

      const particleCount = 40 * (timeLeft / 6500);

      // Trái bắn chéo lên
      confetti({
        particleCount: Math.floor(particleCount * 0.9),
        angle: 60,
        spread: 70,
        origin: { x: 0.05, y: 0.8 },
        colors: confettiColors,
        shapes: ['circle', 'square', 'star'],
        ticks: 200,
        scalar: 1.1,
        zIndex: 999
      });

      // Phải bắn chéo lên
      confetti({
        particleCount: Math.floor(particleCount * 0.9),
        angle: 120,
        spread: 70,
        origin: { x: 0.95, y: 0.8 },
        colors: confettiColors,
        shapes: ['circle', 'square', 'star'],
        ticks: 200,
        scalar: 1.1,
        zIndex: 999
      });

      // Nếu là người chơi chiến thắng, bắn thêm chùm sao vàng rực ở giữa
      if (isWinnerUser && Math.random() > 0.4) {
        confetti({
          particleCount: 25,
          spread: 100,
          origin: { x: 0.5, y: 0.35 },
          colors: ['#FFD700', '#FFF275', '#FFAA00', '#FFFFFF'],
          shapes: ['star'],
          scalar: 1.3,
          zIndex: 999
        });
      }
    }, 450);

    // 3. HTML5 Canvas Fireworks Physics Simulation
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const rockets: Rocket[] = [];
    const particles: Particle[] = [];

    const createExplosion = (x: number, y: number, baseColor?: string) => {
      const color = baseColor || FESTIVAL_COLORS[Math.floor(Math.random() * FESTIVAL_COLORS.length)];
      const count = isWinnerUser ? 95 : 65;

      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * 5.5 + 1.5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color,
          size: Math.random() * 2.8 + 1.2,
          decay: Math.random() * 0.018 + 0.012,
          gravity: 0.05,
          flicker: Math.random() > 0.5
        });
      }

      // Vòng nhũ vàng lấp lánh ở tâm vụ nổ
      for (let j = 0; j < 25; j++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2.5 + 0.5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: '#FFF275',
          size: 1.5,
          decay: Math.random() * 0.03 + 0.02,
          gravity: 0.02,
          flicker: true
        });
      }
    };

    const launchRocket = (targetX?: number, targetY?: number) => {
      const x = targetX ?? Math.random() * (width * 0.75) + width * 0.125;
      const targetDestY = targetY ?? Math.random() * (height * 0.45) + height * 0.1;
      const startY = height;
      const vy = -(Math.sqrt(2 * 0.18 * (startY - targetDestY)));
      const vx = ((x - (targetX ?? x)) * 0.02) + (Math.random() - 0.5) * 1.5;

      rockets.push({
        x,
        y: startY,
        targetY: targetDestY,
        vx,
        vy,
        color: FESTIVAL_COLORS[Math.floor(Math.random() * FESTIVAL_COLORS.length)],
        trail: [],
        exploded: false
      });
    };

    // Khởi tạo vài phát bắn đầu tiên ngay lập tức
    launchRocket(width * 0.3, height * 0.25);
    launchRocket(width * 0.7, height * 0.28);
    setTimeout(() => launchRocket(width * 0.5, height * 0.2), 300);
    setTimeout(() => launchRocket(width * 0.2, height * 0.35), 600);
    setTimeout(() => launchRocket(width * 0.8, height * 0.32), 900);

    let lastLaunch = Date.now();

    const loop = () => {
      // Làm mờ dần để tạo vệt đuôi pháo sáng mượt mà
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'lighter';

      const now = Date.now();
      // Bắn pháo mới định kỳ
      if (now - lastLaunch > (isWinnerUser ? 380 : 650) && now < endCelebrationTime + 4000) {
        launchRocket();
        lastLaunch = now;
      }

      // Cập nhật tên lửa phóng lên
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.16; // gravity

        r.trail.push({ x: r.x, y: r.y, alpha: 1 });
        if (r.trail.length > 8) r.trail.shift();

        // Vẽ vệt sáng tên lửa phóng
        ctx.beginPath();
        for (let t = 0; t < r.trail.length; t++) {
          const pt = r.trail[t];
          ctx.strokeStyle = r.color;
          ctx.lineWidth = (t / r.trail.length) * 2.8 + 0.5;
          ctx.globalAlpha = (t / r.trail.length) * 0.9;
          if (t === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();

        // Đầu tên lửa phát sáng
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Nổ khi đạt đỉnh hoặc gần target
        if (r.vy >= -0.5 || r.y <= r.targetY) {
          createExplosion(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      // Cập nhật hạt pháo hoa nổ bung
      for (let j = particles.length - 1; j >= 0; j--) {
        const p = particles[j];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.98;
        p.vy *= 0.98;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(j, 1);
          continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.flicker && Math.random() > 0.4 ? p.alpha * 0.4 : p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Vầng hào quang nhẹ quanh hạt
        if (p.size > 2) {
          ctx.globalAlpha = p.alpha * 0.25;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    // Cho phép người dùng chạm/bấm bất kỳ chỗ nào để kích nổ thêm pháo hoa
    const handleCanvasClick = (e: MouseEvent) => {
      createExplosion(e.clientX, e.clientY);
    };
    window.addEventListener('click', handleCanvasClick);

    return () => {
      clearInterval(confettiInterval);
      clearTimeout(soundTimer);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('click', handleCanvasClick);
    };
  }, [isWinnerUser]);

  return (
    <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Biểu ngữ pháo hoa rực rỡ lấp lánh trên đỉnh màn hình */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 bg-yellow-400/90 text-red-950 font-black rounded-full border-2 border-yellow-200 shadow-xl shadow-yellow-500/40 text-xs md:text-sm animate-bounce tracking-wide select-none">
        <span>🎆</span>
        <span>PHÁO HOA RỰC RỠ KHAI HỘI CHÚC MỪNG CHIẾN THẮNG</span>
        <span>🎇</span>
      </div>
    </div>
  );
};
