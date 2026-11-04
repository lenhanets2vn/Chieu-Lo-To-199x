/**
 * Quản lý tích lũy Kinh Nghiệm (EXP), Cấp độ, Mở khóa vật phẩm, Theme nền giao diện, Khung đại diện.
 */

import { PlayerProfile, UnlockableItem, WeeklyLeaderboardEntry, ThemeType, FrameType } from './progressionTypes';

const STORAGE_KEY = 'viet_loto_199x_profile_v4';

export const UNLOCKABLE_CATALOG: UnlockableItem[] = [
  // 1. THEME NỀN GIAO DIỆN WEB THEO CHỦ ĐỀ
  {
    id: 'theme_retro_default',
    name: 'Hội Chợ 199x (Mặc Định)',
    type: 'web_theme',
    description: 'Phong cách hội chợ truyền thống rực rỡ cờ hoa và ánh đèn sợi đốt ấm áp.',
    requiredLevel: 1,
    previewIcon: '🏮',
    costCoins: 0,
    themeKey: 'retro_default',
    unlocked: true
  },
  {
    id: 'theme_christmas',
    name: 'Giáng Sinh Tuyết Trắng',
    type: 'web_theme',
    description: 'Chủ đề Noel mùa đông với tuyết rơi bồng bềnh, cây thông xanh và chuông vàng ngân vang.',
    requiredLevel: 2,
    previewIcon: '🎄',
    costCoins: 7500,
    themeKey: 'christmas',
    unlocked: false
  },
  {
    id: 'theme_halloween',
    name: 'Halloween Ma Mị',
    type: 'web_theme',
    description: 'Đêm hội bí ngô huyền bí với ánh sáng tím cam, mạng nhện và lâu đài huyền ảo.',
    requiredLevel: 3,
    previewIcon: '🎃',
    costCoins: 8750,
    themeKey: 'halloween',
    unlocked: false
  },
  {
    id: 'theme_autumn',
    name: 'Mùa Thu Vàng (Autumn)',
    type: 'web_theme',
    description: 'Sắc lá phong hổ phách rực rỡ lãng mạn như mùa thu Hà Nội.',
    requiredLevel: 4,
    previewIcon: '🍂',
    costCoins: 10000,
    themeKey: 'autumn',
    unlocked: false
  },
  {
    id: 'theme_summer',
    name: 'Mùa Hè Rực Rỡ (Summer)',
    type: 'web_theme',
    description: 'Biển xanh sóng vỗ dập dềnh và rặng dừa nhiệt đới thanh mát.',
    requiredLevel: 5,
    previewIcon: '🏖️',
    costCoins: 11250,
    themeKey: 'summer',
    unlocked: false
  },
  {
    id: 'theme_winter',
    name: 'Mùa Đông Băng Giá (Winter)',
    type: 'web_theme',
    description: 'Băng giá pha lê lấp lánh và sắc xanh thẳm của đêm cực quang mùa đông.',
    requiredLevel: 6,
    previewIcon: '❄️',
    costCoins: 12500,
    themeKey: 'winter',
    unlocked: false
  },

  // 2. KHUNG ẢNH ĐẠI DIỆN (AVATAR FRAMES)
  {
    id: 'frame_none',
    name: 'Khung Gỗ Mộc (Mặc Định)',
    type: 'avatar_frame',
    description: 'Viền gỗ nâu mộc mạc cổ điển.',
    requiredLevel: 1,
    previewIcon: '🪵',
    costCoins: 0,
    frameKey: 'frame_none',
    unlocked: true
  },
  {
    id: 'frame_diamond',
    name: 'Khung Kim Cương Ngũ Sắc',
    type: 'avatar_frame',
    description: 'Viền kim cương lấp lánh phản chiếu ánh sáng cầu vồng quý phái.',
    requiredLevel: 4,
    previewIcon: '💎',
    costCoins: 15000,
    frameKey: 'frame_diamond',
    unlocked: false
  },
  {
    id: 'frame_dragon_fire',
    name: 'Khung Hỏa Long Hoàng Gia',
    type: 'avatar_frame',
    description: 'Ngọn lửa rồng rực cháy quanh ảnh đại diện uy dũng.',
    requiredLevel: 6,
    previewIcon: '🔥',
    costCoins: 20000,
    frameKey: 'frame_dragon_fire',
    unlocked: false
  },
  {
    id: 'frame_neon_pink',
    name: 'Khung Neon Hồng 9x',
    type: 'avatar_frame',
    description: 'Đèn neon hồng phát sáng thời thượng của dân chơi internet 2000s.',
    requiredLevel: 3,
    previewIcon: '🌸',
    costCoins: 10000,
    frameKey: 'frame_neon_pink',
    unlocked: false
  },
  {
    id: 'frame_winter_frost',
    name: 'Khung Băng Tuyết Pha Lê',
    type: 'avatar_frame',
    description: 'Hạt sương tuyết kết tinh quanh viền tỏa ánh sáng xanh mát lạnh.',
    requiredLevel: 5,
    previewIcon: '🧊',
    costCoins: 13750,
    frameKey: 'frame_winter_frost',
    unlocked: false
  },
  {
    id: 'frame_pumpkin',
    name: 'Khung Bí Ngô Lửa Ma',
    type: 'avatar_frame',
    description: 'Dây leo bí ngô và ngọn lửa bí ẩn tạo điểm nhấn độc lạ.',
    requiredLevel: 4,
    previewIcon: '🎃',
    costCoins: 11250,
    frameKey: 'frame_pumpkin',
    unlocked: false
  },

  // 3. VIP CHAT EMOJIS (Có hiệu ứng đặc biệt toàn màn hình phòng & thế giới)
  {
    id: 'vip_fireworks',
    name: 'Pháo Hoa Giao Thừa',
    type: 'chat_vip_emoji',
    description: 'Bắn chùm pháo hoa ngũ sắc rực rỡ ngập tràn màn hình cho toàn bộ phòng và kênh thế giới cùng chiêm ngưỡng!',
    requiredLevel: 2,
    previewIcon: '🎆',
    costCoins: 7500,
    effectType: 'fireworks',
    unlocked: false
  },
  {
    id: 'vip_bomb',
    name: 'Bom Nổ Đặt Bom 9x',
    type: 'chat_vip_emoji',
    description: 'Nổ tung màn hình kèm khói hoạt hình nổ bùng như trò chơi đặt bom arcade cổ điển!',
    requiredLevel: 3,
    previewIcon: '💣',
    costCoins: 8750,
    effectType: 'bomb',
    unlocked: false
  },
  {
    id: 'vip_heart_rain',
    name: 'Bão Tim Bay Lơ Lửng',
    type: 'chat_vip_emoji',
    description: 'Thả một cơn mưa trái tim hồng lấp lánh bay qua toàn bộ màn hình chat.',
    requiredLevel: 4,
    previewIcon: '💖',
    costCoins: 10000,
    effectType: 'hearts',
    unlocked: false
  },
  {
    id: 'vip_dragon',
    name: 'Hỏa Long Xuất Thế',
    type: 'chat_vip_emoji',
    description: 'Triệu hồi Rồng Vàng uy phong bay lượn từ trái sang phải màn hình kèm hào quang rực rỡ!',
    requiredLevel: 7,
    previewIcon: '🐉',
    costCoins: 20000,
    effectType: 'dragon',
    unlocked: false
  },
  {
    id: 'vip_piggy',
    name: 'Heo Đất Phát Tài',
    type: 'chat_vip_emoji',
    description: 'Đập heo đất rớt mưa tiền vàng xu rơi leng keng vui tai cho cả phòng!',
    requiredLevel: 5,
    previewIcon: '🐷',
    costCoins: 12500,
    effectType: 'piggy_coins',
    unlocked: false
  },
  {
    id: 'vip_crown',
    name: 'Vương Miện Hoàng Gia',
    type: 'chat_vip_emoji',
    description: 'Tỏa hào quang ngôi sao vàng chói lọi chứng minh đẳng cấp đại gia hội chợ!',
    requiredLevel: 6,
    previewIcon: '👑',
    costCoins: 16250,
    effectType: 'crown',
    unlocked: false
  },
  {
    id: 'vip_guitar',
    name: 'Đàn Kìm Vọng Cổ',
    type: 'chat_vip_emoji',
    description: 'Gảy đàn kìm phát ra dải nốt nhạc lượn sóng bay bổng khắp hội trường!',
    requiredLevel: 3,
    previewIcon: '🎸',
    costCoins: 8000,
    effectType: 'guitar_notes',
    unlocked: false
  },

  // 4. HẠT ĐÁNH DẤU SỐ TRÊN VÉ
  {
    id: 'hat_bap',
    name: 'Hột Bắp Khô',
    type: 'marker',
    description: 'Hột bắp vàng óng truyền thống thường dùng ở mọi gánh hát đình làng.',
    requiredLevel: 1,
    previewIcon: '🌽',
    unlocked: true
  },
  {
    id: 'nap_keng',
    name: 'Nắp Keng Xá Xị 1992',
    type: 'marker',
    description: 'Nắp keng sắt viền răng cưa huyền thoại của chai nước ngọt xá xị Chương Dương.',
    requiredLevel: 3,
    previewIcon: '⭐',
    unlocked: false
  },
  {
    id: 'vien_soi',
    name: 'Viên Sỏi Ngũ Sắc',
    type: 'marker',
    description: 'Viên đá cuội biển láng mịn nhặt ở bãi biển Vũng Tàu năm 1996.',
    requiredLevel: 5,
    previewIcon: '💎',
    unlocked: false
  },
  {
    id: 'cuc_ao',
    name: 'Cúc Áo Thập Niên 90',
    type: 'marker',
    description: 'Cúc áo bốn lỗ mẹ đơm bằng chỉ ngũ sắc bền bỉ theo năm tháng.',
    requiredLevel: 8,
    previewIcon: '🔘',
    unlocked: false
  },
  {
    id: 'con_dau_son',
    name: 'Con Dấu Son Đỏ',
    type: 'marker',
    description: 'Con dấu mực chu sa của Trưởng Ban Giám Khảo đóng cộp chữ KINH!',
    requiredLevel: 10,
    previewIcon: '💮',
    unlocked: false
  },

  // 5. MẪU VÉ LÔ TÔ
  {
    id: 'classic_yellow',
    name: 'Vé Vàng Đình Làng',
    type: 'ticket_skin',
    description: 'Mẫu giấy vàng rơm in mộc truyền thống Nam Bộ.',
    requiredLevel: 1,
    previewIcon: '📜',
    unlocked: true
  },
  {
    id: 'pink_rose',
    name: 'Vé Hồng Hoa Sen',
    type: 'ticket_skin',
    description: 'Mẫu giấy hồng phấn đem lại vận son đỏ cho người chơi.',
    requiredLevel: 4,
    previewIcon: '🌸',
    unlocked: false
  },
  {
    id: 'retro_cyan',
    name: 'Vé Cẩm Thạch Xanh',
    type: 'ticket_skin',
    description: 'Họa tiết đá ngọc bích sang trọng thời kỳ mở cửa.',
    requiredLevel: 6,
    previewIcon: '❇️',
    unlocked: false
  },
  {
    id: 'newspaper',
    name: 'Vé Báo Cũ 1995',
    type: 'ticket_skin',
    description: 'Giấy in báo hoài niệm với phông chữ cơ học thời bao cấp.',
    requiredLevel: 8,
    previewIcon: '📰',
    unlocked: false
  },

  // 6. DANH HIỆU HOÀI NIỆM 9x
  {
    id: 'tan_binh_loto',
    name: 'Tân Binh Đình Làng',
    type: 'yahoo_title',
    description: 'Người mới tập tành nghe tiếng hò xướng.',
    requiredLevel: 1,
    previewIcon: '🌱',
    unlocked: true
  },
  {
    id: 'kute_boy_9x',
    name: '~*kUtE_bOy_9x_dO_vE*~',
    type: 'yahoo_title',
    description: 'Biệt danh kinh điển viết hoa viết thường xen kẽ hoa mỹ.',
    requiredLevel: 2,
    previewIcon: '🎧',
    unlocked: false
  },
  {
    id: 'cong_chua_bong_bong',
    name: '--*cOnG_cHuA_bOnG_bOnG*--',
    type: 'yahoo_title',
    description: 'Danh xưng ngọt ngào từng làm mưa làm gió trang cá nhân 9x.',
    requiredLevel: 5,
    previewIcon: '👑',
    unlocked: false
  },
  {
    id: 'tay_choi_net_co',
    name: '[Pro]_NetCo_BaoSan',
    type: 'yahoo_title',
    description: 'Bang chủ khét tiếng cày đêm tại quán net cỏ.',
    requiredLevel: 7,
    previewIcon: '⚔️',
    unlocked: false
  },
  {
    id: 'trum_nong_trai',
    name: '★Trùm Nông Trại Vui Vẻ★',
    type: 'yahoo_title',
    description: 'Huyền thoại nông trại với vụ mùa củ cải bội thu.',
    requiredLevel: 9,
    previewIcon: '🥕',
    unlocked: false
  },
  {
    id: 'dai_ca_hoi_cho',
    name: '★Đại Ca Gánh Hát Lô Tô★',
    type: 'yahoo_title',
    description: 'Huyền thoại xướng âm bách chiến bách thắng khắp lục tỉnh Nam Kỳ.',
    requiredLevel: 12,
    previewIcon: '🏆',
    unlocked: false
  },
  { id:'ticket_royal_rare', name:'Vé Hoàng Gia Hiếm', type:'ticket_skin', description:'Vật phẩm sưu tầm quý hiếm dành cho người chơi lâu năm.', requiredLevel:12, previewIcon:'🎟️', costCoins:250000, unlocked:false },
  { id:'frame_phoenix_legend', name:'Khung Phượng Hoàng Huyền Thoại', type:'avatar_frame', description:'Khung danh giá dành cho người chơi kỳ cựu.', requiredLevel:20, previewIcon:'🦅', costCoins:1000000, unlocked:false },
  { id:'title_carnival_king', name:'Vua Hội Chợ', type:'yahoo_title', description:'Danh hiệu sưu tầm tối thượng.', requiredLevel:30, previewIcon:'👑', costCoins:5000000, unlocked:false },
];

export function getExpNeededForLevel(level: number): number {
  return level * 300;
}

export function createStarterProfile(id: string): PlayerProfile {
  return {
    id, username: 'khach', displayName: 'Khách Hội Chợ',
    yahooTitle: 'Tân Binh Đình Làng', characterId: 'chi_ba',
    level: 1, currentExp: 0, coins: 1000, totalGames: 0, totalWins: 0,
    activeMarkerId: 'hat_bap', activeTicketSkinId: 'classic_yellow',
    activeThemeId: 'retro_default', activeFrameId: 'frame_none',
    unlockedItemIds: ['hat_bap','classic_yellow','tan_binh_loto','theme_retro_default','frame_none'],
    updatedAt: Date.now()
  };
}

export function loadProfile(): PlayerProfile {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed;
    }
  } catch {
    // Ignore
  }

  const defaultProfile: PlayerProfile = {
    id: `player-${Math.random().toString(36).substring(2, 9)}`,
    username: 'thanh_do_9x',
    displayName: 'Thánh Dò 9x',
    yahooTitle: 'Tân Binh Đình Làng',
    characterId: 'chi_ba',
    level: 1,
    currentExp: 80,
    coins: 1000,
    totalGames: 0,
    totalWins: 0,
    activeMarkerId: 'hat_bap',
    activeTicketSkinId: 'classic_yellow',
    activeThemeId: 'retro_default',
    activeFrameId: 'frame_none',
    unlockedItemIds: ['hat_bap', 'classic_yellow', 'tan_binh_loto', 'theme_retro_default', 'frame_none'],
    updatedAt: Date.now()
  };
  saveProfile(defaultProfile);
  return defaultProfile;
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    profile.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore
  }
}

export function addExpAndRewards(profile: PlayerProfile, expGained: number, coinsGained: number, isWin: boolean, countAsMatch: boolean = true): { updatedProfile: PlayerProfile; leveledUp: boolean; newUnlocks: UnlockableItem[] } {
  const updated = { ...profile, unlockedItemIds: [...profile.unlockedItemIds] };
  if (countAsMatch) updated.totalGames += 1;
  if (isWin && countAsMatch) {
    updated.totalWins += 1;
  }
  updated.coins += coinsGained;
  updated.currentExp += expGained;

  let leveledUp = false;
  let expRequired = getExpNeededForLevel(updated.level);

  while (updated.currentExp >= expRequired) {
    updated.currentExp -= expRequired;
    updated.level += 1;
    leveledUp = true;
    expRequired = getExpNeededForLevel(updated.level);
  }

  const newUnlocks: UnlockableItem[] = [];
  UNLOCKABLE_CATALOG.forEach(item => {
    if (
      item.type !== 'chat_vip_emoji' &&
      item.type !== 'web_theme' &&
      item.type !== 'avatar_frame' &&
      item.requiredLevel <= updated.level &&
      (!item.costCoins || item.costCoins === 0) &&
      !updated.unlockedItemIds.includes(item.id)
    ) {
      updated.unlockedItemIds.push(item.id);
      newUnlocks.push(item);
    }
  });

  saveProfile(updated);
  return { updatedProfile: updated, leveledUp, newUnlocks };
}

export function purchaseItem(profile: PlayerProfile, item: UnlockableItem): { success: boolean; updatedProfile?: PlayerProfile; message: string } {
  if (profile.unlockedItemIds.includes(item.id)) {
    return { success: false, message: 'Bạn đã sở hữu vật phẩm này rồi!' };
  }
  if (profile.level < item.requiredLevel) {
    return { success: false, message: `Bạn cần đạt Cấp độ ${item.requiredLevel} để mở khóa vật phẩm này!` };
  }
  const cost = item.costCoins || 0;
  if (profile.coins < cost) {
    return { success: false, message: `Không đủ Xu! Bạn cần thêm ${(cost - profile.coins).toLocaleString()} Xu nữa.` };
  }

  const updated = { ...profile, unlockedItemIds: [...profile.unlockedItemIds] };
  updated.coins -= cost;
  updated.unlockedItemIds.push(item.id);

  // Auto equip if it's a theme or frame
  if (item.type === 'web_theme' && item.themeKey) {
    updated.activeThemeId = item.themeKey;
  } else if (item.type === 'avatar_frame' && item.frameKey) {
    updated.activeFrameId = item.frameKey;
  }

  saveProfile(updated);
  return { success: true, updatedProfile: updated, message: `Mua thành công ${item.name}!` };
}

export function exportSyncCode(profile: PlayerProfile): string {
  try {
    const jsonStr = JSON.stringify(profile);
    return btoa(encodeURIComponent(jsonStr));
  } catch {
    return '';
  }
}

export function importSyncCode(code: string): { success: boolean; profile?: PlayerProfile; error?: string } {
  try {
    const jsonStr = decodeURIComponent(atob(code.trim()));
    const parsed = JSON.parse(jsonStr) as PlayerProfile;
    if (parsed && parsed.id && typeof parsed.level === 'number') {
      saveProfile(parsed);
      return { success: true, profile: parsed };
    }
    return { success: false, error: 'Mã đồng bộ không hợp lệ!' };
  } catch {
    return { success: false, error: 'Lỗi giải mã! Vui lòng kiểm tra chuỗi mã sao lưu.' };
  }
}

export function getWeeklyLeaderboard(userProfile: PlayerProfile): WeeklyLeaderboardEntry[] {
  const topLegends: WeeklyLeaderboardEntry[] = [
    { rank: 1, playerId: 'legend-1', name: 'Nghệ Sĩ Ba Sang', yahooTitle: '★Đại Ca Gánh Hát Lô Tô★', characterName: 'Chị Ba Lô Tô', wins: 92, winRate: 76, trophies: 3680, avatarCharId: 'chi_ba' },
    { rank: 2, playerId: 'legend-2', name: 'Bạc Liêu Đệ Nhất', yahooTitle: 'Công Tử Xứ Bưởi', characterName: 'Công Tử Bạc Liêu', wins: 81, winRate: 70, trophies: 3150, avatarCharId: 'cong_tu' },
    { rank: 3, playerId: 'legend-3', name: 'Chị Bảy Kim Cương', yahooTitle: 'Hột Xoàn Chiếu Mệnh', characterName: 'Chị Bảy Hột Xoàn', wins: 73, winRate: 67, trophies: 2890, avatarCharId: 'chi_bay_hot_xoan' },
    { rank: 4, playerId: 'legend-4', name: 'Hacker_Net_Pho', yahooTitle: '[Pro]_NetCo_BaoSan', characterName: 'Cu Tèo Net Cỏ', wins: 65, winRate: 63, trophies: 2640, avatarCharId: 'cu_teo' },
    { rank: 5, playerId: 'legend-5', name: 'Bác Ba Củ Cải', yahooTitle: '★Trùm Nông Trại Vui Vẻ★', characterName: 'Bác Ba Nông Trại Xanh', wins: 56, winRate: 60, trophies: 2280, avatarCharId: 'bac_ba_nong_trai' },
    { rank: 6, playerId: 'legend-6', name: 'Bé Mộng Chè Ba Màu', yahooTitle: '--*cOnG_cHuA_bOnG_bOnG*--', characterName: 'Bé Bông Hột Bắp', wins: 49, winRate: 57, trophies: 1980, avatarCharId: 'be_bong' },
    { rank: 7, playerId: 'legend-7', name: 'Anh Bảy Muỗng Keng', yahooTitle: 'Hủ Tiếu Gõ Đêm', characterName: 'Anh Bảy Hủ Tiếu Gõ', wins: 44, winRate: 52, trophies: 1750, avatarCharId: 'anh_bay_hu_tieu' },
    { rank: 8, playerId: 'legend-8', name: 'Hotgirl_NhatKy9x', yahooTitle: 'Nữ Hoàng Nhật Ký 9x', characterName: 'Nữ Hoàng Nhật Ký 9x', wins: 40, winRate: 50, trophies: 1620, avatarCharId: 'nu_hoang_blog' }
  ];

  const userWinRate = userProfile.totalGames > 0 ? Math.round((userProfile.totalWins / userProfile.totalGames) * 100) : 0;
  const userTrophies = userProfile.totalWins * 35 + userProfile.level * 40;

  const userEntry: WeeklyLeaderboardEntry = {
    rank: 9,
    playerId: userProfile.id,
    name: `${userProfile.displayName} (Bạn)`,
    yahooTitle: userProfile.yahooTitle,
    characterName: 'Danh Hiệu Của Bạn',
    wins: userProfile.totalWins,
    winRate: userWinRate,
    trophies: userTrophies,
    avatarCharId: userProfile.characterId
  };

  const list = [...topLegends, userEntry].sort((a, b) => b.trophies - a.trophies);
  return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
}
