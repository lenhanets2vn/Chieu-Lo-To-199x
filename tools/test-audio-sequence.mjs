import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ts = require('typescript');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'src/features/audio/speechCaller.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS }
}).outputText;

// Deterministic WebAudio mock: it records scheduled starts and lets the test
// advance the AudioContext clock without relying on browser timers or speakers.
class FakeAudioParam {
  setValueAtTime() {}
  linearRampToValueAtTime() {}
  cancelScheduledValues() {}
  setTargetAtTime() {}
}
class FakeGainNode {
  constructor() { this.gain = new FakeAudioParam(); }
  connect() {}
  disconnect() {}
}
class FakeBufferSource {
  constructor(context) { this.context = context; this.onended = null; this.startAt = null; }
  connect() {}
  disconnect() {}
  start(at = 0) { this.startAt = at; this.context.sources.push(this); }
  stop() {}
}
class FakeAudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = 'suspended';
    this.destination = {};
    this.sources = [];
  }
  createGain() { return new FakeGainNode(); }
  createAnalyser() { return { fftSize: 0, smoothingTimeConstant: 0, connect() {} }; }
  createBufferSource() { return new FakeBufferSource(this); }
  resume() { this.state = 'running'; return Promise.resolve(); }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
  decodeAudioData() { return Promise.resolve({ duration: 2 }); }
}

const manifest = {
  MAX_SOUND_NUMBER: 90,
  REVEAL_BEFORE_END_SECONDS: 1.15,
  hasNumberTrack: number => Number.isInteger(number) && number >= 1 && number <= 90,
  soundpackUrl: file => `/soundpack/${file}`
};
let timerId = 0;
const timerCallbacks = new Map();
const sandbox = {
  module: { exports: {} },
  AudioContext: FakeAudioContext,
  fetch: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(2048) }),
  setInterval: callback => { const id = ++timerId; timerCallbacks.set(id, callback); return id; },
  clearInterval: id => timerCallbacks.delete(id),
  console,
  require: id => {
    if (id === './soundpackManifest') return manifest;
    throw new Error(`Unexpected test dependency: ${id}`);
  }
};
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(`(function(require, module, exports) { ${compiled}\n})`, sandbox)(
  sandbox.require, sandbox.module, sandbox.exports
);
const player = sandbox.module.exports.speechCaller;
const context = () => player.context;
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

let revealedNumbers = [];
let trackTransitions = [];
let finished = false;
const numberCallbacks = number => ({
  onStart: () => {
    const nextFile = number === 85
      ? 'near_end'
      : number === 90
        ? 'outro'
        : String(number + 1).padStart(2, '0');
    void player.queueFollowing(nextFile, (number === 85 || number === 90) ? 0 : undefined);
  },
  onReveal: () => revealedNumbers.push(number),
  onSongEnd: () => {
    trackTransitions.push(String(number).padStart(2, '0'));
    if (number === 85) player.playNearEnd(nearEndCallbacks());
    else if (number === 90) player.playOutro({ onSongEnd: () => { finished = true; } });
    else player.playSongForNumber(number + 1, numberCallbacks(number + 1));
  }
});
const nearEndCallbacks = () => ({
  onStart: () => void player.queueFollowing('86', 0),
  onSongEnd: () => {
    trackTransitions.push('near_end');
    player.playSongForNumber(86, numberCallbacks(86));
  }
});

async function main() {
  player.playIntro({
    onStart: () => void player.queueFollowing('01', 0),
    onSongEnd: () => {
      trackTransitions.push('intro');
      player.playSongForNumber(1, numberCallbacks(1));
    }
  });
  await flush(); await flush();
  assert.equal(player.getCurrentFile(), 'intro', 'Intro must be the first active track');

  let safety = 0;
  while (!finished && safety++ < 100) {
    await flush(); await flush();
    const active = player.active;
    assert.ok(active, 'There must always be an active track before the outro ends');
    const endAt = active.at + active.buffer.duration;
    const oldFile = active.file;

    if (active.reveal) {
      context().currentTime = endAt - manifest.REVEAL_BEFORE_END_SECONDS;
      player.tick();
    }

    context().currentTime = endAt;
    active.source.onended();
    await flush(); await flush();

    if (player.active) {
      const handoffDelta = player.active.at - endAt;
      const oldOrdinal = Number(oldFile);
      const expectedOverlap = Number.isInteger(oldOrdinal) && oldOrdinal >= 1 && oldOrdinal <= 90 && oldOrdinal !== 85 && oldOrdinal !== 90 ? 0.025 : 0;
      assert.ok(
        Math.abs(handoffDelta + expectedOverlap) <= 0.001,
        `Unexpected audio gap/overlap after ${oldFile}: ${handoffDelta.toFixed(4)}s (expected -${expectedOverlap}s)`
      );
    }
  }

  assert.equal(finished, true, 'Sequence must reach the outro end');
  assert.equal(revealedNumbers.length, 90, 'Every number must reveal exactly once');
  assert.deepEqual(revealedNumbers, Array.from({ length: 90 }, (_, i) => i + 1));
  assert.equal(trackTransitions.length, 92, 'All 92 track boundaries must be handed off');
  assert.equal(context().sources.length, 93, 'Expected intro + 90 numbers + near_end + outro');
  assert.equal(player.getCurrentFile(), null, 'Player must become idle after outro');

  console.log('PASS audio sequence mock');
  console.log('  intro → 01–90 (no duplicate) → near_end before 86 → outro');
  console.log('  reveal callbacks: 90/90');
  console.log('  scheduled audio buffers: 93');
  console.log('  track handoffs: 92/92; strict intro/interlude/outro boundaries + 25 ms voice-to-voice overlap');
}

main().catch(error => {
  console.error('FAIL audio sequence mock:', error);
  process.exitCode = 1;
});
