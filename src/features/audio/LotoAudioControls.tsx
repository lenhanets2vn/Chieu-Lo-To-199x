import React, { useState } from 'react';
import { Settings2, Volume2, VolumeX } from 'lucide-react';
import { MusicStage } from './MusicStage';

interface Props {
  enabled: boolean;
  volume: number;
  playing: boolean;
  onToggle: () => void;
  onVolumeChange: (next: number) => void;
}
/** Only one music visualizer and one settings button across all game views. */
export const LotoAudioControls: React.FC<Props> = ({ enabled, volume, playing, onToggle, onVolumeChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <section className="relative z-30 bg-[#ae201b] border-y-4 border-[#f6c75b] px-3 py-2" aria-label="Sân khấu âm nhạc">
      <div className="max-w-5xl mx-auto flex items-center gap-2">
        <div className="min-w-0 flex-1"><MusicStage active={enabled && playing} /></div>
        <button type="button" aria-label="Cài đặt âm thanh" aria-expanded={open}
          onClick={() => setOpen(value => !value)}
          className="shrink-0 rounded-full bg-[#f8d76b] border-2 border-[#7d2718] text-[#7d2718] p-2 cursor-pointer">
          <Settings2 className="w-5 h-5" />
        </button>
      </div>
      {open && <div className="absolute right-3 top-full mt-2 w-[min(320px,calc(100vw-24px))] rounded-xl border-2 border-amber-500 bg-[#281307] p-4 shadow-2xl text-amber-100 space-y-4" role="region" aria-label="Cài đặt âm thanh">
        <div className="font-black text-yellow-300">CÀI ĐẶT ÂM THANH</div>
        <button type="button" onClick={onToggle} className="flex gap-2 items-center rounded-lg bg-amber-800 px-3 py-2 w-full cursor-pointer">
          {enabled ? <Volume2 /> : <VolumeX />}{enabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
        </button>
        <label className="block text-sm">Âm lượng: {Math.round(volume * 100)}%
          <input type="range" min="0" max="100" value={Math.round(volume * 100)}
            onChange={e => onVolumeChange(Number(e.target.value) / 100)}
            className="block w-full accent-yellow-400 mt-2" />
        </label>
      </div>}
    </section>
  );
};
