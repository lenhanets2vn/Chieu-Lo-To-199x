import {
  collection, doc, updateDoc, query, where,
  limit, orderBy, onSnapshot, addDoc, serverTimestamp, runTransaction,
  FirestoreError, writeBatch, getDocFromServer, getDocs, Timestamp, increment, setDoc
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
  countdownEndsAt?: number;
  // One audio event per transition, never a heartbeat or progress write.
  audioPhase?: 'idle' | 'intro' | 'number' | 'near_end' | 'outro';
  audioTrack?: string;
  audioStartedAt?: Timestamp;
  soundpackId?: string;
  roundId?: string;
}

/** One live room document: game + public roster summary + lobby metadata.
 * Private tickets remain in members/{uid}; they must never be copied into the shared document.
 */
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
    hostName: hostPlayer.name.slice(0, 48),
    maxPlayers: Math.min(100, Math.max(2, params.maxPlayers || 30)),
    players: [{ id: hostPlayer.id, name: hostPlayer.name.slice(0, 48),
      characterId: hostPlayer.characterId, isHost: true, isBot: false, tickets: [],
      isReady: false, hasKinh: false, score: 0 }], // minimal compatibility snapshot, not the roster
    roster: { [hostPlayer.id]: { name: hostPlayer.name.slice(0, 48), characterId: hostPlayer.characterId } },
    memberCount: 1,
    liveVersion: 2,
    gameRevision: 0,
    audioPhase: 'idle',
    status: 'WAITING',
    currentBallNumber: null,
    calledHistory: [],
    callIntervalSeconds: params.callSpeed || 5,
    maxNumber: 90,
    createdAt: Date.now()
  };
  // Atomic creation: 1 room + 1 private member; no third game-state document.
  const roomRef = doc(db, 'rooms', room.id);
  const memberRef = doc(db, 'rooms', room.id, 'members', hostPlayer.id);
  const batch = writeBatch(db);
  batch.set(roomRef, { ...room, updatedAt: serverTimestamp() });
  batch.set(memberRef, { ...hostPlayer, name: hostPlayer.name.slice(0, 48), tickets: [], isBot: false, joinedAt: serverTimestamp() });
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
  // Lobby must NOT listen to rooms while balls/music are being published.
  // Only waiting, joinable public rooms enter this query.
  const q = query(collection(db, 'rooms'), where('isPrivate', '==', false),
    where('status', '==', 'WAITING'), where('liveVersion', '==', 2), limit(20));
  return onSnapshot(q, { includeMetadataChanges: true }, snapshot => {
    onConnection?.(!snapshot.metadata.fromCache);
    onRoomsUpdate(snapshot.docs.map(d => d.data() as GameRoom).sort((a,b) => b.createdAt - a.createdAt));
  }, err => onError?.(err));
}

/** One onSnapshot only for room metadata, public roster and all gameplay events.
 * Avoid duplicate listeners on rooms/{id} and rooms/{id}/state/current.
 * Revision skips expensive game re-render when someone only joins/leaves.
 */
export function subscribeToLiveRoom(
  roomId: string,
  onRoom: (room: GameRoom | null) => void,
  onGame: (state: LiveRoomGame) => void,
  onError?: (error: FirestoreError) => void
): () => void {
  if (!roomId) return () => {};
  let lastMetadata = '';
  let lastGameRevision: number | null = null;
  return onSnapshot(doc(db, 'rooms', roomId), snapshot => {
    if (!snapshot.exists()) { onRoom(null); return; }
    const room = snapshot.data() as GameRoom;
    const metaKey = JSON.stringify([room.hostId, room.hostName, room.name, room.status,
      room.memberCount, room.roster]);
    if (metaKey !== lastMetadata) {
      lastMetadata = metaKey;
      onRoom(room);
    }
    if (lastGameRevision !== room.gameRevision) {
      lastGameRevision = room.gameRevision;
      onGame(room as LiveRoomGame);
    }
  }, err => onError?.(err));
}

// Serialize HOST writes per room so a song-start event cannot overtake its reveal.
// Queue holds no timer; it clears immediately after the last actual write.
const pendingLiveWrites = new Map<string, Promise<void>>();
function queueLiveWrite(roomId: string, update: object): Promise<void> {
  const previous = pendingLiveWrites.get(roomId) ?? Promise.resolve();
  const current = previous.catch(() => {}).then(() => updateDoc(doc(db, 'rooms', roomId), {
    ...update, updatedAt: serverTimestamp(), gameRevision: increment(1)
  }));
  pendingLiveWrites.set(roomId, current);
  const clear = () => { if (pendingLiveWrites.get(roomId) === current) pendingLiveWrites.delete(roomId); };
  current.then(clear, clear);
  return current;
}

/** One write for each meaningful gameplay transition, never a per-second tick. */
export async function publishRoomGameState(roomId: string, update: Partial<LiveRoomGame>): Promise<void> {
  if (!roomId) return;
  await queueLiveWrite(roomId, update);
}

/** Each audio event uses the SAME live document; one write per track change. */
export async function publishRoomAudioEvent(
  roomId: string, phase: 'intro' | 'number' | 'near_end' | 'outro',
  track: string, soundpackId: string, _firstNumber: boolean = false
): Promise<void> {
  if (!roomId) return;
  const liveStatus: GameStatus = phase === 'outro' ? 'GAME_OVER' : phase === 'intro' ? 'COUNTDOWN' : 'CALLING';
  await queueLiveWrite(roomId, {
    audioPhase: phase, audioTrack: track, audioStartedAt: serverTimestamp(),
    soundpackId, status: liveStatus
  });
}

/** Own member state is isolated: no player may edit another player's tickets. */
export async function publishOwnRoomTickets(roomId: string, player: PlayerState, tickets: LotoTicket[]): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== player.id) return;
  // Only the ticket and readiness changed. Do not rewrite the entire member
  // profile, joinedAt, or isHost during a round (especially after HOST handoff).
  await updateDoc(doc(db, 'rooms', roomId, 'members', player.id), {
    tickets: tickets.slice(0, 1), isReady: player.isReady
  });
}

export function subscribeToRoomMembers(roomId: string, onMembers: (players: PlayerState[]) => void,
  onError?: (error: FirestoreError) => void): () => void {
  const q = query(collection(db, 'rooms', roomId, 'members'), limit(100));
  return onSnapshot(q, snapshot => {
    onMembers(snapshot.docs.map(d => d.data() as PlayerState));
  }, err => onError?.(err));
}


/** Lightweight self membership listener. A guest does not need to load 100 tickets
 * just to see his own ticket/chat join-time. */
export function subscribeToOwnRoomMember(roomId: string, uid: string,
  onMember: (member: (PlayerState & { joinedAt?: Timestamp }) | null) => void,
  onError?: (error: FirestoreError) => void): () => void {
  return onSnapshot(doc(db, 'rooms', roomId, 'members', uid), snap => {
    if (!snap.exists() && snap.metadata.fromCache) return;
    onMember(snap.exists() ? snap.data() as (PlayerState & { joinedAt?: Timestamp }) : null);
  }, error => onError?.(error));
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
 * This updates the 100-player public roster only when someone joins/leaves.
 * Gameplay writes carry the same compact summary without private tickets.
 */
export async function joinOnlineRoom(
  codeOrId: string, player: PlayerState, _passwordInput?: string
): Promise<{ success: boolean; room?: GameRoom; error?: string }> {
  try {
    if (!auth.currentUser || auth.currentUser.uid !== player.id) throw new Error('Bạn cần đăng nhập trước khi vào phòng.');
    const roomId = codeOrId.trim().toUpperCase();
    if (!/^LT[A-HJ-NP-Z2-9]{8,18}$/.test(roomId)) throw new Error('Mã phòng không hợp lệ. Hãy sao chép đúng mã mời.');
    const roomRef = doc(db, 'rooms', roomId);
    const memberRef = doc(db, 'rooms', roomId, 'members', player.id);
    const result = await runTransaction(db, async tx => {
      const roomSnap = await tx.get(roomRef);
      const memberSnap = await tx.get(memberRef);
      if (!roomSnap.exists()) throw new Error('Phòng không tồn tại hoặc đã đóng.');
      const room = roomSnap.data() as GameRoom;
      if (!memberSnap.exists()) {
        if (room.liveVersion !== 2) throw new Error('Phòng thuộc phiên bản cũ. Vui lòng mở phòng mới.');
        if (room.status !== 'WAITING') {
          throw new Error('Ván đang diễn ra. Hãy chờ chủ phòng mở ván mới.');
        }
        const count = Number.isInteger(room.memberCount) ? room.memberCount! : (room.players?.length || 1);
        if (count >= room.maxPlayers) throw new Error('Phòng đã đủ người chơi.');
        tx.set(memberRef, { ...player, name: player.name.slice(0, 48), tickets: [], isBot: false, isHost: room.hostId === player.id, joinedAt: serverTimestamp() });
        tx.update(roomRef, { memberCount: count + 1,
          roster: { ...room.roster, [player.id]: { name: player.name.slice(0, 48), characterId: player.characterId } } });
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
      'Phòng thuộc phiên bản cũ. Vui lòng mở phòng mới.',
      'Ván đang diễn ra. Hãy chờ chủ phòng mở ván mới.',
      'Phòng đã đủ người chơi.'
    ];
    return { success: false, error: expected.includes(message) ? message : code === 'permission-denied'
      ? 'Không có quyền vào phòng. Phiên đăng nhập hoặc quy tắc truy cập chưa hợp lệ.'
      : code === 'unavailable' ? 'Kết nối đang gián đoạn. Hãy kiểm tra mạng và thử lại.'
      : 'Chưa vào được phòng. Vui lòng thử lại.' };
  }
}

/**
 * On a deliberate HOST exit, elect one existing member in the same transaction.
 * The state and room ID stay unchanged, so other devices remain connected.
 * Unexpected browser crashes still require a backend presence/lease solution.
 */
export async function leaveOnlineRoom(roomId: string, playerId: string, wasHost: boolean = false): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== playerId) return;
  const roomRef = doc(db, 'rooms', roomId);
  const memberRef = doc(db, 'rooms', roomId, 'members', playerId);
  // This small read occurs ONLY on explicit departure, never while idling.
  // A nominated successor is checked again inside the transaction to avoid races.
  const successors = wasHost
    ? await getDocs(query(collection(db, 'rooms', roomId, 'members'), limit(5))) : null;
  const nominated = successors?.docs.find(snapshot => snapshot.id !== playerId)?.id ?? null;
  await runTransaction(db, async tx => {
    const roomSnap = await tx.get(roomRef);
    const memberSnap = await tx.get(memberRef);
    if (!roomSnap.exists() || !memberSnap.exists()) return;
    const room = roomSnap.data() as GameRoom;
    const count = Number.isInteger(room.memberCount) ? room.memberCount! : (room.players?.length || 1);
    const nextRoster = { ...room.roster };
    delete nextRoster[playerId];
    if (room.hostId !== playerId) {
      tx.delete(memberRef);
      tx.update(roomRef, { memberCount: Math.max(1, count - 1), roster: nextRoster });
      return;
    }
    if (count > 1) {
      if (!nominated) throw new Error('Chưa tìm được người nhận quyền HOST. Hãy thử rời phòng lần nữa.');
      const successorRef = doc(db, 'rooms', roomId, 'members', nominated);
      const successor = await tx.get(successorRef);
      if (!successor.exists()) throw new Error('Người nhận HOST đã rời phòng. Hãy thử lại.');
      tx.update(successorRef, { isHost: true });
      tx.update(roomRef, { hostId: nominated, hostName: successor.data().name || 'Chủ phòng',
        memberCount: count - 1, roster: nextRoster });
      tx.delete(memberRef);
      return;
    }
    tx.delete(memberRef);
    tx.delete(roomRef);
  });
}

export interface RoomReactionDoc {
  id: string; senderId: string; senderName: string; emoji: string; label: string; timestamp: number;
}
export async function sendRoomReaction(roomId: string, reaction: Omit<RoomReactionDoc, 'id'|'timestamp'>): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== reaction.senderId) {
    throw new Error('Phiên đăng nhập không khớp; biểu cảm chưa được gửi.');
  }
  await addDoc(collection(db, 'rooms', roomId, 'reactions'), {
    ...reaction, timestamp: Date.now(), createdAt: serverTimestamp()
  });
}
export function subscribeToRoomReactions(roomId: string,
  onReactionReceived: (reaction: RoomReactionDoc) => void,
  onError?: (error: { code?: string }) => void): () => void {
  if (!roomId) return () => {};
  const q = query(collection(db, 'rooms', roomId, 'reactions'), orderBy('createdAt', 'desc'), limit(10));
  const seen = new Set<string>();
  let firstSnapshot = true;
  return onSnapshot(q, snapshot => {
    const initial = firstSnapshot;
    firstSnapshot = false;
    snapshot.docChanges().forEach(change => {
      if (change.type !== 'added' || seen.has(change.doc.id)) return;
      seen.add(change.doc.id);
      const data = change.doc.data();
      // The original filter compared two players' local clocks. Even a small
      // device clock difference could make real-time reactions disappear.
      // Only suppress old reactions in the initial history snapshot. All new
      // added events received after subscribing are immediately animated.
      const createdAt = data.createdAt instanceof Timestamp
        ? data.createdAt.toMillis() : Number(data.timestamp) || 0;
      if (initial && Math.abs(Date.now() - createdAt) > 12000) return;
      onReactionReceived({ id: change.doc.id, senderId: data.senderId,
        senderName: data.senderName, emoji: data.emoji, label: data.label, timestamp: createdAt });
    });
  }, err => { console.warn('Room reaction listener:', err.code); onError?.(err); });
}


/** One KINH event per button-press; host verifies it against member ticket and called numbers. */
export interface RoomKinhClaim {
  senderId: string;
  numbers: number[];
  roundId: string;
}
export async function sendRoomKinhClaim(roomId: string, senderId: string, numbers: number[], roundId: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== senderId) throw new Error('Chưa đăng nhập.');
  if (numbers.length !== 5 || new Set(numbers).size !== 5 || numbers.some(n => !Number.isInteger(n) || n < 1 || n > 90)) {
    throw new Error('Bộ số KINH không hợp lệ.');
  }
  if (!/^[0-9a-f-]{36}$/.test(roundId)) throw new Error('Chưa có mã ván hợp lệ.');
  // A deterministic doc id prevents repeated claims by the same player/round.
  await setDoc(doc(db, 'rooms', roomId, 'claims', `${roundId}_${senderId}`), {
    senderId, roundId, numbers: [...numbers], createdAt: serverTimestamp()
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
          && typeof data.senderId === 'string' && typeof data.roundId === 'string'
          && Array.isArray(data.numbers)) {
        onClaim({ senderId: data.senderId, roundId: data.roundId, numbers: data.numbers });
      }
    });
  }, error => console.warn('Lỗi nhận KINH trong phòng:', error.code));
}
