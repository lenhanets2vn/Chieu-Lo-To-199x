import React, { useState, useRef, useEffect } from 'react';
import { RETRO_9X_EMOJIS, ChatMessage, renderChatEmojiCodes } from './yahooEmojis';
import { audioSynthesizer } from '../audio/audioSynthesizer';
import { RetroButton } from '../../components/ui/RetroButton';
import type { FilterResult } from './profanityFilter';
import { Smile, Send, BellRing, MicOff, Globe, Users, Share2, Sparkles, AlertTriangle } from 'lucide-react';

interface ChatPanelProps {
  userId?: string;
  messages: ChatMessage[];
  onSendMessage: (text: string, channel: 'room' | 'world', isVipEmoji?: string) => Promise<FilterResult>;
  onSendBuzz: () => void;
  currentRoomCode?: string;
  roomCapacity?: number;
  isInsideRoom: boolean;
  channel: 'room' | 'world';
  onOpenWorldChat?: () => void;
  onShareRoomToWorld?: () => void;
  onJoinRoomFromChat?: (code: string) => void;
  unlockedVipEmojis?: string[];
  onTriggerVipEffect?: (effectType: string) => void;
  connectionState?: 'connecting' | 'online' | 'offline' | 'error';
  connectionError?: string | null;
  onRetry?: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  userId = 'player-me',
  messages,
  onSendMessage,
  onSendBuzz,
  currentRoomCode,
  roomCapacity,
  isInsideRoom,
  channel,
  onOpenWorldChat,
  onShareRoomToWorld,
  onJoinRoomFromChat,
  onTriggerVipEffect,
  unlockedVipEmojis = [],
  connectionState = 'connecting',
  connectionError = null,
  onRetry
}) => {
  const activeTab = channel;
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiTab, setEmojiTab] = useState<'retro' | 'vip'>('retro');
  const [filterWarning, setFilterWarning] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);


  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;
    if (connectionState === 'error' || connectionState === 'offline') {
      setFilterWarning('Chưa thể gửi tin nhắn. Hãy kiểm tra mạng rồi thử lại.');
      return;
    }
    setSending(true);
    try {
      // Only the Firebase service performs the rate-limit check. The old second
      // check rejected every message as spam before it reached Firestore.
      const result = await onSendMessage(text, activeTab);
      if (!result.allowed) {
        setFilterWarning(result.reason || 'Không gửi được tin nhắn.');
        return;
      }
      setFilterWarning(null);
      setInputText('');
      setShowEmojiPicker(false);
    } catch (error) {
      setFilterWarning(error instanceof Error ? error.message : 'Không gửi được tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  const handleBuzzClick = () => {
    audioSynthesizer.playYahooBuzz();
    onSendBuzz();
  };

  const handleSendVipEmoji = (symbol: string, name: string, effect: string, itemId: string) => {
    if (!unlockedVipEmojis.includes(itemId)) {
      setFilterWarning('Hãy mở khóa vật phẩm VIP tại Tạp Hóa trước khi sử dụng.');
      return;
    }
    audioSynthesizer.playClick();
    onTriggerVipEffect?.(effect);
    void onSendMessage(`[VIP ${symbol}] ${name}!`, activeTab, effect).then(result => {
      if (!result.allowed) setFilterWarning(result.reason || 'Không gửi được biểu tượng.');
    });
    setShowEmojiPicker(false);
  };

  const filteredMessages = messages.filter(m => m.channel === activeTab || m.channel === 'system');

  return (
    <div className="bg-[#f0f0f0] border-2 border-[#808080] win98-box p-1 text-black flex flex-col h-full font-sans text-xs">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] text-white px-2 py-1 flex items-center justify-between font-bold rounded-t-sm shadow-inner">
        <div className="flex items-center gap-1.5">
          <span className="text-yellow-300 font-pixel text-sm">💬</span>
          <span className="tracking-tight font-pixel text-sm">{channel === 'world' ? '🌍 CHAT THẾ GIỚI' : '🏮 CHAT TRONG PHÒNG'}</span>
          <span role="status" className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${connectionState === 'online' ? 'bg-emerald-700' : connectionState === 'error' ? 'bg-red-700' : 'bg-amber-700'}`}>
            {connectionState === 'error' ? 'Không thể gửi tin' : connectionState === 'offline' ? 'Mất mạng' : connectionState === 'connecting' ? 'Đang vào chat…' : 'Trò chuyện'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isInsideRoom && <button
            onClick={handleBuzzClick}
            className="win98-btn bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 shadow cursor-pointer border-t-rose-300 border-l-rose-300"
            title="Rung chuông nhắc nhở cả chiếu!"
          >
            <BellRing className="w-3 h-3 text-yellow-300 animate-wiggle" />
            <span>RUNG CHUÔNG</span>
          </button>}
        </div>
      </div>

      {connectionError && (
        <div role="alert" className="bg-red-50 border border-red-300 px-2 py-1 text-red-800 text-[11px] font-semibold flex justify-between items-center gap-2">
          <span>{connectionError}</span>
          {onRetry && <button type="button" className="bg-red-800 text-white px-2 py-1 rounded cursor-pointer whitespace-nowrap" onClick={onRetry}>Thử kết nối lại</button>}
        </div>
      )}
      {/* Separate panels; no cross-channel tabs or cached history mixing. */}
      <div className="flex flex-wrap items-center justify-between gap-1 bg-[#d4d0c8] border-b border-[#808080] px-2 py-1 text-[11px] font-semibold">
        <span className="flex items-center gap-1">
          {channel === 'room' ? <Users className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
          {channel === 'room' ? `Phòng ${currentRoomCode || ''}` : 'Kênh Thế Giới'}
        </span>
        {channel === 'room' && onOpenWorldChat && (
          <button type="button" onClick={onOpenWorldChat} className="win98-btn flex items-center gap-1 px-2 py-0.5 bg-blue-800 text-white cursor-pointer">
            <Globe className="w-3 h-3"/> Chat Thế Giới
          </button>
        )}
        {channel === 'room' && onShareRoomToWorld && (
          <button type="button" onClick={onShareRoomToWorld} className="text-blue-900 font-bold underline cursor-pointer" title="Mời người chơi vào phòng">Mời vào phòng</button>
        )}
      </div>

      {/* Voice is not advertised until WebRTC signaling and TURN are deployed. */}
      <div className="bg-[#e4e4e4] px-2 py-1 border-b border-[#a0a0a0] text-[11px] text-stone-600">
        <MicOff className="w-3.5 h-3.5 inline mr-1" /> Bộ đàm đang tạm khóa. Bạn vẫn có thể trò chuyện bằng tin nhắn.
      </div>

      {/* Message history list */}
      <div className="flex-1 bg-white border border-[#808080] p-2 overflow-y-auto space-y-1.5 min-h-[160px] win98-box-inset">
        {filteredMessages.length === 0 ? (
          <div className="text-center text-stone-400 py-6 text-xs italic">
            Chưa có tin mới trong phiên này. Hãy bắt đầu cuộc trò chuyện!
          </div>
        ) : (
          filteredMessages.map((msg) => {
            if (msg.isBuzz) {
              return (
                <div key={msg.id} className="p-1.5 bg-red-50 border border-red-300 rounded text-red-700 font-bold text-center text-xs animate-buzz flex items-center justify-center gap-1 shadow-sm">
                  <BellRing className="w-4 h-4 text-red-600" />
                  <span>CHUÔNG RUNG! {msg.senderName} vừa gõ chuông báo cả phòng!</span>
                </div>
              );
            }

            if (msg.channel === 'system') {
              return (
                <div key={msg.id} className="text-center text-stone-500 text-[11px] py-0.5 italic border-y border-stone-200">
                  {msg.text}
                </div>
              );
            }

            const isVipMsg = msg.text.startsWith('[VIP');
            const isInvite = msg.text.includes('[MÃ PHÒNG:');
            const roomMatch = msg.text.match(/\[MÃ PHÒNG: #([A-Z0-9]+)\]/);
            const extractedCode = roomMatch ? roomMatch[1] : null;

            return (
              <div key={msg.id} className={`text-xs leading-relaxed ${isVipMsg ? 'p-1.5 bg-amber-50 rounded border border-amber-300 font-semibold' : ''}`}>
                <span className="font-bold text-blue-900 mr-1.5 hover:underline cursor-pointer">
                  {msg.senderName}:
                </span>
                <span className="text-stone-800 break-words whitespace-pre-wrap">{renderChatEmojiCodes(msg.text)}</span>

                {isInvite && extractedCode && onJoinRoomFromChat && (
                  <div className="mt-1 p-1.5 bg-amber-50 border border-amber-300 rounded flex items-center justify-between">
                    <span className="font-mono text-amber-900 font-bold text-[11px]">
                      Phòng #{extractedCode}{roomCapacity ? ` (Sức chứa ${roomCapacity} người)` : ''}
                    </span>
                    <button
                      onClick={() => onJoinRoomFromChat(extractedCode)}
                      className="win98-btn bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] px-2 py-0.5 rounded cursor-pointer"
                    >
                      Vào Chơi Ngay
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker Drawer */}
      {showEmojiPicker && (
        <div className="bg-[#ffffcc] border-2 border-[#808080] p-2 mt-1 rounded shadow-lg win98-box z-30">
          <div className="flex gap-1 mb-2 border-b border-stone-400 pb-1">
            <button
              onClick={() => setEmojiTab('retro')}
              className={`px-2 py-0.5 text-[11px] font-bold rounded ${emojiTab === 'retro' ? 'win98-btn bg-[#000080] text-white' : 'win98-btn'}`}
            >
              Mặt Cười 9x Cổ Điển
            </button>
            <button
              onClick={() => setEmojiTab('vip')}
              className={`px-2 py-0.5 text-[11px] font-bold rounded flex items-center gap-1 ${emojiTab === 'vip' ? 'win98-btn bg-amber-600 text-white' : 'win98-btn'}`}
            >
              <Sparkles className="w-3 h-3 text-yellow-300" />
              <span>VIP Hiệu Ứng Toàn Phòng</span>
            </button>
          </div>

          {emojiTab === 'retro' ? (
            <div className="grid grid-cols-5 gap-1.5">
              {RETRO_9X_EMOJIS.map((emoji) => (
                <button
                  key={emoji.code}
                  onClick={() => {
                    setInputText(prev => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}${emoji.symbol} `);
                    setShowEmojiPicker(false);
                  }}
                  className="p-1 bg-white hover:bg-yellow-100 border border-stone-300 rounded flex flex-col items-center justify-center cursor-pointer text-xs"
                  title={`${emoji.name} (${emoji.code})`}
                >
                  <span className="text-base">{emoji.symbol}</span>
                  <span className="text-[9px] font-semibold text-stone-700">{emoji.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { symbol: '🎆', name: 'Pháo Hoa Giao Thừa', effect: 'fireworks', itemId: 'vip_fireworks' },
                { symbol: '💣', name: 'Bom Nổ Đặt Bom 9x', effect: 'bomb', itemId: 'vip_bomb' },
                { symbol: '💖', name: 'Bão Tim Bay', effect: 'hearts', itemId: 'vip_heart_rain' },
                { symbol: '🐉', name: 'Hỏa Long Xuất Thế', effect: 'dragon', itemId: 'vip_dragon' },
                { symbol: '🐷', name: 'Heo Đất Tiền Vàng', effect: 'piggy_coins', itemId: 'vip_piggy' },
                { symbol: '👑', name: 'Vương Miện Hoàng Gia', effect: 'crown', itemId: 'vip_crown' },
                { symbol: '🎸', name: 'Đàn Kìm Vọng Cổ', effect: 'guitar_notes', itemId: 'vip_guitar' }
              ].map((vip) => (
                <button
                  key={vip.effect}
                  onClick={() => handleSendVipEmoji(vip.symbol, vip.name, vip.effect, vip.itemId)}
                  disabled={!unlockedVipEmojis.includes(vip.itemId)}
                  className="p-1.5 bg-white hover:bg-amber-100 border border-amber-300 rounded flex items-center gap-2 cursor-pointer text-left shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="text-xl">{vip.symbol}</span>
                  <div className="min-w-0">
                    <div className="font-bold text-[11px] text-stone-900 truncate">{vip.name}</div>
                    <div className="text-[9px] text-rose-600 font-semibold">Hiệu ứng toàn phòng</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filter / Spam warning notice */}
      {filterWarning && (
        <div className="mt-1 p-1 bg-amber-100 border border-amber-400 text-amber-900 rounded text-[11px] font-bold flex items-center gap-1 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span>{filterWarning}</span>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSend} className="mt-1 flex items-center gap-1">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="win98-btn p-1.5 rounded cursor-pointer hover:bg-yellow-200"
          title="Chọn mặt cười & Emoji VIP"
        >
          <Smile className="w-4 h-4 text-amber-600" />
        </button>

        <input
          type="text"
          maxLength={180}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={activeTab === 'room' ? 'Gõ tin nhắn phòng (tối đa 180 ký tự)...' : 'Gõ tin nhắn kênh thế giới...'}
          className="flex-1 bg-white border border-[#808080] px-2 py-1 text-xs text-black outline-none win98-box-inset font-sans"
        />

        <RetroButton type="submit" size="sm" variant="primary" disabled={sending || connectionState === 'error' || connectionState === 'offline'} icon={<Send className="w-3 h-3" />}>
          {sending ? 'Đang gửi…' : 'Gửi'}
        </RetroButton>
      </form>
    </div>
  );
};
