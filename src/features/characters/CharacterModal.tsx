import React from 'react';
import { CHARACTERS, Character } from './characterData';
import { RetroWindow } from '../../components/ui/RetroWindow';
import { RetroButton } from '../../components/ui/RetroButton';
import { Check, Zap, Sparkles } from 'lucide-react';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCharId: string;
  onSelectCharacter: (charId: string) => void;
}

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  selectedCharId,
  onSelectCharacter
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        <RetroWindow
          title="DANH HIỆU & TUYỆT KỸ LÔ TÔ 199x"
          icon="🎭"
          onClose={onClose}
          className="h-full"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[75vh] overflow-y-auto p-1 win98-box-inset bg-[#e8e8e8]">
            {CHARACTERS.map((char: Character) => {
              const isSelected = selectedCharId === char.id;

              return (
                <div
                  key={char.id}
                  className={`bg-white border-2 rounded-md p-2.5 flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-blue-600 ring-2 ring-blue-400 shadow-md'
                      : 'border-stone-300 hover:border-stone-400'
                  }`}
                >
                  <div>
                    {/* Character Header & Avatar */}
                    <div className="flex items-center gap-2.5 mb-2 pb-2 border-b border-stone-200">
                      <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-600 shrink-0 bg-stone-900 shadow">
                        {char.avatar ? (
                          <img
                            src={char.avatar}
                            alt={char.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl bg-gradient-to-br from-amber-600 to-rose-700 text-white font-bold">
                            {char.name[0]}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="font-extrabold text-sm text-stone-900 truncate">
                            {char.name}
                          </h3>
                        </div>
                        <div className="text-[11px] text-amber-700 font-semibold truncate">
                          {char.title}
                        </div>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {char.era}
                        </span>
                      </div>
                    </div>

                    {/* Quote */}
                    <div className="text-[11px] italic text-stone-600 mb-2 bg-yellow-50 p-1.5 rounded border border-yellow-200">
                      "{char.quote}"
                    </div>

                    {/* Active Skill */}
                    <div className="mb-1.5 p-1.5 bg-blue-50 border border-blue-200 rounded text-xs">
                      <div className="flex items-center justify-between text-blue-900 font-bold mb-0.5">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-blue-600" />
                          <span>Chiêu Chủ Động: {char.activeSkill.name}</span>
                        </span>
                        <span className="text-[10px] text-blue-700 font-mono">
                          Hồi: {char.activeSkill.cooldownSeconds}s
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-700 leading-snug">
                        {char.activeSkill.description}
                      </p>
                    </div>

                    {/* Passive Skill */}
                    <div className="p-1.5 bg-emerald-50 border border-emerald-200 rounded text-xs">
                      <div className="flex items-center gap-1 text-emerald-900 font-bold mb-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Kỹ Năng Nội Tại: {char.passiveSkill.name}</span>
                      </div>
                      <p className="text-[11px] text-stone-700 leading-snug">
                        {char.passiveSkill.description}
                      </p>
                    </div>
                  </div>

                  {/* Select button */}
                  <div className="mt-3 pt-2 border-t border-stone-200 flex justify-end">
                    {isSelected ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 py-1">
                        <Check className="w-4 h-4" />
                        Đang Sử Dụng
                      </span>
                    ) : (
                      <RetroButton
                        size="sm"
                        variant="primary"
                        onClick={() => onSelectCharacter(char.id)}
                      >
                        Chọn Danh Hiệu Này
                      </RetroButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </RetroWindow>
      </div>
    </div>
  );
};
