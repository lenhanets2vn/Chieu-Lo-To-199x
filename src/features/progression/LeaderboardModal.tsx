import React from 'react';
import { PlayerProfile, WeeklyLeaderboardEntry } from './progressionTypes';
import { getWeeklyLeaderboard } from './progressionStore';
import { RetroWindow } from '../../components/ui/RetroWindow';
import { Trophy, Medal, Flame } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  profile
}) => {
  if (!isOpen) return null;

  const entries: WeeklyLeaderboardEntry[] = getWeeklyLeaderboard(profile);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3">
      <div className="w-full max-w-xl">
        <RetroWindow
          title="BẢNG XẾP HẠNG TOÀN CẦU HÀNG TUẦN (TUẦN NÀY)"
          icon="🏆"
          onClose={onClose}
        >
          {/* Header notice */}
          <div className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white p-2 rounded mb-2.5 flex items-center justify-between text-xs shadow-inner">
            <div className="flex items-center gap-1.5 font-bold">
              <Trophy className="w-4 h-4 text-yellow-200" />
              <span>ĐẤU TRƯỜNG LÔ TÔ ĐẠI CHIẾN - TUẦN 44 / 1996</span>
            </div>
            <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded font-mono">
              Reset sau 3 ngày
            </span>
          </div>

          {/* Table */}
          <div className="bg-white border border-[#808080] win98-box-inset max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#d4d0c8] text-stone-800 border-b border-[#808080] font-bold text-[11px]">
                  <th className="p-1.5 text-center w-12">Hạng</th>
                  <th className="p-1.5">Cao Thủ & Danh Hiệu</th>
                  <th className="p-1.5 text-center">Số Lần Kinh</th>
                  <th className="p-1.5 text-center">Tỷ Lệ Thắng</th>
                  <th className="p-1.5 text-right pr-2">Điểm Cúp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 font-sans">
                {entries.map((entry) => {
                  const isUser = entry.playerId === profile.id;

                  const rankBadge = {
                    1: <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-400 text-stone-900 font-black shadow text-[10px]">🥇</span>,
                    2: <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-300 text-stone-900 font-black shadow text-[10px]">🥈</span>,
                    3: <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-700 text-white font-black shadow text-[10px]">🥉</span>
                  }[entry.rank] || <span className="font-mono text-stone-600 font-bold">{entry.rank}</span>;

                  return (
                    <tr
                      key={entry.playerId}
                      className={`hover:bg-amber-50 ${
                        isUser ? 'bg-yellow-100 font-bold text-blue-950' : ''
                      }`}
                    >
                      <td className="p-1.5 text-center font-bold">
                        {rankBadge}
                      </td>
                      <td className="p-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold truncate text-xs">{entry.name}</span>
                          {entry.rank <= 3 && <Flame className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                        </div>
                        <div className="text-[10px] text-stone-500 truncate">
                          {entry.yahooTitle}
                        </div>
                      </td>
                      <td className="p-1.5 text-center font-mono font-bold text-amber-700">
                        {entry.wins}
                      </td>
                      <td className="p-1.5 text-center font-mono text-stone-600">
                        {entry.winRate}%
                      </td>
                      <td className="p-1.5 text-right pr-2 font-mono font-extrabold text-blue-900">
                        {entry.trophies.toLocaleString()} 🏆
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-2 text-right text-[11px] text-stone-600 italic">
            * Phần thưởng top 3 hàng tuần: Danh hiệu Vàng và 5,000 Xu Hội Chợ!
          </div>
        </RetroWindow>
      </div>
    </div>
  );
};
