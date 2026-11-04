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
  /** Public minimal roster; NEVER include ticket data here. */
  roster?: Record<string, { name: string; characterId: string }>;
  /** This schema co-locates the live round and public metadata. */
  liveVersion?: number;
  gameRevision?: number;
  audioPhase?: 'idle' | 'intro' | 'number' | 'near_end' | 'outro';
  audioTrack?: string;
  audioStartedAt?: import('firebase/firestore').Timestamp;
  soundpackId?: string;
  roundId?: string;
  countdownEndsAt?: number;
  updatedAt?: unknown;
  status: GameStatus;
  currentBallNumber: number | null;
  calledHistory: number[];
  callIntervalSeconds: number; // 3, 5, 7s
  maxNumber: number; // 99
  createdAt: number;
  winnerPlayerName?: string;
  winnerRow?: number[];
}
