import React, { useState } from 'react';
import { Dice5, MousePointerClick, TimerReset, CheckCircle2, RefreshCw, Sparkles, Layers } from 'lucide-react';

interface Props {
  mode: 'random' | 'manual' | null;
  selected: number[];
  secondsLeft: number;
  locked: boolean;
  onMode: (mode: 'random' | 'manual') => void;
  onToggle: (number: number) => void;
  onConfirm: () => void;
  maxNumber?: number;
  packCount: 1 | 5;
  completedPacks: number[][];
  onPackCount: (n: 1 | 5) => void;
  onUnlockSelection?: () => void;
  onSaveAllPacks?: (packs: number[][]) => void;
}

export const FiveNumberPicker: React.FC<Props> = ({
  mode,
  selected,
  secondsLeft,
  locked,
  onMode,
  onToggle,
  onConfirm,
  packCount,
  completedPacks,
  onPackCount,
  onUnlockSelection,
  onSaveAllPacks,
  maxNumber = 90
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);

  // Helper to pick 5 unique numbers
  const generateRandomFive = (existing: number[] = []): number[] => {
    const pool = Array.from({ length: maxNumber }, (_, i) => i + 1);
    // shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const chosen = [...existing];
    for (const n of pool) {
      if (chosen.length >= 5) break;
      if (!chosen.includes(n)) chosen.push(n);
    }
    return chosen.sort((a, b) => a - b);
  };

  const handleRandomAll = () => {
    onMode('random');
    if (onSaveAllPacks) {
      const all: number[][] = [];
      for (let i = 0; i < packCount; i++) {
        all.push(generateRandomFive());
      }
      onSaveAllPacks(all);
    }
  };

  const currentPackIndex = completedPacks.length;

  return (
    <section className="rounded-xl bg-[#271308] border-2 border-amber-600 p-4 text-amber-100 shadow-xl" aria-label="Chọn bộ số lô tô">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-3 border-b border-amber-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-yellow-400" />
            <h3 className="font-black text-lg text-yellow-300 font-pixel tracking-wide uppercase">
              CHỌN 5 SỐ CỦA BẠN
            </h3>
          </div>
          <p className="text-xs text-amber-200/80 mt-0.5">
            Chọn đúng 5 số cho một vé lô tô.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!locked ? (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono font-bold text-xs ${
              secondsLeft <= 10 ? 'border-red-500 bg-red-950/80 text-red-300 animate-pulse' : 'border-amber-700 bg-black/40 text-amber-300'
            }`}>
              <TimerReset className="h-4 w-4" />
              <span>Chốt sau: {secondsLeft}s</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-500 bg-emerald-950/80 text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="h-4 w-4" /> Đã chốt 5 số
              </span>
              {onUnlockSelection && (
                <button
                  type="button"
                  onClick={onUnlockSelection}
                  className="px-2.5 py-1.5 rounded border border-amber-600 bg-amber-900/60 hover:bg-amber-800 text-amber-200 text-xs font-bold cursor-pointer"
                >
                  ✏ Đổi lại
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {!locked && (
        <>
          {/* Quick Choice Buttons: Random vs Manual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={handleRandomAll}
              className={`rounded-lg border p-3 text-xs sm:text-sm font-bold flex justify-center gap-2 items-center cursor-pointer transition-all ${
                mode === 'random'
                  ? 'bg-amber-500 border-yellow-300 text-black shadow-md'
                  : 'bg-[#381f12] border-amber-800 hover:bg-[#482918] text-amber-100'
              }`}
            >
              <Dice5 className="h-5 w-5" />
              <span>Bốc ngẫu nhiên 5 số</span>
            </button>
            <button
              type="button"
              onClick={() => onMode('manual')}
              className={`rounded-lg border p-3 text-xs sm:text-sm font-bold flex justify-center gap-2 items-center cursor-pointer transition-all ${
                mode === 'manual'
                  ? 'bg-amber-500 border-yellow-300 text-black shadow-md'
                  : 'bg-[#381f12] border-amber-800 hover:bg-[#482918] text-amber-100'
              }`}
            >
              <MousePointerClick className="h-5 w-5" />
              <span>Tự chọn từng bộ 5 số</span>
            </button>
          </div>

          {/* If 5 packs: Show sets summary chips */}
          {packCount === 5 && completedPacks.length > 0 && (
            <div className="mb-3 p-2.5 rounded-lg bg-black/40 border border-amber-900/60 flex flex-col gap-1.5 text-xs">
              <span className="font-bold text-yellow-300">Các bộ số đã chọn ({completedPacks.length}/5):</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {completedPacks.map((pack, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[#331c10] px-2 py-1 rounded border border-amber-800/80">
                    <span className="font-bold text-amber-400">Bộ {idx + 1}:</span>
                    <span className="font-mono text-amber-100 font-bold">
                      {pack.map(n => String(n).padStart(2, '0')).join(' · ')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual Picking Area */}
          {mode === 'manual' && (
            <div className="mt-2 bg-black/30 p-3 rounded-lg border border-amber-800">
              <div className="flex justify-between items-center mb-2 text-xs sm:text-sm">
                <div>
                  <span className="font-bold text-amber-200">
                    {packCount === 5 ? `Đang chọn Bộ ${currentPackIndex + 1} / 5` : 'Chọn 5 số cho vé của bạn'}:
                  </span>{' '}
                  <strong className="text-yellow-300 font-mono text-base">{selected.length}/5 số</strong>
                </div>
                <div className="text-amber-300 font-mono text-xs sm:text-sm font-bold">
                  {selected.length > 0 ? selected.map(n => String(n).padStart(2, '0')).join(' · ') : '(Chưa chọn số)'}
                </div>
              </div>

              {/* Number Grid 1-90 */}
              <div
                className="grid grid-cols-10 gap-1 sm:gap-1.5 max-h-60 overflow-y-auto p-1.5 rounded bg-black/40 border border-amber-900/70"
                aria-label="Bảng chọn số 1-90"
              >
                {Array.from({ length: maxNumber }, (_, i) => i + 1).map(n => {
                  const isSelected = selected.includes(n);
                  return (
                    <button
                      type="button"
                      key={n}
                      aria-pressed={isSelected}
                      onClick={() => onToggle(n)}
                      disabled={!isSelected && selected.length >= 5}
                      className={`rounded aspect-square text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-400 text-black border-2 border-yellow-200 font-black scale-105 shadow-md'
                          : 'bg-[#3b2314] text-amber-200 hover:bg-[#52331f] border border-amber-900'
                      } disabled:opacity-30 disabled:cursor-not-allowed`}
                    >
                      {String(n).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>

              {/* Confirm / Next Pack Button */}
              <button
                type="button"
                disabled={selected.length !== 5}
                onClick={onConfirm}
                className="mt-3 w-full rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white border-2 border-emerald-400 py-2.5 px-4 font-black text-sm uppercase tracking-wider transition-all disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer shadow-lg"
              >
                {currentPackIndex + 1 === packCount
                  ? `✓ CHỐT TẤT CẢ ${packCount} BỘ SỐ`
                  : `✓ CHỐT BỘ ${currentPackIndex + 1} / ${packCount} ➔ CHỌN BỘ KẾ TIẾP`}
              </button>
            </div>
          )}

          <p className="text-[11px] mt-2 text-amber-300/70 italic text-center">
            Sau {packCount === 5 ? '120' : '30'} giây, nếu chưa chốt hệ thống sẽ tự động bốc ngẫu nhiên đủ 5 số cho bạn.
          </p>
        </>
      )}

      {/* Locked Confirmation Banner */}
      {locked && (
        <div className="bg-emerald-950/60 border border-emerald-600 rounded-lg p-3 text-emerald-200 text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-bold text-emerald-300 mb-1">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span>Đã khóa bộ số thành công ({packCount} bộ vé)!</span>
          </div>
          <p className="text-emerald-200/80 text-xs">
            Bấm nút <strong>&quot;BẮT ĐẦU VÁN CHƠI&quot;</strong> bên dưới để thưởng thức nhạc dạo mở màn và vào vòng kêu số.
          </p>
        </div>
      )}
    </section>
  );
};
