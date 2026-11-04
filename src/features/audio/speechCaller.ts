/**
 * Lô Tô audio engine: Shared AudioContext, decoded real human folk recordings ONLY.
 * WebAudio hardware clock scheduling ensures 100% gapless transitions between songs.
 * Exactly 1.0 second before each number song ends, onReveal is triggered to display
 * the called number and update history.
 */
import { MAX_SOUND_NUMBER, REVEAL_BEFORE_END_SECONDS } from './soundpackManifest';
import { DEFAULT_SOUNDPACK, getSoundpackAssetUrl, type SoundpackDefinition } from './soundpackRegistry';

export type AudioCallbacks = {
  onStart?: () => void;
  onReveal?: () => void;
  onSongEnd?: () => void;
  onError?: (message: string) => void;
  onProgress?: (elapsed: number, duration: number) => void;
};

interface ScheduledTrack {
  file: string;
  number?: number;
  buffer: AudioBuffer;
  source: AudioBufferSourceNode;
  gain: GainNode;
  startTime: number;
  endTime: number;
  callbacks: AudioCallbacks;
  revealTriggered: boolean;
  ended: boolean;
}

class LotoSoundpackPlayer {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private pack: SoundpackDefinition = DEFAULT_SOUNDPACK;

  private currentTrack: ScheduledTrack | null = null;
  private queuedTrack: ScheduledTrack | null = null;

  private bufferCache = new Map<string, AudioBuffer>();
  private pendingLoads = new Map<string, Promise<AudioBuffer>>();

  private enabled = true;
  private volumeLevel = 0.85;
  private pausedByUser = false;
  private tickerId: ReturnType<typeof setInterval> | null = null;
  private sampleSource: AudioBufferSourceNode | null = null;
  private sessionToken = 0;

  private ensureContext(): AudioContext {
    if (this.context) return this.context;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.context = new AudioCtx({ latencyHint: 'playback' });
    this.masterGain = this.context.createGain();
    this.masterGain.gain.setValueAtTime(this.enabled ? this.volumeLevel : 0, this.context.currentTime);

    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.context.destination);
    return this.context;
  }

  public getEffectsBus(): { context: AudioContext; destination: GainNode } {
    return { context: this.ensureContext(), destination: this.masterGain! };
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getSoundpack(): SoundpackDefinition {
    return this.pack;
  }

  public setSoundpack(pack: SoundpackDefinition): void {
    this.stopSample();
    this.pack = pack;
    this.bufferCache.clear();
    this.pendingLoads.clear();
  }

  public setEnabled(value: boolean): void {
    this.enabled = value;
    this.applyVolume();
    if (value && !this.pausedByUser && this.context?.state === 'suspended') {
      void this.context.resume().catch(() => {});
    }
  }

  public getEnabled(): boolean {
    return this.enabled;
  }

  public setVolume(value: number): void {
    this.volumeLevel = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0.85));
    this.applyVolume();
  }

  public getVolume(): number {
    return this.volumeLevel;
  }

  private applyVolume(): void {
    if (!this.masterGain || !this.context) return;
    const now = this.context.currentTime;
    const target = this.enabled ? this.volumeLevel : 0;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(target, now, 0.015);
  }

  public getAudioState(): string {
    return this.context?.state ?? 'chưa khởi tạo';
  }

  public getCurrentFile(): string | null {
    return this.currentTrack?.file ?? null;
  }

  public isSongPlaying(): boolean {
    return !!this.currentTrack && !this.currentTrack.ended && this.context?.state === 'running';
  }

  public getPlaybackTime(): number {
    const cur = this.currentTrack;
    if (!cur || !this.context) return 0;
    const elapsed = this.context.currentTime - cur.startTime;
    return Math.max(0, Math.min(cur.buffer.duration, elapsed));
  }

  public getDuration(): number {
    return this.currentTrack?.buffer.duration ?? 0;
  }

  public async unlock(): Promise<void> {
    const ctx = this.ensureContext();
    if (ctx.state !== 'running') {
      await ctx.resume().catch(() => {});
    }
    if (ctx.state !== 'running') {
      throw new Error('Trình duyệt chưa cho phép phát âm thanh. Vui lòng bấm BẮT ĐẦU.');
    }
  }

  /**
   * Preload and decode an audio buffer from the active soundpack.
   * Format priority: MP3 then WebM.
   */
  public async load(file: string): Promise<AudioBuffer> {
    const cacheKey = `${this.pack.id}:${file}`;
    const cached = this.bufferCache.get(cacheKey);
    if (cached) return cached;

    const pending = this.pendingLoads.get(cacheKey);
    if (pending) return pending;

    const ctx = this.ensureContext();
    const pack = this.pack;

    const task = (async () => {
      let lastErr = '';
      for (const ext of pack.preferredFormats) {
        const url = getSoundpackAssetUrl(pack, `${file}.${ext}`);
        try {
          const res = await fetch(url, { cache: 'force-cache' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const bytes = await res.arrayBuffer();
          if (bytes.byteLength < 500) throw new Error('File âm thanh quá nhỏ');
          const decoded = await ctx.decodeAudioData(bytes);
          if (decoded.duration <= 0) throw new Error('Độ dài âm thanh không hợp lệ');

          this.bufferCache.set(cacheKey, decoded);
          return decoded;
        } catch (err) {
          lastErr = `${url}: ${err instanceof Error ? err.message : String(err)}`;
        }
      }
      throw new Error(`Không tải được bài hò ${file} (${pack.title}): ${lastErr}`);
    })();

    this.pendingLoads.set(cacheKey, task);
    try {
      return await task;
    } finally {
      this.pendingLoads.delete(cacheKey);
    }
  }

  public preloadNumber(num: number): void {
    if (Number.isInteger(num) && num >= 1 && num <= MAX_SOUND_NUMBER) {
      void this.load(String(num).padStart(2, '0')).catch(() => {});
    }
  }

  public preloadTrack(file: string): void {
    void this.load(file).catch(() => {});
  }

  private createSourceForBuffer(buffer: AudioBuffer): { source: AudioBufferSourceNode; gain: GainNode } {
    const ctx = this.ensureContext();
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(1, ctx.currentTime);
    source.connect(gain);
    gain.connect(this.masterGain!);
    return { source, gain };
  }

  /**
   * Start playing a track immediately.
   */
  public async playTrack(
    file: string,
    callbacks: AudioCallbacks = {},
    number?: number,
    offsetSeconds: number = 0
  ): Promise<void> {
    this.stopSample();
    const requestedAt = Date.now();
    this.sessionToken++;
    const currentToken = this.sessionToken;

    this.clearCurrentAndQueued();
    this.pausedByUser = false;

    try {
      await this.unlock();
      const buffer = await this.load(file);
      if (this.sessionToken !== currentToken) return;

      const ctx = this.ensureContext();
      // Followers may join a track already in progress. Seek to the shared
      // server event time instead of replaying the entire song from second 0.
      const elapsedLoading = offsetSeconds > 0 ? (Date.now() - requestedAt) / 1000 : 0;
      const actualOffset = offsetSeconds + elapsedLoading;
      const offset = Math.max(0, Math.min(Math.max(0, buffer.duration - 0.05), actualOffset));
      if (actualOffset >= buffer.duration) return;
      const { source, gain } = this.createSourceForBuffer(buffer);
      const startTime = ctx.currentTime + 0.05;
      const endTime = startTime + buffer.duration - offset;

      const track: ScheduledTrack = {
        file,
        number,
        buffer,
        source,
        gain,
        startTime,
        endTime,
        callbacks,
        revealTriggered: false,
        ended: false
      };

      this.currentTrack = track;
      source.start(startTime, offset);
      callbacks.onStart?.();

      this.startTicker();
    } catch (err) {
      if (this.sessionToken !== currentToken) return;
      this.stop();
      callbacks.onError?.(err instanceof Error ? err.message : String(err));
    }
  }

  /**
   * Queue the next track to start with 0 gap right as current track ends.
   */
  public async queueNextTrack(
    file: string,
    callbacks: AudioCallbacks = {},
    number?: number
  ): Promise<void> {
    const cur = this.currentTrack;
    const currentToken = this.sessionToken;
    if (!cur || cur.ended) return;

    try {
      const buffer = await this.load(file);
      if (this.sessionToken !== currentToken || this.currentTrack !== cur || cur.ended) return;

      const ctx = this.ensureContext();
      const { source, gain } = this.createSourceForBuffer(buffer);

      // Schedule at exact end of current track minus tiny 0.02s crossfade to prevent any click
      const crossfade = 0.02;
      const startTime = Math.max(ctx.currentTime + 0.02, cur.endTime - crossfade);
      const endTime = startTime + buffer.duration;

      // Micro crossfade: ensure queued track starts from 0 gain
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(1, startTime + crossfade);
      cur.gain.gain.cancelScheduledValues(startTime);
      cur.gain.gain.setValueAtTime(1, startTime);
      cur.gain.gain.linearRampToValueAtTime(0, startTime + crossfade);

      this.queuedTrack = {
        file,
        number,
        buffer,
        source,
        gain,
        startTime,
        endTime,
        callbacks,
        revealTriggered: false,
        ended: false
      };

      source.start(startTime);
    } catch (err) {
      // If queuing fails, don't stop the current song abruptly
      console.warn('Queue next track delayed or failed:', err);
    }
  }

  public getCurrentNumber(): number | undefined {
    return this.currentTrack?.number;
  }

  public hasQueuedTrack(): boolean {
    return this.queuedTrack !== null && !this.queuedTrack.ended;
  }

  public isPlaying(): boolean {
    return this.currentTrack !== null && !this.currentTrack.ended;
  }

  private startTicker(): void {
    if (this.tickerId) clearInterval(this.tickerId);
    this.tickerId = setInterval(() => this.tick(), 30);
    this.tick();
  }

  private tick(): void {
    if (!this.context) return;
    const now = this.context.currentTime;
    const cur = this.currentTrack;

    if (!cur) {
      if (this.tickerId) {
        clearInterval(this.tickerId);
        this.tickerId = null;
      }
      return;
    }

    const elapsed = Math.max(0, now - cur.startTime);
    cur.callbacks.onProgress?.(elapsed, cur.buffer.duration);

    // Trigger reveal EXACTLY 1.0s before track ends
    const timeRemaining = cur.endTime - now;
    if (!cur.revealTriggered && timeRemaining <= REVEAL_BEFORE_END_SECONDS) {
      cur.revealTriggered = true;
      cur.callbacks.onReveal?.();
    }

    // Check if current track has finished
    if (!cur.ended && now >= cur.endTime) {
      cur.ended = true;
      if (!cur.revealTriggered) {
        cur.revealTriggered = true;
        cur.callbacks.onReveal?.();
      }

      // Hand off seamlessly to queued track BEFORE firing onSongEnd
      const next = this.queuedTrack;
      this.queuedTrack = null;
      this.currentTrack = next;

      cur.callbacks.onSongEnd?.();

      if (next) {
        next.callbacks.onStart?.();
      }
    }
  }

  private clearCurrentAndQueued(): void {
    if (this.queuedTrack) {
      try {
        this.queuedTrack.source.stop();
        this.queuedTrack.source.disconnect();
        this.queuedTrack.gain.disconnect();
      } catch { /* already ended */ }
      this.queuedTrack = null;
    }
    if (this.currentTrack) {
      try {
        this.currentTrack.source.stop();
        this.currentTrack.source.disconnect();
        this.currentTrack.gain.disconnect();
      } catch { /* already ended */ }
      this.currentTrack = null;
    }
  }

  public stop(): void {
    this.stopSample();
    this.sessionToken++;
    this.clearCurrentAndQueued();
    if (this.tickerId) {
      clearInterval(this.tickerId);
      this.tickerId = null;
    }
    this.pausedByUser = false;
  }

  public pause(): void {
    this.pausedByUser = true;
    if (this.context && this.context.state === 'running') {
      void this.context.suspend();
    }
  }

  public async resume(): Promise<void> {
    this.pausedByUser = false;
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  /** Guest-only playback: never draws, calls or publishes a number. */
  public playSyncedTrack(file: string, offsetSeconds: number, callbacks: AudioCallbacks = {}): void {
    if (!/^(?:intro|near_end|outro|(?:0[1-9]|[1-8][0-9]|90))$/.test(file)) return;
    void this.playTrack(file, callbacks, /^\d+$/.test(file) ? Number(file) : undefined, offsetSeconds);
  }

  public playIntro(callbacks: AudioCallbacks = {}): void {
    void this.playTrack('intro', callbacks);
  }

  public playSongForNumber(number: number, callbacks: AudioCallbacks = {}): void {
    if (!Number.isInteger(number) || number < 1 || number > MAX_SOUND_NUMBER) {
      callbacks.onError?.(`Soundpack không hỗ trợ số ${number}`);
      return;
    }
    const file = String(number).padStart(2, '0');
    void this.playTrack(file, callbacks, number);
  }

  public playNearEnd(callbacks: AudioCallbacks = {}): void {
    void this.playTrack('near_end', callbacks);
  }

  public playOutro(callbacks: AudioCallbacks = {}): void {
    void this.playTrack('outro', callbacks);
  }

  /**
   * Quick 3-second sample test in waiting screen.
   */
  public async testIntroSample(): Promise<void> {
    if (this.currentTrack) throw new Error('Đang trong ván chơi. Không thể thử nhạc.');
    if (!this.enabled || this.volumeLevel <= 0) {
      throw new Error('Nhạc đang tắt tiếng hoặc âm lượng 0%. Hãy tăng âm lượng.');
    }
    await this.unlock();
    const buffer = await this.load('intro');
    if (this.currentTrack) return;

    this.stopSample();
    const ctx = this.ensureContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.masterGain!);
    this.sampleSource = source;

    source.onended = () => {
      if (this.sampleSource === source) this.sampleSource = null;
      source.disconnect();
    };

    source.start();
    source.stop(ctx.currentTime + Math.min(3.5, buffer.duration));
  }

  public stopSample(): void {
    if (!this.sampleSource) return;
    try {
      this.sampleSource.stop();
    } catch { /* finished */ }
    this.sampleSource.disconnect();
    this.sampleSource = null;
  }
}

export const speechCaller = new LotoSoundpackPlayer();
