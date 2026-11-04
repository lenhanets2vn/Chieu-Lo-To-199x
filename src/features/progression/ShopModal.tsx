import React, { useState } from 'react';
import { PlayerProfile, UnlockableItem } from './progressionTypes';
import { UNLOCKABLE_CATALOG, getExpNeededForLevel, purchaseItem } from './progressionStore';
import { RetroWindow } from '../../components/ui/RetroWindow';
import { RetroButton } from '../../components/ui/RetroButton';
import { Coins, Check, Lock, Sparkles } from 'lucide-react';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onUpdateProfile: (newProfile: PlayerProfile) => void;
  onTriggerVipEffect?: (effectType: string) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile,
  onTriggerVipEffect
}) => {
  const [activeTab, setActiveTab] = useState<'themes' | 'frames' | 'vip_emojis' | 'markers' | 'tickets' | 'titles'>('themes');
  const [buyToast, setBuyToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const expNeeded = getExpNeededForLevel(profile.level);
  const expPercent = Math.min(100, Math.round((profile.currentExp / expNeeded) * 100));

  const handleEquip = (item: UnlockableItem) => {
    const updated = { ...profile };
    if (item.type === 'web_theme' && item.themeKey) {
      updated.activeThemeId = item.themeKey;
    } else if (item.type === 'avatar_frame' && item.frameKey) {
      updated.activeFrameId = item.frameKey;
    } else if (item.type === 'marker') {
      updated.activeMarkerId = item.id;
    } else if (item.type === 'ticket_skin') {
      updated.activeTicketSkinId = item.id;
    } else if (item.type === 'yahoo_title') {
      updated.yahooTitle = item.name;
    }
    onUpdateProfile(updated);
  };

  const handleBuy = (item: UnlockableItem) => {
    const res = purchaseItem(profile, item);
    if (res.success && res.updatedProfile) {
      onUpdateProfile(res.updatedProfile);
      setBuyToast(res.message);
      if (item.effectType && onTriggerVipEffect) {
        onTriggerVipEffect(item.effectType);
      }
      setTimeout(() => setBuyToast(null), 3000);
    } else {
      alert(res.message);
    }
  };

  const items = UNLOCKABLE_CATALOG.filter(item => {
    if (activeTab === 'themes') return item.type === 'web_theme';
    if (activeTab === 'frames') return item.type === 'avatar_frame';
    if (activeTab === 'vip_emojis') return item.type === 'chat_vip_emoji';
    if (activeTab === 'markers') return item.type === 'marker';
    if (activeTab === 'tickets') return item.type === 'ticket_skin';
    if (activeTab === 'titles') return item.type === 'yahoo_title';
    return false;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3">
      <div className="w-full max-w-xl">
        <RetroWindow
          title="TẠP HÓA HỘI CHỢ"
          icon="🏪"
          onClose={onClose}
        >
          {/* Level & Coins status bar */}
          <div className="bg-white p-2.5 mb-2 border border-[#808080] win98-box-inset">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-pixel text-lg font-bold text-blue-900">
                  CẤP {profile.level}
                </span>
                <span className="text-xs font-semibold text-stone-700 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-300">
                  {profile.yahooTitle}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-800">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>{profile.coins.toLocaleString()} Xu Hội Chợ</span>
              </div>
            </div>

            {/* EXP Bar */}
            <div className="w-full bg-stone-200 h-3 rounded overflow-hidden border border-stone-400 relative">
              <div
                className="bg-gradient-to-r from-amber-500 to-rose-500 h-full transition-all duration-500"
                style={{ width: `${expPercent}%` }}
              ></div>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-bold text-stone-800">
                EXP: {profile.currentExp} / {expNeeded} ({expPercent}%)
              </span>
            </div>
          </div>

          {buyToast && (
            <div className="p-2 mb-2 bg-emerald-100 border border-emerald-400 text-emerald-900 text-xs font-bold rounded animate-fadeIn">
              ✨ {buyToast}
            </div>
          )}

          {/* Sub Navigation */}
          <div className="flex gap-1 mb-2.5 border-b border-[#808080] pb-1 flex-wrap">
            <button
              onClick={() => setActiveTab('themes')}
              className={`px-2.5 py-1 text-xs font-bold cursor-pointer flex items-center gap-1 ${
                activeTab === 'themes' ? 'win98-btn bg-amber-600 text-white' : 'win98-btn'
              }`}
            >
              <span>🎨</span>
              <span>Theme Nền Web</span>
            </button>
            <button
              onClick={() => setActiveTab('frames')}
              className={`px-2.5 py-1 text-xs font-bold cursor-pointer flex items-center gap-1 ${
                activeTab === 'frames' ? 'win98-btn bg-amber-600 text-white' : 'win98-btn'
              }`}
            >
              <span>🖼️</span>
              <span>Khung Avatar</span>
            </button>
            <button
              onClick={() => setActiveTab('vip_emojis')}
              className={`px-2.5 py-1 text-xs font-bold cursor-pointer flex items-center gap-1 ${
                activeTab === 'vip_emojis' ? 'win98-btn bg-amber-600 text-white' : 'win98-btn'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Emoji VIP</span>
            </button>
            <button
              onClick={() => setActiveTab('markers')}
              className={`px-2.5 py-1 text-xs font-bold cursor-pointer ${
                activeTab === 'markers' ? 'win98-btn bg-[#000080] text-white' : 'win98-btn'
              }`}
            >
              Hạt Đánh Dấu
            </button>
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-2.5 py-1 text-xs font-bold cursor-pointer ${
                activeTab === 'tickets' ? 'win98-btn bg-[#000080] text-white' : 'win98-btn'
              }`}
            >
              Mẫu Giấy Lô Tô
            </button>
            <button
              onClick={() => setActiveTab('titles')}
              className={`px-2.5 py-1 text-xs font-bold cursor-pointer ${
                activeTab === 'titles' ? 'win98-btn bg-[#000080] text-white' : 'win98-btn'
              }`}
            >
              Danh Hiệu
            </button>

          </div>

          {/* ITEM LIST */}
          {(
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1 win98-box-inset bg-white">
              {items.map((item) => {
                const isOwned = 
                  item.unlocked ||
                  profile.unlockedItemIds.includes(item.id) || 
                  (profile.level >= item.requiredLevel && (!item.costCoins || item.costCoins === 0));
                
                const isEquipped =
                  (item.type === 'web_theme' && profile.activeThemeId === item.themeKey) ||
                  (item.type === 'avatar_frame' && profile.activeFrameId === item.frameKey) ||
                  (item.type === 'marker' && profile.activeMarkerId === item.id) ||
                  (item.type === 'ticket_skin' && profile.activeTicketSkinId === item.id) ||
                  (item.type === 'yahoo_title' && profile.yahooTitle === item.name);

                return (
                  <div
                    key={item.id}
                    className={`p-2 border rounded flex flex-col justify-between ${
                      isEquipped
                        ? 'border-blue-600 bg-blue-50/70 shadow-sm'
                        : isOwned
                        ? 'border-stone-300 hover:bg-stone-50'
                        : 'border-stone-200 bg-stone-50/80 opacity-90'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-2xl p-1 bg-white border border-stone-200 rounded shrink-0 shadow-sm flex items-center justify-center w-10 h-10">
                        {item.previewIcon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-stone-900 truncate">
                          {item.name}
                        </div>
                        <p className="text-[10px] text-stone-500 leading-tight mt-0.5 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-stone-200 flex items-center justify-between text-xs">
                      {item.type === 'chat_vip_emoji' ? (
                        isOwned ? (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              Đã Mở
                            </span>
                            <button
                              onClick={() => {
                                if (item.effectType && onTriggerVipEffect) onTriggerVipEffect(item.effectType);
                              }}
                              className="win98-btn px-2 py-0.5 text-[10px] font-bold cursor-pointer"
                            >
                              Xem Hiệu Ứng
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[10px] font-bold text-amber-800">
                              {item.costCoins?.toLocaleString()} Xu (Cấp {item.requiredLevel})
                            </span>
                            <button
                              onClick={() => handleBuy(item)}
                              disabled={profile.level < item.requiredLevel || profile.coins < (item.costCoins || 0)}
                              className="win98-btn bg-amber-600 text-white hover:bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold cursor-pointer disabled:opacity-40"
                            >
                              Mua Ngay
                            </button>
                          </div>
                        )
                      ) : !isOwned ? (
                        item.costCoins && item.costCoins > 0 ? (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-[10px] font-bold text-amber-800">
                              {item.costCoins.toLocaleString()} Xu (Cấp {item.requiredLevel})
                            </span>
                            <button
                              onClick={() => handleBuy(item)}
                              disabled={profile.level < item.requiredLevel || profile.coins < item.costCoins}
                              className="win98-btn bg-amber-600 text-white hover:bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold cursor-pointer disabled:opacity-40"
                            >
                              Mua Ngay
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Mở tại Cấp {item.requiredLevel}
                          </span>
                        )
                      ) : isEquipped ? (
                        <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Đang Áp Dụng
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEquip(item)}
                          className="win98-btn px-2.5 py-0.5 text-[10px] font-bold cursor-pointer hover:bg-stone-200"
                        >
                          Trang Bị
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </RetroWindow>
      </div>
    </div>
  );
};
