import React, { useState } from 'react';
import { audioSynthesizer } from '../audio/audioSynthesizer';
import { Sparkles } from 'lucide-react';

export interface ReactionConfig {
  emoji: string;
  label: string;
  soundType?: 'click' | 'buzzer' | 'success';
}

export const QUICK_REACTIONS: ReactionConfig[] = [
  { emoji: '🤣', label: 'Cười bò', soundType: 'click' },
  { emoji: '😭', label: 'Tiếc quá', soundType: 'click' },
  { emoji: '👍', label: 'Chuẩn bài', soundType: 'click' },
  { emoji: '❤️', label: 'Thương ghê', soundType: 'click' },
  { emoji: '👏', label: 'Vỗ tay', soundType: 'click' },
  { emoji: '🔥', label: 'Cháy quá', soundType: 'click' },
  { emoji: '🏮', label: 'Hội Chiếu', soundType: 'click' },
  { emoji: '🍀', label: 'KINH Đi!', soundType: 'success' }
];

interface FloatingEmoteBarProps {
  onSendReaction: (emoji: string, label: string) => void;
  disabled?: boolean;
}

export const FloatingEmoteBar: React.FC<FloatingEmoteBarProps> = ({
  onSendReaction,
  disabled = false
}) => {
  const [cooldown, setCooldown] = useState(false);

  const handleClick = (reaction: ReactionConfig) => {
    if (disabled || cooldown) return;

    audioSynthesizer.playClick();
    onSendReaction(reaction.emoji, reaction.label);

    // 0.4s micro-cooldown to prevent rapid spam clicking
    setCooldown(true);
    setTimeout(() => setCooldown(false), 400);
  };

  return (
    <div
      className="bg-[#2a1408] border border-amber-700/80 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2 shadow-md"
      aria-label="Thanh biểu cảm nhanh thập niên 90s"
    >
      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-300 font-pixel whitespace-nowrap shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-spin-slow" />
        <span className="hidden sm:inline">BIỂU CẢM 90S:</span>
        <span className="sm:hidden">CẢM XÚC:</span>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 flex-1 justify-end overflow-x-auto py-0.5 no-scrollbar">
        {QUICK_REACTIONS.map((item) => (
          <button
            key={item.emoji}
            type="button"
            disabled={disabled || cooldown}
            onClick={() => handleClick(item)}
            title={`${item.label} (${item.emoji})`}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[#3d1f0d] hover:bg-amber-600 border border-amber-700 hover:border-yellow-300 text-base sm:text-lg flex items-center justify-center transform active:scale-90 hover:scale-110 transition-all cursor-pointer shadow disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <span role="img" aria-label={item.label}>
              {item.emoji}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
