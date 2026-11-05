/** Optional RTDB transport. No socket is opened unless a caller actually uses it.
 * VITE_FIREBASE_DATABASE_URL must be copied from the Firebase Console database page.
 */
import { getApps, getApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

const explicitUrl = String(import.meta.env.VITE_FIREBASE_DATABASE_URL || '').trim();
// Never guess the regional endpoint: non-us-central RTDB URLs differ.
export const realtimeConfigured = /^https:\/\/[-a-z0-9.]+\.(firebasedatabase\.app|firebaseio\.com)\/?$/i.test(explicitUrl);
let instance: Database | null = null;
export function realtimeDatabase(): Database {
  if (!realtimeConfigured) throw new Error('Chưa bật kênh realtime. Vui lòng liên hệ quản trị viên.');
  if (!instance) {
    if (!getApps().length) throw new Error('Chưa khởi tạo tài khoản ứng dụng.');
    instance = getDatabase(getApp(), explicitUrl);
  }
  return instance;
}

/** Cost-safety switch: enable only after verifying RTDB admission rules and
 * measuring Firestore queue traffic on real devices. Disabled by default to
 * avoid silently running a second Firestore listener for every login. */
export const sparkAdmissionEnabled = realtimeConfigured &&
  String(import.meta.env.VITE_ENABLE_SPARK_ADMISSION || '').toLowerCase() === 'true';
