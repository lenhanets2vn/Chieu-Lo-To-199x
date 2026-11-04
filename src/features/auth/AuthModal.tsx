import React, { useState } from 'react';
import { RetroWindow } from '../../components/ui/RetroWindow';
import { RetroButton } from '../../components/ui/RetroButton';
import { PlayerProfile } from '../progression/progressionTypes';
import { registerPlayerAccount, loginPlayerAccount } from './firebaseAuthService';
import { User, Lock, KeyRound, Sparkles, UserPlus, LogIn, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (profile: PlayerProfile) => void;
  currentProfile: PlayerProfile;
  required?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  currentProfile,
  required = false
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanUsername = username.trim().toLowerCase();
    const cleanNick = nickname.trim();

    if (!cleanUsername) {
      setErrorMsg('Vui lòng nhập Tên Đăng Nhập!');
      return;
    }

    if (mode === 'register' && !cleanNick) {
      setErrorMsg('Vui lòng nhập Tên Nickname hiển thị!');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Mật khẩu tối thiểu 6 ký tự để bảo mật tài khoản!');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setErrorMsg('Mật khẩu xác nhận không khớp!');
          setIsLoading(false);
          return;
        }

        const newProfile = await registerPlayerAccount(cleanUsername, cleanNick, password, currentProfile);
        setSuccessMsg(`Đăng ký thành công! Chào mừng hội viên ${newProfile.displayName}!`);
        setTimeout(() => {
          onAuthSuccess(newProfile);
          onClose();
        }, 700);
      } else {
        // Login mode
        const loggedProfile = await loginPlayerAccount(cleanUsername, password);
        setSuccessMsg(`Đăng nhập thành công! Chào mừng ${loggedProfile.displayName} trở lại.`);
        setTimeout(() => {
          onAuthSuccess(loggedProfile);
          onClose();
        }, 600);
      }
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      const errCode = err?.code || '';
      if (errCode === 'auth/email-already-in-use') {
        setErrorMsg('Tên Đăng Nhập này đã có người đăng ký! Vui lòng chọn tên khác hoặc chuyển sang Đăng Nhập.');
      } else if (errCode === 'auth/invalid-credential' || errCode === 'auth/user-not-found' || errCode === 'auth/wrong-password') {
        setErrorMsg('Tên đăng nhập hoặc mật khẩu không chính xác!');
      } else if (errCode === 'auth/network-request-failed') {
        setErrorMsg('Không kết nối được Firebase. Kiểm tra mạng rồi thử lại; chưa đăng nhập nên không thể chơi.');
      } else {
        setErrorMsg(err?.message || 'Có lỗi khi kết nối máy chủ xác thực.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 select-none">
      <div className="w-full max-w-md">
        <RetroWindow
          title="ĐĂNG NHẬP / ĐĂNG KÝ HỘI VIÊN LÔ TÔ ONLINE"
          icon="🔑"
          onClose={required ? undefined : onClose}
        >
          {/* Mode Switcher */}
          <div className="flex gap-1 mb-3 border-b border-[#808080] pb-1">
            <button
              onClick={() => { setMode('login'); setErrorMsg(''); }}
              className={`flex-1 py-1 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer ${
                mode === 'login' ? 'win98-btn bg-[#000080] text-white' : 'win98-btn'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng Nhập</span>
            </button>
            <button
              onClick={() => { setMode('register'); setErrorMsg(''); }}
              className={`flex-1 py-1 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer ${
                mode === 'register' ? 'win98-btn bg-[#000080] text-white' : 'win98-btn'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Đăng Ký Mới</span>
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-3 bg-white p-3 border border-[#808080] win98-box-inset">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-800" />
                <span>Tên Đăng Nhập (Username tài khoản online):</span>
              </label>
              <input
                type="text"
                required
                maxLength={24}
                placeholder="VD: tuan9x, chiba_loto, hoangtuden..."
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                className="w-full border border-[#808080] px-2.5 py-1.5 text-xs text-black font-mono font-bold outline-none bg-stone-50"
              />
              <span className="text-[10px] text-stone-500">
                * Dùng để đăng nhập và đồng bộ tiến trình (vàng, cấp, vé) lên Cloud
              </span>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tên Nickname Hiển Thị (Hiện trên vé, bảng điểm & chat):</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={24}
                  placeholder="VD: Tuấn Đẹp Trai 9x, Chị Ba Đỗ Thành Lô Tô..."
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full border border-[#808080] px-2.5 py-1.5 text-xs text-black font-semibold outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Mật khẩu bảo mật:</span>
              </label>
              <input
                type="password"
                required
                placeholder="Tối thiểu 6 ký tự..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[#808080] px-2.5 py-1.5 text-xs text-black outline-none"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Xác nhận lại mật khẩu:</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Gõ lại mật khẩu một lần nữa..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-[#808080] px-2.5 py-1.5 text-xs text-black outline-none"
                />
              </div>
            )}

            {errorMsg && (
              <div className="p-1.5 bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold rounded">
                ⚠️ {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-1.5 bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-bold rounded flex items-center gap-1">
                <span>✨</span>
                <span>{successMsg}</span>
              </div>
            )}

            <div className="pt-2 flex justify-between items-center gap-2">
              <span className="text-[11px] text-stone-600 font-semibold">
                {required ? 'Cần đăng nhập hoặc đăng ký để chơi và lưu tiến trình.' : 'Tài khoản của bạn được lưu trên Firebase.'}
              </span>
              <RetroButton
                type="submit"
                size="md"
                variant="gold"
                disabled={isLoading}
                icon={isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-yellow-200" />}
              >
                {isLoading
                  ? 'Đang kết nối...'
                  : mode === 'login'
                  ? 'Vào Chơi Ngay'
                  : 'Hoàn Tất Đăng Ký'}
              </RetroButton>
            </div>
          </form>
        </RetroWindow>
      </div>
    </div>
  );
};
