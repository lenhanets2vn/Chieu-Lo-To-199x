/** Spark admission gate: at most 90 RTDB active slots, reserving headroom for retries.
 * Queue uses Firestore WITHOUT a persistent RTDB socket. Active slots disappear
 * through server-side RTDB onDisconnect even on browser crashes.
 * This is a best-effort FIFO: a malicious client can ignore the UI, but cannot
 * exceed 90 active slots using the bounded RTDB keyspace (0..89).
 */
import { collection, deleteDoc, doc, getDoc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, type Timestamp } from 'firebase/firestore';
import { get, onDisconnect, onValue, ref, remove, serverTimestamp as rtServerTimestamp, set, type DatabaseReference } from 'firebase/database';
import { auth, db } from '../../services/firebase';
import { realtimeDatabase } from '../../services/realtime';

export type AdmissionState = {
  status: 'connecting' | 'waiting' | 'active' | 'error';
  position?: number;
  message?: string;
};
const STALE_AFTER_MS = 8 * 60_000;

function awaitConnection(): Promise<void> {
  const rtdb = realtimeDatabase();
  return new Promise((resolve, reject) => {
    let settled = false;
    let stop = () => {};
    const timer = window.setTimeout(() => finish(new Error('Kết nối quá thời gian chờ.')), 9000);
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      stop();
      error ? reject(error) : resolve();
    };
    stop = onValue(ref(rtdb, '.info/connected'), s => { if (s.val() === true) finish(); }, e => finish(e));
    if (settled) stop();
  });
}

export function startOnlineAdmission(uid: string, notify: (state: AdmissionState) => void): () => void {
  const waitingRef = doc(db, 'online_waiting', uid);
  const SLOT_COUNT = 90; // Bounded keyspace enforced by database.rules.json (0..89).
  let stopped = false;
  let admitted = false;
  let trying = false;
  let queueLeader = false;
  let stopQueue: (() => void) | null = null;
  let stopActiveConnection: (() => void) | null = null;
  let retryTimer: ReturnType<typeof setInterval> | undefined;
  let leaseTimer: ReturnType<typeof setInterval> | undefined;
  const rtdb = realtimeDatabase();
  const activeRoot = ref(rtdb, 'admission/active');
  const claimRef = ref(rtdb, `admission/claims/${uid}`);
  let occupiedSlot: DatabaseReference | null = null;
  const validUser = () => !stopped && auth.currentUser?.uid === uid;

  const attempt = async () => {
    if (!validUser() || !queueLeader || admitted || trying) return;
    trying = true;
    try {
      await awaitConnection();
      if (!validUser()) return;
      // Read at most 90 tiny public admission records once per attempt. A client
      // cannot bypass the 90-seat cap: only keys 0..89 are legal in Rules, and
      // each key is create-only until its owner disconnects.
      const snapshot = await get(activeRoot);
      if (!validUser()) return;
      const busy = new Set<string>(Object.keys((snapshot.val() || {}) as Record<string, unknown>));
      const offset = Math.floor(Math.random() * SLOT_COUNT);
      const candidates = Array.from({ length: SLOT_COUNT }, (_, n) => String((offset + n) % SLOT_COUNT))
        .filter(index => !busy.has(index));
      let claimed = false;
      let lastError: unknown = null;
      // Only a few writes in a rare race; free-slot visibility is not a
      // security guarantee, the RTDB Rules enforce atomic create-only writes.
      for (const index of candidates.slice(0, 12)) {
        if (!validUser()) return;
        const candidate = ref(rtdb, `admission/active/${index}`);
        try {
          // One claim per account. While a user owns an active slot their
          // mapping cannot be changed to reserve a second slot.
          await set(claimRef, index);
          // Register server-side cleanup first; deletion of an empty slot is
          // allowed, but only the owner may delete an occupied slot.
          await onDisconnect(candidate).remove();
          await set(candidate, { uid, connectedAt: rtServerTimestamp() });
          occupiedSlot = candidate;
          claimed = true;
          break;
        } catch (error) {
          lastError = error;
          await onDisconnect(candidate).cancel().catch(() => {});
        }
      }
      if (!claimed || !occupiedSlot) {
        // Full capacity or a server-side permission/network issue: stay queued.
        if (candidates.length > 0 && lastError) console.warn('Không chiếm được chỗ chơi:', lastError);
        throw new Error(candidates.length === 0 ? 'Phòng chơi đang đủ người.' : 'Không chiếm được chỗ chơi.');
      }
      if (!validUser()) { await remove(occupiedSlot).catch(() => {}); occupiedSlot = null; return; }
      admitted = true;
      notify({ status: 'active' });
      stopQueue?.(); stopQueue = null;
      if (retryTimer) clearInterval(retryTimer);
      if (leaseTimer) clearInterval(leaseTimer);
      void deleteDoc(waitingRef).catch(() => {});
      // onDisconnect removes the slot server-side. A recovered socket must
      // NEVER keep playing without obtaining a fresh slot and queue position.
      stopActiveConnection?.();
      stopActiveConnection = onValue(ref(rtdb, '.info/connected'), snapshot => {
        if (!validUser() || !admitted || snapshot.val() !== false) return;
        stopActiveConnection?.(); stopActiveConnection = null;
        admitted = false;
        notify({ status: 'connecting', message: 'Mất kết nối. Đang chờ được vào lại…' });
        void start();
      });
    } catch (e) {
      if (!validUser()) return;
      // A full DB is expected; other errors are retried, not exposed as backend names.
      notify({ status: 'waiting', message: 'Hệ thống đang đủ người. Bạn đang ở hàng chờ.' });
      if (occupiedSlot) await onDisconnect(occupiedSlot).cancel().catch(() => {});
      // RTDB manages the socket; never disconnect unrelated chat listeners.
    } finally { trying = false; }
  };

  const start = async () => {
    try {
      notify({ status: 'connecting' });
      const current = await getDoc(waitingRef);
      if (!validUser()) return;
      if (current.exists()) await updateDoc(waitingRef, { lastSeen: serverTimestamp() });
      else await setDoc(waitingRef, { joinedAt: serverTimestamp(), lastSeen: serverTimestamp() });
      if (!validUser()) return;
      const q = query(collection(db, 'online_waiting'), orderBy('joinedAt', 'asc'), limit(50));
      stopQueue = onSnapshot(q, snapshot => {
        if (!validUser() || admitted) return;
        const now = Date.now();
        const queue = snapshot.docs.filter(item => {
          const seen = item.data().lastSeen as Timestamp | undefined;
          return !!seen && now - seen.toMillis() < STALE_AFTER_MS;
        });
        const index = queue.findIndex(item => item.id === uid);
        queueLeader = index === 0;
        notify({ status: 'waiting', position: index >= 0 ? index + 1 : undefined });
        if (queueLeader) void attempt();
      }, () => notify({ status: 'error', message: 'Chưa đọc được hàng chờ. Hãy thử tải lại trang.' }));
      // At most ONE queue leader retries the slot; no RTDB presence heartbeat.
      retryTimer = setInterval(() => { if (queueLeader) void attempt(); }, 25_000);
      // Only waiting users refresh an expiring queue lease, not active players.
      leaseTimer = setInterval(() => {
        if (!validUser() || admitted) return;
        void updateDoc(waitingRef, { lastSeen: serverTimestamp() }).catch(() => {});
      }, 3 * 60_000);
    } catch (e) {
      if (validUser()) notify({ status: 'error', message: 'Không vào được hàng chờ. Kiểm tra kết nối và quyền truy cập.' });
    }
  };
  // Waiting primarily uses Firestore; no forced connection disconnects.
  void start();
  return () => {
    stopped = true;
    stopQueue?.();
    stopActiveConnection?.();
    if (retryTimer) clearInterval(retryTimer);
    if (leaseTimer) clearInterval(leaseTimer);
    if (admitted && occupiedSlot) void remove(occupiedSlot).catch(() => {});
    else void deleteDoc(waitingRef).catch(() => {});
  };
}
