/**
 * Engine cốt lõi quản lý rút bóng lồng cầu và kiểm tra điều kiện KINH Lô Tô.
 */

import { CalledBall, LotoTicket } from './types';

export class LotoEngine {
  private remainingBalls: number[] = [];
  private calledBalls: CalledBall[] = [];
  private maxNumber: number = 99;
  private pendingBall: CalledBall | null = null;

  constructor(maxNum: number = 99) {
    this.reset(maxNum);
  }

  public reset(maxNum: number = 99) {
    this.maxNumber = maxNum;
    this.remainingBalls = [];
    for (let i = 1; i <= maxNum; i++) {
      this.remainingBalls.push(i);
    }
    // Shuffle xáo trộn lồng cầu
    for (let i = this.remainingBalls.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.remainingBalls[i], this.remainingBalls[j]] = [this.remainingBalls[j], this.remainingBalls[i]];
    }
    this.calledBalls = [];
    this.pendingBall = null;
  }

  /**
   * Rút 1 quả bóng tiếp theo từ lồng cầu
   */
  public drawNextBall(targetNumber?: number): CalledBall | null {
    if (this.remainingBalls.length === 0) return null;

    let selectedNum: number;
    if (targetNumber && this.remainingBalls.includes(targetNumber)) {
      selectedNum = targetNumber;
      this.remainingBalls = this.remainingBalls.filter(n => n !== targetNumber);
    } else {
      selectedNum = this.remainingBalls.pop()!;
    }

    const ball: CalledBall = {
      number: selectedNum,
      drawnAt: Date.now(),
      order: this.calledBalls.length + 1
    };
    this.pendingBall = ball;
    return ball;
  }

  /** Đánh dấu số chỉ khi xuất hiện trên game (cuối bài hát). */
  public confirmCurrentBall(number: number): boolean {
    if (this.calledBalls.some(b => b.number === number)) return false;
    if (this.pendingBall && this.pendingBall.number === number) {
      this.calledBalls.push(this.pendingBall);
      this.pendingBall = null;
      return true;
    }
    this.remainingBalls = this.remainingBalls.filter(n => n !== number);
    this.calledBalls.push({
      number,
      drawnAt: Date.now(),
      order: this.calledBalls.length + 1
    });
    if (this.pendingBall && this.pendingBall.number === number) {
      this.pendingBall = null;
    }
    return true;
  }

  /** Next number in the existing shuffle; read-only, never reveals or consumes it.
   * Lets the audio system pre-decode the next song while this one is playing. */
  public peekNextNumber(): number | null {
    return this.remainingBalls.length ? this.remainingBalls[this.remainingBalls.length - 1] : null;
  }

  /** Read-only lookahead; does not consume or reveal shuffled numbers. */
  public peekNextNumbers(count: number = 2): number[] {
    return this.remainingBalls.slice(-Math.max(0, count)).reverse();
  }

  public getPendingBall(): CalledBall | null { return this.pendingBall; }

  public getCalledBalls(): CalledBall[] {
    return this.calledBalls;
  }

  public getCalledNumbersSet(): Set<number> {
    return new Set(this.calledBalls.map(b => b.number));
  }

  public getRemainingCount(): number {
    return this.remainingBalls.length;
  }

  /** KINH khi và chỉ khi cả 5 số duy nhất trên vé đều đã thực sự mở. */
  public checkTicketKinh(ticket: LotoTicket, calledSet: Set<number>): { hasKinh: boolean; rowIndex: number; rowNumbers: number[] } {
    const numbers = ticket.grid.flat().filter(c => c.value !== null).map(c => c.value as number);
    const valid = numbers.length === 5 && new Set(numbers).size === 5;
    return {
      hasKinh: valid && numbers.every(n => calledSet.has(n)),
      rowIndex: valid ? 0 : -1,
      rowNumbers: valid ? numbers : []
    };
  }

  public getClosestToKinh(ticket: LotoTicket, calledSet: Set<number>): { missingCount: number; missingNumbers: number[]; rowIndex: number } {
    const numbers = ticket.grid.flat().filter(c => c.value !== null).map(c => c.value as number);
    if (numbers.length !== 5 || new Set(numbers).size !== 5) return { missingCount: 5, missingNumbers: [], rowIndex: -1 };
    const missingNumbers = numbers.filter(n => !calledSet.has(n));
    return { missingCount: missingNumbers.length, missingNumbers, rowIndex: 0 };
  }
}
