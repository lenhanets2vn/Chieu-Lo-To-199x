import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { canSpinToday, millisecondsUntilNextDay, spinGuardKey } from './dailySpin';
import { reserveCloudDailySpin } from './cloudDailySpin';
import { PlayerProfile } from './progressionTypes';
import { addExpAndRewards, saveProfile } from './progressionStore';
import { audioSynthesizer } from '../audio/audioSynthesizer';
import { RetroButton } from '../../components/ui/RetroButton';
import { X, Sparkles, Clock, Coins, Zap, Trophy, HelpCircle } from 'lucide-react';

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onUpdateProfile: (newProfile: PlayerProfile) => void;
}

export interface WheelSegment {
  id: string;
  label: string;
  sublabel: string;
  type: 'coins' | 'exp' | 'jackpot';
  coins: number;
  exp: number;
  icon: string;
  color: string;
  textColor: string;
}

const SEGMENTS: WheelSegment[] = [
  { id: 'seg_1', label: '+200 Xu', sublabel: 'Túi Tiền Đồng', type: 'coins', coins: 200, exp: 0, icon: '🪙', color: '#047857', textColor: '#ffffff' },
  { id: 'seg_2', label: '+150 EXP', sublabel: 'Tay Dò Lão Luyện', type: 'exp', coins: 0, exp: 150, icon: '⚡', color: '#1d4ed8', textColor: '#ffffff' },
  { id: 'seg_3', label: '+500 Xu', sublabel: 'Bao Lì Xì Đỏ', type: 'coins', coins: 500, exp: 0, icon: '🧧', color: '#b91c1c', textColor: '#fef08a' },
  { id: 'seg_4', label: '+300 EXP', sublabel: 'Bí Kíp So Số', type: 'exp', coins: 0, exp: 300, icon: '📜', color: '#7e22ce', textColor: '#ffffff' },
  { id: 'seg_5', label: '+100 Xu', sublabel: 'Tiền Quà Bánh', type: 'coins', coins: 100, exp: 0, icon: '🍬', color: '#d97706', textColor: '#ffffff' },
  { id: 'seg_6', label: '+800 Xu', sublabel: 'Đại Phú Hào 9x', type: 'coins', coins: 800, exp: 0, icon: '💰', color: '#0f766e', textColor: '#fef08a' },
  { id: 'seg_7', label: '+500 EXP', sublabel: 'Thần Cơ Diệu Toán', type: 'exp', coins: 0, exp: 500, icon: '🔮', color: '#be123c', textColor: '#ffffff' },
  { id: 'seg_8', label: 'JACKPOT!', sublabel: '+1500 Xu & +500 EXP', type: 'jackpot', coins: 1500, exp: 500, icon: '🏆', color: '#eab308', textColor: '#78350f' }
];

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile
}) => {
  const [rotation, setRotation] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wonPrize, setWonPrize] = useState<WheelSegment | null>(null);
  const [bulbState, setBulbState] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const spinAnimationRef = useRef<number | null>(null);
  const reservationInFlightRef = useRef(false);
  const [isReserving, setIsReserving] = useState(false);
  const lastTickAngleRef = useRef<number>(0);

  // Check if daily spin is available
  const lastGuard = Number(localStorage.getItem(spinGuardKey(profile.id)) || 0);
  const lastSpin = Math.max(profile.lastDailySpinTime || 0, lastGuard);
  const canFreeSpin = canSpinToday(lastSpin);

  // Countdown timer calculation
  useEffect(() => {
    if (!lastSpin) {
      setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const diff = canSpinToday(lastSpin) ? 0 : millisecondsUntilNextDay();
      setTimeRemaining(diff > 0 ? diff : 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastSpin]);

  // Alternating light bulbs effect
  useEffect(() => {
    const bulbInterval = setInterval(() => {
      setBulbState(prev => !prev);
    }, isSpinning ? 120 : 500);

    return () => clearInterval(bulbInterval);
  }, [isSpinning]);

  if (!isOpen) return null;

  const formatCountdown = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startSpin = async () => {
    if (isSpinning || reservationInFlightRef.current || !canFreeSpin) return;
    reservationInFlightRef.current = true;
    setIsReserving(true);
    let reservedAt: number;
    try {
      reservedAt = await reserveCloudDailySpin(profile.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Không xác nhận được lượt quay với Firebase.');
      reservationInFlightRef.current = false;
      setIsReserving(false);
      return;
    }
    reservationInFlightRef.current = false;
    setIsReserving(false);
    localStorage.setItem(spinGuardKey(profile.id), String(reservedAt));
    setIsSpinning(true);
    setWonPrize(null);

    // Pick a random segment (weighted: jackpot is 6%, big rewards 10%, others distributed)
    const rand = Math.random();
    let winningIndex = 0;
    if (rand < 0.06) {
      winningIndex = 7; // JACKPOT
    } else if (rand < 0.16) {
      winningIndex = 5; // +800 xu
    } else if (rand < 0.28) {
      winningIndex = 2; // +500 xu
    } else if (rand < 0.42) {
      winningIndex = 6; // +500 exp
    } else if (rand < 0.58) {
      winningIndex = 3; // +300 exp
    } else if (rand < 0.74) {
      winningIndex = 1; // +150 exp
    } else if (rand < 0.88) {
      winningIndex = 0; // +200 xu
    } else {
      winningIndex = 4; // +100 xu
    }

    const selectedPrize = SEGMENTS[winningIndex];

    // Calculate target rotation
    // Each segment is 45 degrees.
    // 0 deg is at top (12 o'clock).
    // Segment i occupies [i * 45, (i + 1) * 45]. Center is (i + 0.5) * 45.
    const segmentAngle = 360 / SEGMENTS.length;
    const targetSegmentCenter = (winningIndex + 0.5) * segmentAngle;
    
    // Slight random deviation inside the slice (±12 deg)
    const jitter = (Math.random() - 0.5) * 24;
    
    const targetAngleAtPointer = (targetSegmentCenter + jitter + 360) % 360;
    const neededAngleMod360 = (360 - targetAngleAtPointer + 360) % 360;

    const currentMod360 = (rotation % 360 + 360) % 360;
    let forwardAngle = (neededAngleMod360 - currentMod360 + 360) % 360;
    if (forwardAngle < 90) forwardAngle += 360; // Ensure handsome spinning distance

    const fullSpins = 6 * 360; // 6 full revolutions
    const totalRotationTarget = rotation + fullSpins + forwardAngle;

    const startTime = performance.now();
    const duration = 4600; // 4.6 seconds of smooth nostalgic deceleration
    const startAngle = rotation;

    lastTickAngleRef.current = startAngle;

    // Cubic bezier ease-out approximation: 1 - Math.pow(1 - t, 3.2)
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3.4);

      const currentRotation = startAngle + (totalRotationTarget - startAngle) * easeOut;
      setRotation(currentRotation);

      // Play mechanical tick sound every segment boundary crossed
      if (Math.abs(currentRotation - lastTickAngleRef.current) >= segmentAngle * 0.85) {
        audioSynthesizer.playWheelTick();
        lastTickAngleRef.current = currentRotation;
      }

      if (progress < 1) {
        spinAnimationRef.current = requestAnimationFrame(animate);
      } else {
        // Spin finished!
        setIsSpinning(false);
        setWonPrize(selectedPrize);

        {
          // Play fanfare win audio
          audioSynthesizer.playWheelWin();

          // Award Coins & EXP to profile
          const { updatedProfile, leveledUp } = addExpAndRewards(
            profile,
            selectedPrize.exp,
            selectedPrize.coins,
            false, false
          );
          updatedProfile.lastDailySpinTime = reservedAt;
          onUpdateProfile(updatedProfile);
          saveProfile(updatedProfile);

          // Confetti celebration
          confetti({
            particleCount: selectedPrize.type === 'jackpot' ? 140 : 80,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#FFD700', '#FF1744', '#00E676', '#FFFFFF']
          });

          if (leveledUp) {
            setTimeout(() => {
              alert(`Chúc mừng! Bạn đã thăng lên CẤP ${updatedProfile.level}!`);
            }, 900);
          }
        }
      }
    };

    spinAnimationRef.current = requestAnimationFrame(animate);
  };

  const numBulbs = 18;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-lg bg-[#241308] border-4 border-yellow-500 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-amber-50">
        
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-red-900 via-amber-800 to-red-900 px-4 py-3 border-b-2 border-yellow-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl animate-spin" style={{ animationDuration: '6s' }}>🎡</span>
            <div>
              <h2 className="font-pixel text-xl sm:text-2xl font-black text-yellow-300 tracking-wider uppercase leading-none">
                VÒNG QUAY MAY MẮN 199x
              </h2>
              <span className="text-[11px] text-amber-200/90 font-medium">
                Vận đỏ hội chợ · Nhận Xu & Kinh Nghiệm miễn phí mỗi ngày
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSpinning}
            className="p-1 rounded bg-black/40 hover:bg-black/60 text-amber-300 hover:text-white transition cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex flex-col items-center">
          
          {/* Status & Daily Indicator */}
          <div className="w-full mb-3 flex items-center justify-between px-3 py-1.5 rounded-lg bg-black/40 border border-amber-700/60 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-yellow-400 font-bold">Số dư hiện tại:</span>
              <span className="font-mono text-yellow-300 font-black">{profile.coins.toLocaleString()} Xu</span>
              <span className="text-amber-400">·</span>
              <span className="font-mono text-cyan-300 font-black">{profile.currentExp} EXP</span>
            </div>

            {canFreeSpin ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-600/30 border border-emerald-500 text-emerald-300 font-bold text-[11px] animate-pulse">
                <Sparkles className="w-3 h-3" />
                1 LƯỢT QUAY MIỄN PHÍ
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-600 text-amber-300 text-[11px] font-mono">
                <Clock className="w-3 h-3 text-amber-400" />
                Quay lại sau: <b className="text-yellow-300">{formatCountdown(timeRemaining)}</b>
              </span>
            )}
          </div>

          {/* THE LUCKY WHEEL STAGE */}
          <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] my-2 select-none flex items-center justify-center">
            
            {/* Outer Flashing Bulbs Ring */}
            <div className="absolute inset-0 rounded-full border-4 border-yellow-600 shadow-[0_0_35px_rgba(245,158,11,0.35)] bg-[#190903] flex items-center justify-center">
              {Array.from({ length: numBulbs }).map((_, i) => {
                const angle = (i * 360) / numBulbs;
                const isLit = (i % 2 === 0) ? bulbState : !bulbState;
                const rad = (angle * Math.PI) / 180;
                // position near outer rim
                const r = 138; // px on 280-320
                const x = Math.cos(rad) * r;
                const y = Math.sin(rad) * r;

                return (
                  <div
                    key={i}
                    className={`absolute w-3 h-3 rounded-full border transition-all duration-150 ${
                      isLit
                        ? 'bg-yellow-300 border-yellow-100 shadow-[0_0_8px_#fde047]'
                        : 'bg-red-700 border-red-900 opacity-60'
                    }`}
                    style={{
                      transform: `translate(${x}px, ${y}px)`
                    }}
                  />
                );
              })}
            </div>

            {/* Pointer Flapper at Top (12 o'clock) */}
            <div className="absolute -top-3 z-30 flex flex-col items-center filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.8)]">
              <div className="w-7 h-9 bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-600 clip-pointer rounded-t-sm border border-yellow-200"
                style={{
                  clipPath: 'polygon(50% 100%, 0% 0%, 100% 0%)'
                }}
              />
              <div className="w-3 h-3 -mt-9 rounded-full bg-red-600 border border-yellow-300 shadow" />
            </div>

            {/* Rotating Wheel SVG */}
            <div
              className="relative w-[250px] h-[250px] sm:w-[280px] sm:h-[280px] rounded-full overflow-hidden shadow-inner border-2 border-yellow-500/80"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'none' : 'transform 0.1s ease-out'
              }}
            >
              <svg viewBox="0 0 300 300" className="w-full h-full">
                <defs>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="1" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.8" />
                  </filter>
                </defs>

                {SEGMENTS.map((seg, i) => {
                  const angle = 360 / SEGMENTS.length;
                  const startAngle = i * angle;
                  const endAngle = (i + 1) * angle;

                  // SVG Arc calculation
                  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
                    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
                    return {
                      x: cx + r * Math.cos(angleInRadians),
                      y: cy + r * Math.sin(angleInRadians)
                    };
                  };

                  const start = polarToCartesian(150, 150, 150, endAngle);
                  const end = polarToCartesian(150, 150, 150, startAngle);
                  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

                  const d = [
                    'M', 150, 150,
                    'L', start.x, start.y,
                    'A', 150, 150, 0, largeArcFlag, 0, end.x, end.y,
                    'Z'
                  ].join(' ');

                  const midAngle = startAngle + angle / 2;

                  return (
                    <g key={seg.id}>
                      {/* Segment Slice */}
                      <path
                        d={d}
                        fill={seg.color}
                        stroke="#fef08a"
                        strokeWidth="1.5"
                      />

                      {/* Segment Text and Icon */}
                      <g transform={`rotate(${midAngle}, 150, 150)`}>
                        <text
                          x="150"
                          y="42"
                          fill={seg.textColor}
                          fontSize="13"
                          fontWeight="900"
                          fontFamily="sans-serif"
                          textAnchor="middle"
                          filter="url(#shadow)"
                        >
                          {seg.label}
                        </text>
                        <text
                          x="150"
                          y="64"
                          fontSize="18"
                          textAnchor="middle"
                        >
                          {seg.icon}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Center Spinning Hub Button */}
            <button
              onClick={() => startSpin()}
              disabled={isSpinning || isReserving || !canFreeSpin}
              className={`absolute z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-yellow-300 shadow-2xl flex flex-col items-center justify-center cursor-pointer transition transform active:scale-95 ${
                canFreeSpin && !isSpinning
                  ? 'bg-gradient-to-tr from-red-700 via-yellow-500 to-amber-300 hover:scale-105'
                  : 'bg-neutral-800 border-neutral-600 opacity-90 cursor-not-allowed'
              }`}
            >
              <span className="text-xl sm:text-2xl font-black text-red-950 font-pixel tracking-wider drop-shadow">
                QUAY
              </span>
              <span className="text-[9px] font-bold text-red-950/90 uppercase tracking-tighter -mt-1">
                {canFreeSpin ? 'MIỄN PHÍ' : 'ĐÃ QUAY'}
              </span>
            </button>
          </div>

          {/* Winning Announcement Card */}
          {wonPrize && (
            <div className="w-full mt-3 p-3 bg-gradient-to-r from-amber-950/80 via-yellow-950/90 to-amber-950/80 border-2 border-yellow-400 rounded-xl text-center shadow-lg animate-[zoomIn_0.2s_ease-out]">
              <div className="text-2xl mb-1">{wonPrize.icon}</div>
              <h3 className="font-pixel text-lg sm:text-xl font-black text-yellow-300 uppercase tracking-wide">
                XIN CHÚC MỪNG! BẠN ĐÃ TRÚNG:
              </h3>
              <div className="font-black text-lg text-white font-mono my-1">
                {wonPrize.label}
              </div>
              <p className="text-xs text-amber-200">
                {`Đã cộng thưởng vào hồ sơ: ${wonPrize.coins > 0 ? `+${wonPrize.coins} Xu` : ''} ${wonPrize.exp > 0 ? `+${wonPrize.exp} EXP` : ''}`}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full mt-4 flex flex-col sm:flex-row gap-2.5 justify-center">
            {!canFreeSpin && <div className="rounded-lg bg-stone-700 text-stone-200 px-5 py-3 font-bold text-center">Hết lượt hôm nay</div>}

            <RetroButton
              size="md"
              variant="default"
              onClick={onClose}
              disabled={isSpinning}
              className="w-full sm:w-auto"
            >
              Đóng Lại
            </RetroButton>
          </div>

          {/* Instruction Note */}
          <p className="text-[11px] text-amber-300/70 text-center mt-3 flex items-center justify-center gap-1">
            <HelpCircle className="w-3 h-3 shrink-0" />
            Mỗi người chơi chỉ được quay 1 lần mỗi ngày. Cơ hội rinh Jackpot 1500 Xu & 500 EXP!
          </p>
        </div>
      </div>
    </div>
  );
};
