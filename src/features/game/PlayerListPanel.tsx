import React, { useState } from 'react';
import { PlayerState } from './types';
import { getCharacterById } from '../characters/characterData';
import { Users, Crown, Bot, Sparkles, Search } from 'lucide-react';

interface PlayerListPanelProps {
  players: PlayerState[];
  calledSet: Set<number>;
  userPlayerId: string;
}

export const PlayerListPanel: React.FC<PlayerListPanelProps> = ({
  players,
  calledSet,
  userPlayerId
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Tính trạng thái dò vé của từng người chơi
  const getPlayerProgress = (player: PlayerState) => {
    if (player.hasKinh) {
      return { status: 'ĐÃ KINH CHIẾN THẮNG!', badgeColor: 'bg-rose-600 text-white animate-pulse', priority: 0 };
    }

    let minMissing = 5;
    for (const ticket of player.tickets) {
      for (const row of ticket.grid) {
        const nums = row.filter(c => c.value !== null).map(c => c.value as number);
        if (nums.length === 5) {
          const missing = nums.filter(n => !calledSet.has(n)).length;
          if (missing < minMissing) {
            minMissing = missing;
          }
        }
      }
    }

    if (minMissing === 1) {
      return { status: 'Chờ 1 con là KINH!', badgeColor: 'bg-amber-500 text-amber-950 font-black ring-1 ring-yellow-300 animate-pulse', priority: 1 };
    }
    if (minMissing === 2) {
      return { status: 'Chờ 2 con nữa...', badgeColor: 'bg-yellow-200 text-yellow-950 font-bold', priority: 2 };
    }
    if (minMissing === 3) {
      return { status: 'Đã trúng 2 số', badgeColor: 'bg-stone-200 text-stone-700', priority: 3 };
    }
    return { status: 'Đang lắng nghe hò...', badgeColor: 'bg-stone-100 text-stone-500', priority: 4 };
  };

  const filteredPlayers = players.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#f0f0f0] border-2 border-[#808080] win98-box p-1 text-black flex flex-col h-full font-sans text-xs select-none">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1.5 flex items-center justify-between font-bold rounded-t-sm shadow-inner">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-yellow-300" />
          <span className="tracking-tight font-pixel text-sm uppercase">
            BẠN CHƠI TRONG CHIẾU ({players.length} TAY DÒ)
          </span>
        </div>
        <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded font-mono text-emerald-300">
          ● Sẵn Sàng
        </span>
      </div>

      {/* Search Bar */}
      <div className="p-1 bg-[#d4d0c8] border-b border-[#808080] flex items-center gap-1">
        <Search className="w-3.5 h-3.5 text-stone-600 shrink-0 ml-1" />
        <input
          type="text"
          placeholder="Tìm tên bạn chơi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-[#808080] px-2 py-0.5 text-xs text-black outline-none win98-box-inset font-sans"
        />
      </div>

      {/* Players List Grid */}
      <div className="flex-1 bg-white border border-[#808080] p-1.5 overflow-y-auto space-y-1.5 win98-box-inset max-h-[360px]">
        {filteredPlayers.length === 0 ? (
          <div className="text-center text-stone-400 py-6 text-xs italic">
            Không tìm thấy bạn chơi nào khớp với từ khóa.
          </div>
        ) : (
          filteredPlayers.map((player, index) => {
            const isUser = player.id === userPlayerId;
            const char = getCharacterById(player.characterId);
            const progress = getPlayerProgress(player);

            return (
              <div
                key={player.id}
                className={`p-1.5 border rounded flex items-center justify-between gap-2 transition-colors ${
                  isUser
                    ? 'bg-amber-100/90 border-amber-500 shadow-sm'
                    : 'bg-stone-50 hover:bg-stone-100 border-stone-200'
                }`}
              >
                {/* Left: Avatar & Nickname */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[10px] text-stone-400 w-4 text-center shrink-0">
                    {index + 1}
                  </span>

                  <div className="w-7 h-7 rounded-full overflow-hidden border border-amber-600 shrink-0 bg-stone-800 shadow-sm">
                    {char.avatar ? (
                      <img
                        src={char.avatar}
                        alt={char.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-amber-600 text-white">
                        {player.name[0]}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className={`font-bold text-xs truncate ${isUser ? 'text-blue-900' : 'text-stone-900'}`}>
                        {player.name}
                      </span>
                      {isUser && (
                        <span className="text-[9px] bg-blue-600 text-white px-1 rounded font-bold shrink-0">
                          Bạn
                        </span>
                      )}
                      {player.isHost && (
                        <span title="Chủ Chiếu"><Crown className="w-3 h-3 text-amber-600 shrink-0" /></span>
                      )}
                      {player.isBot && (
                        <span title="Khách Chiếu"><Bot className="w-3 h-3 text-stone-400 shrink-0" /></span>
                      )}
                    </div>
                    <div className="text-[10px] text-stone-500 truncate">
                      {char.name}
                    </div>
                  </div>
                </div>

                {/* Right: Ticket Progress Status */}
                <div className="shrink-0 text-right">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded shadow-sm inline-block ${progress.badgeColor}`}>
                    {progress.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer count summary */}
      <div className="bg-[#d4d0c8] px-2 py-1 border-t border-[#808080] flex items-center justify-between text-[10px] text-stone-600 font-mono">
        <span>TAY DÒ TRONG CHIẾU: {players.length}</span>
        <span>HỘI CHIẾU XUÂN</span>
      </div>
    </div>
  );
};
