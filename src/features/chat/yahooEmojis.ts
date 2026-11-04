/**
 * Kho biểu tượng cảm xúc (Emoticons) kinh điển phong cách Internet 9x - 2000s.
 */

export interface RetroEmoji {
  code: string;
  name: string;
  symbol: string;
  badgeColor: string;
}

export const RETRO_9X_EMOJIS: RetroEmoji[] = [
  { code: ':)', name: 'Cười mỉm', symbol: '🙂', badgeColor: 'bg-amber-100 text-amber-900' },
  { code: '=))', name: 'Cười lăn lộn', symbol: '🤣', badgeColor: 'bg-amber-200 text-amber-950 font-bold' },
  { code: ':D', name: 'Cười toe toét', symbol: '😃', badgeColor: 'bg-yellow-200 text-yellow-900' },
  { code: ';)', name: 'Nháy mắt', symbol: '😉', badgeColor: 'bg-blue-100 text-blue-900' },
  { code: ':P', name: 'Lè lưỡi', symbol: '😜', badgeColor: 'bg-pink-100 text-pink-900' },
  { code: ':x', name: 'Yêu thương', symbol: '🥰', badgeColor: 'bg-rose-200 text-rose-900' },
  { code: ':-*', name: 'Hôn gió', symbol: '😘', badgeColor: 'bg-red-100 text-red-900' },
  { code: 'B-)', name: 'Dân chơi sành điệu', symbol: '😎', badgeColor: 'bg-indigo-100 text-indigo-900' },
  { code: ':(', name: 'Buồn thiu', symbol: '🙁', badgeColor: 'bg-slate-200 text-slate-800' },
  { code: ':((', name: 'Khóc ròng', symbol: '😭', badgeColor: 'bg-blue-200 text-blue-950' },
  { code: ':-O', name: 'Hốt hoảng', symbol: '😮', badgeColor: 'bg-orange-100 text-orange-900' },
  { code: 'X(', name: 'Tức giận', symbol: '😡', badgeColor: 'bg-red-200 text-red-950' },
  { code: ':-SS', name: 'Toát mồ hôi hột', symbol: '😰', badgeColor: 'bg-cyan-100 text-cyan-900' },
  { code: '>:D<', name: 'Ôm thắm thiết', symbol: '🤗', badgeColor: 'bg-emerald-100 text-emerald-900' },
  { code: '~:>', name: 'Con gà công nghiệp', symbol: '🐔', badgeColor: 'bg-amber-300 text-amber-900' }
];

// Alias for backwards compatibility
export const YAHOO_EMOJIS = RETRO_9X_EMOJIS;
export type YahooEmoji = RetroEmoji;

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  characterId: string;
  avatar?: string;
  text: string;
  timestamp: number;
  /** Server timestamp, used for incremental listener reconnections. */
  createdAt?: import('firebase/firestore').Timestamp;
  channel: 'room' | 'world' | 'system';
  isBuzz?: boolean;
  isVipEmoji?: string;
}



/** Convert legacy Yahoo 9x emoticon codes to visible Unicode emoji. */
const emojiByCode: ReadonlyMap<string, string> = new Map(RETRO_9X_EMOJIS.map(item => [item.code, item.symbol]));
const escapedCodes = RETRO_9X_EMOJIS.map(item => item.code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const retroCodePattern = new RegExp(escapedCodes.sort((a, b) => b.length - a.length).join('|'), 'g');
export function renderChatEmojiCodes(text: string): string {
  return text.replace(retroCodePattern, code => emojiByCode.get(code) ?? code);
}
