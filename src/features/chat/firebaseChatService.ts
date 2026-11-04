import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  FirestoreError, Timestamp, doc, setDoc, getDocFromServer, where
} from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { realtimeConfigured, realtimeDatabase } from '../../services/realtime';
import { ref as rtRef, set as rtSet, get as rtGet, push as rtPush, query as rtQuery, orderByChild, startAt, limitToLast, onChildAdded, onChildRemoved, onValue, serverTimestamp as rtServerTimestamp } from 'firebase/database';
import { ChatMessage, renderChatEmojiCodes } from './yahooEmojis';
import { validateAndFilterChatMessage, FilterResult } from './profanityFilter';

/** One write + one server read per signed-in browser session; no heartbeat.
 * Used as a server-sourced lower bound for world-chat visibility.
 * Never persist this across new page opens.
 */
export async function beginWorldChatSession(uid: string): Promise<Timestamp> {
  if (auth.currentUser?.uid !== uid || auth.currentUser.isAnonymous) throw new Error('Cần đăng nhập.');
  if (realtimeConfigured) {
    const sessionRef = rtRef(realtimeDatabase(), `worldChatSessions/${uid}`);
    await rtSet(sessionRef, rtServerTimestamp());
    const session = await rtGet(sessionRef);
    if (typeof session.val() !== 'number') throw new Error('Không thể mở phiên trò chuyện.');
    return Timestamp.fromMillis(session.val());
  }
  const ref = doc(db, 'chat_sessions', uid);
  await setDoc(ref, { uid, joinedAt: serverTimestamp() });
  const snapshot = await getDocFromServer(ref);
  const timestamp = snapshot.data()?.joinedAt;
  if (!(timestamp instanceof Timestamp)) throw new Error('Không thể bắt đầu phiên trò chuyện.');
  return timestamp;
}

/**
 * Subscribe to real-time World chat messages with low latency.
 * Uses limit(40) and orderBy('createdAt', 'desc') to optimize read quotas.
 */
export function subscribeToWorldChat(
  onMessagesUpdate: (messages: ChatMessage[]) => void,
  joinedAt: Timestamp,
  onError?: (error: FirestoreError) => void,
  onConnection?: (fromServer: boolean) => void,
  resumeFrom?: Timestamp
): () => void {
  if (realtimeConfigured) {
    const rtdb = realtimeDatabase();
    const earliest = Math.max(joinedAt.toMillis(), (resumeFrom?.toMillis() ?? 0));
    const messagesQuery = rtQuery(rtRef(rtdb, 'worldMessages'), orderByChild('timestamp'), startAt(earliest), limitToLast(40));
    const cache = new Map<string, ChatMessage>();
    let queued = false;
    const flush = () => {
      if (queued) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        onMessagesUpdate([...cache.values()].sort((a,b) => a.timestamp-b.timestamp).slice(-40));
      });
    };
    const unsubAdded = onChildAdded(messagesQuery, snapshot => {
      const v = snapshot.val();
      if (!v || !snapshot.key) return;
      const when = Number(v.timestamp) || Date.now();
      cache.set(snapshot.key, { id: snapshot.key, senderId: String(v.senderId || ''),
        senderName: String(v.senderName || 'Hội viên'), characterId: String(v.characterId || 'chi_ba'),
        text: renderChatEmojiCodes(String(v.text || '')), timestamp: when,
        createdAt: Timestamp.fromMillis(when), channel: 'world',
        isVipEmoji: typeof v.isVipEmoji === 'string' ? v.isVipEmoji : undefined });
      flush();
    }, error => onError?.(error as FirestoreError));
    const unsubRemoved = onChildRemoved(messagesQuery, snap => { cache.delete(snap.key || ''); flush(); });
    const unsubConnection = onValue(rtRef(rtdb, '.info/connected'), snap => onConnection?.(snap.val() === true));
    return () => { unsubAdded(); unsubRemoved(); unsubConnection(); cache.clear(); };
  }
  const worldRef = collection(db, 'world_messages');
  // Retain the mandatory session lower bound for privacy Rules. On reconnect,
  // also restrict to the newest timestamp already held in React memory.
  const q = resumeFrom
    ? query(worldRef, where('createdAt', '>=', joinedAt), where('createdAt', '>=', resumeFrom),
      orderBy('createdAt', 'desc'), limit(40))
    : query(worldRef, where('createdAt', '>=', joinedAt), orderBy('createdAt', 'desc'), limit(40));

  return onSnapshot(
    q, { includeMetadataChanges: true },
    (snapshot) => {
      onConnection?.(!snapshot.metadata.fromCache);
      // Metadata-only updates are not new messages: avoid needless React renders.
      if (snapshot.docChanges().length === 0) return;
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          senderId: data.senderId || 'unknown',
          senderName: data.senderName || 'Khách vãng lai',
          characterId: data.characterId || 'chi_ba',
          avatar: data.avatar,
          text: data.text || '',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : undefined,
          timestamp: data.createdAt?.toMillis?.() || (typeof data.timestamp === 'number' ? data.timestamp : Date.now()),
          channel: 'world',
          isBuzz: data.isBuzz || false,
          isVipEmoji: typeof data.isVipEmoji === 'string' ? data.isVipEmoji : undefined
        });
      });
      // Reverse so oldest is top, newest is bottom
      onMessagesUpdate(msgs.reverse());
    },
    (err) => {
      console.warn('World chat subscription error:', err);
      onError?.(err);
    }
  );
}

/**
 * Send a message to the Global World Chat.
 * Validates through profanity & spam filter before write.
 */
export async function sendWorldChatMessage(
  sender: { id: string; name: string; characterId: string; avatar?: string },
  rawText: string,
  isVipEmoji?: string
): Promise<FilterResult> {
  if (!auth.currentUser || auth.currentUser.uid !== sender.id) return { allowed: false, filteredText: '', reason: 'Chưa xác thực tài khoản.' };
  const filter = validateAndFilterChatMessage(sender.id, rawText, 'world');
  if (!filter.allowed) {
    return filter;
  }

  try {
    if (realtimeConfigured) {
      const messageRef = rtPush(rtRef(realtimeDatabase(), 'worldMessages'));
      await rtSet(messageRef, {
        senderId: sender.id, senderName: sender.name.slice(0, 48),
        characterId: sender.characterId.slice(0, 48), text: renderChatEmojiCodes(filter.filteredText),
        isVipEmoji: isVipEmoji || '', timestamp: rtServerTimestamp()
      });
      return filter;
    }
    const worldRef = collection(db, 'world_messages');
    await addDoc(worldRef, {
      senderId: sender.id,
      senderName: sender.name,
      characterId: sender.characterId,
      avatar: sender.avatar && !sender.avatar.startsWith('data:') ? sender.avatar.slice(0, 2048) : '',
      text: renderChatEmojiCodes(filter.filteredText),
      timestamp: Date.now(),
      channel: 'world',
      isVipEmoji: isVipEmoji || null,
      createdAt: serverTimestamp()
    });
    return filter;
  } catch (error) {
    console.error('Error sending world chat message:', error);
    return {
      allowed: false,
      filteredText: filter.filteredText,
      reason: 'Không gửi được tin nhắn. Kiểm tra mạng và thử lại.'
    };
  }
}

/**
 * Subscribe to in-room chat messages.
 */
export function subscribeToRoomChat(
  roomId: string,
  onMessagesUpdate: (messages: ChatMessage[]) => void,
  joinedAt: Timestamp,
  onError?: (error: FirestoreError) => void,
  onConnection?: (fromServer: boolean) => void,
  resumeFrom?: Timestamp
): () => void {
  if (!roomId) return () => {};
  const roomMsgRef = collection(db, 'rooms', roomId, 'messages');
  const q = resumeFrom
    ? query(roomMsgRef, where('createdAt', '>=', joinedAt), where('createdAt', '>=', resumeFrom),
      orderBy('createdAt', 'desc'), limit(40))
    : query(roomMsgRef, where('createdAt', '>=', joinedAt), orderBy('createdAt', 'desc'), limit(40));

  return onSnapshot(
    q, { includeMetadataChanges: true },
    (snapshot) => {
      onConnection?.(!snapshot.metadata.fromCache);
      // Metadata-only updates are not new messages: avoid needless React renders.
      if (snapshot.docChanges().length === 0) return;
      const msgs: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          senderId: data.senderId || 'unknown',
          senderName: data.senderName || 'Hội viên',
          characterId: data.characterId || 'cu_teo',
          avatar: data.avatar,
          text: data.text || '',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : undefined,
          timestamp: data.createdAt?.toMillis?.() || (typeof data.timestamp === 'number' ? data.timestamp : Date.now()),
          channel: 'room',
          isBuzz: data.isBuzz || false,
          isVipEmoji: typeof data.isVipEmoji === 'string' ? data.isVipEmoji : undefined
        });
      });
      onMessagesUpdate(msgs.reverse());
    },
    (err) => {
      console.warn(`Room ${roomId} chat subscription error:`, err);
      onError?.(err);
    }
  );
}

/**
 * Send a message inside a specific Game Room.
 */
export async function sendRoomChatMessage(
  roomId: string,
  sender: { id: string; name: string; characterId: string; avatar?: string },
  rawText: string,
  isVipEmoji?: string
): Promise<FilterResult> {
  if (!auth.currentUser || auth.currentUser.uid !== sender.id) return { allowed: false, filteredText: '', reason: 'Chưa xác thực tài khoản.' };
  const filter = validateAndFilterChatMessage(sender.id, rawText, 'room');
  if (!filter.allowed) {
    return filter;
  }

  if (!auth.currentUser || auth.currentUser.uid !== sender.id) return { allowed: false, filteredText: '', reason: 'Chưa xác thực tài khoản.' };
  try {
    const roomMsgRef = collection(db, 'rooms', roomId, 'messages');
    await addDoc(roomMsgRef, {
      senderId: sender.id,
      senderName: sender.name,
      characterId: sender.characterId,
      avatar: sender.avatar && !sender.avatar.startsWith('data:') ? sender.avatar.slice(0, 2048) : '',
      text: renderChatEmojiCodes(filter.filteredText),
      timestamp: Date.now(),
      channel: 'room',
      isVipEmoji: isVipEmoji || null,
      createdAt: serverTimestamp()
    });
    return filter;
  } catch (error) {
    console.error('Error sending room chat message:', error);
    return {
      allowed: false,
      filteredText: filter.filteredText,
      reason: 'Không gửi được tin nhắn trong phòng. Vui lòng thử lại.'
    };
  }
}

/**
 * Send a Buzz notification to the room.
 */
export async function sendRoomBuzz(
  roomId: string,
  sender: { id: string; name: string; characterId: string }
): Promise<void> {
  if (!auth.currentUser || auth.currentUser.uid !== sender.id) return;
  try {
    const roomMsgRef = collection(db, 'rooms', roomId, 'messages');
    await addDoc(roomMsgRef, {
      senderId: sender.id,
      senderName: sender.name,
      characterId: sender.characterId,
      text: 'BUZZ!',
      timestamp: Date.now(),
      channel: 'room',
      isBuzz: true,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.warn('Error sending buzz to room:', error);
  }
}
