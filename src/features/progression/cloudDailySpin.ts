import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { localDayKey } from './dailySpin';

/** Atomic cloud daily claim: competing tabs/devices cannot create the SAME daily document twice. */
export async function reserveCloudDailySpin(profileId: string): Promise<number> {
  if (!auth.currentUser || auth.currentUser.uid !== profileId) {
    throw new Error('Vui lòng đăng nhập để quay.');
  }
  const startedAt = Date.now();
  const claim = doc(db, 'users', profileId, 'spinClaims', localDayKey(startedAt));
  await runTransaction(db, async tx => {
    const existing = await tx.get(claim);
    if (existing.exists()) throw new Error('Bạn đã sử dụng lượt quay hôm nay trên tài khoản này.');
    tx.set(claim, { createdAt: serverTimestamp() });
  });
  return startedAt;
}
