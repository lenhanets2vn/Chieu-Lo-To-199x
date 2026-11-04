import React from 'react';
import type { LotoTicket } from './types';

interface LotoTicketViewProps {
  ticket: LotoTicket;
  calledNumbers: Set<number>;
  activeMarkerIcon: string;
  activeMarkerName?: string;
  activeTicketSkinId?: string;
  highlightNumber?: number | null;
}

/** Five-number vintage fairground ticket. Called numbers use the player's actual equipped marker. */
export const LotoTicketView: React.FC<LotoTicketViewProps> = ({
  ticket, calledNumbers, activeMarkerIcon, activeMarkerName,
  activeTicketSkinId = 'classic_yellow', highlightNumber
}) => {
  const numbers = ticket.grid.flat().filter(c => c.value !== null).map(c => c.value as number).slice(0, 5);
  const matched = numbers.filter(n => calledNumbers.has(n)).length;
  const ready = numbers.length === 5 && matched === 5;
  const palette = (() => {
    switch (activeTicketSkinId) {
      case 'pink_rose': return { card: 'bg-[#ffdaea] border-[#b83e6d] text-[#9b2450]', header: 'bg-[#a42d65] border-[#85224f]', chip: 'bg-[#fff0f4] border-[#c66391]' };
      case 'retro_cyan': return { card: 'bg-[#ccf1e9] border-[#287a74] text-[#165e60]', header: 'bg-[#226d68] border-[#164f4d]', chip: 'bg-[#f2fff5] border-[#2d8776]' };
      case 'newspaper': return { card: 'bg-[#e3decf] border-[#665d4c] text-[#514939]', header: 'bg-[#5e5445] border-[#453b31]', chip: 'bg-[#f4f1e8] border-[#776d5e]' };
      case 'ticket_royal_rare': return { card: 'bg-[#fff0c2] border-[#9d5428] text-[#683a16]', header: 'bg-[#864e2e] border-[#593010]', chip: 'bg-[#fff7dd] border-[#a96b2d]' };
      default: return { card: 'bg-[#ffe8a6] border-[#b63324] text-[#8c211c]', header: 'bg-[#196d59] border-[#16523e]', chip: 'bg-[#fff1bd] border-[#c84b31]' };
    }
  })();
  return (
    <section className={`${palette.card} rounded-xl border-[3px] px-2.5 sm:px-4 py-3 shadow-[0_3px_0_#8b4513] outline outline-1 outline-offset-[-7px] outline-dashed outline-[#cb8b55]`}
      aria-label="Vé lô tô một hàng năm số">
      <div className="flex justify-between items-center gap-2 mb-3">
        <div className="min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-wider opacity-75">VÉ LÔ TÔ HỘI CHỢ</span>
          <h3 className={`${palette.header} text-center border-2 rounded-full text-[#fff2c8] font-black text-sm sm:text-lg px-3 py-1 tracking-wide`}>
            BỘ SỐ CỦA BẠN
          </h3>
        </div>
        <span className={`rounded-md border px-2 py-1 font-black text-sm shrink-0 ${ready ? 'bg-green-700 text-white border-green-900' : 'bg-[#fff0bf] text-[#7b311c] border-[#c69140]'}`}>{matched}/5</span>
      </div>
      <div className="grid grid-cols-5 gap-1 sm:gap-2.5 items-center w-full" role="list" aria-label="5 số tự chọn">
        {numbers.map(n => {
          const checked = calledNumbers.has(n);
          return (
            <div key={n} role="listitem"
              aria-label={`Số ${n}${checked ? ` đã được đánh dấu bằng ${activeMarkerName || 'hạt đánh dấu'}` : ' chưa được gọi'}`}
              className={`aspect-square min-w-0 w-full rounded-full relative flex justify-center items-center border-[3px] sm:border-4 shadow-[0_3px_0_#8b4513] ${checked ? 'bg-[#ccebbb] border-[#2d6a4f] text-[#176449]' : `${palette.chip} text-[#a92e2f]`} ${highlightNumber === n ? 'ring-2 ring-amber-500' : ''}`}>
              <span className="font-black text-[clamp(12px,3.8vw,28px)] leading-none tabular-nums">{String(n).padStart(2,'0')}</span>
              {checked && <span title={activeMarkerName || 'Hạt đánh dấu đã trang bị'} aria-hidden="true"
                className="absolute -bottom-1.5 -right-1 z-10 flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-full border border-[#9a622f] bg-[#fff6d7] text-sm sm:text-base shadow-sm">{activeMarkerIcon}</span>}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] font-semibold opacity-85">
        Hạt đang dùng: <span className="font-bold">{activeMarkerIcon} {activeMarkerName || 'Hột Bắp Khô'}</span>. Số trúng tự được đánh dấu.
      </p>
      {ready && <p className="mt-1 text-sm font-black text-emerald-800">✓ Đã đủ 5 số — BẤM KINH!</p>}
    </section>
  );
};
