import React from 'react';
import type { LotoTicket } from './types';
import { Check } from 'lucide-react';

interface LotoTicketViewProps {
  ticket: LotoTicket;
  calledNumbers: Set<number>;
  activeMarkerIcon: string;
  highlightNumber?: number | null;
}

/** Chỉ xem: người chơi KHÔNG THỂ đánh dấu tay. Số gọi được xác nhận mới sáng. */
export const LotoTicketView: React.FC<LotoTicketViewProps> = ({ ticket, calledNumbers, activeMarkerIcon, highlightNumber }) => {
  const numbers = ticket.grid.flat().filter(c => c.value !== null).map(c => c.value as number);
  const matched = numbers.filter(n => calledNumbers.has(n)).length;
  const ready = numbers.length === 5 && matched === 5;
  return (
    <section className="bg-[#ffe8a6] border-4 border-[#b63324] rounded-2xl p-3 sm:p-6 text-[#8c211c] shadow-lg outline outline-2 outline-offset-[-9px] outline-dashed outline-[#c96a49]" aria-label="Bộ 5 số lô tô của bạn">
      <div className="flex justify-between items-center gap-2 mb-4 px-2">
        <div>
          <div className="text-xs uppercase tracking-widest font-bold text-amber-900/70">VÉ LÔ TÔ HỘI CHỢ</div>
          <h3 className="font-black text-xl sm:text-2xl bg-[#196d59] border-2 border-[#16523e] rounded-full px-4 py-1 text-[#ffe7a4] text-center tracking-wide">BỘ SỐ CỦA BẠN</h3>
        </div>
        <span className={`px-3 py-1 rounded-lg font-black border text-lg ${ready ? 'bg-green-600 text-white border-green-800' : 'bg-amber-200 text-amber-900 border-amber-400'}`}>
          {matched}/5
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
        {numbers.map(n => {
          const checked = calledNumbers.has(n);
          return (
            <div key={n} aria-label={`Số ${n}, ${checked ? 'đã được gọi và tự động đánh dấu' : 'chưa được gọi'}`}
              className={`aspect-square min-h-0 flex flex-col items-center justify-center rounded-full border-[3px] sm:border-4 font-black shadow-[0_3px_0_#9e4c23] relative select-none ${checked ? 'bg-[#bce7a4] text-[#14734f] border-[#22855e] shadow-inner' : 'bg-[#fff1bd] text-[#bd302e] border-[#d39843]'} ${highlightNumber === n ? 'ring-4 ring-cyan-400' : ''}`}>
              <span className="font-black text-xl sm:text-3xl tabular-nums">{String(n).padStart(2, '0')}</span>
              {checked && <span className="absolute -top-2 -right-1 bg-green-600 text-white rounded-full p-1" title={`Đã đánh dấu tự động ${activeMarkerIcon}`}><Check className="w-4 h-4" /></span>}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-amber-800/80 font-semibold">Hệ thống tự đánh dấu khi hò ra số. Bạn không cần và không thể đánh dấu thủ công.</p>
      {ready && <p className="mt-2 font-black text-green-700 animate-pulse">✓ Đã đủ 5 số — có thể bấm KINH NGAY!</p>}
    </section>
  );
};
