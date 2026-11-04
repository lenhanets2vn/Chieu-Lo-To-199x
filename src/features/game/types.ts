/**
 * Types & models for Vietnamese Traditional Lô Tô 199x.
 */

export interface LotoCell {
  value: number | null; // null nếu là ô trống
  marked: boolean;      // Hệ thống tự đánh dấu theo số đã được gọi
  called: boolean;      // Số này đã được lồng cầu bốc trúng chưa
}

export type LotoRow = LotoCell[];

export interface LotoTicket {
  id: string;
  name: string;
  colorTheme: 'classic-yellow' | 'pink-rose' | 'retro-cyan' | 'newspaper';
  grid: LotoCell[][]; // 1 hàng đúng 5 số mỗi bộ (V7)
}

export interface PlayerState {
  id: string;
  name: string;
  isHost: boolean;
  isBot: boolean;
  characterId: string;
  tickets: LotoTicket[];
  isReady: boolean;
  hasKinh: boolean;
  kinhRowInfo?: { ticketIndex: number; rowIndex: number };
  score: number;
}

export type GameStatus = 'WAITING' | 'COUNTDOWN' | 'CALLING' | 'PAUSED' | 'CHECKING_KINH' | 'GAME_OVER';

export interface GameSettings {
  mode: 'offline_bot' | 'online_friend';
  callIntervalSeconds: number; // 3s, 5s, hoặc 7s
  maxNumber: number; // 99 (hoặc 90)
  autoMark: boolean; // Luôn true ở V7; chỉ tự động đánh dấu
  ticketCount: 1 | 5; // Mỗi người có 1 hoặc 5 bộ, mỗi bộ đúng 5 số
  voiceCaller: boolean; // Bật giọng hò tiếng Việt
  soundEffects: boolean; // Âm thanh Web Audio
  crtScanlines: boolean; // Hiệu ứng màn hình cong CRT
}

export interface CalledBall {
  number: number;
  drawnAt: number;
  order: number;
}
