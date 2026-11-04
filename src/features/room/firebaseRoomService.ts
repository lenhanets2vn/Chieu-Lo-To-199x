import {
  collection, doc, setDoc, getDoc, updateDoc, deleteDoc, query, where,
  limit, orderBy, onSnapshot, addDoc, serverTimestamp, runTransaction,
  FirestoreError
} from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { GameRoom } from './types';
import { PlayerState, GameStatus, LotoTicket } from '../game/types';

// Public identifiers are easy to share; private identifiers are high-entropy invite secrets.
// A private invite link is NOT equivalent to server-verified password protection.
function generateRoomCode(isPrivate: boolean): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(isPrivate ? 18 : 8);
  crypto.getRandomValues(bytes);
  return 'LT' + Array.from(bytes, n => alphabet[n % alphabet.length]).join('');
}

export interface LiveRoomGame {
  status: GameStatus;
  currentBallNumber: number | null;
  calledHistory: number[];
  winnerPlayerName?: string;
  winnerRow?: number[];
  updatedAt?: unknown;
}

/** Create a room and its small separate live-state document. */
export async function createOnlineRoom(
  params: { name: string; isPrivate: boolean; password?: string; callSpeed: number; maxPlayers: number },
  hostPlayer: PlayerState
): Promise<GameRoom> {
  if (!auth.currentUser || auth.currentUser.uid !== hostPlayer.id) throw new Error('Vui lòng đăng nhập trước khi mở phòng.');
  // Password verification would require an authenticated server endpoint; never pretend a client-only password is secure.
  if (params.isPrivate && params.password) throw new Error('Phòng mật khẩu cần Cloud Functions để xác thực an toàn. Hãy tạo phòng bằng mã mời riêng thay thế.');
  const code = generateRoomCode(params.isPrivate);
  const room: GameRoom = {
    id: code,
    code,
    name: params.name.trim().slice(0, 70) || 'Chiếu Lô Tô Hội Xuân 199x',
    isPrivate: params.isPrivate,
    hostId: hostPlayer.id,
    hostName: hostPlayer.name,
    maxPlayers: Math.min(100, Math.max(2, params.maxPlayers || 30)),
    players: [hostPlayer],
    status: 'WAITING',
    currentBallNumber: null,
    calledHistory: [],
    callIntervalSeconds: params.callSpeed || 5,
    maxNumber: 90,
    createdAt: Date.now()
  };
  await setDoc(doc(db, 'rooms', room.id), room);
  await Promise.all([
    setDoc(doc(db, 'rooms', room.id, 'members', hostPlayer.id), hostPlayer),
    setDoc(doc(db, 'rooms', room.id, 'state', 'current'), {
      status: 'WAITING', currentBallNumber: null, calledHistory: [], updatedAt: serverTimestamp()
    })
  ]);
  return room;
}

/** Public lobby is loaded only when the lobby dialog is visible. */
export function subscribeToPublicRooms(
  onRoomsUpdate: (rooms: GameRoom[]) => void,
  onError?: (error: FirestoreError) => void,
  onConnection?: (fromServer: boolean) => void
): () => void {
  const q = query(collection(db, 'rooms'), where('isPrivate', '==', false), limit(20));
  return onSnapshot(q, { includeMetadataChanges: true }, snapshot => {
    onConnection?.(!snapshot.metadata.fromCache);
    onRoomsUpdate(snapshot.docs.map(d => d.data() as GameRoom).sort((a,b) => b.createdAt - a.createdAt));
  }, err => onError?.(err));
}

export function subscribeToRoom(roomId: string, onRoomUpdate: (room: GameRoom | null) => void,
  onError?: (error: FirestoreError) => void): () => void {
  if (!roomId) return () => {};
  return onSnapshot(doc(db, 'rooms', roomId), snap => {
    onRoomUpdate(snap.exists() ? snap.data() as GameRoom : null);
  }, err => onError?.(err));
}

/** Single tiny document carries the authoritative host's gameplay events. */
export function subscribeToRoomGameState(roomId: string, onState: (state: LiveRoomGame) => void,
  onError?: (error: FirestoreError) => void): () => void {
  if (!roomId) return () => {};
  return onSnapshot(doc(db, 'rooms', roomId, 'state', 'current'), snap => {
    if (snap.exists()) onState(snap.data() as LiveRoomGame);
  }, err => onError?.(err));
}

export async function publishRoomGameState(roomId: string, update: Partial<LiveRoomGame>): Promise<void> {
  if (!roomId) return;
  await updateDoc(doc(db, 'rooms', roomId, 'state', 'current'), {
    ...update, updatedAt: serverTimestamp()
  });
}

/** Own member state is isolated: no player may edit another player's tickets. */
export async function publishOwnRoomTickets(roomId: string, player: PlayerState, tickets: LotoTicket[]): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== player.id) return;
  await setDoc(doc(db, 'rooms', roomId, 'members', player.id), {
    ...player, tickets: tickets.slice(0, 1), isBot: false
  });
}

export function subscribeToRoomMembers(roomId: string, onMembers: (players: PlayerState[]) => void,
  onError?: (error: FirestoreError) => void): () => void {
  const q = query(collection(db, 'rooms', roomId, 'members'), limit(100));
  return onSnapshot(q, snapshot => {
    onMembers(snapshot.docs.map(d => d.data() as PlayerState));
  }, err => onError?.(err));
}

/** Concurrent joins use Firestore transaction, not getDoc() + blind updateDoc(). */
export async function joinOnlineRoom(
  codeOrId: string, player: PlayerState, _passwordInput?: string
): Promise<{ success: boolean; room?: GameRoom; error?: string }> {
  try {
    if (!auth.currentUser || auth.currentUser.uid !== player.id) throw new Error('Bạn cần đăng nhập trước khi vào phòng.');
    const roomId = codeOrId.trim().toUpperCase();
    if (!/^LT[A-Z2-9]{8,18}$/.test(roomId)) throw new Error('Mã phòng không hợp lệ.');
    const roomRef = doc(db, 'rooms', roomId);
    const stateRef = doc(db, 'rooms', roomId, 'state', 'current');
    const result = await runTransaction(db, async tx => {
      const snap = await tx.get(roomRef);
      const liveSnap = await tx.get(stateRef);
      if (!snap.exists()) throw new Error('Không tìm thấy phòng này.');
      const room = snap.data() as GameRoom;
      if (liveSnap.exists() && liveSnap.data().status !== 'WAITING') throw new Error('Ván đang diễn ra. Hãy chờ chủ phòng mở ván mới.');
      const players = room.players || [];
      if (!players.some(p => p.id === player.id)) {
        if (players.length >= room.maxPlayers) throw new Error('Phòng đã đủ người chơi.');
        tx.update(roomRef, { players: [...players, { ...player, tickets: [] }] });
      }
      return { ...room, players: players.some(p => p.id === player.id) ? players : [...players, player] };
    });
    const rosterPlayer = result.players.find(p => p.id === player.id) || player;
    await setDoc(doc(db, 'rooms', roomId, 'members', player.id), { ...rosterPlayer, tickets: [] });
    return { success: true, room: result };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Không thể kết nối phòng online.' };
  }
}

export async function leaveOnlineRoom(roomId: string, playerId: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== playerId) return;
  await deleteDoc(doc(db, 'rooms', roomId, 'members', playerId));
  // The host can later remove disconnected accounts from the roster. Guest cannot rewrite other players.
}

export interface RoomReactionDoc {
  id: string; senderId: string; senderName: string; emoji: string; label: string; timestamp: number;
}
export async function sendRoomReaction(roomId: string, reaction: Omit<RoomReactionDoc, 'id'|'timestamp'>): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== reaction.senderId) return;
  await addDoc(collection(db, 'rooms', roomId, 'reactions'), {
    ...reaction, timestamp: Date.now(), createdAt: serverTimestamp()
  });
}
export function subscribeToRoomReactions(roomId: string,
  onReactionReceived: (reaction: RoomReactionDoc) => void): () => void {
  if (!roomId) return () => {};
  const q = query(collection(db, 'rooms', roomId, 'reactions'), orderBy('createdAt', 'desc'), limit(10));
  const seen = new Set<string>();
  return onSnapshot(q, snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type !== 'added' || seen.has(change.doc.id)) return;
      seen.add(change.doc.id);
      const data = change.doc.data();
      if (Date.now() - (data.timestamp || 0) < 8000) {
        onReactionReceived({ id: change.doc.id, senderId: data.senderId,
          senderName: data.senderName, emoji: data.emoji, label: data.label, timestamp: data.timestamp });
      }
    });
  }, err => console.warn('Room reaction listener:', err.code));
}


/** One KINH event per button-press; host verifies it against member ticket and called numbers. */
export interface RoomKinhClaim {
  senderId: string;
  numbers: number[];
}
export async function sendRoomKinhClaim(roomId: string, senderId: string, numbers: number[]): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== senderId) throw new Error('Chưa đăng nhập.');
  if (numbers.length !== 5 || new Set(numbers).size !== 5 || numbers.some(n => !Number.isInteger(n) || n < 1 || n > 90)) {
    throw new Error('Bộ số KINH không hợp lệ.');
  }
  await addDoc(collection(db, 'rooms', roomId, 'claims'), {
    senderId, numbers: [...numbers], createdAt: serverTimestamp()
  });
}
export function subscribeToRoomKinhClaims(roomId: string, onClaim: (claim: RoomKinhClaim) => void): () => void {
  const seen = new Set<string>();
  const q = query(collection(db, 'rooms', roomId, 'claims'), orderBy('createdAt', 'desc'), limit(20));
  return onSnapshot(q, snapshot => {
    snapshot.docChanges().forEach(change => {
      if (change.type !== 'added' || seen.has(change.doc.id)) return;
      seen.add(change.doc.id);
      const data = change.doc.data();
      const at = data.createdAt?.toMillis?.() || 0;
      if (Date.now() - at < 10_000 && at <= Date.now() + 2_000
          && typeof data.senderId === 'string' && Array.isArray(data.numbers)) {
        onClaim({ senderId: data.senderId, numbers: data.numbers });
      }
    });
  }, error => console.warn('Lỗi nhận KINH trong phòng:', error.code));
}
