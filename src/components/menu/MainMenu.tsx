import { canSpinToday } from '../../features/progression/dailySpin';
import heroStage from '../../assets/images/loto_retro_stage_hero_1793699559466.jpg';
import React from 'react';
import { PlayerProfile } from '../../features/progression/progressionTypes';
import { getCharacterById } from '../../features/characters/characterData';
import { RetroButton } from '../ui/RetroButton';
import { 
  Play, 
  Users, 
  ShoppingBag, 
  Trophy, 
  History as HistoryIcon, 
  Sparkles,
  MessageSquare,
  LogIn
} from 'lucide-react';

interface MainMenuProps {
  profile: PlayerProfile;
  onQuickPlay: () => void;
  onOpenRoomModal: () => void;
  onOpenCharacters: () => void;
  onOpenShop: () => void;
  onOpenLeaderboard: () => void;
  onOpenHistory: () => void;
  onOpenAuth: () => void;
  onOpenLuckyWheel: () => void;
  onOpenWorldChat: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  profile,
  onQuickPlay,
  onOpenRoomModal,
  onOpenCharacters,
  onOpenShop,
  onOpenLeaderboard,
  onOpenHistory,
  onOpenAuth,
  onOpenLuckyWheel,
  onOpenWorldChat
}) => {
  const char = getCharacterById(profile.characterId);
  const canFreeSpin = canSpinToday(profile.lastDailySpinTime);

  return (
    <div className="relative min-h-[600px] flex-1 flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      {/* Background Hero Stage Image with Dark Scrim */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 scale-105 filter blur-[1px]"
        style={{ backgroundImage: `url('${heroStage}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#180a04]/90 via-[#180a04]/80 to-[#120703]/95" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-xl flex flex-col items-center">
        {/* User Profile Bar */}
        <div className="w-full bg-[#241308]/90 border-2 border-amber-600 rounded-xl p-3 mb-4 shadow-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-400 shrink-0 bg-stone-900 shadow">
              {char.avatar ? (
                <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xl bg-amber-700 text-white">
                  {profile.displayName[0]}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-yellow-300 truncate">
                  {profile.displayName}
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40 font-mono">
                  Cấp {profile.level}
                </span>
              </div>
              <div className="text-xs text-amber-200/80 font-medium">
                {char.name} · <b className="text-yellow-400 font-mono">{profile.coins.toLocaleString()} Xu Hội Chợ</b>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <RetroButton size="sm" variant="default" onClick={onOpenAuth} icon={<LogIn className="w-3.5 h-3.5" />}>
              Tài Khoản / Đổi Tên
            </RetroButton>
          </div>
        </div>

        {/* Title Lockup */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-600 text-red-200 text-xs font-bold uppercase tracking-wider mb-2 shadow">
            <span>🏮</span>
            <span>GÁNH HÁT LÔ TÔ DÂN GIAN · XUÂN HOÀI NIỆM 199x</span>
            <span>🏮</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-yellow-300 font-pixel tracking-wider drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)]">
            CHIẾU LÔ TÔ HỘI CHỢ
          </h1>
          <p className="text-xs sm:text-sm text-amber-200/90 italic mt-1 max-w-lg leading-relaxed">
            Rộn ràng điệu lý câu hò gánh hát xưa. Mời bà con chọn chiếu, so từng con số và đón chờ khoảnh khắc hô vang câu KINH giật giải!
          </p>
        </div>

        {/* Primary Action Buttons: 2 Clear Modes */}
        <div className="w-full flex flex-col gap-3 mb-4">
          {/* OFFLINE MODE: Player presses start when ready */}
          <button
            onClick={onQuickPlay}
            className="w-full bg-gradient-to-r from-[#991b1b] via-[#c2410c] to-[#b45309] hover:from-[#b91c1c] hover:to-[#d97706] text-white p-4 rounded-xl shadow-2xl cursor-pointer flex items-center justify-between gap-4 group transition-all transform hover:-translate-y-0.5 border-3 border-yellow-300"
          >
            <div className="flex items-center gap-3.5 text-left">
              <span className="text-4xl p-2 bg-black/40 rounded-lg group-hover:scale-110 transition-transform">
                🎲
              </span>
              <div>
                <div className="font-black text-base sm:text-xl font-pixel tracking-wide text-yellow-200 uppercase">
                  VÀO CHIẾU CHƠI VỚI MÁY (OFFLINE)
                </div>
                <div className="text-xs text-amber-100 font-medium leading-tight mt-0.5">
                  Luyện tay so vé một mình · Bạn tự bấm Bắt Đầu khi sẵn sàng
                </div>
              </div>
            </div>
            <span className="hidden sm:inline font-pixel text-yellow-300 text-lg font-bold group-hover:translate-x-1 transition-transform">
              VÀO CHIẾU ➜
            </span>
          </button>

          {/* ONLINE ROOMS: Public & Private */}
          <button
            onClick={onOpenRoomModal}
            className="w-full bg-gradient-to-r from-[#1e3a8a] via-[#1d4ed8] to-[#0284c7] hover:from-[#2563eb] hover:to-[#0369a1] text-white p-3.5 rounded-xl shadow-lg cursor-pointer flex items-center justify-between gap-3 text-left border-2 border-cyan-300 transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl p-1.5 bg-black/40 rounded">🌐</span>
              <div>
                <div className="font-bold text-sm text-cyan-200 font-pixel uppercase tracking-wide">
                  PHÒNG ONLINE (PUBLIC & PRIVATE)
                </div>
                <div className="text-[11px] text-blue-100 font-medium">
                  Phòng công khai hoặc phòng riêng bằng mã mời · Chủ phòng bấm Bắt Đầu
                </div>
              </div>
            </div>
            <Users className="w-5 h-5 text-cyan-300 mr-2 shrink-0" />
          </button>

          {/* LUCKY WHEEL MINI-GAME: Daily Spin */}
          <button
            onClick={onOpenLuckyWheel}
            className="w-full bg-gradient-to-r from-[#78350f] via-[#b45309] to-[#d97706] hover:from-[#92400e] hover:to-[#f59e0b] text-white p-3 rounded-xl shadow-xl cursor-pointer flex items-center justify-between gap-3 text-left border-2 border-yellow-300 transition-all hover:-translate-y-0.5 group"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl p-1.5 bg-black/40 rounded-lg group-hover:rotate-45 transition-transform duration-300">
                🎡
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm sm:text-base font-pixel tracking-wide text-yellow-200 uppercase drop-shadow">
                    VÒNG QUAY MAY MẮN (QUAY MỖI NGÀY)
                  </span>
                  {canFreeSpin ? (
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-yellow-200 text-[10px] font-black border border-yellow-300 animate-bounce">
                      MIỄN PHÍ!
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-black/40 text-amber-200 text-[10px] font-mono">
                      HẸN NGÀY MAI
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-amber-100 font-medium leading-tight mt-0.5">
                  Quay 1 lần mỗi ngày · Nhận Xu & Kinh Nghiệm, cơ hội trúng JACKPOT 1500 Xu!
                </div>
              </div>
            </div>
            <span className="hidden sm:inline font-pixel text-yellow-200 text-sm font-black bg-black/40 px-2.5 py-1 rounded border border-yellow-300/80 group-hover:scale-105 transition-transform shrink-0">
              THỬ VẬN MAY ➜
            </span>
          </button>
        </div>

        <button onClick={onOpenWorldChat}
          className="w-full mb-3 bg-[#216c60] border-2 border-[#e5ca81] rounded-xl p-3 text-amber-100 font-black text-sm flex items-center justify-center gap-2 hover:bg-[#287e70] cursor-pointer">
          <MessageSquare className="w-5 h-5" /> 🌍 KÊNH CHAT THẾ GIỚI
        </button>

        {/* Secondary Navigation Strip */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2">
          <RetroButton size="md" variant="default" onClick={onOpenCharacters} icon={<Sparkles className="w-3.5 h-3.5" />}>
            Danh Hiệu
          </RetroButton>

          <RetroButton size="md" variant="gold" onClick={onOpenShop} icon={<ShoppingBag className="w-3.5 h-3.5" />}>
            Tạp Hóa & Quà
          </RetroButton>

          <RetroButton size="md" variant="default" onClick={onOpenLeaderboard} icon={<Trophy className="w-3.5 h-3.5" />}>
            Bảng Vinh Danh
          </RetroButton>

          <RetroButton size="md" variant="default" onClick={onOpenHistory} icon={<HistoryIcon className="w-3.5 h-3.5" />}>
            Sổ Lưu Ván Chơi
          </RetroButton>
        </div>

        {/* Footer */}
        <div className="mt-6 text-[11px] text-amber-400/60 font-mono text-center">
          © 1996 GÁNH HÁT LÔ TÔ ĐẠI NHẠC HỘI · PHONG CÁCH HOÀI NIỆM DÂN GIAN 9x
        </div>
      </div>
    </div>
  );
};
