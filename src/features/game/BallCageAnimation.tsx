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
  } else if (gameStatus === 'PAUSED') {
    stateText = '⏸ Tạm dừng phát nhạc';
  } else if (gameStatus === 'GAME_OVER') {
    stateText = '🎺 Ván chơi kết thúc';
  } else if (isSingingSong) {
    stateText = audioLabel || '🎶 Gánh hát đang hò số bí mật... (Số sẽ mở 1 giây trước khi đổi bài)';
  } else if (audioLabel) {
    stateText = audioLabel;
  }

  return (
    <section className="bg-[#190e09] border border-amber-700/70 rounded-xl p-3 sm:p-4 text-amber-100 shadow-lg" aria-label="Bảng lịch sử số lô tô và sóng nhạc">
      {/* Top Bar with Counters & Volume Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-900/60 pb-3">
        <div className="flex items-center gap-2 text-amber-300">
          <Radio className="h-5 w-5 text-yellow-400 animate-pulse" />
          <h2 className="text-base sm:text-xl font-bold tracking-wide font-pixel uppercase">
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
      <div className="grid grid-cols-1 lg:grid-cols-[165px_1fr] gap-3 pt-3">
        {/* Number Badge */}
        <div className="rounded-xl border-2 border-amber-700/80 bg-gradient-to-b from-[#2a1608] to-[#1c0d05] min-h-32 flex flex-col items-center justify-center p-3 text-center shadow-inner">
          <span className="text-[11px] text-amber-300 font-extrabold uppercase tracking-wider">
            SỐ VỪA KÊU
          </span>
          <div
            key={lastCalled ?? 'none'}
            className={`text-5xl sm:text-6xl font-black font-pixel tabular-nums leading-none my-2 text-yellow-300 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)] ${
              lastCalled !== null ? 'animate-[numberAppear_0.3s_ease-out]' : ''
            }`}
          >
            {lastCalled === null ? '—' : String(lastCalled).padStart(2, '0')}
          </div>
          <span className="text-[10px] text-amber-300/80 font-medium">
            {lastCalled === null ? 'Đang chờ hò số...' : 'Mở 1s trước khi hết câu'}
          </span>
        </div>

        {/* Called Numbers History List */}
        <div className="flex flex-col min-w-0 rounded-xl border border-amber-800/80 bg-[#221209] p-3 shadow-inner">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-xs text-yellow-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span>📋</span>
              <span>LỊCH SỬ GỌI SỐ (THEO THỨ TỰ HÒ THỰC TẾ)</span>
            </p>
            <span className="text-[11px] font-mono text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-amber-900">
              {calledHistory.length}/90 số
            </span>
          </div>

          <div
            ref={historyRef}
            className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2 content-start overflow-y-auto max-h-[170px] min-h-[85px] pr-1 p-1 bg-[#a91f1d] rounded-lg border-2 border-[#f4cc7d]"
            aria-live="polite"
            aria-label="Các số đã được hò và hiện trên màn hình"
          >
            {calledHistory.length === 0 ? (
              <span className="text-xs text-amber-300/60 italic p-2">
                Chưa có số nào được gọi. Nhạc dạo và bài hò sẽ phát trước khi mở số đầu tiên đúng 1 giây trước khi đổi bài.
              </span>
            ) : (
              calledHistory.map((number, index) => {
                const isLatest = index === calledHistory.length - 1;
                return (
                  <span
                    key={`${index}-${number}`}
                    className={`aspect-square rounded-full border-[3px] flex items-center justify-center font-black text-base sm:text-lg tabular-nums transition-all ${
                      isLatest
                        ? 'bg-[#bee7ac] border-[#1b8f73] text-[#166955] ring-2 ring-yellow-400/60 font-black scale-105 shadow-md'
                        : 'bg-[#fff1b4] text-[#b52231] border-[#e0a05b] hover:border-[#f7ca73]'
                    }`}
                    title={`Lượt gọi thứ ${index + 1}: số ${number}`}
                  >
                    {String(number).padStart(2, '0')}
                  </span>
                );
              })
            )}
          </div>

        </div>
      </div>

      {/* Audio Spectrum & Live Status */}
      <div className="mt-3 px-3 py-2 rounded-lg border border-amber-900/60 bg-[#120b08] flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs text-amber-300 font-semibold">
          <Music2 className={`h-4 w-4 text-yellow-400 ${audioActive ? 'animate-pulse' : ''}`} />
          <span className="truncate">{stateText}</span>
          {isSingingSong && (
            <span className="ml-auto text-[11px] text-amber-400/80 font-mono hidden sm:inline">
              ⚡ Số mở trước 1.0 giây
            </span>
          )}
        </div>

      </div>
    </section>
  );
};
