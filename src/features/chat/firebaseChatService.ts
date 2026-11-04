import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  FirestoreError
} from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { ChatMessage } from './yahooEmojis';
import { validateAndFilterChatMessage, FilterResult } from './profanityFilter';

/**
 * Subscribe to real-time World chat messages with low latency.
 * Uses limit(40) and orderBy('createdAt', 'desc') to optimize read quotas.
 */
export function subscribeToWorldChat(
  onMessagesUpdate: (messages: ChatMessage[]) => void,
  onError?: (error: FirestoreError) => void,
  onConnection?: (fromServer: boolean) => void
): () => void {
  const worldRef = collection(db, 'world_messages');
  const q = query(worldRef, orderBy('createdAt', 'desc'), limit(40));

  return onSnapshot(
    q, { includeMetadataChanges: true },
    (snapshot) => {
      onConnection?.(!snapshot.metadata.fromCache);
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
          timestamp: typeof data.timestamp === 'number' ? data.timestamp : (data.timestamp?.toMillis?.() || Date.now()),
          channel: 'world',
          isBuzz: data.isBuzz || false
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
    const worldRef = collection(db, 'world_messages');
    await addDoc(worldRef, {
      senderId: sender.id,
      senderName: sender.name,
      characterId: sender.characterId,
      avatar: sender.avatar || '',
      text: filter.filteredText,
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
      reason: `Không gửi được tin nhắn thế giới: ${(error as {code?: string})?.code || 'lỗi kết nối'}. Kiểm tra Firestore Rules và database.`
    };
  }
}

/**
 * Subscribe to in-room chat messages.
 */
export function subscribeToRoomChat(
  roomId: string,
  onMessagesUpdate: (messages: ChatMessage[]) => void,
  onError?: (error: FirestoreError) => void,
  onConnection?: (fromServer: boolean) => void
): () => void {
  if (!roomId) return () => {};
  const roomMsgRef = collection(db, 'rooms', roomId, 'messages');
  const q = query(roomMsgRef, orderBy('createdAt', 'desc'), limit(40));

  return onSnapshot(
    q, { includeMetadataChanges: true },
    (snapshot) => {
      onConnection?.(!snapshot.metadata.fromCache);
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
          timestamp: typeof data.timestamp === 'number' ? data.timestamp : (data.timestamp?.toMillis?.() || Date.now()),
          channel: 'room',
          isBuzz: data.isBuzz || false
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
      avatar: sender.avatar || '',
      text: filter.filteredText,
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
      reason: `Không gửi được tin phòng: ${(error as {code?: string})?.code || 'lỗi kết nối'}. Kiểm tra quyền thành viên.`
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
