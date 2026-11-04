import React, { useState } from 'react';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { PlayerProfile } from '../progression/progressionTypes';
import { flushPendingProfileSync } from './firebaseAuthService';
import { RetroWindow } from '../../components/ui/RetroWindow';
import { RetroButton } from '../../components/ui/RetroButton';

interface AccountModalProps {
  isOpen: boolean;
  profile: PlayerProfile;
  onClose: () => void;
  onUpdateProfile: (next: PlayerProfile) => void;
  onLogout: () => Promise<void>;
}

/** An authenticated account settings screen; NEVER reopens registration/login. */
export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen, profile, onClose, onUpdateProfile, onLogout
}) => {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [avatarBusy, setAvatarBusy] = useState(false);
  async function changeAvatar(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setError('Chọn ảnh JPG, PNG hoặc WebP tối đa 5 MB.'); return;
    }
    const user = auth.currentUser;
    if (!user || user.uid !== profile.id) { setError('Phiên đăng nhập không hợp lệ.'); return; }
    setAvatarBusy(true); setError(''); setMessage('');
    try {
      const image = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 96;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      const side = Math.min(image.width, image.height);
      ctx.drawImage(image, (image.width - side)/2, (image.height - side)/2, side, side, 0, 0, 96, 96);
      image.close();
      const avatarDataUrl = canvas.toDataURL('image/jpeg', 0.72);
      if (avatarDataUrl.length > 25000) throw new Error('Avatar too large');
      await flushPendingProfileSync();
      await updateDoc(doc(db, 'users', user.uid), { avatarDataUrl, updatedAt: Date.now() });
      onUpdateProfile({ ...profile, avatarDataUrl, updatedAt: Date.now() });
      setMessage('Đã cập nhật ảnh đại diện.');
    } catch {
      setError('Không lưu được ảnh đại diện. Vui lòng thử ảnh khác.');
    } finally { setAvatarBusy(false); }
  }
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  if (!isOpen) return null;

  async function changeName(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setMessage('');
    const nextName = displayName.trim();
    if (nextName.length < 2 || nextName.length > 24) {
      setError('Tên hiển thị phải dài từ 2 đến 24 ký tự.'); return;
    }
    const user = auth.currentUser;
    if (!user || user.uid !== profile.id) { setError('Phiên đăng nhập không hợp lệ.'); return; }
    setBusy(true);
    try {
      await flushPendingProfileSync();
      await updateDoc(doc(db, 'users', user.uid), { displayName: nextName, updatedAt: Date.now() });
      onUpdateProfile({ ...profile, displayName: nextName, updatedAt: Date.now() });
      setMessage('Đã lưu tên hiển thị.');
    } catch {
      setError('Chưa lưu được tên. Kiểm tra kết nối rồi thử lại.');
    } finally { setBusy(false); }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setMessage('');
    if (password.length < 6) { setError('Mật khẩu mới cần tối thiểu 6 ký tự.'); return; }
    if (password !== confirm) { setError('Hai mật khẩu mới chưa khớp.'); return; }
    const user = auth.currentUser;
    if (!user?.email || user.uid !== profile.id) { setError('Vui lòng đăng nhập lại để đổi mật khẩu.'); return; }
    setBusy(true);
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, oldPassword));
      await updatePassword(user, password);
      setOldPassword(''); setPassword(''); setConfirm('');
      setMessage('Đổi mật khẩu thành công.');
    } catch (err) {
      const code = (err as {code?: string})?.code;
      setError(code === 'auth/invalid-credential' || code === 'auth/wrong-password'
        ? 'Mật khẩu hiện tại không chính xác.'
        : 'Chưa đổi được mật khẩu. Kiểm tra kết nối rồi thử lại.');
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3">
      <div className="w-full max-w-md">
        <RetroWindow title="HỒ SƠ & BẢO MẬT TÀI KHOẢN" icon="👤" onClose={onClose}>
          <div className="space-y-3 bg-white border border-stone-400 p-3 text-stone-900 text-xs">
            <div className="rounded bg-amber-50 border border-amber-300 p-2">
              <strong>Tài khoản:</strong> {profile.username}<br />
              <strong>Cấp độ:</strong> {profile.level} · <strong>Xu:</strong> {profile.coins.toLocaleString('vi-VN')}
            </div>
            <div className="flex items-center gap-3 border-b pb-3">
              {profile.avatarDataUrl ? <img src={profile.avatarDataUrl} alt="Ảnh đại diện" className="w-16 h-16 rounded-full object-cover border-2 border-amber-500" />
                : <div className="w-16 h-16 rounded-full bg-amber-200 grid place-items-center text-3xl">👤</div>}
              <label className="cursor-pointer rounded border border-amber-700 bg-amber-100 px-3 py-2 font-bold">
                {avatarBusy ? 'Đang lưu ảnh...' : '📷 Đổi ảnh đại diện'}
                <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || avatarBusy}
                  onChange={e => { void changeAvatar(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
            </div>
            <form onSubmit={changeName} className="space-y-2 border-b pb-3">
              <label htmlFor="account-display-name" className="block font-bold">Đổi tên hiển thị</label>
              <input id="account-display-name" value={displayName} maxLength={24}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full border border-stone-400 rounded p-2 text-black" />
              <RetroButton type="submit" variant="gold" disabled={busy || displayName.trim() === profile.displayName}>Lưu tên</RetroButton>
            </form>
            <form onSubmit={changePassword} className="space-y-2">
              <label className="block font-bold">Đổi mật khẩu</label>
              <input type="password" autoComplete="current-password" value={oldPassword}
                onChange={e => setOldPassword(e.target.value)} placeholder="Mật khẩu hiện tại" required
                className="w-full border border-stone-400 rounded p-2 text-black" />
              <input type="password" autoComplete="new-password" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="Mật khẩu mới (ít nhất 6 ký tự)" required
                className="w-full border border-stone-400 rounded p-2 text-black" />
              <input type="password" autoComplete="new-password" value={confirm}
                onChange={e => setConfirm(e.target.value)} placeholder="Xác nhận mật khẩu mới" required
                className="w-full border border-stone-400 rounded p-2 text-black" />
              <RetroButton type="submit" variant="primary" disabled={busy}>Đổi mật khẩu</RetroButton>
            </form>
            {error && <div role="alert" className="p-2 bg-rose-50 text-red-800 border border-red-300">{error}</div>}
            {message && <div role="status" className="p-2 bg-emerald-50 text-emerald-900 border border-emerald-300">{message}</div>}
            <div className="flex justify-between gap-2 border-t pt-2">
              <RetroButton disabled={busy} onClick={onClose}>Đóng</RetroButton>
              <RetroButton disabled={busy} onClick={() => { void (async () => {
                setBusy(true);
                try { await onLogout(); onClose(); }
                catch { setError('Chưa đăng xuất được. Vui lòng thử lại.'); }
                finally { setBusy(false); }
              })(); }}>Đăng xuất</RetroButton>
            </div>
          </div>
        </RetroWindow>
      </div>
    </div>
  );
};
