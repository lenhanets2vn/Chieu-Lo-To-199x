import {
  collection, doc, setDoc, updateDoc, query, where,
  limit, orderBy, onSnapshot, addDoc, serverTimestamp, runTransaction,
  FirestoreError, writeBatch, getDocFromServer
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
  if (params.isPrivate && params.password) throw new Error('Phòng có mật khẩu chưa được hỗ trợ. Hãy sử dụng mã mời riêng.');
  const code = generateRoomCode(params.isPrivate);
  const room: GameRoom = {
    id: code,
    code,
    name: params.name.trim().slice(0, 70) || 'Chiếu Lô Tô Hội Xuân 199x',
    isPrivate: params.isPrivate,
    hostId: hostPlayer.id,
    hostName: hostPlayer.name,
    maxPlayers: Math.min(100, Math.max(2, params.maxPlayers || 30)),
    players: [hostPlayer], // compatibility: roster is now stored in rooms/{id}/members
    memberCount: 1,
    status: 'WAITING',
    currentBallNumber: null,
    calledHistory: [],
    callIntervalSeconds: params.callSpeed || 5,
    maxNumber: 90,
    createdAt: Date.now()
  };
  // All three documents are created together; never leave an unjoinable room.
  const roomRef = doc(db, 'rooms', room.id);
  const memberRef = doc(db, 'rooms', room.id, 'members', hostPlayer.id);
  const stateRef = doc(db, 'rooms', room.id, 'state', 'current');
  const batch = writeBatch(db);
  batch.set(roomRef, room);
  batch.set(memberRef, { ...hostPlayer, tickets: [], isBot: false, joinedAt: serverTimestamp() });
  batch.set(stateRef, {
    status: 'WAITING', currentBallNumber: null, calledHistory: [], updatedAt: serverTimestamp()
  });
  try {
    await batch.commit();
  } catch (error) {
    const code = (error as {code?:string})?.code;
    throw new Error(code === 'permission-denied'
      ? 'Chưa được cấp quyền mở phòng. Cần cập nhật quy tắc truy cập máy chủ.'
      : code === 'unavailable' ? 'Kết nối đang gián đoạn. Hãy thử lại.'
      : 'Không tạo được phòng. Vui lòng thử lại.');
  }
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
  }, { merge: true });
}

export function subscribeToRoomMembers(roomId: string, onMembers: (players: PlayerState[]) => void,
  onError?: (error: FirestoreError) => void): () => void {
  const q = query(collection(db, 'rooms', roomId, 'members'), limit(100));
  return onSnapshot(q, snapshot => {
    onMembers(snapshot.docs.map(d => d.data() as PlayerState));
  }, err => onError?.(err));
}


/** Backfill a join timestamp once for a member from a pre-session release. */
export async function ensureRoomChatJoinTime(roomId: string, uid: string): Promise<void> {
  if (auth.currentUser?.uid !== uid) return;
  const ref = doc(db, 'rooms', roomId, 'members', uid);
  const snapshot = await getDocFromServer(ref);
  if (snapshot.exists() && !snapshot.data().joinedAt) {
    await updateDoc(ref, { joinedAt: serverTimestamp() });
  }
}

/**
 * Atomic membership join. Only a tiny memberCount changes on the room document;
 * a player's tickets/profile live solely in that player's members/{uid} document.
 * This avoids repeatedly uploading a 100-player roster on every join.
 */
export async function joinOnlineRoom(
  codeOrId: string, player: PlayerState, _passwordInput?: string
): Promise<{ success: boolean; room?: GameRoom; error?: string }> {
  try {
    if (!auth.currentUser || auth.currentUser.uid !== player.id) throw new Error('Bạn cần đăng nhập trước khi vào phòng.');
    const roomId = codeOrId.trim().toUpperCase();
    if (!/^LT[A-HJ-NP-Z2-9]{8,18}$/.test(roomId)) throw new Error('Mã phòng không hợp lệ. Hãy sao chép đúng mã mời.');
    const roomRef = doc(db, 'rooms', roomId);
    const stateRef = doc(db, 'rooms', roomId, 'state', 'current');
    const memberRef = doc(db, 'rooms', roomId, 'members', player.id);
    const result = await runTransaction(db, async tx => {
      // All reads MUST precede all writes in a Firestore transaction.
      const roomSnap = await tx.get(roomRef);
      const stateSnap = await tx.get(stateRef);
      const memberSnap = await tx.get(memberRef);
      if (!roomSnap.exists()) throw new Error('Phòng không tồn tại hoặc đã đóng.');
      const room = roomSnap.data() as GameRoom;
      if (!memberSnap.exists()) {
        if (!stateSnap.exists()) throw new Error('Phòng chưa sẵn sàng. Chủ phòng cần mở lại.');
        if (stateSnap.data().status !== 'WAITING') {
          throw new Error('Ván đang diễn ra. Hãy chờ chủ phòng mở ván mới.');
        }
        const count = Number.isInteger(room.memberCount) ? room.memberCount! : (room.players?.length || 1);
        if (count >= room.maxPlayers) throw new Error('Phòng đã đủ người chơi.');
        tx.set(memberRef, { ...player, tickets: [], isBot: false, isHost: room.hostId === player.id, joinedAt: serverTimestamp() });
        tx.update(roomRef, { memberCount: count + 1 });
      }
      return room;
    });
    return { success: true, room: result };
  } catch (err) {
    const code = (err as {code?: string})?.code || '';
    const message = err instanceof Error ? err.message : '';
    const expected = [
      'Bạn cần đăng nhập trước khi vào phòng.', 'Mã phòng không hợp lệ. Hãy sao chép đúng mã mời.',
      'Phòng không tồn tại hoặc đã đóng.', 'Phòng chưa sẵn sàng. Chủ phòng cần mở lại.',
      'Ván đang diễn ra. Hãy chờ chủ phòng mở ván mới.',
      'Phòng đã đủ người chơi.'
    ];
    return { success: false, error: expected.includes(message) ? message : code === 'permission-denied'
      ? 'Không có quyền vào phòng. Phiên đăng nhập hoặc quy tắc truy cập chưa hợp lệ.'
      : code === 'unavailable' ? 'Kết nối đang gián đoạn. Hãy kiểm tra mạng và thử lại.'
      : 'Chưa vào được phòng. Vui lòng thử lại.' };
  }
}

/** Leave atomically so a departed user frees one slot. Host leaving closes room. */
export async function leaveOnlineRoom(roomId: string, playerId: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== playerId) return;
  const roomRef = doc(db, 'rooms', roomId);
  const memberRef = doc(db, 'rooms', roomId, 'members', playerId);
  const stateRef = doc(db, 'rooms', roomId, 'state', 'current');
  await runTransaction(db, async tx => {
    const roomSnap = await tx.get(roomRef);
    const memberSnap = await tx.get(memberRef);
    const stateSnap = await tx.get(stateRef);
    if (!roomSnap.exists() || !memberSnap.exists()) return;
    const room = roomSnap.data() as GameRoom;
    if (room.hostId === playerId) {
      // Remaining clients observe room deletion and leave; nested historical messages
      // require optional scheduled backend cleanup (Firestore does not cascade-delete).
      tx.delete(memberRef);
      if (stateSnap.exists()) tx.delete(stateRef);
      tx.delete(roomRef);
    } else {
      const count = Number.isInteger(room.memberCount) ? room.memberCount! : (room.players?.length || 1);
      tx.delete(memberRef);
      tx.update(roomRef, { memberCount: Math.max(1, count - 1) });
    }
  });
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
