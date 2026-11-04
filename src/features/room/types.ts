/**
 * Types for Room Management in Vietnamese Lô Tô 199x.
 */

import { PlayerState, GameStatus } from '../game/types';

export interface GameRoom {
  id: string;
  code: string;
  name: string;
  isPrivate: boolean;
  password?: string;
  hostId: string;
  hostName: string;
  maxPlayers: number;
  players: PlayerState[]; // legacy host snapshot; live roster is in members collection
  memberCount?: number;
  status: GameStatus;
  currentBallNumber: number | null;
  calledHistory: number[];
  callIntervalSeconds: number; // 3, 5, 7s
  maxNumber: number; // 99
  createdAt: number;
  winnerPlayerName?: string;
  winnerRow?: number[];
}
