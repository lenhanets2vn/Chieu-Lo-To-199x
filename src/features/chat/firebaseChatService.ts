import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, FirestoreError, Timestamp, where } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { ChatMessage, renderChatEmojiCodes } from './yahooEmojis';
import { validateAndFilterChatMessage, FilterResult } from './profanityFilter';

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
  const filter = validateAndFilterChatMessage(sender.id, rawText);
  if (!filter.allowed) {
    return filter;
  }

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
