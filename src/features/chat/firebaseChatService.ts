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
import type { Database } from 'firebase/database';
import { ref as rtRef, set as rtSet, get as rtGet, push as rtPush, query as rtQuery, orderByChild, startAt, limitToLast, onChildAdded, onChildRemoved, onValue, serverTimestamp as rtServerTimestamp } from 'firebase/database';
import { ChatMessage, renderChatEmojiCodes } from './yahooEmojis';
import { validateAndFilterChatMessage, FilterResult } from './profanityFilter';

/** World chat is lazy. An RTDB permission/transport error causes ONE session-
 * scoped switch to Firestore; never run both listeners in parallel. The fallback
 * is cached so reopening the chat does not repeat server session writes. */
type WorldTransport = 'rtdb' | 'firestore';
// Select one public transport for the whole deployment. A site administrator can
// force Firestore during a rules outage so all users see the SAME chat channel.
// Normally, configured RTDB is preferred and SDK reconnection is automatic.
const configuredWorldTransport: WorldTransport =
  String(import.meta.env.VITE_WORLD_CHAT_TRANSPORT || '').toLowerCase() === 'firestore'
    ? 'firestore' : (realtimeConfigured ? 'rtdb' : 'firestore');
let worldTransport: WorldTransport = configuredWorldTransport;
let rtdbChatConnected = false;
let worldTransportUid: string | null = null;
let firestoreWorldSessionPromise: Promise<Timestamp> | null = null;
let chatRealtimeListeners = 0;
export function isRealtimeWorldChatSubscribed(): boolean { return chatRealtimeListeners > 0; }

function checkWorldUser(uid: string): void {
  if (auth.currentUser?.uid !== uid || auth.currentUser.isAnonymous) {
    throw new Error('Cần đăng nhập.');
  }
  if (worldTransportUid !== uid) {
    worldTransportUid = uid;
    worldTransport = configuredWorldTransport;
    firestoreWorldSessionPromise = null;
  }
}

function getFirestoreWorldSession(uid: string): Promise<Timestamp> {
  checkWorldUser(uid);
  if (!firestoreWorldSessionPromise) {
    firestoreWorldSessionPromise = (async () => {
      const sessionRef = doc(db, 'chat_sessions', uid);
      await setDoc(sessionRef, { uid, joinedAt: serverTimestamp() });
      const snapshot = await getDocFromServer(sessionRef);
      const timestamp = snapshot.data()?.joinedAt;
      if (!(timestamp instanceof Timestamp)) throw new Error('Không thể mở phiên chat dự phòng.');
      return timestamp;
    })().catch(error => {
      firestoreWorldSessionPromise = null; // Explicit user retry may try again.
      throw error;
    });
  }
  return firestoreWorldSessionPromise;
}

// Wait for an actual RTDB connection BEFORE writing the session. If the page
// loses Wi-Fi while opening the chat, do not queue a write indefinitely. This
// watcher is local connectivity metadata, not a billable messages listener.
function waitForChatSocket(rtdb: Database, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    let done = false;
    let stop: (() => void) | undefined;
    let timer: ReturnType<typeof setTimeout>;
    const finish = (reason?: Error) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      stop?.();
      reason ? reject(reason) : resolve();
    };
    const abort = () => finish(new Error('Chat session canceled'));
    if (signal?.aborted) { reject(new Error('Chat session canceled')); return; }
    signal?.addEventListener('abort', abort, { once: true });
    timer = setTimeout(() => finish(new Error('Kết nối trò chuyện quá thời gian chờ.')), 12_000);
    try {
      stop = onValue(rtRef(rtdb, '.info/connected'), snap => {
        if (snap.val() === true) finish();
      }, error => finish(error));
      if (done) stop(); // onValue may deliver cached state immediately
    } catch (error) { finish(error as Error); }
  });
}

function isPermanentChatAccessError(error: unknown): boolean {
  const code = String((error as { code?: string })?.code || (error as Error)?.message || '').toLowerCase();
  return code.includes('permission_denied') || code.includes('permission-denied') ||
    code.includes('unauthorized') || code.includes('database not found');
}

export async function beginWorldChatSession(uid: string, signal?: AbortSignal): Promise<Timestamp> {
  checkWorldUser(uid);
  if (worldTransport === 'rtdb') {
    try {
      const rtdb = realtimeDatabase();
      // SDK reconnects itself; no goOffline/goOnline cycling here.
      await waitForChatSocket(rtdb, signal);
      if (signal?.aborted) throw new Error('Chat session canceled');
      const sessionRef = rtRef(rtdb, `worldChatSessions/${uid}`);
      await rtSet(sessionRef, rtServerTimestamp());
      if (signal?.aborted) throw new Error('Chat session canceled');
      const session = await rtGet(sessionRef);
      if (typeof session.val() !== 'number') throw new Error('Phiên trò chuyện chưa có mốc thời gian.');
      return Timestamp.fromMillis(session.val());
    } catch (error) {
      if (signal?.aborted) throw error;
      // A transient network failure must NOT silently split users between
      // different backends. Only an explicit access denial triggers fallback.
      if (!isPermanentChatAccessError(error)) throw error;
      console.warn('World-chat access was rejected; using configured fallback.');
      worldTransport = 'firestore';
    }
  }
  if (signal?.aborted) throw new Error('Chat session canceled');
  return getFirestoreWorldSession(uid);
}

function subscribeToFirestoreWorldChat(
  onMessagesUpdate: (messages: ChatMessage[]) => void,
  joinedAt: Timestamp,
  onError?: (error: FirestoreError) => void,
  onConnection?: (fromServer: boolean) => void,
  resumeFrom?: Timestamp
): () => void {
  const earliest = resumeFrom && resumeFrom.toMillis() > joinedAt.toMillis() ? resumeFrom : joinedAt;
  const q = query(collection(db, 'world_messages'), where('createdAt', '>=', earliest),
    orderBy('createdAt', 'desc'), limit(40));
  return onSnapshot(q, { includeMetadataChanges: false }, snapshot => {
    onConnection?.(!snapshot.metadata.fromCache);
    const messages: ChatMessage[] = [];
    snapshot.forEach(item => {
      const data = item.data();
      messages.push({
        id: item.id, senderId: data.senderId || 'unknown',
        senderName: data.senderName || 'Hội viên', characterId: data.characterId || 'chi_ba',
        avatar: data.avatar, text: renderChatEmojiCodes(data.text || ''),
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt : undefined,
        timestamp: data.createdAt?.toMillis?.() || (typeof data.timestamp === 'number' ? data.timestamp : Date.now()),
        channel: 'world', isBuzz: Boolean(data.isBuzz),
        isVipEmoji: typeof data.isVipEmoji === 'string' ? data.isVipEmoji : undefined
      });
    });
    onMessagesUpdate(messages.reverse());
  }, error => onError?.(error));
}

/** Query at most 40 recent messages, never load messages before login/chat start. */
export function subscribeToWorldChat(
  onMessagesUpdate: (messages: ChatMessage[]) => void,
  joinedAt: Timestamp,
  onError?: (error: FirestoreError) => void,
  onConnection?: (fromServer: boolean) => void,
  resumeFrom?: Timestamp
): () => void {
  const uid = auth.currentUser?.uid;
  if (!uid) { onError?.(new Error('Cần đăng nhập.') as FirestoreError); return () => {}; }
  checkWorldUser(uid);
  let closed = false;
  let fallbackStarted = false;
  let hasChatCount = false;
  let stopFirestore: (() => void) | null = null;
  const rtdbUnsubs: Array<() => void> = [];
  const stopRtdb = () => {
    while (rtdbUnsubs.length) rtdbUnsubs.pop()?.();
  };
  const fallback = (failure: unknown) => {
    if (closed || fallbackStarted) return;
    fallbackStarted = true;
    worldTransport = 'firestore';
    rtdbChatConnected = false;
    stopRtdb();
    if (hasChatCount) {
      chatRealtimeListeners = Math.max(0, chatRealtimeListeners - 1);
      hasChatCount = false;
    }
    onConnection?.(false);
    console.warn('RTDB world-chat read failed; using one Firestore fallback listener:',
      (failure as { code?: string })?.code || 'unavailable');
    void getFirestoreWorldSession(uid).then(fallbackJoinedAt => {
      if (closed) return;
      // A new session timestamp is mandatory under Firestore Security Rules.
      stopFirestore = subscribeToFirestoreWorldChat(onMessagesUpdate, fallbackJoinedAt,
        onError, onConnection);
    }).catch(error => { if (!closed) onError?.(error as FirestoreError); });
  };
  if (worldTransport !== 'rtdb') {
    // Fallback session may have been initialized by a previous subscription.
    void getFirestoreWorldSession(uid).then(fallbackJoinedAt => {
      if (closed) return;
      stopFirestore = subscribeToFirestoreWorldChat(onMessagesUpdate, fallbackJoinedAt,
        onError, onConnection, resumeFrom);
    }).catch(error => { if (!closed) onError?.(error as FirestoreError); });
    return () => { closed = true; stopFirestore?.(); };
  }
  try {
    const rtdb = realtimeDatabase();
    const earliest = Math.max(joinedAt.toMillis(), resumeFrom?.toMillis() ?? 0);
    const messagesQuery = rtQuery(rtRef(rtdb, 'worldMessages'),
      orderByChild('timestamp'), startAt(earliest), limitToLast(40));
    const cache = new Map<string, ChatMessage>();
    let queued = false;
    const flush = () => {
      if (queued || closed || fallbackStarted) return;
      queued = true;
      queueMicrotask(() => {
        queued = false;
        if (!closed && !fallbackStarted) onMessagesUpdate(
          [...cache.values()].sort((a,b) => a.timestamp - b.timestamp).slice(-40));
      });
    };
    chatRealtimeListeners++;
    hasChatCount = true;
    const added = onChildAdded(messagesQuery, snapshot => {
      const value = snapshot.val();
      if (!value || !snapshot.key) return;
      const when = Number(value.timestamp) || Date.now();
      cache.set(snapshot.key, {
        id: snapshot.key, senderId: String(value.senderId || ''),
        senderName: String(value.senderName || 'Hội viên'),
        characterId: String(value.characterId || 'chi_ba'),
        text: renderChatEmojiCodes(String(value.text || '')), timestamp: when,
        createdAt: Timestamp.fromMillis(when), channel: 'world',
        isVipEmoji: typeof value.isVipEmoji === 'string' ? value.isVipEmoji : undefined
      });
      flush();
    }, fallback);
    rtdbUnsubs.push(added);
    rtdbUnsubs.push(onChildRemoved(messagesQuery, snapshot => {
      cache.delete(snapshot.key || ''); flush();
    }));
    // .info/connected can briefly be false while Wi-Fi changes. Do not tear
    // down listeners or display a hard error: the SDK will reconnect itself.
    let disconnectedTimer: ReturnType<typeof setTimeout> | null = null;
    rtdbUnsubs.push(() => { if (disconnectedTimer) clearTimeout(disconnectedTimer); });
    rtdbUnsubs.push(onValue(rtRef(rtdb, '.info/connected'), snapshot => {
      const connected = snapshot.val() === true;
      rtdbChatConnected = connected;
      if (disconnectedTimer) { clearTimeout(disconnectedTimer); disconnectedTimer = null; }
      if (connected) {
        onConnection?.(true);
      } else {
        disconnectedTimer = setTimeout(() => {
          disconnectedTimer = null;
          if (!closed && !fallbackStarted) onConnection?.(false);
        }, 1800);
      }
    }, fallback));
  } catch (error) { fallback(error); }
  return () => {
    closed = true;
    stopRtdb();
    stopFirestore?.();
    if (hasChatCount) chatRealtimeListeners = Math.max(0, chatRealtimeListeners - 1);
    // Unsubscribing is sufficient. The SDK naturally idles unused connections;
    // goOffline() affects ALL RTDB features and caused repeated chat outages.
    if (chatRealtimeListeners === 0) rtdbChatConnected = false;
  };
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
    if (worldTransport === 'rtdb' && realtimeConfigured) {
      // Do not queue a message indefinitely on a disconnected socket: users
      // could tap Send again and later receive duplicates after reconnection.
      if (!rtdbChatConnected) return {
        allowed: false, filteredText: filter.filteredText,
        reason: 'Kênh trò chuyện đang kết nối lại. Vui lòng thử gửi sau.'
      };
      const rtdb = realtimeDatabase();
      const messageRef = rtPush(rtRef(rtdb, 'worldMessages'));
      await rtSet(messageRef, {
        senderId: sender.id, senderName: sender.name.slice(0, 48),
        characterId: sender.characterId.slice(0, 48), text: renderChatEmojiCodes(filter.filteredText),
        isVipEmoji: isVipEmoji || '', timestamp: rtServerTimestamp()
      });
      return filter;
    }
    // Firestore fallback must establish its own server-sided start time once.
    await getFirestoreWorldSession(sender.id);
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
