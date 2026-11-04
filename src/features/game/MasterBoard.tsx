import React, { useState } from 'react';
import { getRhymeForNumber } from '../audio/lotoRhymes';

interface MasterBoardProps {
  calledNumbers: Set<number>;
  lastNumber: number | null;
  maxNumber?: number;
}

export const MasterBoard: React.FC<MasterBoardProps> = ({
  calledNumbers,
  lastNumber,
  maxNumber = 99
}) => {
  const [filter, setFilter] = useState<'all' | 'called' | 'uncalled'>('all');
  const [inspectedNum, setInspectedNum] = useState<number | null>(null);

  const numbers = Array.from({ length: maxNumber }, (_, i) => i + 1);

  const inspectedRhyme = inspectedNum ? getRhymeForNumber(inspectedNum) : null;

  return (
    <div className="bg-[#120a06] border-2 border-[#854d0e] rounded-lg p-2.5 shadow-md text-amber-50">
      {/* Header with stats and filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-amber-900/60">
        <div className="flex items-center gap-1.5">
          <span className="text-base">📋</span>
          <span className="font-bold text-xs uppercase tracking-wider text-amber-300 font-pixel text-sm">
            BẢNG ĐIỀU KHIỂN TỔNG DUYỆT 1 - {maxNumber}
          </span>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded border border-amber-900/70 text-[11px]">
          <button
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
              filter === 'all' ? 'bg-amber-600 text-white font-bold' : 'text-amber-200/70 hover:text-white'
            }`}
          >
            Tất cả ({maxNumber})
          </button>
          <button
            onClick={() => setFilter('called')}
            className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
              filter === 'called' ? 'bg-amber-600 text-white font-bold' : 'text-amber-200/70 hover:text-white'
            }`}
          >
            Đã kêu ({calledNumbers.size})
          </button>
          <button
            onClick={() => setFilter('uncalled')}
            className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
              filter === 'uncalled' ? 'bg-amber-600 text-white font-bold' : 'text-amber-200/70 hover:text-white'
            }`}
          >
            Chưa kêu ({maxNumber - calledNumbers.size})
          </button>
        </div>
      </div>

      {/* 10-Column Grid */}
      <div className="grid grid-cols-10 gap-1 sm:gap-1.5 font-mono text-center">
        {numbers.map((num) => {
          const isCalled = calledNumbers.has(num);
          const isLatest = lastNumber === num;

          if (filter === 'called' && !isCalled) return null;
          if (filter === 'uncalled' && isCalled) return null;

          return (
            <button
              key={num}
              onClick={() => setInspectedNum(inspectedNum === num ? null : num)}
              className={`relative rounded p-1 sm:p-1.5 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isLatest
                  ? 'bg-rose-600 text-white shadow-lg ring-2 ring-yellow-400 scale-105 z-10 animate-pulse'
                  : isCalled
                  ? 'bg-amber-500 text-amber-950 font-black shadow-inner border border-amber-300'
                  : 'bg-[#201209] text-stone-500 border border-stone-800/80 hover:border-amber-700/60 hover:text-stone-300'
              }`}
              title={`Số ${num} - Bấm để xem câu hò`}
            >
              <span>{num < 10 ? `0${num}` : num}</span>
              {isLatest && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-yellow-300"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Rhyme inspect popup bar */}
      {inspectedRhyme && (
        <div className="mt-2.5 p-2 bg-[#2a1708] border border-amber-600 rounded text-xs flex items-center justify-between gap-2 animate-fadeIn">
          <div className="min-w-0">
            <span className="font-bold text-yellow-400 font-pixel text-sm mr-2">
              [Số {inspectedRhyme.number}] {inspectedRhyme.intro}:
            </span>
            <span className="italic text-amber-100/90 text-[11px]">
              "{inspectedRhyme.rhyme}"
            </span>
            <span className="ml-2 font-bold text-rose-400 font-pixel">
              👉 {inspectedRhyme.callOut}
            </span>
          </div>
          <button
            onClick={() => setInspectedNum(null)}
            className="text-stone-400 hover:text-white px-1.5 text-xs shrink-0 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
