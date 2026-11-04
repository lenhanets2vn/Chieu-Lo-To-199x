import React, { useState } from 'react';
import { GameRoom } from './types';
import { RetroButton } from '../../components/ui/RetroButton';
import { RetroWindow } from '../../components/ui/RetroWindow';
import { Users, Lock, Unlock, Plus, Search, Link2, Copy, Check, Shield } from 'lucide-react';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicRooms: GameRoom[];
  cloudError?: string | null;
  cloudReady?: boolean;
  onCreateRoom: (roomData: { name: string; isPrivate: boolean; password?: string; callSpeed: number; maxPlayers: number }) => Promise<void>;
  onJoinRoom: (code: string, password?: string) => Promise<void>;
  currentRoom?: GameRoom | null;
}

export const RoomModal: React.FC<RoomModalProps> = ({
  isOpen,
  onClose,
  publicRooms,
  cloudError = null,
  cloudReady = false,
  onCreateRoom,
  onJoinRoom,
  currentRoom
}) => {
  // Ba chế độ theo đúng yêu cầu: Phòng Public, Phòng Private, Tạo Phòng
  const [tab, setTab] = useState<'public' | 'private' | 'create'>('public');
  
  // Create Room state
  const [newRoomName, setNewRoomName] = useState('Chiếu Lô Tô Hội Xuân');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [maxPlayers, setMaxPlayers] = useState<number>(30);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [createRoomError, setCreateRoomError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joiningCode, setJoiningCode] = useState<string | null>(null);

  // Private Join by code & password state
  const [privateCode, setPrivateCode] = useState('');
  const [privatePassword, setPrivatePassword] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleCopyInviteLink = () => {
    if (!currentRoom) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${currentRoom.code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const tryJoin = async (code: string) => {
    if (joiningCode) return;
    setJoinError(null);
    setJoiningCode(code);
    try {
      await onJoinRoom(code);
      onClose();
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : 'Không thể vào phòng. Vui lòng thử lại.');
    } finally {
      setJoiningCode(null);
    }
  };

  const handleJoinPrivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (privateCode.trim()) void tryJoin(privateCode.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 select-none">
      <div className="w-full max-w-lg">
        <RetroWindow
          title="HỘI CHIẾU LÔ TÔ ONLINE"
          icon="🏮"
          onClose={onClose}
        >
          <div role="status" className={`mb-2 rounded border px-2 py-1 text-[11px] font-bold ${cloudError ? 'bg-rose-100 border-red-400 text-red-800' : cloudReady ? 'bg-emerald-100 border-emerald-400 text-emerald-900' : 'bg-amber-50 border-amber-400 text-amber-900'}`}>
            {cloudError ? cloudError : cloudReady ? 'Danh sách phòng đang mở' : 'Đang tìm phòng…'}
          </div>
          {joinError && <div role="alert" className="mb-2 p-2 rounded border border-red-500 bg-red-50 text-red-900 text-xs">{joinError}</div>}
          {/* Tabs: Chỉ có Tạo phòng, Phòng Public, Phòng Private */}
          <div className="flex gap-1 mb-3 border-b border-[#808080] pb-1">
            <button
              onClick={() => setTab('public')}
              className={`flex-1 py-1.5 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'public' ? 'win98-btn bg-[#000080] text-white' : 'win98-btn'
              }`}
            >
              <Unlock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Phòng Public (Công Khai)</span>
            </button>

            <button
              onClick={() => setTab('private')}
              className={`flex-1 py-1.5 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'private' ? 'win98-btn bg-[#000080] text-white' : 'win98-btn'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Phòng Private (Riêng Tư)</span>
            </button>

            <button
              onClick={() => setTab('create')}
              className={`flex-1 py-1.5 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'create' ? 'win98-btn bg-[#000080] text-white' : 'win98-btn'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-yellow-300" />
              <span>Tạo Phòng Mới</span>
            </button>
          </div>

          {/* TAB 1: PHÒNG PUBLIC (CÔNG KHAI) */}
          {tab === 'public' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-stone-700 px-1 font-bold">
                <span>Các chiếu hội công khai đang mở ({publicRooms.filter(r => !r.isPrivate).length}):</span>
                <span className="text-[11px] text-stone-500 font-normal">Tự do vào chơi cùng bà con</span>
              </div>

              <div className="bg-white border border-[#808080] p-1.5 max-h-60 overflow-y-auto space-y-1.5 win98-box-inset">
                {publicRooms.filter(r => !r.isPrivate).length === 0 ? (
                  <div className="text-center py-8 text-stone-400 text-xs italic">
                    Hiện chưa có phòng công khai nào. Bạn hãy bấm "Tạo Phòng Mới" để mở chiếu ngay!
                  </div>
                ) : (
                  publicRooms
                    .filter(r => !r.isPrivate)
                    .map((room) => (
                      <div
                        key={room.id}
                        className="p-2 border border-stone-300 rounded hover:bg-amber-50/70 flex items-center justify-between gap-2 transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-blue-950 text-xs truncate">
                              {room.name}
                            </span>
                            <span className="font-mono text-[10px] bg-stone-200 px-1 rounded text-stone-700">
                              #{room.code}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            Chủ chiếu: <b className="text-stone-700">{room.hostName}</b>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-mono text-stone-600 flex items-center gap-1 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-300">
                            <Users className="w-3 h-3 text-stone-500" />
                            {room.memberCount ?? room.players?.length ?? 1}/{room.maxPlayers || 30}
                          </span>
                          <RetroButton
                            size="sm"
                            variant="primary"
                            disabled={joiningCode !== null}
                            onClick={() => { void tryJoin(room.code); }}
                          >
                            Vào Chiếu
                          </RetroButton>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PHÒNG PRIVATE (RIÊNG TƯ) */}
          {tab === 'private' && (
            <div className="space-y-3 bg-white p-3 border border-[#808080] win98-box-inset">
              <div className="flex items-start gap-2">
                <Shield className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-stone-900">
                    Chiếu Lô Tô Kín Bạn Bè (Phòng Riêng)
                  </h4>
                  <p className="text-[11px] text-stone-600 leading-snug">
                    Dùng mã mời riêng do chủ phòng chia sẻ. Mật khẩu phòng chưa được hỗ trợ nếu không có xác thực máy chủ.
                  </p>
                </div>
              </div>

              <form onSubmit={handleJoinPrivate} className="space-y-2 pt-1 border-t border-stone-200">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Mã phòng riêng:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: LOTO99, TET96..."
                    value={privateCode}
                    onChange={(e) => setPrivateCode(e.target.value.toUpperCase())}
                    className="w-full border border-[#808080] px-2.5 py-1.5 text-xs font-mono font-bold uppercase text-black"
                  />
                </div>


                <div className="pt-2 flex justify-end">
                  <RetroButton
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={!privateCode.trim() || joiningCode !== null}
                    icon={<Search className="w-3.5 h-3.5" />}
                  >
                    Vào Phòng Riêng
                  </RetroButton>
                </div>
              </form>

              {/* Nếu người chơi đang ở trong phòng riêng, hiển thị link mời */}
              {currentRoom && currentRoom.isPrivate && (
                <div className="mt-3 pt-3 border-t border-stone-200 bg-amber-50/70 p-2 rounded border border-amber-300">
                  <span className="block text-xs font-bold text-amber-900 mb-1">
                    Liên kết mời bạn vào phòng hiện tại (#{currentRoom.code}):
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}${window.location.pathname}?room=${currentRoom.code}`}
                      className="border border-[#808080] px-2 py-1 text-[11px] font-mono bg-white flex-1 select-all"
                    />
                    <RetroButton
                      size="sm"
                      variant="gold"
                      onClick={handleCopyInviteLink}
                      icon={copiedLink ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                    >
                      {copiedLink ? 'Đã Chép' : 'Sao Chép'}
                    </RetroButton>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TẠO PHÒNG MỚI */}
          {tab === 'create' && (
            <div className="space-y-3 bg-white p-3 border border-[#808080] win98-box-inset">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Tên chiếu Lô Tô:
                </label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full border border-[#808080] px-2.5 py-1.5 text-xs text-black font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Chế độ phòng:
                  </label>
                  <select
                    value={isPrivate ? 'private' : 'public'}
                    onChange={(e) => setIsPrivate(e.target.value === 'private')}
                    className="w-full border border-[#808080] px-2 py-1 text-xs bg-white font-bold"
                  >
                    <option value="public">Phòng Public (Ai cũng vào được)</option>
<option value="private">Phòng Private (Bằng mã mời riêng)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">
                    Số tay chơi tối đa:
                  </label>
                  <select
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full border border-[#808080] px-2 py-1 text-xs bg-white font-bold text-amber-900"
                  >
                    <option value={100}>100 Người (Đại Hội)</option>
                    <option value={75}>75 Người</option>
                    <option value={50}>50 Người</option>
                    <option value={30}>30 Người (Mặc định)</option>
                    <option value={20}>20 Người</option>
                    <option value={10}>10 Người</option>
                  </select>
                  <span className="block mt-1 text-[10px] text-stone-600">Đã tự điền số người; có thể chọn tối đa 100.</span>
                </div>
              </div>

              {isPrivate && <p className="text-[11px] text-amber-900 bg-amber-50 p-2 border border-amber-300 rounded">
                Phòng riêng sử dụng mã mời dài khó đoán. Không có mật khẩu vì việc kiểm tra mật khẩu trên trình duyệt không đủ an toàn.
              </p>}

              {createRoomError && (
                <div role="alert" className="p-2 rounded border border-red-500 bg-red-50 text-red-900 text-xs break-words">
                  {createRoomError}
                </div>
              )}
              <div className="pt-2 flex justify-end gap-2 border-t border-stone-200">
                <RetroButton size="md" disabled={isCreatingRoom} onClick={() => { setCreateRoomError(null); setTab('public'); }}>
                  Hủy
                </RetroButton>
                <RetroButton
                  size="md"
                  variant="gold"
                  disabled={isCreatingRoom}
                  onClick={() => {
                    void (async () => {
                      setIsCreatingRoom(true);
                      setCreateRoomError(null);
                      try {
                        await onCreateRoom({
                          name: newRoomName.trim() || 'Chiếu Lô Tô Hội Xuân',
                          isPrivate,
                          password: undefined,
                          callSpeed: 5,
                          maxPlayers
                        });
                        onClose();
                      } catch (error) {
                        setCreateRoomError(error instanceof Error ? error.message : 'Không tạo được phòng. Vui lòng thử lại.');
                      } finally {
                        setIsCreatingRoom(false);
                      }
                    })();
                  }}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  {isCreatingRoom ? 'Đang tạo phòng…' : 'Mở Chiếu Lô Tô'}
                </RetroButton>
              </div>
            </div>
          )}
        </RetroWindow>
      </div>
    </div>
  );
};
