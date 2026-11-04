import React from 'react';
import { MatchRecord, loadMatchHistory } from './historyStore';
import { RetroWindow } from '../../components/ui/RetroWindow';
import { History, Award, CheckCircle2, XCircle } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const history: MatchRecord[] = loadMatchHistory();

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3">
      <div className="w-full max-w-lg">
        <RetroWindow
          title="NHẬT KÝ CHIẾU LÔ TÔ - LỊCH SỬ VÁN ĐẤU"
          icon="📜"
          onClose={onClose}
        >
          {history.length === 0 ? (
            <div className="bg-white p-8 border border-[#808080] win98-box-inset text-center text-stone-500 text-xs italic">
              <History className="w-8 h-8 text-stone-400 mx-auto mb-2 opacity-50" />
              Chưa có lịch sử ván đấu nào được ghi lại. Hãy hoàn thành ván chơi đầu tiên của bạn!
            </div>
          ) : (
            <div className="bg-white border border-[#808080] win98-box-inset max-h-80 overflow-y-auto divide-y divide-stone-200">
              {history.map((rec) => {
                const dateStr = new Date(rec.timestamp).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: '2-digit',
                  month: '2-digit'
                });

                return (
                  <div key={rec.id} className="p-2.5 hover:bg-stone-50 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        {rec.isUserWinner ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            BẠN KINH THẮNG!
                          </span>
                        ) : (
                          <span className="text-stone-700 flex items-center gap-1">
                            <XCircle className="w-4 h-4 text-rose-500" />
                            {rec.winnerName} Đã Kinh
                          </span>
                        )}
                        <span className="text-[10px] text-stone-500 font-normal">
                          ({rec.gameMode === 'offline_bot' ? 'Ngoại tuyến AI' : 'Online Bạn Bè'})
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {dateStr}
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-600 flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>Đã bốc: <b className="font-mono text-stone-800">{rec.totalBallsCalled}</b> quả bi</span>
                      <span>Bi chốt kinh: <b className="font-mono text-rose-600">Số {rec.lastBallNumber}</b></span>
                      <span>Thưởng: <b className="text-amber-700 font-mono">+{rec.expEarned} EXP</b> · <b className="text-yellow-700 font-mono">+{rec.coinsEarned} Xu</b></span>
                    </div>

                    {rec.winningRow && rec.winningRow.length > 0 && (
                      <div className="mt-1 pt-1 border-t border-dashed border-stone-200 text-[10px] text-stone-500 flex items-center gap-1">
                        <span>Hàng trúng:</span>
                        <div className="flex gap-1 font-mono font-bold text-amber-900">
                          {rec.winningRow.map((n) => (
                            <span key={n} className="bg-amber-100 px-1 rounded border border-amber-300">
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-2 text-right text-[11px] text-stone-500 italic">
            Tự động lưu lại trên trình duyệt và thiết bị của bạn.
          </div>
        </RetroWindow>
      </div>
    </div>
  );
};
