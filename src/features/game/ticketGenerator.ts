/** Luật Lô Tô Hội Chợ 199x V7: mỗi bộ chỉ có 5 số, có thể chơi 1 hoặc 5 bộ. */
import type { LotoTicket } from './types';

export function pickFiveUnique(maxNum: number = 90, alreadySelected: number[] = []): number[] {
  const valid = [...new Set(alreadySelected.filter(n => Number.isInteger(n) && n >= 1 && n <= maxNum))].slice(0, 5);
  const pool = Array.from({ length: maxNum }, (_, i) => i + 1).filter(n => !valid.includes(n));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return [...valid, ...pool.slice(0, 5 - valid.length)].sort((a, b) => a - b);
}

/** Vé chỉ có một hàng 5 số; giao diện chỉ đọc và tự đánh dấu. */
export function generateFiveNumberTicket(numbers: number[], theme: LotoTicket['colorTheme'] = 'classic-yellow'): LotoTicket {
  if (numbers.length !== 5 || new Set(numbers).size !== 5 || numbers.some(n => !Number.isInteger(n) || n < 1 || n > 90)) {
    throw new Error('Vé phải có đúng 5 số khác nhau trong khoảng 01–90.');
  }
  return {
    id: `ve5-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: 'Bộ 5 số may mắn',
    colorTheme: theme,
    grid: [[...numbers].sort((a, b) => a - b).map(value => ({ value, called: false, marked: false }))]
  };
}

/** Tương thích các tiện ích cũ, nhưng KHÔNG bao giờ tạo vé 15 số nữa. */
export function generatePlayerTickets(count: number = 1, maxNum: number = 90): LotoTicket[] {
  return Array.from({ length: Math.min(4, Math.max(0, count)) }, () => generateFiveNumberTicket(pickFiveUnique(Math.min(maxNum, 90))));
}
