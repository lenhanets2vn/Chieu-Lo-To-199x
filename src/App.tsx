import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { LotoEngine } from './features/game/lotoEngine';
import { generateFiveNumberTicket, pickFiveUnique } from './features/game/ticketGenerator';
import { LotoTicket, PlayerState, GameStatus, GameSettings } from './features/game/types';
import { createOfflineBots } from './features/game/botBrain';
import { CHARACTERS, getCharacterById, Character } from './features/characters/characterData';
import { audioSynthesizer } from './features/audio/audioSynthesizer';
import { speechCaller, type AudioCallbacks } from './features/audio/speechCaller';
import { LotoAudioControls } from './features/audio/LotoAudioControls';
import { MAX_SOUND_NUMBER, ALMOST_OVER_REMAINING } from './features/audio/soundpackManifest';
import { DEFAULT_SOUNDPACK, loadSoundpackCatalog, type SoundpackDefinition } from './features/audio/soundpackRegistry';
import { ChatMessage } from './features/chat/yahooEmojis';
import { GameRoom } from './features/room/types';
import { PlayerProfile, UnlockableItem } from './features/progression/progressionTypes';
import { loadProfile, saveProfile, addExpAndRewards, UNLOCKABLE_CATALOG } from './features/progression/progressionStore';
import { saveMatchRecord } from './features/history/historyStore';

// Main Menu
import { MainMenu } from './components/menu/MainMenu';

// Game Playfield Components
import { BallCageAnimation } from './features/game/BallCageAnimation';
import { MasterBoard } from './features/game/MasterBoard';
import { LotoTicketView } from './features/game/LotoTicketView';
import { FiveNumberPicker } from './features/game/FiveNumberPicker';
import { PlayerListPanel } from './features/game/PlayerListPanel';
import { ChatPanel } from './features/chat/ChatPanel';
import { VipScreenEffects } from './features/chat/VipScreenEffects';
import { RetroButton } from './components/ui/RetroButton';
import { FireworksCelebration } from './features/game/FireworksCelebration';
import { FloatingEmoteBar } from './features/reactions/FloatingEmoteBar';
import { FloatingEmoteCanvas, FloatingEmoteItem } from './features/reactions/FloatingEmoteCanvas';
import {
  subscribeToWorldChat,
  sendWorldChatMessage,
  subscribeToRoomChat,
  sendRoomChatMessage,
  sendRoomBuzz,
  beginWorldChatSession
} from './features/chat/firebaseChatService';
import {
  createOnlineRoom,
  subscribeToPublicRooms,
  subscribeToRoom,
  subscribeToRoomGameState,
  subscribeToRoomMembers,
  publishRoomGameState,
  publishOwnRoomTickets,
  leaveOnlineRoom,
  joinOnlineRoom,
  sendRoomReaction,
  subscribeToRoomReactions,
  subscribeToRoomKinhClaims,
  sendRoomKinhClaim,
  ensureRoomChatJoinTime
} from './features/room/firebaseRoomService';
import {
  syncProfileToFirestoreThrottled,
  cancelPendingProfileSync,
  flushPendingProfileSync, logoutPlayer
} from './features/auth/firebaseAuthService';
import { auth, db } from './services/firebase';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { createStarterProfile } from './features/progression/progressionStore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Modals
import { AuthModal } from './features/auth/AuthModal';
import { AccountModal } from './features/auth/AccountModal';
import { RoomModal } from './features/room/RoomModal';
import { CharacterModal } from './features/characters/CharacterModal';
import { ShopModal } from './features/progression/ShopModal';
import { LeaderboardModal } from './features/progression/LeaderboardModal';
import { HistoryModal } from './features/history/HistoryModal';
import { LuckyWheelModal } from './features/progression/LuckyWheelModal';

import { 
  Volume2, 
  VolumeX, 
  Tv, 
  RotateCcw, 
  Sparkles, 
  Zap, 
  ArrowLeft,
  Users,
  Grid,
  MessageSquare
} from 'lucide-react';

const BROADCAST_CHANNEL_NAME = 'viet_loto_199x_sync_channel';
const initialPackCount = (): 1 | 5 => 1;


type AppView = 'MENU' | 'GAME_MATCH';

export default function App() {
  // Navigation View
  const [currentView, setCurrentView] = useState<AppView>('MENU');

  // User Profile
  const [profile, setProfile] = useState<PlayerProfile>(() => loadProfile());
  const displayNameRef = useRef(profile.displayName);
  displayNameRef.current = profile.displayName;
  const [readyUserId, setReadyUserId] = useState<string | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [authIssue, setAuthIssue] = useState<string | null>(null);
  const [chatConnection, setChatConnection] = useState<{world: 'connecting'|'online'|'offline'|'error'; room: 'connecting'|'online'|'offline'|'error'}>({ world:'connecting', room:'connecting' });
  const [chatConnectionError, setChatConnectionError] = useState<{world:string|null;room:string|null}>({ world:null, room:null });
  const [worldChatJoinedAt, setWorldChatJoinedAt] = useState<Timestamp | null>(null);
  const [roomChatJoinedAt, setRoomChatJoinedAt] = useState<{roomId:string;since:Timestamp} | null>(null);
  const legacyMemberMigratedRef = useRef<Set<string>>(new Set());
  const handledInviteRef = useRef<string | null>(null);
  // Each rendered VIP animation comes from one newly received message.
  // The first chat snapshot is history, not a new event.
  const seenVipMessagesRef = useRef<Set<string>>(new Set());
  const hasSeenChatSnapshotRef = useRef<{world: boolean; roomId: string | null}>({world:false, roomId:null});
  const consumeVipChatEffects = useCallback((messages: ChatMessage[], channel: 'world' | 'room', roomId?: string) => {
    const scope = channel === 'world' ? 'world' : (roomId || '');
    const first = channel === 'world' ? !hasSeenChatSnapshotRef.current.world : hasSeenChatSnapshotRef.current.roomId !== scope;
    const seen = seenVipMessagesRef.current;
    const permitted = new Set(['fireworks','bomb','hearts','dragon','piggy_coins','crown','guitar_notes']);
    for (const msg of messages) {
      const key = `${scope}:${msg.id}`;
      if (!seen.has(key) && !first && msg.senderId !== auth.currentUser?.uid &&
          msg.isVipEmoji && permitted.has(msg.isVipEmoji) && Date.now() - msg.timestamp < 12000) {
        setActiveVipEffect(msg.isVipEmoji);
      }
      seen.add(key);
    }
    if (channel === 'world') hasSeenChatSnapshotRef.current.world = true;
    else hasSeenChatSnapshotRef.current.roomId = scope;
    if (seen.size > 600) seenVipMessagesRef.current = new Set(Array.from(seen).slice(-300));
  }, []);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => document.visibilityState === 'visible');

  // Game Settings: Auto-mark is TRUE by default, Ticket Count is strictly 1!
  const [settings, setSettings] = useState<GameSettings>({
    mode: 'offline_bot',
    callIntervalSeconds: 5,
    maxNumber: MAX_SOUND_NUMBER,
    autoMark: true, // Luôn tự đánh dấu. Không có chế độ đánh dấu thủ công.
    ticketCount: 1,
    voiceCaller: localStorage.getItem('loto_v6_music_enabled') !== 'false',
    soundEffects: true,
    crtScanlines: true
  });

  // Right sidebar tab in match view ('board' | 'players' | 'chat')
  const [matchRightTab, setMatchRightTab] = useState<'board' | 'players' | 'chat'>('players');

  // Core Game State
  const [gameState, setGameState] = useState<GameStatus>('WAITING');
  const engineRef = useRef<LotoEngine>(new LotoEngine(MAX_SOUND_NUMBER));
  const [calledNumbers, setCalledNumbers] = useState<Set<number>>(new Set());
  // Lịch sử hiển thị riêng theo thứ tự phát thực tế, cập nhật cùng thời điểm mở số.
  const [calledHistory, setCalledHistory] = useState<number[]>([]);
  const calledHistoryRef = useRef<number[]>([]);
  const activeRoomRef = useRef<GameRoom | null>(null);
  const [currentBall, setCurrentBall] = useState<number | null>(null);
  const [isBallRolling, setIsBallRolling] = useState<boolean>(false);
  const [isSingingSong, setIsSingingSong] = useState<boolean>(false);
  const [singingNumber, setSingingNumber] = useState<number | null>(null);
  const nextSongTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Điều phối phát nhạc: trạng thái thật ở ref tránh callback stale giữa hai file.
  const gameStatusRef = useRef<GameStatus>('WAITING');
  const singingRef = useRef(false);
  const revealedRef = useRef<number | null>(null);
  const preparedNumberRef = useRef<number | null>(null);
  const winnerPendingRef = useRef<{name:string;rowNumbers:number[]} | null>(null);
  const hasPlayedNearEndRef = useRef(false);
  const playersRef = useRef<PlayerState[]>([]);
  const rosterRoomIdRef = useRef<string | null>(null);
  const handleGameOverRef = useRef<((name:string, isUser:boolean, row?:number[])=>void) | null>(null);
  const remoteRoundResetRef = useRef<(() => void) | null>(null);
  const kinClaimPendingRef = useRef(false);
  const startSongForNextBallRef = useRef<((forcedNumber?:number)=>void) | null>(null);
  const phaseRef = useRef<'intro'|'song'|'near_end'|'outro'|'idle'>('idle');
  const [isIntroPlaying, setIsIntroPlaying] = useState(false);
  const [trackRevealed, setTrackRevealed] = useState(false);
  const [audioLabel, setAudioLabel] = useState('Chưa phát nhạc');
  const [audioError, setAudioError] = useState<string | null>(null);
  const [musicVolume, setMusicVolume] = useState(() => {
    const stored = Number(localStorage.getItem('loto_v6_music_volume'));
    return Number.isFinite(stored) && stored >= 0 && stored <= 1 && localStorage.getItem('loto_v6_music_volume') !== null ? stored : 0.85;
  });
  const [audioTestStatus, setAudioTestStatus] = useState<string | null>(null);
  const [soundpacks, setSoundpacks] = useState<SoundpackDefinition[]>([DEFAULT_SOUNDPACK]);
  const [soundpackId, setSoundpackId] = useState(DEFAULT_SOUNDPACK.id);
  const [soundpackStatus, setSoundpackStatus] = useState<string | null>(null);
  useEffect(() => {
    let canceled = false;
    void loadSoundpackCatalog().then(packs => {
      if (canceled) return;
      setSoundpacks(packs);
      const saved = localStorage.getItem('loto_soundpack_id');
      const selected = packs.find(p => p.id === saved) ?? DEFAULT_SOUNDPACK;
      try {
        speechCaller.setSoundpack(selected);
        setSoundpackId(selected.id);
        setSoundpackStatus(`Đã nạp danh sách ${packs.length} soundpack`);
      } catch {
        // A round may have already started before catalog fetch completed.
        setSoundpackStatus('Ván đang chạy, soundpack sẽ chỉ đổi ở ván mới.');
      }
    }).catch(error => { if (!canceled) setSoundpackStatus(`Lỗi danh sách bộ nhạc: ${String(error)}. Đang dùng bộ mặc định.`); });
    return () => { canceled = true; };
  }, []);
  const handleSoundpackChange = (id: string) => {
    const pack = soundpacks.find(p => p.id === id);
    if (!pack) return;
    try {
      speechCaller.setSoundpack(pack);
      setSoundpackId(pack.id);
      localStorage.setItem('loto_soundpack_id', pack.id);
      setSoundpackStatus(`Đã chọn bộ nhạc: ${pack.title}`);
      setAudioTestStatus(null);
    } catch (error) {
      setSoundpackStatus(`Không đổi được bộ nhạc: ${String(error)}`);
    }
  };

  const handleMusicToggle = () => {
    const enabled = !speechCaller.getEnabled();
    speechCaller.setEnabled(enabled); // Must execute synchronously on the click, not only React effect.
    setSettings(previous => ({ ...previous, voiceCaller: enabled }));
    localStorage.setItem('loto_v6_music_enabled', String(enabled));
    setAudioTestStatus(enabled ? `Đã bật lại nhạc · AudioContext: ${speechCaller.getAudioState()}` : 'Đã tắt tiếng; bài đang hát vẫn tiếp tục chạy.');
  };
  const handleMusicVolume = (next: number) => {
    const value = Math.max(0, Math.min(1, next));
    speechCaller.setVolume(value); // Update sound immediately, even before React render.
    setMusicVolume(value);
    localStorage.setItem('loto_v6_music_volume', String(value));
  };
  const handleTestIntroAudio = async () => {
    setAudioTestStatus('Đang tải và giải mã intro.mp3…');
    try {
      await speechCaller.testIntroSample();
      setAudioTestStatus(`Nghe thử thành công · intro.mp3 · AudioContext: ${speechCaller.getAudioState()}. Nếu im lặng hãy kiểm tra âm lượng hệ thống/trình duyệt.`);
    } catch (error) {
      setAudioTestStatus(`LỖI NHẠC: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  const [selectionMode, setSelectionMode] = useState<'random' | 'manual' | null>(null);
  // Một hoặc năm bộ; mỗi bộ đúng 5 số. Các bộ có thể có số trùng nhau,
  // nhưng số trong chính một bộ không được trùng.
  const [packCount, setPackCount] = useState<1 | 5>(initialPackCount);
  const [chosenPacks, setChosenPacks] = useState<number[][]>([]);
  const [selectedFive, setSelectedFive] = useState<number[]>([]);
  const [selectionLocked, setSelectionLocked] = useState(false);
  const selectionLockedRef = useRef(false);
  const selectionDeadlineRef = useRef(0);
  const [selectionSecondsLeft, setSelectionSecondsLeft] = useState(30);
  const [noWinnerEnding, setNoWinnerEnding] = useState(false);
  const [noWinnerReason, setNoWinnerReason] = useState<'exhausted'|'manual'>('exhausted');
  const updateAudioProgress = (_elapsed: number, _total: number) => { /* Hidden timeline: no React render per audio tick. */ };
  const onAudioFailure = (message: string) => {
    singingRef.current = false;
    setIsSingingSong(false);
    setIsIntroPlaying(false);
    setAudioError(message);
    gameStatusRef.current = 'PAUSED';
    setGameState('PAUSED');
  };

  // Tickets & Players (Max 30 players supported!)
  const [playerTickets, setPlayerTickets] = useState<LotoTicket[]>([]);
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [winnerInfo, setWinnerInfo] = useState<{ name: string; isUser: boolean; rowNumbers?: number[] } | null>(null);

  // Character skill state
  const [skillCooldown, setSkillCooldown] = useState<number>(0);
  const [activeHighlightNumber, setActiveHighlightNumber] = useState<number | null>(null);

  // VIP Full Screen Effects
  const [activeVipEffect, setActiveVipEffect] = useState<string | null>(null);

  // 90s Cyber Chat & Buzz
  // Only real messages received during this browser session are shown.
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isBuzzing, setIsBuzzing] = useState<boolean>(false);

  // Modals
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLuckyWheelOpen, setIsLuckyWheelOpen] = useState(false);
  const [isWorldChatOpen, setIsWorldChatOpen] = useState(false);

  // Multiplayer Rooms
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [publicRooms, setPublicRooms] = useState<GameRoom[]>([]);
  const [roomCloudError, setRoomCloudError] = useState<string|null>(null);
  const [roomCloudReady, setRoomCloudReady] = useState(false);

  // 90s Real-time Quick-reaction floating emotes
  const [floatingEmotes, setFloatingEmotes] = useState<FloatingEmoteItem[]>([]);

  const addFloatingEmote = useCallback((senderName: string, emoji: string, label: string) => {
    const id = `emote-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const xPercent = Math.floor(Math.random() * 65) + 18;
    const item: FloatingEmoteItem = {
      id,
      senderName,
      emoji,
      label,
      xPercent,
      createdAt: Date.now()
    };
    setFloatingEmotes(prev => [...prev.slice(-15), item]);
    setTimeout(() => {
      setFloatingEmotes(prev => prev.filter(e => e.id !== id));
    }, 2900);
  }, []);

  const handleSendReaction = useCallback((emoji: string, label: string) => {
    addFloatingEmote(profile.displayName, emoji, label);
    if (currentRoom?.id) {
      void sendRoomReaction(currentRoom.id, {
        senderId: profile.id,
        senderName: profile.displayName,
        emoji,
        label
      });
    }
    broadcastChannelRef.current?.postMessage({
      type: 'ROOM_REACTION',
      payload: {
        senderName: profile.displayName,
        emoji,
        label
      }
    });
  }, [profile, currentRoom?.id, addFloatingEmote]);

  // Profile update with Firestore throttled sync
  const handleUpdateProfile = useCallback((newProfile: PlayerProfile) => {
    setProfile(newProfile);
    saveProfile(newProfile);
    syncProfileToFirestoreThrottled(newProfile);
  }, []);

  // Sign-in is mandatory. Auth state is checked before ANY game screen is rendered.
  // Anonymous sessions from older versions are signed out, never promoted silently.
  useEffect(() => {
    let mounted = true;
    const unsubscribe = onAuthStateChanged(auth, async user => {
      cancelPendingProfileSync();
      if (!mounted) return;
      setReadyUserId(null);
      setAuthIssue(null);
      if (!user || user.isAnonymous) {
        if (user?.isAnonymous) {
          try { await signOut(auth); } catch (error) { console.warn('Không thể thoát phiên khách cũ:', error); }
        }
        if (mounted) { setAuthResolved(true); setIsAuthOpen(true); }
        return;
      }
      try {
        const userRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userRef);
        if (!mounted || auth.currentUser?.uid !== user.uid) return;
        let cloudProfile: PlayerProfile;
        if (snapshot.exists()) {
          cloudProfile = { ...(snapshot.data() as PlayerProfile), id: user.uid };
        } else {
          // Recovery only for a truly authenticated user. Never borrow local profile
          // from another account, and never infer an account from localStorage.
          const username = (user.email || '').split('@')[0].slice(0, 24) || 'hoi_vien';
          cloudProfile = { ...createStarterProfile(user.uid), username, displayName: username };
          await setDoc(userRef, cloudProfile);
        }
        if (!mounted || auth.currentUser?.uid !== user.uid) return;
        setProfile(cloudProfile);
        saveProfile(cloudProfile);
        setReadyUserId(user.uid);
        setIsAuthOpen(false);
      } catch (error) {
        if (mounted) {
          console.warn('Không tải được tài khoản:', (error as {code?: string})?.code || 'unknown');
          setAuthIssue('Không tải được tài khoản. Kiểm tra mạng và thử lại.');
          setIsAuthOpen(true);
        }
      } finally {
        if (mounted) setAuthResolved(true);
      }
    }, error => {
      if (mounted) {
        setAuthResolved(true);
        setAuthIssue('Đăng nhập tạm thời không khả dụng. Vui lòng thử lại.');
        setIsAuthOpen(true);
      }
    });
    return () => { mounted = false; unsubscribe(); };
  }, []);

  // Flush noncritical profile writes as the player hides the browser tab.
  useEffect(() => {
    const onHidden = () => {
      const visible = document.visibilityState === 'visible';
      setPageVisible(visible);
      if (!visible) void flushPendingProfileSync();
    };
    document.addEventListener('visibilitychange', onHidden);
    return () => document.removeEventListener('visibilitychange', onHidden);
  }, []);

  // Subscribe to real-time public rooms from Firestore
  useEffect(() => {
    if (!readyUserId || !isRoomModalOpen || !pageVisible) return;
    setRoomCloudReady(false);
    setRoomCloudError(null);
    const unsubPublicRooms = subscribeToPublicRooms((rooms) => setPublicRooms(rooms), err => {
      setRoomCloudError('Không tải được danh sách phòng. Vui lòng thử lại.');
      setRoomCloudReady(false);
    }, fromServer => {
      setRoomCloudReady(fromServer);
      if (fromServer) setRoomCloudError(null);
    });
    return () => unsubPublicRooms();
  }, [isRoomModalOpen, readyUserId, pageVisible]);

  // One session start per authenticated page open, never a recurring heartbeat.
  // The server timestamp is also required by Firestore Rules for chat history access.
  useEffect(() => {
    setWorldChatJoinedAt(null);
    setMessages(previous => previous.filter(message => message.channel !== 'world'));
    if (!readyUserId) return;
    let active = true;
    beginWorldChatSession(readyUserId).then(joinedAt => {
      if (!active) return;
      setWorldChatJoinedAt(joinedAt);
      setChatConnectionError(previous => ({ ...previous, world: null }));
    }).catch(() => {
      if (!active) return;
      setChatConnection(previous => ({ ...previous, world: 'error' }));
      setChatConnectionError(previous => ({ ...previous, world: 'Không bắt đầu được trò chuyện. Hãy thử tải lại trang.' }));
    });
    return () => { active = false; };
  }, [readyUserId]);

  // Subscribe to real-time World chat from Firestore
  useEffect(() => {
    if (!readyUserId || !worldChatJoinedAt || !pageVisible) return;
    // World is a separate modal; offline practice may display it in the sidebar.
    if (!isWorldChatOpen && !(currentView === 'GAME_MATCH' && !currentRoom && matchRightTab === 'chat')) return;
    setChatConnection(previous => ({...previous, world:'connecting'}));
    setChatConnectionError(previous => ({...previous, world:null}));
    const unsubWorld = subscribeToWorldChat((worldMsgs) => {
      consumeVipChatEffects(worldMsgs, 'world');
      setMessages(prev => {
        const nonWorld = prev.filter(m => m.channel !== 'world');
        return [...nonWorld, ...worldMsgs].sort((a, b) => a.timestamp - b.timestamp);
      });
    }, worldChatJoinedAt, error => {
      setChatConnection(previous => ({...previous, world:'error'}));
      setChatConnectionError(previous => ({...previous, world:'Không tải được tin nhắn. Vui lòng thử lại.'}));
    }, fromServer => {
      setChatConnection(previous => ({...previous, world:fromServer?'online':'offline'}));
      if (fromServer) setChatConnectionError(previous => ({...previous, world:null}));
    });
    return () => unsubWorld();
  }, [currentView, currentRoom?.id, matchRightTab, isWorldChatOpen, readyUserId, worldChatJoinedAt, pageVisible, consumeVipChatEffects]);

  // Gameplay listeners are stable for the lifetime of one room: switching chat tabs
  // MUST NOT detach and re-query room/members/state (billable initial reads).
  useEffect(() => {
    if (!currentRoom?.id) return;
    const roomId = currentRoom.id;
    setRoomChatJoinedAt(null);
    setMessages(previous => previous.filter(message => message.channel !== 'room'));
    const unsubRoom = subscribeToRoom(roomId, updated => {
      if (!updated) { activeRoomRef.current = null; rosterRoomIdRef.current = null; setCurrentRoom(null); setCurrentView('MENU'); return; }
      activeRoomRef.current = updated;
      setCurrentRoom(updated);
    });
    const unsubMembers = subscribeToRoomMembers(roomId, members => {
      rosterRoomIdRef.current = roomId;
      setPlayers(members);
      playersRef.current = members;
      const own = members.find(member => member.id === auth.currentUser?.uid) as (PlayerState & {joinedAt?: Timestamp}) | undefined;
      if (own?.joinedAt instanceof Timestamp) {
        setRoomChatJoinedAt(previous => previous?.roomId === roomId && previous.since.isEqual(own.joinedAt!)
          ? previous : { roomId, since: own.joinedAt! });
      } else if (own && !legacyMemberMigratedRef.current.has(roomId)) {
        legacyMemberMigratedRef.current.add(roomId);
        void ensureRoomChatJoinTime(roomId, own.id).catch(() => {
          setChatConnection(previous => ({ ...previous, room: 'error' }));
          setChatConnectionError(previous => ({ ...previous, room: 'Không mở được phiên trò chuyện trong phòng.' }));
        });
      }
    }, err => console.warn('Không nạp được thành viên phòng:', err.code));
    const unsubState = subscribeToRoomGameState(roomId, state => {
      if (activeRoomRef.current?.hostId === auth.currentUser?.uid) return;
      const history = (state.calledHistory || []).filter(n => Number.isInteger(n) && n >= 1 && n <= 90);
      if (state.status === 'WAITING' && gameStatusRef.current !== 'WAITING') {
        remoteRoundResetRef.current?.();
      }
      calledHistoryRef.current = history;
      setCalledHistory(history);
      setCalledNumbers(new Set(history));
      setCurrentBall(state.currentBallNumber ?? history.at(-1) ?? null);
      setPlayerTickets(tickets => tickets.map(ticket => ({ ...ticket, grid: ticket.grid.map(row =>
        row.map(cell => ({ ...cell, called: cell.value !== null && history.includes(cell.value),
          marked: cell.value !== null && history.includes(cell.value) }))
      ) })));
      gameStatusRef.current = state.status;
      setGameState(state.status);
      if (state.status === 'GAME_OVER' && state.winnerPlayerName) {
        setWinnerInfo({ name: state.winnerPlayerName, isUser: state.winnerPlayerName === displayNameRef.current, rowNumbers: state.winnerRow });
      }
    }, err => console.warn('Không nạp được trạng thái online:', err.code));
    return () => { unsubRoom(); unsubMembers(); unsubState(); };
  }, [currentRoom?.id]);

  // Chat has its own visibility-scoped listener, disconnected without affecting gameplay.
  useEffect(() => {
    if (!readyUserId || !pageVisible || isWorldChatOpen || !currentRoom?.id || roomChatJoinedAt?.roomId !== currentRoom.id || currentView !== 'GAME_MATCH' || matchRightTab !== 'chat') return;
    setChatConnection(previous => ({...previous, room:'connecting'}));
    setChatConnectionError(previous => ({...previous, room:null}));
    return subscribeToRoomChat(currentRoom.id, roomMsgs => {
      consumeVipChatEffects(roomMsgs, 'room', currentRoom.id);
      setMessages(prev => [...prev.filter(m => m.channel !== 'room'), ...roomMsgs]
        .sort((a, b) => a.timestamp - b.timestamp));
    }, roomChatJoinedAt.since, error => {
      setChatConnection(previous => ({...previous, room:'error'}));
      setChatConnectionError(previous => ({...previous, room:'Không tải được tin nhắn trong phòng.'}));
    }, fromServer => {
      setChatConnection(previous => ({...previous, room:fromServer?'online':'offline'}));
      if (fromServer) setChatConnectionError(previous => ({...previous, room:null}));
    });
  }, [readyUserId, pageVisible, isWorldChatOpen, currentRoom?.id, roomChatJoinedAt, currentView, matchRightTab, consumeVipChatEffects]);

  useEffect(() => {
    if (!pageVisible || !currentRoom?.id || currentView !== 'GAME_MATCH') return;
    return subscribeToRoomReactions(currentRoom.id, reaction => {
      if (reaction.senderId !== auth.currentUser?.uid) {
        addFloatingEmote(reaction.senderName, reaction.emoji, reaction.label);
      }
    });
  }, [currentRoom?.id, currentView, pageVisible, addFloatingEmote]);

  // Only the host listens to KINH claims; each claim is one event, NOT a polling loop.
  useEffect(() => {
    if (!currentRoom?.id || currentRoom.hostId !== profile.id) return;
    return subscribeToRoomKinhClaims(currentRoom.id, claim => {
      if (gameStatusRef.current !== 'CALLING' && gameStatusRef.current !== 'PAUSED') return;
      const member = playersRef.current.find(p => p.id === claim.senderId);
      if (!member || member.isBot || !member.tickets?.length) return;
      const calledSet = new Set(calledHistoryRef.current);
      const won = member.tickets.some(ticket => ticket.grid.some(row => {
        const chosen = row.map(cell => cell.value).filter((n): n is number => n !== null);
        return chosen.length === 5 && chosen.every(n => calledSet.has(n))
          && chosen.every(n => claim.numbers.includes(n)) && claim.numbers.every(n => chosen.includes(n));
      }));
      if (won) handleGameOverRef.current?.(member.name, member.id === profile.id, claim.numbers);
    });
  }, [currentRoom?.id, currentRoom?.hostId, profile.id]);

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    localStorage.setItem('viet_loto_visited', 'true');
  }, []);

  // Multi-tab sync channel
  useEffect(() => {
    try {
      broadcastChannelRef.current = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      broadcastChannelRef.current.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'BUZZ') {
          triggerScreenBuzz();
        } else if (type === 'VIP_EFFECT') {
          setActiveVipEffect(payload);
        } else if (type === 'PUBLIC_ROOM_LIST') {
          setPublicRooms(payload);
        } else if (type === 'ROOM_REACTION') {
          addFloatingEmote(payload.senderName, payload.emoji, payload.label);
        }
      };
    } catch {
      // Fallback
    }

    return () => {
      broadcastChannelRef.current?.close();
    };
  }, [addFloatingEmote]);

  // An invite link is only processed AFTER Authentication and the matching cloud profile are ready.
  useEffect(() => {
    const inviteCode = new URLSearchParams(window.location.search).get('room');
    if (!inviteCode || !readyUserId || profile.id !== readyUserId) return;
    if (handledInviteRef.current === inviteCode) return;
    handledInviteRef.current = inviteCode;
    void handleJoinRoom(inviteCode).catch(error => {
      setRoomCloudError(error instanceof Error ? error.message : 'Không thể vào phòng từ lời mời.');
      setIsRoomModalOpen(true);
    });
  }, [readyUserId, profile.id]);

  useEffect(() => {
    audioSynthesizer.setMuted(!settings.soundEffects);
    speechCaller.setEnabled(settings.voiceCaller);
    speechCaller.setVolume(musicVolume);
  }, [settings.soundEffects, settings.voiceCaller, musicVolume]);

  useEffect(() => {
    if (skillCooldown > 0) {
      const timer = setTimeout(() => {
        setSkillCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [skillCooldown]);

  const triggerScreenBuzz = useCallback(() => {
    setIsBuzzing(true);
    audioSynthesizer.playYahooBuzz();
    setTimeout(() => {
      setIsBuzzing(false);
    }, 600);
  }, []);

  const triggerVipEffect = useCallback((effectType: string) => {
    setActiveVipEffect(effectType);
    broadcastChannelRef.current?.postMessage({
      type: 'VIP_EFFECT',
      payload: effectType
    });
  }, []);

  const handleSendMessage = async (text: string, channel: 'room' | 'world', isVipEmoji?: string) => {
    const sender = { id: profile.id, name: profile.displayName, characterId: profile.characterId };
    if (!readyUserId || readyUserId !== auth.currentUser?.uid || auth.currentUser?.isAnonymous) {
      return { allowed:false, filteredText:'', reason:'Hãy đăng nhập để gửi tin nhắn.' };
    }
    if (channel === 'world') {
      if (!worldChatJoinedAt) return {allowed:false, filteredText:'', reason:'Kênh Thế Giới chưa sẵn sàng. Hãy thử lại.'};
      return sendWorldChatMessage(sender, text, isVipEmoji);
    }
    if (currentRoom?.id) {
      if (roomChatJoinedAt?.roomId !== currentRoom.id) return {allowed:false, filteredText:'', reason:'Đang kết nối trò chuyện trong phòng. Hãy thử lại.'};
      return sendRoomChatMessage(currentRoom.id, sender, text, isVipEmoji);
    }
    return { allowed:false, filteredText:'', reason:'Hãy vào phòng online để sử dụng chat phòng.' };
  };

  const handleSendBuzz = () => {
    triggerScreenBuzz();
    if (currentRoom?.id) {
      void sendRoomBuzz(currentRoom.id, {
        id: profile.id, name: profile.displayName, characterId: profile.characterId
      });
    }
  };

  const handleShareRoomToWorld = () => {
    if (!currentRoom) return;
    if (currentRoom.isPrivate) { alert('Phòng riêng không được phát mã mời lên chat thế giới. Hãy gửi mã trực tiếp cho bạn bè.'); return; }
    const inviteText = `📢 [MÃ PHÒNG: #${currentRoom.code}] "${currentRoom.name}" sức chứa ${currentRoom.maxPlayers} người đang mở! Mời bà con vào chơi!`;
    void handleSendMessage(inviteText, 'world').then(result => { if (!result.allowed) alert(result.reason || 'Không gửi được lời mời.'); });
  };

  /** Chốt đúng 5 số. Nếu hết giờ, giữ số người chơi đã chọn và bốc bù số còn thiếu. */
  /** Khóa bộ vé chỉ sau khi tất cả bộ số đã đủ. Đủ 30/120 giây tự điền phần còn thiếu. */
  const finalizePacks = useCallback((sets: number[][]) => {
    if (selectionLockedRef.current || gameStatusRef.current !== 'WAITING') return;
    const complete = Array.from({ length: packCount }, (_, i) =>
      pickFiveUnique(MAX_SOUND_NUMBER, sets[i] ?? [])
    );
    const tickets = complete.map((chosen, i) => {
      const ticket = generateFiveNumberTicket(chosen, (profile.activeTicketSkinId as LotoTicket['colorTheme']) || 'classic-yellow');
      return { ...ticket, id: `${ticket.id}-${i}`, name: `Bộ ${i + 1}` };
    });
    selectionLockedRef.current = true;
    setSelectionLocked(true);
    setChosenPacks(complete);
    setSelectedFive([]);
    setPlayerTickets(tickets);
    const liveRoom = activeRoomRef.current;
    if (liveRoom && auth.currentUser?.uid === profile.id) {
      const myself: PlayerState = { id: profile.id, name: profile.displayName,
        isHost: liveRoom.hostId === profile.id, isBot: false, characterId: profile.characterId,
        tickets, isReady: true, hasKinh: false, score: profile.coins };
      void publishOwnRoomTickets(liveRoom.id, myself, tickets)
        .catch(error => console.warn('Không lưu được vé vào phòng online:', error));
    }
    setPlayers(previous => {
      const updated = previous.map(person => person.id === profile.id ? { ...person, tickets } : person);
      playersRef.current = updated;
      return updated;
    });
  }, [packCount, profile]);

  const choosePackCount = useCallback((count: 1 | 5) => {
    if (selectionLockedRef.current || gameStatusRef.current !== 'WAITING') return;
    setPackCount(1);
    setSettings(previous => ({ ...previous, ticketCount: 1 }));
    localStorage.setItem('loto_pack_count', '1');
    setSelectionMode(null);
    setChosenPacks([]);
    setSelectedFive([]);
    selectionDeadlineRef.current = Date.now() + 30_000;
    setSelectionSecondsLeft(30);
  }, []);

  const chooseFiveMode = useCallback((mode: 'random' | 'manual') => {
    if (selectionLockedRef.current || gameStatusRef.current !== 'WAITING') return;
    setSelectionMode(mode);
    if (mode === 'random') finalizePacks([]);
    else { setChosenPacks([]); setSelectedFive([]); }
  }, [finalizePacks]);

  const toggleSelectedFive = useCallback((n: number) => {
    if (selectionLockedRef.current || gameStatusRef.current !== 'WAITING') return;
    setSelectedFive(previous => previous.includes(n)
      ? previous.filter(v => v !== n)
      : previous.length < 5 && n >= 1 && n <= MAX_SOUND_NUMBER ? [...previous, n].sort((a,b)=>a-b) : previous);
  }, []);

  const confirmCurrentPack = useCallback(() => {
    if (selectionLockedRef.current || gameStatusRef.current !== 'WAITING' || selectedFive.length !== 5) return;
    const newPacks = [...chosenPacks, [...selectedFive]];
    if (newPacks.length >= packCount) finalizePacks(newPacks);
    else { setChosenPacks(newPacks); setSelectedFive([]); }
  }, [chosenPacks, selectedFive, packCount, finalizePacks]);

  useEffect(() => {
    if (currentView !== 'GAME_MATCH' || gameState !== 'WAITING' || selectionLocked) return;
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((selectionDeadlineRef.current - Date.now()) / 1000));
      setSelectionSecondsLeft(seconds);
      if (seconds === 0 && !selectionLockedRef.current) finalizePacks([...chosenPacks, selectedFive]);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [currentView, gameState, selectionLocked, selectedFive, chosenPacks, finalizePacks]);

  // START A NEW GAME ROUND (Exactly 1 random ticket per player, 30 players)
  const startNewGame = useCallback((mode: 'offline_bot' | 'online_friend' = settings.mode, roomOverride?: GameRoom) => {
    const liveRoom = roomOverride || activeRoomRef.current;
    speechCaller.stop();
    gameStatusRef.current = 'WAITING';
    singingRef.current = false;
    phaseRef.current = 'idle';
    revealedRef.current = null;
    preparedNumberRef.current = null;
    winnerPendingRef.current = null;
    hasPlayedNearEndRef.current = false;
    setIsIntroPlaying(false);
    setTrackRevealed(false);
    setNoWinnerEnding(false);
    setNoWinnerReason('exhausted');
    setAudioError(null);
    setAudioLabel('Chờ bắt đầu ván');


    engineRef.current.reset(MAX_SOUND_NUMBER);
    setCalledNumbers(new Set());
    calledHistoryRef.current = [];
    setCalledHistory([]);
    setCurrentBall(null);
    setWinnerInfo(null);
    setActiveHighlightNumber(null);

    // Chưa cấp vé ở đây: người chơi tự chọn 5 số hoặc chọn random trước khi bấm BẮT ĐẦU.
    selectionLockedRef.current = false;
    kinClaimPendingRef.current = false;
    const rememberedSeconds = 30;
    selectionDeadlineRef.current = Date.now() + rememberedSeconds * 1_000;
    setSelectionSecondsLeft(rememberedSeconds);
    setSelectionMode(null);
    setChosenPacks([]);
    const rememberedCount: 1 | 5 = 1;
    setPackCount(rememberedCount);
    setSelectedFive([]);
    setSelectionLocked(false);
    const mappedTickets: LotoTicket[] = [];
    setPlayerTickets(mappedTickets);

    const userPlayer: PlayerState = {
      id: profile.id,
      name: profile.displayName,
      isHost: mode === 'offline_bot' || !liveRoom || liveRoom.hostId === profile.id,
      isBot: false,
      characterId: profile.characterId,
      tickets: mappedTickets,
      isReady: true,
      hasKinh: false,
      score: profile.coins
    };

    let allPlayers: PlayerState[] = [userPlayer];
    if (mode === 'offline_bot') {
      // 29 Bots + 1 User = 30 Players!
      const bots = createOfflineBots(29, MAX_SOUND_NUMBER);
      allPlayers = [userPlayer, ...bots];
    } else if (liveRoom) {
      // Live roster is supplied by the members listener; do not treat room.players as current.
      allPlayers = rosterRoomIdRef.current === liveRoom.id && playersRef.current.length
        ? playersRef.current : [userPlayer];
    }
    setPlayers(allPlayers);
    playersRef.current = allPlayers;

    // Không có quyền đánh dấu trước: tất cả 5 số chỉ được đánh dấu khi âm thanh mở số.

    setGameState('WAITING');
    setCurrentView('GAME_MATCH');
    if (mode === 'online_friend' && liveRoom?.hostId === auth.currentUser?.uid) {
      void publishOwnRoomTickets(liveRoom.id, userPlayer, []).catch(error => console.warn('Không reset được vé chủ phòng:', error));
      void publishRoomGameState(liveRoom.id, { status: 'WAITING', currentBallNumber: null, calledHistory: [], winnerPlayerName: '', winnerRow: [] })
        .catch(error => console.warn('Không thể đặt lại ván online:', error));
    }
    setIsSingingSong(false);
    setSingingNumber(null);
    if (nextSongTimeoutRef.current) {
      clearTimeout(nextSongTimeoutRef.current);
    }
  }, [settings, profile]);


  remoteRoundResetRef.current = () => {
    // Guest resets only local ticket-selection state; only host writes live room state.
    speechCaller.stop();
    singingRef.current = false;
    setNoWinnerEnding(false);
    setWinnerInfo(null);
    setPlayerTickets([]);
    const liveRoom = activeRoomRef.current;
    const member = playersRef.current.find(p => p.id === profile.id);
    if (liveRoom && member) {
      void publishOwnRoomTickets(liveRoom.id, member, []).catch(e => console.warn('Không reset được vé online:', e));
    }
    setChosenPacks([]);
    setSelectedFive([]);
    setSelectionMode(null);
    selectionLockedRef.current = false;
    kinClaimPendingRef.current = false;
    setSelectionLocked(false);
    selectionDeadlineRef.current = Date.now() + 30_000;
    setSelectionSecondsLeft(30);
  };

  // Luồng audio tuần tự: INTRO -> hò số bất kỳ -> (Sắp hết) -> Hết nhạc nếu chưa KINH.
  // Không gán thời lượng cố định; timeupdate theo duration của CHÍNH BÀI NHẠC.
  const handleSongReveal = useCallback((number: number) => {
    if (gameStatusRef.current !== 'CALLING' || revealedRef.current === number) return;
    revealedRef.current = number;
    engineRef.current.confirmCurrentBall(number);
    setTrackRevealed(true);
    setCurrentBall(number);
    setCalledNumbers(prev => new Set(prev).add(number));
    const newHistory = calledHistoryRef.current.includes(number) ? calledHistoryRef.current : [...calledHistoryRef.current, number];
    calledHistoryRef.current = newHistory;
    setCalledHistory(newHistory);
    const liveRoom = activeRoomRef.current;
    if (liveRoom && liveRoom.hostId === auth.currentUser?.uid) {
      void publishRoomGameState(liveRoom.id, { status: 'CALLING', currentBallNumber: number, calledHistory: newHistory })
        .catch(error => console.warn('Không gửi được số mới:', error));
    }

    if (profile.characterId === 'cu_teo') {
      setActiveHighlightNumber(number);
      setTimeout(() => setActiveHighlightNumber(null), 3000);
    }

    setPlayerTickets(tickets => tickets.map(ticket => ({
      ...ticket,
      grid: ticket.grid.map(row => row.map(cell => cell.value === number ? { ...cell, marked: true, called: true } : cell))
    })));

    const updatedPlayers = playersRef.current.map(player => ({
      ...player,
      tickets: player.tickets.map(ticket => ({
        ...ticket,
        grid: ticket.grid.map(row => row.map(cell => cell.value === number ? { ...cell, marked: true, called: true } : cell))
      }))
    }));
    playersRef.current = updatedPlayers;
    setPlayers(updatedPlayers);
  }, [profile.characterId]);

  const playNoWinnerOutro = useCallback((reason: 'exhausted'|'manual' = 'exhausted') => {
    if (gameStatusRef.current === 'GAME_OVER') return;
    gameStatusRef.current = 'GAME_OVER';
    phaseRef.current = 'outro';
    singingRef.current = false;
    setIsSingingSong(false);
    setTrackRevealed(false);
    setGameState('GAME_OVER');
    const liveRoom = activeRoomRef.current;
    if (liveRoom?.hostId === auth.currentUser?.uid) {
      void publishRoomGameState(liveRoom.id, { status: 'GAME_OVER', currentBallNumber: calledHistoryRef.current.at(-1) || null, calledHistory: calledHistoryRef.current });
    }
    setNoWinnerEnding(true);
    setNoWinnerReason(reason);
    setAudioLabel('Hết nhạc — chưa ai KINH');

    setAudioError(null);
    speechCaller.playOutro({
      onProgress: updateAudioProgress,
      onError: message => setAudioError(message)
    });
    handleSendMessage(reason === 'manual' ? '🎺 Gánh hát kết thúc ván, chưa có ai KINH!' : '🎺 Hết nhạc! Cả 90 số đã kêu mà chưa ai KINH. Ván chơi khép lại!', 'room');
  }, []);

  const queueNextStepRef = useRef<(() => void) | null>(null);

  const createNumberChantCallbacks = useCallback((num: number): AudioCallbacks => {
    return {
      onStart: () => {
        phaseRef.current = 'song';
        singingRef.current = true;
        setIsSingingSong(true);
        setIsIntroPlaying(false);
        gameStatusRef.current = 'CALLING';
        setGameState('CALLING');
        setTrackRevealed(false);
        setSingingNumber(null);
        setAudioError(null);
        setAudioLabel('Gánh hát đang hò một con số bí mật...');
        // Advance queue next track seamlessly
        queueNextStepRef.current?.();
      },
      onReveal: () => {
        handleSongReveal(num);
      },
      onSongEnd: () => {
        handleNumberSongEnd(num);
      },
      onProgress: updateAudioProgress,
      onError: onAudioFailure
    };
  }, [handleSongReveal]);

  const queueNextStep = useCallback(() => {
    if (gameStatusRef.current !== 'CALLING') return;
    const remaining = engineRef.current.getRemainingCount();
    if (remaining === 0) {
      speechCaller.queueNextTrack('outro', {
        onStart: () => {
          phaseRef.current = 'outro';
          singingRef.current = false;
          setIsSingingSong(false);
          setTrackRevealed(false);
          gameStatusRef.current = 'GAME_OVER';
          setGameState('GAME_OVER');
          setNoWinnerEnding(true);
          setAudioLabel('Hết nhạc — chưa ai KINH');
        },
        onProgress: updateAudioProgress,
        onError: onAudioFailure
      });
      return;
    }

    if (!hasPlayedNearEndRef.current && remaining <= ALMOST_OVER_REMAINING) {
      hasPlayedNearEndRef.current = true;
      speechCaller.queueNextTrack('near_end', {
        onStart: () => {
          phaseRef.current = 'near_end';
          singingRef.current = true;
          setIsSingingSong(true);
          setTrackRevealed(false);
          setAudioLabel('Nhạc báo sắp hết số');
          const nextBall = engineRef.current.drawNextBall();
          if (nextBall) {
            speechCaller.queueNextTrack(
              String(nextBall.number).padStart(2, '0'),
              createNumberChantCallbacks(nextBall.number),
              nextBall.number
            );
          }
        },
        onProgress: updateAudioProgress,
        onError: onAudioFailure
      });
      return;
    }

    const nextBall = engineRef.current.drawNextBall();
    if (nextBall) {
      speechCaller.queueNextTrack(
        String(nextBall.number).padStart(2, '0'),
        createNumberChantCallbacks(nextBall.number),
        nextBall.number
      );
    }
  }, [createNumberChantCallbacks]);

  useEffect(() => {
    queueNextStepRef.current = queueNextStep;
  }, [queueNextStep]);

  const playNearEndInterlude = useCallback(() => {
    if (gameStatusRef.current !== 'CALLING') return;
    phaseRef.current = 'near_end';
    singingRef.current = true;
    setIsSingingSong(true);
    setTrackRevealed(false);
    setAudioLabel('Nhạc báo sắp hết số');

    speechCaller.playNearEnd({
      onStart: () => {
        setAudioLabel('Nhạc báo sắp hết số');
        const next = engineRef.current.drawNextBall();
        if (next) {
          speechCaller.queueNextTrack(
            String(next.number).padStart(2, '0'),
            createNumberChantCallbacks(next.number),
            next.number
          );
        }
      },
      onProgress: updateAudioProgress,
      onSongEnd: () => {
        if (gameStatusRef.current !== 'CALLING') return;
        if (!speechCaller.isPlaying() && !speechCaller.hasQueuedTrack()) {
          startSongForNextBallRef.current?.();
        }
      },
      onError: onAudioFailure
    });
  }, [createNumberChantCallbacks]);

  const handleNumberSongEnd = useCallback((number: number) => {
    if (gameStatusRef.current !== 'CALLING') return;
    const winner = winnerPendingRef.current;
    if (winner) {
      winnerPendingRef.current = null;
      handleGameOverRef.current?.(winner.name, false, winner.rowNumbers);
      return;
    }
    // If next track is already playing or queued via WebAudio, let it flow gaplessly
    if (speechCaller.isPlaying() || speechCaller.hasQueuedTrack()) {
      return;
    }
    singingRef.current = false;
    setIsSingingSong(false);
    const count = engineRef.current.getCalledBalls().length;
    if (count >= MAX_SOUND_NUMBER) {
      playNoWinnerOutro();
      return;
    }
    if (!hasPlayedNearEndRef.current && engineRef.current.getRemainingCount() <= ALMOST_OVER_REMAINING) {
      hasPlayedNearEndRef.current = true;
      playNearEndInterlude();
      return;
    }
    startSongForNextBallRef.current?.();
  }, [playNearEndInterlude, playNoWinnerOutro]);

  const startSongForNextBall = useCallback((forcedNumber?: number) => {
    if (gameStatusRef.current !== 'CALLING' || speechCaller.isPlaying() || speechCaller.hasQueuedTrack()) return;
    const drawn = engineRef.current.drawNextBall(forcedNumber);
    if (!drawn) {
      if (engineRef.current.getRemainingCount() === 0) playNoWinnerOutro();
      return;
    }
    phaseRef.current = 'song';
    singingRef.current = true;
    revealedRef.current = null;
    setIsSingingSong(true);
    setTrackRevealed(false);
    setSingingNumber(null);
    setAudioError(null);

    setAudioLabel('Gánh hát đang hò một con số bí mật...');

    speechCaller.playSongForNumber(drawn.number, createNumberChantCallbacks(drawn.number));
  }, [createNumberChantCallbacks, playNoWinnerOutro]);

  useEffect(() => {
    startSongForNextBallRef.current = startSongForNextBall;
  }, [startSongForNextBall]);

  // Bắt đầu bằng NHẠC DẠO (intro.mp3), sau đó lần lượt phát soundpack các số được xáo ngẫu nhiên.
  const handleStartGameRound = useCallback(() => {
    if (gameStatusRef.current !== 'WAITING' || !selectionLockedRef.current) return;
    const room = activeRoomRef.current;
    if (room) {
      if (room.hostId !== auth.currentUser?.uid) return;
      if (!playersRef.current.length || playersRef.current.some(player => !player.isBot && player.tickets.length !== 1)) {
        alert('Chưa đủ vé đã chốt của mọi người trong phòng. Hãy chờ người chơi chọn xong bộ 5 số.');
        return;
      }
    }
    gameStatusRef.current = 'COUNTDOWN';
    phaseRef.current = 'intro';
    speechCaller.setEnabled(settings.voiceCaller);
    speechCaller.setVolume(musicVolume);
    setGameState('COUNTDOWN');
    const liveRoom = activeRoomRef.current;
    if (liveRoom?.hostId === auth.currentUser?.uid) {
      void publishRoomGameState(liveRoom.id, { status: 'COUNTDOWN', currentBallNumber: null, calledHistory: [] });
    }
    setIsIntroPlaying(true);
    setAudioLabel('Đang phát nhạc mở màn...');

    setAudioError(null);
    if (liveRoom) void handleSendMessage('🏮 Trống hội nổi lên! Nghe hết nhạc dạo rồi gánh hát bắt đầu kêu số!', 'room');

    speechCaller.playIntro({
      onStart: () => {
        setAudioLabel('Nhạc mở màn');
        // Pre-draw Ball 1 and queue it ahead of time into WebAudio for 100% gapless handoff
        const ball1 = engineRef.current.drawNextBall();
        if (ball1) {
          speechCaller.queueNextTrack(
            String(ball1.number).padStart(2, '0'),
            createNumberChantCallbacks(ball1.number),
            ball1.number
          );
        }
      },
      onProgress: updateAudioProgress,
      onSongEnd: () => {
        setIsIntroPlaying(false);
        if (gameStatusRef.current === 'COUNTDOWN') {
          gameStatusRef.current = 'CALLING';
          setGameState('CALLING');
        }
        // Fallback only if queue had not triggered
        if (!speechCaller.isPlaying() && !speechCaller.hasQueuedTrack()) {
          startSongForNextBallRef.current?.();
        }
      },
      onError: onAudioFailure
    });
  }, [settings.voiceCaller, musicVolume, createNumberChantCallbacks]);

  const handleAudioPauseToggle = () => {
    if (gameStatusRef.current === 'PAUSED') {
      gameStatusRef.current = phaseRef.current === 'intro' ? 'COUNTDOWN' : 'CALLING';
      setGameState(gameStatusRef.current);
      speechCaller.resume().then(() => setAudioError(null)).catch(e => onAudioFailure(String(e)));
    } else if (gameStatusRef.current === 'CALLING' || gameStatusRef.current === 'COUNTDOWN') {
      speechCaller.pause();
      gameStatusRef.current = 'PAUSED';
      setGameState('PAUSED');
    }
  };

  const handleRetryAudio = () => {
    if (!audioError) return;
    const phase = phaseRef.current;
    setAudioError(null);
    if (phase === 'intro') {
      gameStatusRef.current = 'WAITING';
      setGameState('WAITING');
      handleStartGameRound();
    } else if (phase === 'song') {
      gameStatusRef.current = 'CALLING';
      setGameState('CALLING');
      singingRef.current = false;
      startSongForNextBallRef.current?.();
    } else if (phase === 'near_end') {
      gameStatusRef.current = 'CALLING';
      setGameState('CALLING');
      singingRef.current = false;
      playNearEndInterlude();
    }
  };

  // Cleanup timeout on unmount or mode switch
  useEffect(() => {
    return () => {
      if (nextSongTimeoutRef.current) clearTimeout(nextSongTimeoutRef.current);
      speechCaller.stop();
    };
  }, []);

  // CHECK KINH BUTTON
  const handleUserCallKinh = () => {
    if ((gameStatusRef.current !== 'CALLING' && gameStatusRef.current !== 'PAUSED') || !selectionLockedRef.current) return;
    const calledSet = new Set(calledHistoryRef.current);
    let validKinh = false;
    let winningRowNums: number[] = [];

    for (const ticket of playerTickets) {
      const check = engineRef.current.checkTicketKinh(ticket, calledSet);
      if (check.hasKinh) {
        validKinh = true;
        winningRowNums = check.rowNumbers;
        break;
      }
    }

    if (validKinh) {
      const liveRoom = activeRoomRef.current;
      if (liveRoom && liveRoom.hostId !== auth.currentUser?.uid) {
        if (kinClaimPendingRef.current) return;
        kinClaimPendingRef.current = true;
        void sendRoomKinhClaim(liveRoom.id, profile.id, winningRowNums)
          .catch(error => { kinClaimPendingRef.current = false; alert(`Không gửi được KINH đến chủ phòng: ${String(error)}`); });
      } else {
        handleGameOver(profile.displayName, true, winningRowNums);
      }
    } else {
      // Không cho nhấn khi chưa đủ; kiểm tra lại tại đây để chặn thao tác giả mạo.
    }
  };

  // HANDLE GAME OVER
  const handleGameOver = (winnerName: string, isUserWinner: boolean, winningRow?: number[]) => {
    gameStatusRef.current = 'GAME_OVER';
    phaseRef.current = 'idle';
    singingRef.current = false;
    preparedNumberRef.current = null;
    winnerPendingRef.current = null;
    speechCaller.stop();
    setIsSingingSong(false);
    setIsIntroPlaying(false);
    setGameState('GAME_OVER');
    setWinnerInfo({ name: winnerName, isUser: isUserWinner, rowNumbers: winningRow });
    const liveRoom = activeRoomRef.current;
    if (liveRoom?.hostId === auth.currentUser?.uid) {
      void publishRoomGameState(liveRoom.id, { status: 'GAME_OVER', winnerPlayerName: winnerName, winnerRow: winningRow || [], currentBallNumber: calledHistoryRef.current.at(-1) || null });
    }

    audioSynthesizer.playVictoryKinh();
    // Chỉ phát hiệu ứng KINH, tuyệt đối không sử dụng giọng đọc AI/TTS.

    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 }
    });

    let baseExp = isUserWinner ? 250 : 70;
    let baseCoins = isUserWinner ? 600 : 100;

    if (profile.characterId === 'chi_ba') baseExp = Math.round(baseExp * 1.35);
    if (profile.characterId === 'cong_tu' && isUserWinner) baseCoins = baseCoins * 2;
    if (profile.characterId === 'chi_bay_hot_xoan' && isUserWinner) baseExp = baseExp * 3;

    const { updatedProfile, leveledUp } = addExpAndRewards(profile, baseExp, baseCoins, isUserWinner);
    handleUpdateProfile(updatedProfile);

    saveMatchRecord({
      id: `match-${Date.now()}`,
      timestamp: Date.now(),
      gameMode: settings.mode,
      totalBallsCalled: engineRef.current.getCalledBalls().length,
      winnerName,
      isUserWinner,
      winningRow,
      expEarned: baseExp,
      coinsEarned: baseCoins,
      playerTicketCount: 1,
      lastBallNumber: currentBall || 0
    });

    const victoryText = `🎉 KINH RỒI! ${winnerName} đã hô KINH thành công ở bi số ${currentBall} trong phòng ${currentRoom?.maxPlayers || players.length} người!`;
    handleSendMessage(victoryText, 'room');

    if (leveledUp) {
      setTimeout(() => {
        alert(`Chúc mừng! Bạn đã thăng lên CẤP ${updatedProfile.level}! Đã mở khóa thêm vật phẩm mới tại Tạp Hóa.`);
      }, 1000);
    }
  };

  handleGameOverRef.current = handleGameOver;

  // Character Active Skill
  const handleUseSkill = () => {
    if (skillCooldown > 0 || gameState !== 'CALLING') return;

    const char = getCharacterById(profile.characterId);
    audioSynthesizer.playFestivalDrum();
    setSkillCooldown(char.activeSkill.cooldownSeconds);

    if (char.id === 'chi_ba') {
      const calledSet = engineRef.current.getCalledNumbersSet();
      const waitingNumbers: number[] = [];
      playerTickets.forEach(t => {
        t.grid.forEach(r => {
          r.forEach(c => {
            if (c.value !== null && !calledSet.has(c.value)) {
              waitingNumbers.push(c.value);
            }
          });
        });
      });
      if (waitingNumbers.length > 0) {
        // Kỹ năng không được can thiệp thứ tự phát nhạc hoặc công bố sớm số bí mật.
        setActiveHighlightNumber(waitingNumbers[Math.floor(Math.random() * waitingNumbers.length)]);
        setTimeout(() => setActiveHighlightNumber(null), 2500);
      }
    } else if (char.id === 'cu_teo') {
      if (currentBall) {
        setActiveHighlightNumber(currentBall);
        setTimeout(() => setActiveHighlightNumber(null), 6000);
      }
    } else if (char.id === 'cong_tu') {
      // Hiệu ứng giải trí, không bỏ qua hoặc chọn trước bài hò.
      triggerVipEffect('hearts');
    } else if (char.id === 'ma_mi') {
      const calledSet = engineRef.current.getCalledNumbersSet();
      playerTickets.forEach(t => {
        const closest = engineRef.current.getClosestToKinh(t, calledSet);
        if (closest.missingNumbers.length > 0) {
          alert(`Má Mì Soi Kính: Vé của bạn đang chờ con: ${closest.missingNumbers.join(', ')}`);
        }
      });
    } else if (char.id === 'anh_bay_hu_tieu') {
      setSkillCooldown(0);
      alert('Anh Bảy Hủ Tiếu Gõ muỗng: Giảm toàn bộ thời gian hồi chiêu!');
    } else if (char.id === 'nu_hoang_blog') {
      triggerVipEffect('hearts');
    } else if (char.id === 'bac_ba_nong_trai') {
      triggerVipEffect('piggy_coins');
    }
  };

  const handleCreateRoom = async (data: { name: string; isPrivate: boolean; password?: string; callSpeed: number; maxPlayers: number }) => {
    const hostPlayer: PlayerState = {
      id: profile.id, name: profile.displayName, isHost: true, isBot: false,
      characterId: profile.characterId, tickets: [], isReady: true,
      hasKinh: false, score: profile.coins
    };
    try {
      const room = await createOnlineRoom(data, hostPlayer);
      rosterRoomIdRef.current = null;
      activeRoomRef.current = room;
      setCurrentRoom(room);
      setSettings(prev => ({ ...prev, mode: 'online_friend', callIntervalSeconds: room.callIntervalSeconds }));
      startNewGame('online_friend', room);
    } catch (error) {
      // The room dialog remains open and displays the precise failure stage.
      throw error instanceof Error ? error : new Error('Không tạo được phòng. Vui lòng thử lại.');
    }
  };

  const handleJoinRoom = async (code: string, passwordInput?: string) => {
    const joining: PlayerState = {
      id: profile.id, name: profile.displayName, isHost: false, isBot: false,
      characterId: profile.characterId, tickets: [], isReady: true,
      hasKinh: false, score: profile.coins
    };
    const result = await joinOnlineRoom(code, joining, passwordInput);
    if (!result.success || !result.room) {
      throw new Error(result.error || 'Không vào được phòng online.');
    }
    rosterRoomIdRef.current = null;
    activeRoomRef.current = result.room;
    setCurrentRoom(result.room);
    setSettings(prev => ({ ...prev, mode: 'online_friend', callIntervalSeconds: result.room!.callIntervalSeconds }));
    startNewGame('online_friend', result.room);
  };

  const exitOnlineRoom = () => {
    const oldRoom = activeRoomRef.current;
    if (oldRoom) void leaveOnlineRoom(oldRoom.id, profile.id).catch(error => console.warn('Lỗi rời phòng:', error));
    activeRoomRef.current = null;
    rosterRoomIdRef.current = null;
    setCurrentRoom(null);
    setSettings(prev => ({ ...prev, mode: 'offline_bot' }));
  };

  // KINH khi ít nhất 1 trong 1 hoặc 5 bộ đã đủ 5 số được HÒ & HIỂN THỊ.
  const hasAllFiveCalled = playerTickets.some(ticket =>
    engineRef.current.checkTicketKinh(ticket, calledNumbers).hasKinh
  );
  const maxPackProgress = playerTickets.reduce((best, ticket) =>
    Math.max(best, ticket.grid.flat().filter(cell => cell.value !== null && calledNumbers.has(cell.value)).length), 0
  );
  const canCallKinh = selectionLocked && hasAllFiveCalled
    && (gameState === 'CALLING' || gameState === 'PAUSED');

  const activeChar = getCharacterById(profile.characterId);
  const activeMarker = UNLOCKABLE_CATALOG.find(i => i.id === profile.activeMarkerId) || UNLOCKABLE_CATALOG[0];

  // Visual Theme Configuration based on profile.activeThemeId
  const getThemeConfig = (theme: string) => {
    switch (theme) {
      case 'christmas':
        return {
          wrapper: 'bg-[#1b0808] text-red-50 selection:bg-red-600',
          header: 'bg-[#2b0808] border-b-2 border-red-700 shadow-lg shadow-red-950/50',
          bannerIcon: '🎄',
          titleColor: 'text-red-300',
          themeLabel: 'Giáng Sinh Tuyết Rơi'
        };
      case 'halloween':
        return {
          wrapper: 'bg-[#12071f] text-purple-100 selection:bg-purple-600',
          header: 'bg-[#220c38] border-b-2 border-purple-800 shadow-lg shadow-purple-950/50',
          bannerIcon: '🎃',
          titleColor: 'text-amber-400',
          themeLabel: 'Halloween Ma Mị'
        };
      case 'autumn':
        return {
          wrapper: 'bg-[#211105] text-amber-100 selection:bg-amber-600',
          header: 'bg-[#331c08] border-b-2 border-amber-700 shadow-lg shadow-amber-950/50',
          bannerIcon: '🍂',
          titleColor: 'text-amber-300',
          themeLabel: 'Mùa Thu Vàng'
        };
      case 'summer':
        return {
          wrapper: 'bg-[#061824] text-cyan-50 selection:bg-cyan-600',
          header: 'bg-[#09273c] border-b-2 border-cyan-700 shadow-lg shadow-cyan-950/50',
          bannerIcon: '🏖️',
          titleColor: 'text-cyan-300',
          themeLabel: 'Mùa Hè Biển Xanh'
        };
      case 'winter':
        return {
          wrapper: 'bg-[#071324] text-sky-100 selection:bg-sky-600',
          header: 'bg-[#0a203b] border-b-2 border-sky-700 shadow-lg shadow-sky-950/50',
          bannerIcon: '❄️',
          titleColor: 'text-sky-300',
          themeLabel: 'Mùa Đông Băng Tuyết'
        };
      default: // retro_default
        return {
          wrapper: 'bg-[#1c0f09] text-amber-50 selection:bg-rose-500',
          header: 'bg-[#291307] border-b-2 border-amber-800 shadow-md',
          bannerIcon: '🏮',
          titleColor: 'text-amber-300',
          themeLabel: 'Hội Chợ 199x'
        };
    }
  };

  const getFrameStyle = (frame: string) => {
    switch (frame) {
      case 'frame_diamond':
        return 'ring-4 ring-cyan-300 shadow-[0_0_15px_#38bdf8] border-2 border-white';
      case 'frame_dragon_fire':
        return 'ring-4 ring-rose-500 shadow-[0_0_16px_#f43f5e] border-2 border-yellow-400 animate-pulse';
      case 'frame_neon_pink':
        return 'ring-4 ring-pink-500 shadow-[0_0_15px_#ec4899] border-2 border-fuchsia-300';
      case 'frame_winter_frost':
        return 'ring-4 ring-sky-300 shadow-[0_0_14px_#bae6fd] border-2 border-white';
      case 'frame_pumpkin':
        return 'ring-4 ring-amber-500 shadow-[0_0_14px_#f59e0b] border-2 border-orange-400';
      case 'frame_phoenix_legend':
        return 'ring-4 ring-orange-400 border-4 border-red-700 shadow-[0_0_0_3px_#fcd34d]';
      default:
        return 'border-2 border-amber-500 shadow';
    }
  };

  const currentTheme = getThemeConfig(profile.activeThemeId);

  // The entire gameplay UI remains inaccessible until Firebase Auth AND a
  // matching Firestore user profile are ready (no anonymous/guest mode).
  if (!authResolved || !readyUserId || auth.currentUser?.uid !== readyUserId || auth.currentUser?.isAnonymous) {
    return (
      <div className="min-h-screen bg-[#1c0f09] text-amber-100 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-3 text-center">
          <h1 className="text-2xl sm:text-3xl font-black text-yellow-300">🏮 LÔ TÔ HỘI CHỢ 199x</h1>
          {!authResolved && <p role="status" className="text-amber-200">Đang kiểm tra tài khoản…</p>}
          {authIssue && <p role="alert" className="bg-red-950 border border-red-500 p-3 rounded-lg text-red-100 text-sm">{authIssue}</p>}
          {authResolved && <AuthModal isOpen={true} required onClose={() => {}} onAuthSuccess={newProfile => {
            cancelPendingProfileSync(); setProfile(newProfile); saveProfile(newProfile);
            setReadyUserId(newProfile.id); setAuthIssue(null);
          }} currentProfile={profile} />}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.wrapper} flex flex-col relative selection:text-white ${isBuzzing ? 'animate-buzz' : ''}`}>
      {/* 90s CRT Scanline Overlay */}
      {settings.crtScanlines && (
        <div className="fixed inset-0 crt-overlay z-40 pointer-events-none opacity-40" />
      )}

      {/* Full Screen VIP Chat Emojis Effects */}
      <VipScreenEffects
        activeEffect={activeVipEffect}
        onEffectEnd={() => setActiveVipEffect(null)}
      />

      {/* TOP NAVIGATION BAR */}
      <header className={`flex items-center justify-between gap-8 px-4 py-2.5 ${currentTheme.header} shrink-0 z-30`}>
        <a 
          href="#"
          onClick={(e) => { e.preventDefault(); speechCaller.stop(); gameStatusRef.current = 'WAITING'; setCurrentView('MENU'); }}
          className={`flex items-center gap-2 text-base sm:text-lg font-black tracking-tight ${currentTheme.titleColor} font-pixel whitespace-nowrap shrink-0 hover:text-yellow-400`}
        >
          <span>{currentTheme.bannerIcon}</span>
          <span>LÔ TÔ HỘI CHỢ 199x</span>
        </a>

        <nav className="hidden md:flex items-center gap-5 text-xs font-bold text-amber-200/90 whitespace-nowrap shrink-0">
          <button onClick={() => { speechCaller.stop(); gameStatusRef.current = 'WAITING'; exitOnlineRoom(); setCurrentView('MENU'); }} className="hover:text-yellow-300 cursor-pointer flex items-center gap-1">
            <span>Menu Chính</span>
          </button>
          <button onClick={() => setIsCharModalOpen(true)} className="hover:text-yellow-300 cursor-pointer flex items-center gap-1">
            <span>Danh Hiệu ({activeChar.name})</span>
          </button>
          <button onClick={() => setIsShopModalOpen(true)} className="hover:text-yellow-300 cursor-pointer flex items-center gap-1">
            <span>Tạp Hóa (Cấp {profile.level})</span>
          </button>
          <button onClick={() => setIsLeaderboardOpen(true)} className="hover:text-yellow-300 cursor-pointer flex items-center gap-1">
            <span>Bảng Xếp Hạng</span>
          </button>
          <button onClick={() => setIsLuckyWheelOpen(true)} className="hover:text-yellow-300 cursor-pointer flex items-center gap-1 text-yellow-300 font-bold">
            <span>🎡 Vòng Quay 9x</span>
          </button>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <RetroButton
            size="sm"
            variant="gold"
            onClick={() => setIsRoomModalOpen(true)}
            icon={<Users className="w-3.5 h-3.5 text-yellow-200" />}
          >
            {currentRoom ? `Phòng #${currentRoom.code}` : 'Hội Chiếu Online'}
          </RetroButton>
        </div>
      </header>

      {/* V7 permanent controls: shown BOTH on MENU and inside GAME_MATCH.
          This is the real App root, guaranteed mounted whenever App.tsx renders. */}
      <LotoAudioControls
        visible={currentView === 'GAME_MATCH' && (gameState === 'COUNTDOWN' || gameState === 'CALLING' || gameState === 'PAUSED')}
        enabled={settings.voiceCaller}
        volume={musicVolume}
        playing={gameState === 'CALLING' || gameState === 'COUNTDOWN' || gameState === 'PAUSED'}
        onToggle={handleMusicToggle}
        onVolumeChange={handleMusicVolume}
      />

      {/* VIEW 1: MAIN MENU */}
      {currentView === 'MENU' && (
        <MainMenu
          profile={profile}
          onQuickPlay={() => { exitOnlineRoom(); startNewGame('offline_bot'); }}
          onOpenRoomModal={() => setIsRoomModalOpen(true)}
          onOpenCharacters={() => setIsCharModalOpen(true)}
          onOpenShop={() => setIsShopModalOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenAuth={() => setIsAccountOpen(true)}
          onOpenLuckyWheel={() => setIsLuckyWheelOpen(true)}
          onOpenWorldChat={() => setIsWorldChatOpen(true)}
        />
      )}

      {/* VIEW 2: ACTIVE GAME MATCH VIEWPORT */}
      {currentView === 'GAME_MATCH' && (
        <div className="flex-1 flex flex-col">
          {/* Sub Toolbar */}
          <div className="bg-[#1e0e06] px-4 py-1.5 border-b border-amber-900/60 flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-3">
              <RetroButton size="sm" variant="default" onClick={() => { speechCaller.stop(); gameStatusRef.current = 'WAITING'; exitOnlineRoom(); setCurrentView('MENU'); }} icon={<ArrowLeft className="w-3 h-3" />}>
                Menu
              </RetroButton>

              <span className="font-pixel text-amber-300 text-sm hidden sm:inline">
                CHIẾU HỘI TRUYỀN THỐNG
              </span>

              <span className="text-[11px] bg-red-950 px-2 py-0.5 rounded border border-red-700 text-red-200 font-mono">
                {players.length} Tay Dò
              </span>

              <span className="text-[11px] text-emerald-300 font-bold">✓ Tự động đánh dấu 5 số · Không chỉnh tay</span>
            </div>


          </div>

          <main className="flex-1 p-3 sm:p-4 max-w-7xl mx-auto w-full flex flex-col gap-3">
            {/* Player Title Status Bar */}
            <div className="bg-[#241208] border border-amber-900/80 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2.5">
                <div className={`w-11 h-11 rounded-full overflow-hidden shrink-0 bg-stone-900 transition-all ${getFrameStyle(profile.activeFrameId)}`}>
                  {activeChar.avatar ? (
                    <img src={activeChar.avatar} alt={activeChar.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-lg bg-amber-700">
                      {profile.displayName[0]}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-amber-200 truncate">{profile.displayName}</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/40 font-mono">
                      Cấp {profile.level}
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-400/80 font-medium">
                    {activeChar.name} ({activeChar.title}) · Chiếu hội: {players.length} bạn chơi
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <RetroButton
                  size="md"
                  variant={skillCooldown > 0 ? 'default' : 'primary'}
                  disabled={skillCooldown > 0 || gameState !== 'CALLING'}
                  onClick={handleUseSkill}
                  icon={<Zap className="w-4 h-4 text-yellow-300" />}
                >
                  {skillCooldown > 0 ? `Hồi (${skillCooldown}s)` : `Tuyệt Kỹ: ${activeChar.activeSkill.name}`}
                </RetroButton>

                <RetroButton
                  size="md"
                  variant="default"
                  onClick={() => startNewGame()}
                  disabled={settings.mode === 'online_friend' && !!currentRoom && currentRoom.hostId !== profile.id}
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Ván Mới
                </RetroButton>
                {(gameState === 'CALLING' || gameState === 'PAUSED') &&
                 (settings.mode === 'offline_bot' || !currentRoom || currentRoom.hostId === profile.id) && (
                  <button
                    onClick={() => { if (window.confirm('Kết thúc ván khi chưa có ai KINH và phát nhạc hạ màn?')) playNoWinnerOutro('manual'); }}
                    className="px-2 py-1 rounded text-xs text-amber-200 bg-amber-950 border border-amber-800 hover:bg-amber-900 cursor-pointer"
                  >
                    🎺 Kết thúc chưa KINH
                  </button>
                )}
              </div>
            </div>

            {audioError && <div role="alert" className="rounded-lg border border-red-600 bg-red-950 p-2 text-red-200 flex gap-3 items-center">Không thể phát âm thanh. <button onClick={handleRetryAudio} className="underline">Thử lại</button></div>}
            {(gameState === 'CALLING' || gameState === 'COUNTDOWN' || (gameState === 'PAUSED' && !audioError)) && <button onClick={handleAudioPauseToggle} className="self-start bg-amber-700 text-white rounded px-4 py-2 font-bold">{gameState === 'PAUSED' ? '▶ Tiếp tục' : '⏸ Tạm dừng'}</button>}

            {/* LOTTERY BALL CAGE ANIMATION */}
            <BallCageAnimation
              currentNumber={currentBall}
              isIntroPlaying={isIntroPlaying}
              isRolling={isBallRolling}
              isSingingSong={isSingingSong}
              singingNumber={null}
              totalCalled={calledNumbers.size}
              remainingCount={MAX_SOUND_NUMBER - calledNumbers.size}
              voiceEnabled={settings.voiceCaller}
              onToggleVoice={handleMusicToggle}
              onStartGame={handleStartGameRound}
              canStart={selectionLocked && (!currentRoom || (currentRoom.hostId === profile.id && players.length > 0 && players.every(p => p.isBot || p.tickets.length === 1)))}
              calledHistory={calledHistory}
              audioLabel={audioLabel}
              audioActive={gameState === 'CALLING' || gameState === 'COUNTDOWN'}
              isHost={settings.mode === 'offline_bot' || !currentRoom || currentRoom.hostId === profile.id}
              gameStatus={gameState}
            />

            {/* PLAYFIELD */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1">
              {/* TICKET COLUMN (7 COLS) */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                {gameState === 'WAITING' && (
                  <FiveNumberPicker
                    mode={selectionMode}
                    selected={selectedFive}
                    secondsLeft={selectionSecondsLeft}
                    locked={selectionLocked}
                    packCount={packCount}
                    completedPacks={chosenPacks}
                    onPackCount={choosePackCount}
                    onMode={chooseFiveMode}
                    onToggle={toggleSelectedFive}
                    onConfirm={confirmCurrentPack}
                    onUnlockSelection={() => {
                      selectionLockedRef.current = false;
                      setSelectionLocked(false);
                    }}
                    onSaveAllPacks={(allPacks) => {
                      finalizePacks(allPacks);
                    }}
                  />
                )}

                {playerTickets.map((ticket) => (
                  <LotoTicketView
                    key={ticket.id}
                    ticket={ticket}
                    calledNumbers={calledNumbers}
                    activeMarkerIcon={activeMarker.previewIcon}
                    activeMarkerName={activeMarker.name}
                    activeTicketSkinId={profile.activeTicketSkinId}
                    highlightNumber={activeHighlightNumber}
                  />
                ))}

                {/* KINH disabled & faded until the complete set of five has actually been revealed. */}
                {(gameState === 'CALLING' || gameState === 'PAUSED') && (
                  <div className="p-3 bg-[#241208] border-2 border-red-600 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                    <div className="text-center sm:text-left">
                      <span className="text-sm font-black text-yellow-300 block font-pixel text-base">
                        {canCallKinh ? 'ĐÃ ĐỦ 5 SỐ — CÓ THỂ KINH!' : 'CHỜ ĐỦ 5 SỐ MỚI ĐƯỢC KINH'}
                      </span>
                      <span className="text-xs text-amber-200/80">
                        {canCallKinh ? 'Bạn có thể nhấn KINH NGAY!' : `Tiến độ: ${maxPackProgress}/5 số đã gọi trong bộ gần KINH nhất. Hệ thống tự đánh dấu.`}
                      </span>
                    </div>
                    <button
                      disabled={!canCallKinh}
                      aria-disabled={!canCallKinh}
                      onClick={handleUserCallKinh}
                      className={`win98-btn bg-red-600 text-white font-black text-base px-8 py-3 rounded border-2 border-yellow-300 transition-all flex items-center gap-2 ${canCallKinh ? 'cursor-pointer hover:bg-red-500 animate-pulse active:scale-95' : 'opacity-30 grayscale cursor-not-allowed'}` }
                    >
                      <Sparkles className="w-5 h-5 text-yellow-200" />
                      <span>KINH NGAY!</span>
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT SIDEBAR: Tabs for Master Board, Player List, and Chat */}
              <div className="lg:col-span-5 flex flex-col gap-2">
                {/* Switcher Tab buttons */}
                <div className="flex gap-1 bg-[#241208] p-1 rounded-lg border border-amber-900/80">
                  <button
                    onClick={() => setMatchRightTab('players')}
                    className={`flex-1 py-1 px-2 text-xs font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      matchRightTab === 'players'
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-amber-300/80 hover:text-white hover:bg-stone-800'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Bạn Chơi ({players.length})</span>
                  </button>

                  <button
                    onClick={() => setMatchRightTab('board')}
                    className={`flex-1 py-1 px-2 text-xs font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      matchRightTab === 'board'
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-amber-300/80 hover:text-white hover:bg-stone-800'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>Bảng Số 1-90</span>
                  </button>

                  <button
                    onClick={() => setMatchRightTab('chat')}
                    className={`flex-1 py-1 px-2 text-xs font-bold rounded flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      matchRightTab === 'chat'
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-amber-300/80 hover:text-white hover:bg-stone-800'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Hộp Trò Chuyện</span>
                  </button>
                </div>

                {/* Real-time 90s Quick-Reaction Emote Bar */}
                <FloatingEmoteBar onSendReaction={handleSendReaction} />

                {/* Tab content view */}
                <div className="h-[420px]">
                  {matchRightTab === 'players' && (
                    <PlayerListPanel
                      players={players}
                      calledSet={calledNumbers}
                      userPlayerId={profile.id}
                    />
                  )}

                  {matchRightTab === 'board' && (
                    <MasterBoard
                      calledNumbers={calledNumbers}
                      lastNumber={currentBall}
                      maxNumber={settings.maxNumber}
                    />
                  )}

                  {matchRightTab === 'chat' && (
                    <ChatPanel
                      userId={profile.id}
                      connectionState={chatConnection[currentRoom ? 'room' : 'world']}
                      connectionError={chatConnectionError[currentRoom ? 'room' : 'world']}
                      channel={currentRoom ? 'room' : 'world'}
                      onOpenWorldChat={currentRoom ? () => setIsWorldChatOpen(true) : undefined}
                      messages={messages}
                      onSendMessage={handleSendMessage}
                      onSendBuzz={handleSendBuzz}
                      currentRoomCode={currentRoom?.code}
                      roomCapacity={currentRoom?.maxPlayers}
                      isInsideRoom={settings.mode === 'online_friend'}
                      onShareRoomToWorld={currentRoom && !currentRoom.isPrivate ? handleShareRoomToWorld : undefined}
                      onJoinRoomFromChat={(code) => handleJoinRoom(code)}
                      onTriggerVipEffect={triggerVipEffect}
                      unlockedVipEmojis={profile.unlockedItemIds}
                    />
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      )}

      {/* GAME OVER VICTORY MODAL WITH BRILLIANT FIREWORKS */}
      {gameState === 'GAME_OVER' && winnerInfo && (
        <>
          <FireworksCelebration isWinnerUser={winnerInfo.isUser} />
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 animate-[fadeIn_0.3s_ease-out]">
            <div className="w-full max-w-md bg-gradient-to-b from-[#2e1206] via-[#1f0b04] to-[#120502] border-4 border-yellow-400 rounded-2xl p-6 text-center text-amber-50 shadow-[0_0_50px_rgba(250,204,21,0.5)] relative overflow-hidden animate-[zoomIn_0.25s_ease-out]">
              
              {/* Trang trí vàng kim hoàng gia hoài cổ */}
              <div className="absolute top-2 left-2 text-xl select-none animate-pulse">✨</div>
              <div className="absolute top-2 right-2 text-xl select-none animate-pulse">✨</div>
              <div className="absolute -top-12 -right-12 w-28 h-28 bg-yellow-400/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-red-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 border-4 border-yellow-200 shadow-lg shadow-yellow-500/50 mb-3 animate-bounce">
                  <span className="text-4xl">{winnerInfo.isUser ? '👑' : '🏮'}</span>
                </div>

                <div className="inline-block px-3 py-1 bg-yellow-400/20 border border-yellow-400/50 rounded-full text-[11px] font-bold text-yellow-300 uppercase tracking-widest mb-2">
                  {winnerInfo.isUser ? '🎆 ĐẠI CHIẾN THẮNG HỘI CHIẾU 🎆' : '🏮 TIN VUI HỘI CHIẾU 🏮'}
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 font-pixel tracking-wider uppercase mb-2 drop-shadow-[0_2px_10px_rgba(234,179,8,0.4)]">
                  {winnerInfo.isUser ? 'XIN CHÚC MỪNG! BẠN ĐÃ KINH!' : `${winnerInfo.name} ĐÃ KINH!`}
                </h2>

                <p className="text-xs sm:text-sm text-amber-200/90 mb-4 font-medium leading-relaxed">
                  {winnerInfo.isUser 
                    ? 'Xuất sắc! Bạn đã dò đủ 5 số trúng đủ bộ 5 số và giật giải Quán Quân Lô Tô của gánh hát!' 
                    : 'Chúc bạn may mắn ván sau! Hãy chú ý so vé và bấm KINH thật nhanh tay!'}
                </p>

                {winnerInfo.rowNumbers && winnerInfo.rowNumbers.length > 0 && (
                  <div className="p-3 bg-black/50 rounded-xl border-2 border-amber-500/60 mb-4 shadow-inner">
                    <span className="text-[11px] sm:text-xs text-amber-300 font-bold block mb-1.5 uppercase tracking-wide">
                      ⭐ 5 Con Số Vàng Trúng Giải:
                    </span>
                    <div className="flex justify-center gap-2 font-mono font-black text-lg text-yellow-300">
                      {winnerInfo.rowNumbers.map(n => (
                        <span key={n} className="bg-gradient-to-b from-amber-600 to-amber-800 px-2.5 py-1 rounded-lg border border-yellow-400 shadow-md">
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-center items-center gap-2.5 mt-2">
                  <RetroButton
                    size="lg"
                    variant="gold"
                    onClick={() => startNewGame()}
                    disabled={!!currentRoom && currentRoom.hostId !== profile.id}
                    icon={<RotateCcw className="w-4 h-4" />}
                    className="w-full sm:w-auto font-bold text-base"
                  >
                    {!!currentRoom && currentRoom.hostId !== profile.id ? 'Chờ chủ phòng mở ván mới' : 'Chơi Ván Mới (Chọn 5 Số)'}
                  </RetroButton>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {gameState === 'GAME_OVER' && noWinnerEnding && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#28160b] text-center text-amber-100 rounded-xl border-2 border-amber-500 p-7 shadow-xl">
            <div className="text-4xl mb-3">🎺</div>
            <h2 className="text-2xl font-black text-amber-300 mb-2">HẾT NHẠC — CHƯA CÓ AI KINH</h2>
            <p className="text-sm leading-6 mb-5">{noWinnerReason === 'manual' ? 'Chủ chiếu đã kết thúc ván khi chưa ai KINH. Gánh hát phát nhạc hạ màn.' : 'Gánh hát đã gọi hết 90 số và chưa ai KINH. Đang phát nhạc hạ màn.'} Mời bà con thử vận may ở ván mới!</p>
            {audioError && <p className="text-xs text-red-300 mb-3">{audioError}</p>}
            <RetroButton size="lg" variant="gold" disabled={!!currentRoom && currentRoom.hostId !== profile.id} onClick={() => startNewGame()}>{!!currentRoom && currentRoom.hostId !== profile.id ? 'Chờ chủ phòng mở ván mới' : 'Chơi Ván Mới'}</RetroButton>
          </div>
        </div>
      )}

      {/* Account editing is separate from the mandatory login/register flow. */}
      <AccountModal
        isOpen={isAccountOpen}
        profile={profile}
        onClose={() => setIsAccountOpen(false)}
        onUpdateProfile={next => {
          // Name is already written by AccountModal; avoid a duplicate delayed write.
          setProfile(next); saveProfile(next);
          const activeRoom = activeRoomRef.current;
          if (activeRoom) {
            void (async () => {
              await updateDoc(doc(db, 'rooms', activeRoom.id, 'members', next.id), { name: next.displayName });
              if (activeRoom.hostId === next.id) {
                await updateDoc(doc(db, 'rooms', activeRoom.id), { hostName: next.displayName });
              }
            })().catch(() => {});
          }
        }}
        onLogout={async () => {
          const room = activeRoomRef.current;
          if (room) await leaveOnlineRoom(room.id, profile.id).catch(() => {});
          activeRoomRef.current = null;
          rosterRoomIdRef.current = null;
          setCurrentRoom(null);
          setCurrentView('MENU');
          await logoutPlayer();
        }}
      />
      {/* MODALS */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(newProf) => { cancelPendingProfileSync(); setProfile(newProf); saveProfile(newProf); setReadyUserId(newProf.id); }}
        currentProfile={profile}
      />

      {isWorldChatOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex justify-center items-center p-3">
          <div className="w-full max-w-2xl rounded-xl bg-[#eee6c9] p-3 border-4 border-[#e9b54c]">
            <div className="flex justify-between gap-3 items-center mb-2 text-red-900 font-black">
              <span>🌍 CHAT THẾ GIỚI</span>
              <button type="button" aria-label="Đóng kênh chat thế giới" onClick={() => setIsWorldChatOpen(false)} className="rounded bg-red-800 text-white px-3 py-1 cursor-pointer">Đóng ✕</button>
            </div>
            <div className="h-[min(68vh,580px)]">
              <ChatPanel userId={profile.id} messages={messages}
                connectionState={chatConnection.world}
                connectionError={chatConnectionError.world}
                onSendMessage={handleSendMessage} onSendBuzz={() => {}}
                isInsideRoom={false} channel="world"
                onJoinRoomFromChat={code => { setIsWorldChatOpen(false); void handleJoinRoom(code).catch(error => {
                  setRoomCloudError(error instanceof Error ? error.message : 'Chưa vào được phòng.');
                  setIsRoomModalOpen(true);
                }); }}
                unlockedVipEmojis={profile.unlockedItemIds} onTriggerVipEffect={triggerVipEffect}/>
            </div>
          </div>
        </div>
      )}

      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        publicRooms={publicRooms}
        cloudError={roomCloudError}
        cloudReady={roomCloudReady}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        currentRoom={currentRoom}
      />

      <CharacterModal
        isOpen={isCharModalOpen}
        onClose={() => setIsCharModalOpen(false)}
        selectedCharId={profile.characterId}
        onSelectCharacter={(charId) => {
          handleUpdateProfile({ ...profile, characterId: charId });
        }}
      />

      <ShopModal
        isOpen={isShopModalOpen}
        onClose={() => setIsShopModalOpen(false)}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        onTriggerVipEffect={triggerVipEffect}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        profile={profile}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

      <LuckyWheelModal
        isOpen={isLuckyWheelOpen}
        onClose={() => setIsLuckyWheelOpen(false)}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
      />

      {/* 90s Floating Emote Overlay Canvas */}
      <FloatingEmoteCanvas emotes={floatingEmotes} />
    </div>
  );
}
