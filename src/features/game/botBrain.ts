/**
 * Trí tuệ nhân tạo (AI Bots) cho chế độ chơi Lô Tô 199x.
 * Hỗ trợ tối đa 30 người chơi cùng lúc trong 1 phòng.
 * Mỗi bot sở hữu đúng 1 tấm vé ngẫu nhiên duy nhất!
 */

import { generateFiveNumberTicket, pickFiveUnique } from './ticketGenerator';
import { PlayerState } from './types';
import { CHARACTERS } from '../characters/characterData';

export interface BotPersonality {
  id: string;
  name: string;
  characterId: string;
  reactionSpeedMs: number;
  chatFrequency: number;
}

const BOT_NAMES = [
  'Chị Ba Bến Tre',
  'Tuấn Net Cỏ HP',
  'Công Tử Bạc Liêu',
  'Bé Mộng Mơ 9x',
  'Anh Bảy Hủ Tiếu Gõ',
  'Chú Chín Kẹo Kéo',
  'Hotgirl Blog 360',
  'Bác Ba Nông Trại',
  'Chị Bảy Hột Xoàn',
  'Má Mì Soi Kính',
  'Thánh Dò Xóm Chiếu',
  'Bé Bông Hột Vịt Lộn',
  'Đại Ca Đình Làng',
  'Cao Thủ Bấm Chuông',
  'Kute Boy 1996',
  'Công Chúa Bong Bóng',
  'Vũ Điệu Lô Tô',
  'Thiếu Gia Miền Tây',
  'Thợ Lắc Lồng Cầu',
  'Dân Chơi Võ Lâm 1',
  'Bang Chủ Cái Bang',
  'Tiểu Muội Hái Chè',
  'Bác Tám Xe Lôi',
  'Cô Năm Bán Chiếu',
  'Út Nhỏ Đình Miếu',
  'Thần Bài Cửu Long',
  'Gà Công Nghiệp 9x',
  'Đại Gia Đất Phèn',
  'Trùm Phá Làng Phá Xóm'
];

/**
 * Khởi tạo danh sách AI Bot người chơi cho phòng (lên đến 29 bot, tổng 30 người chơi)
 * Mỗi người chơi CHỈ CÓ ĐÚNG 1 VÉ DUY NHẤT theo yêu cầu!
 */
export function createOfflineBots(count: number = 29, maxNum: number = 99): PlayerState[] {
  const actualCount = Math.min(count, BOT_NAMES.length);
  const bots: PlayerState[] = [];

  for (let i = 0; i < actualCount; i++) {
    const char = CHARACTERS[i % CHARACTERS.length];
    const botName = BOT_NAMES[i];

    bots.push({
      id: `bot-${char.id}-${i}`,
      name: botName,
      isHost: false,
      isBot: true,
      characterId: char.id,
      // Mỗi người chỉ được chơi 1 vé duy nhất!
      tickets: [generateFiveNumberTicket(pickFiveUnique(Math.min(maxNum, 90)))],
      isReady: true,
      hasKinh: false,
      score: 1000 + Math.floor(Math.random() * 800)
    });
  }

  return bots;
}
