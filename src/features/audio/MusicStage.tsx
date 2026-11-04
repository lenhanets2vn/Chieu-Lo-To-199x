import React from 'react';
import { AudioSpectrum } from './AudioSpectrum';

const NOTES = [
  { glyph: '♪', left: 4, top: 38, delay: -0.8 },
  { glyph: '♫', left: 15, top: 20, delay: -2.1 },
  { glyph: '♬', left: 26, top: 51, delay: -0.4 },
  { glyph: '♩', left: 38, top: 28, delay: -1.4 },
  { glyph: '♫', left: 49, top: 55, delay: -2.9 },
  { glyph: '♪', left: 60, top: 16, delay: -1.9 },
  { glyph: '♬', left: 70, top: 41, delay: -0.2 },
  { glyph: '♩', left: 82, top: 24, delay: -3.1 },
  { glyph: '♫', left: 91, top: 52, delay: -1.3 }
];

function CarnivalSpeaker({ side }: { side: 'left' | 'right' }) {
  return (
    <div aria-hidden="true" className={`loto-speaker loto-speaker-${side}`}>
      <div className="loto-speaker-tweeter" />
      <div className="loto-speaker-cone"><div /></div>
    </div>
  );
}

/** Frequency bars follow the real WebAudio analyser; floating notes are visual decoration. */
export function MusicStage({ active }: { active: boolean }) {
  return (
    <div className={`loto-music-stage ${active ? 'loto-music-active' : ''}`} aria-label="Sân khấu âm nhạc với hai loa và khuông nhạc chuyển động">
      <CarnivalSpeaker side="left" />
      <div className="loto-score" aria-hidden="true">
        <div className="loto-staff">
          {Array.from({ length: 5 }, (_, i) => <div key={i} className="loto-staff-line" style={{ top: `${16 + i * 16}%` }} />)}
          {NOTES.map((note, index) => (
            <span key={index} className="loto-floating-note" style={{left: `${note.left}%`, top: `${note.top}%`, animationDelay: `${note.delay}s`, animationPlayState: active ? 'running' : 'paused'}}>{note.glyph}</span>
          ))}
        </div>
        <div className="loto-equalizer"><AudioSpectrum active={active} /></div>
      </div>
      <CarnivalSpeaker side="right" />
    </div>
  );
}
