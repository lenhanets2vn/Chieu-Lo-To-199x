import React, { useEffect, useRef } from 'react';
import { Music2, Play, Radio, Volume2, VolumeX, Volume1 } from 'lucide-react';

interface BallCageAnimationProps {
  currentNumber: number | null;
  isRolling: boolean;
  isIntroPlaying?: boolean;
  isSingingSong?: boolean;
  singingNumber?: number | null;
  totalCalled: number;
  remainingCount: number;
  voiceEnabled: boolean;
  volume?: number;
  onVolumeChange?: (vol: number) => void;
  onToggleVoice: () => void;
  onStartGame?: () => void;
  canStart?: boolean;
  onManualDraw?: () => void;
  isHost: boolean;
  gameStatus: string;
  calledHistory?: number[];
  audioLabel?: string;
  audioActive?: boolean;
}

/** Display-only board. ALL numbers shown here have actually been revealed
 * by the soundpack player; no chant text, TTS or automatic number countdown. */
export const BallCageAnimation: React.FC<BallCageAnimationProps> = ({
  currentNumber,
  isIntroPlaying = false,
  isSingingSong = false,
  totalCalled,
  remainingCount,
  voiceEnabled,
  volume = 0.85,
  onVolumeChange,
  onToggleVoice,
  onStartGame,
  canStart = true,
  isHost,
  gameStatus,
  calledHistory = [],
  audioLabel = '',
  audioActive = false
}) => {
  const historyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const area = historyRef.current;
    if (area) area.scrollTop = area.scrollHeight;
  }, [calledHistory.length]);

  // Last called number from history: stays visible throughout subsequent chanting
  const lastCalled = calledHistory.length ? calledHistory[calledHistory.length - 1] : null;
  const isWaiting = gameStatus === 'WAITING';

  let stateText = 'Sẵn sàng vào hội';
  if (isWaiting) {
    stateText = 'Chiếu hội sẵn sàng — Mời bạn chọn bộ số rồi bấm BẮT ĐẦU VÁN CHƠI';
  } else if (isIntroPlaying) {
    stateText = '🏮 Nhạc mở màn — Chuẩn bị kêu số...';
  } else if (gameStatus === 'GAME_OVER') {
    stateText = '🎺 Ván chơi kết thúc';
  } else if (isSingingSong) {
    stateText = '🎶 Gánh hát đang hò số...';
  }

  return (
    <section className="bg-[#190e09] border border-amber-700/70 rounded-xl p-3 sm:p-4 text-amber-100 shadow-lg" aria-label="Bảng lịch sử số lô tô và sóng nhạc">
      {/* Top Bar with Counters & Volume Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c06e2b] pb-3">
        <div className="flex items-center gap-2 rounded-xl border-4 border-dotted border-[#ffda65] bg-[#995121] p-1.5 text-[#ffe19a]">
          <Radio className="h-5 w-5 text-yellow-400 animate-pulse" />
          <h2 className="rounded-lg bg-[#ffcc24] px-3 py-2 text-sm sm:text-lg font-black tracking-wide font-pixel uppercase text-[#b02025]">
            CÁC SỐ ĐÃ RA
          </h2>
          <span className="rounded bg-amber-900/80 px-2 py-0.5 text-[10px] font-mono text-amber-100 border border-amber-700">
            LÔ TÔ
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-amber-200">
          <span className="bg-black/40 px-2.5 py-1 rounded border border-amber-900">
            ĐÃ KÊU: <b className="text-yellow-300 text-sm">{totalCalled}</b>
          </span>
          <span className="bg-black/40 px-2.5 py-1 rounded border border-amber-900">
            CÒN: <b className="text-yellow-300 text-sm">{remainingCount}</b>
          </span>

          {/* Inline Volume Slider right on the board */}

        </div>
      </div>

      {/* Start Game Action Banner */}
      {isWaiting && isHost && (
        <div className="my-3 bg-gradient-to-r from-[#351a0c] via-[#452310] to-[#351a0c] border-2 border-amber-600 rounded-xl px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xl">
          <div>
            <p className="font-black text-yellow-300 font-pixel text-base">
              CHIẾU HỘI ĐÃ SẴN SÀNG
            </p>
            <p className="text-xs text-amber-200/90 mt-0.5">
              Bấm nút bên cạnh để phát nhạc mở màn, sau đó gánh hát tự động hò từng con số.
            </p>
          </div>
          <button
            type="button"
            disabled={!canStart}
            onClick={onStartGame}
            className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 border-2 border-yellow-300 text-white rounded-lg px-6 py-3 font-black text-sm uppercase tracking-wider cursor-pointer shadow-lg transform hover:scale-102 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play className="h-4 w-4 fill-current text-yellow-200" />
            <span>BẮT ĐẦU VÁN CHƠI</span>
          </button>
        </div>
      )}

      {/* Grid: Last Called Number Display + Full History */}
      <div className="grid grid-cols-1 lg:grid-cols-[135px_1fr] gap-2 pt-2">
        {/* Number Badge */}
        <div className="rounded-xl border-2 border-amber-700/80 bg-gradient-to-b from-[#2a1608] to-[#1c0d05] min-h-24 flex flex-col items-center justify-center p-3 text-center shadow-inner">
          <span className="text-[11px] text-amber-300 font-extrabold uppercase tracking-wider">
            SỐ VỪA KÊU
          </span>
          <div
            key={lastCalled ?? 'none'}
            className={`text-4xl sm:text-5xl font-black font-pixel tabular-nums leading-none my-2 text-yellow-300 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)] ${
              lastCalled !== null ? 'animate-[numberAppear_0.3s_ease-out]' : ''
            }`}
          >
            {lastCalled === null ? '—' : String(lastCalled).padStart(2, '0')}
          </div>
          <span className="text-[10px] text-amber-300/80 font-medium">
            {lastCalled === null ? 'Đang chờ hò số...' : 'Số vừa được hò'}
          </span>
        </div>

        {/* Called Numbers History List */}
        <div className="flex flex-col min-w-0 rounded-xl border border-amber-800/80 bg-[#221209] p-3 shadow-inner">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-xs text-yellow-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span>📋</span>
              <span>LỊCH SỬ GỌI SỐ</span>
            </p>
            <span className="text-[11px] font-mono text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-amber-900">
              {calledHistory.length}/90 số
            </span>
          </div>

          <div
            ref={historyRef}
            className="min-w-0 max-h-28 overflow-y-auto rounded-lg border border-[#f4cc7d] bg-[#a91f1d] px-3 py-2 text-[13px] sm:text-sm font-bold tabular-nums leading-7 text-[#fff1bd]"
            aria-live="polite"
            aria-label="Dãy số đã gọi theo thứ tự"
          >
            {calledHistory.length === 0 ? (
              <span className="text-amber-100/80 italic font-normal">Chưa có số nào được gọi.</span>
            ) : (
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                {calledHistory.map((number, index) => (
                  <span key={`${index}-${number}`} className="inline-flex items-center whitespace-nowrap" title={`Lượt ${index + 1}: số ${number}`}>
                    {index > 0 && <span aria-hidden="true" className="mr-1.5 text-[#ffc774]">-</span>}
                    <span className={index === calledHistory.length - 1 ? 'text-yellow-300' : ''}>
                      {String(number).padStart(2, '0')}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Audio Spectrum & Live Status */}
      <div className="mt-3 px-3 py-2 rounded-lg border border-amber-900/60 bg-[#120b08] flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold">
          <Music2 className={`h-4 w-4 text-yellow-400 ${audioActive ? 'animate-pulse' : ''}`} />
          <span className="truncate">{stateText}</span>

        </div>

      </div>
    </section>
  );
};
