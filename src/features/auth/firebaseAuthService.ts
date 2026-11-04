import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { PlayerProfile } from '../progression/progressionTypes';
import { saveProfile, createStarterProfile } from '../progression/progressionStore';

// Helper to convert plain usernames into standard email format for Firebase Auth
export function formatAuthEmail(input: string): string {
  const clean = input.trim().toLowerCase();
  if (clean.includes('@')) return clean;
  // Replace non-alphanumeric with underscores
  const safeName = clean.replace(/[^a-z0-9]/g, '_');
  return `${safeName || 'guest'}@loto199x.local`;
}

/**
 * Register a new player account with username/password
 */
export async function registerPlayerAccount(
  username: string,
  nickname: string,
  pass: string,
  baseProfile: PlayerProfile
): Promise<PlayerProfile> {
  const email = formatAuthEmail(username);
  await flushPendingProfileSync();
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  const newProfile: PlayerProfile = {
    ...createStarterProfile(user.uid),
    id: user.uid,
    username: username.trim(),
    displayName: nickname.trim() || username.trim(),
    coins: 1000,
    currentExp: 100,
    level: 1,
    updatedAt: Date.now()
  };

  // Save to Firestore
  await setDoc(doc(db, 'users', user.uid), newProfile);
  saveProfile(newProfile);
  return newProfile;
}

/**
 * Login existing player account
 */
export async function loginPlayerAccount(
  usernameOrEmail: string,
  pass: string
): Promise<PlayerProfile> {
  const email = formatAuthEmail(usernameOrEmail);
  await flushPendingProfileSync();
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  // Retrieve user document from Firestore
  const userDocRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userDocRef);

  if (snap.exists()) {
    const data = { ...(snap.data() as PlayerProfile), id: user.uid };
    saveProfile(data);
    return data;
  }

  throw new Error('Tài khoản đã xác thực nhưng hồ sơ trên máy chủ chưa sẵn sàng. Vui lòng đăng nhập lại.');
}

/**
 * Logout
 */
export async function logoutPlayer(): Promise<void> {
  await flushPendingProfileSync();
  await signOut(auth);
}

// Coalesce non-critical profile changes but NEVER cross account boundaries.
let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingProfile: PlayerProfile | null = null;
let pendingUid: string | null = null;

export function cancelPendingProfileSync(): void {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = null;
  pendingProfile = null;
  pendingUid = null;
}

export async function flushPendingProfileSync(): Promise<void> {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = null;
  const profile = pendingProfile;
  const uid = pendingUid;
  pendingProfile = null;
  pendingUid = null;
  if (!profile || !uid || !auth.currentUser || auth.currentUser.uid !== uid || profile.id !== uid) return;
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: profile.displayName, avatarDataUrl: profile.avatarDataUrl || "", characterId: profile.characterId,
      yahooTitle: profile.yahooTitle, activeMarkerId: profile.activeMarkerId,
      coins: profile.coins, currentExp: profile.currentExp, level: profile.level,
      unlockedItemIds: profile.unlockedItemIds,
      activeTicketSkinId: profile.activeTicketSkinId,
      activeThemeId: profile.activeThemeId, activeFrameId: profile.activeFrameId,
      totalGames: profile.totalGames, totalWins: profile.totalWins,
      lastDailySpinTime: profile.lastDailySpinTime || 0,
      updatedAt: Date.now()
    });
  } catch (err) {
    console.warn('Không đồng bộ được hồ sơ lên Firestore:', err);
  }
}
export function syncProfileToFirestoreThrottled(profile: PlayerProfile): void {
  saveProfile(profile);
  const uid = auth.currentUser?.uid;
  if (!uid || uid !== profile.id) return;
  if (pendingUid && pendingUid !== uid) cancelPendingProfileSync();
  pendingUid = uid;
  pendingProfile = { ...profile };
  if (!syncTimeout) syncTimeout = setTimeout(() => { void flushPendingProfileSync(); }, 15_000);
}
