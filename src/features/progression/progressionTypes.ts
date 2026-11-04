/**
 * Types & models for Player Level, EXP, Unlockables, Themes, Frames, and Accounts.
 */

export type ThemeType = 'retro_default' | 'christmas' | 'halloween' | 'autumn' | 'summer' | 'winter';
export type FrameType = 'frame_none' | 'frame_diamond' | 'frame_dragon_fire' | 'frame_neon_pink' | 'frame_winter_frost' | 'frame_pumpkin' | 'frame_phoenix_legend';

export interface UnlockableItem {
  id: string;
  name: string;
  type: 'marker' | 'ticket_skin' | 'yahoo_title' | 'chat_vip_emoji' | 'avatar_frame' | 'web_theme';
  description: string;
  requiredLevel: number;
  previewIcon: string;
  unlocked: boolean;
  costCoins?: number;
  effectType?: 'fireworks' | 'bomb' | 'hearts' | 'dragon' | 'piggy_coins' | 'crown' | 'guitar_notes';
  themeKey?: ThemeType;
  frameKey?: FrameType;
}

export interface PlayerProfile {
  id: string;
  username: string;     // Tên đăng nhập (duy nhất, dùng để đăng nhập)
  displayName: string;  // Tên Nickname hiển thị công khai trong game
  avatarDataUrl?: string; // Ảnh đại diện đã thu nhỏ, lưu riêng cho tài khoản
  yahooTitle: string;   // Danh hiệu 9x
  characterId: string;
  level: number;
  currentExp: number;
  coins: number;
  totalGames: number;
  totalWins: number;
  activeMarkerId: string;
  activeTicketSkinId: string;
  activeThemeId: ThemeType;
  activeFrameId: FrameType;
  unlockedItemIds: string[];
  lastDailySpinTime?: number;
  updatedAt: number;
}

export interface WeeklyLeaderboardEntry {
  rank: number;
  playerId: string;
  name: string;
  yahooTitle: string;
  characterName: string;
  wins: number;
  winRate: number;
  trophies: number;
  avatarCharId: string;
}
