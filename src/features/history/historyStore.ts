/**
 * Types and storage for Game Match History.
 */

export interface MatchRecord {
  id: string;
  timestamp: number;
  gameMode: 'offline_bot' | 'online_friend';
  totalBallsCalled: number;
  winnerName: string;
  isUserWinner: boolean;
  winningRow?: number[];
  expEarned: number;
  coinsEarned: number;
  playerTicketCount: number;
  lastBallNumber: number;
}

const HISTORY_KEY = 'viet_loto_199x_match_history';

export function loadMatchHistory(): MatchRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore error
  }
  return [];
}

export function saveMatchRecord(record: MatchRecord): void {
  try {
    const history = loadMatchHistory();
    history.unshift(record);
    // Lưu tối đa 30 ván gần nhất để giữ dung lượng nhẹ
    if (history.length > 30) {
      history.pop();
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // Ignore error
  }
}
