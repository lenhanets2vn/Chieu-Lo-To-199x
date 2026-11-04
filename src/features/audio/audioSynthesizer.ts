import { speechCaller } from './speechCaller';
/**
 * Web Audio API procedural sound engine for 90s Retro Vietnamese Lô Tô.
 * Zero external audio file dependencies - ultra-fast load time on weak networks.
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private output: GainNode | null = null;

  /** All effects share the exact same AudioContext and master gain as the song. */
  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const bus = speechCaller.getEffectsBus();
      this.ctx = bus.context;
      this.output = bus.destination;
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Tiếng click chuột retro Windows 98 / máy cổ
   */
  public playClick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(this.output!);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Audio context error ignore
    }
  }

  /**
   * Tiếng đóng dấu / dán nút / đặt hạt ngô lên vé Lô Tô
   */
  public playTokenMark() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.output!);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Ignore
    }
  }

  /**
   * Tiếng lồng sắt quay lạo xạo xóc số (rotary cage rattle)
   */
  public playCageRoll() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 5; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = i % 2 === 0 ? 'triangle' : 'square';
        const freq = 450 + Math.random() * 600;
        osc.frequency.setValueAtTime(freq, now + i * 0.05);
        gain.gain.setValueAtTime(0.08, now + i * 0.05);
        gain.gain.linearRampToValueAtTime(0.001, now + i * 0.05 + 0.04);
        osc.connect(gain);
        gain.connect(this.output!);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.04);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Tiếng bi lọt vào máng rơi cắc bụp
   */
  public playBallPop() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(this.output!);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // Ignore
    }
  }

  /**
   * Tiếng gõ bo / trống hội chợ khai cuộc
   */
  public playFestivalDrum() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.35);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.output!);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Ignore
    }
  }

  /**
   * ÂM THANH BUZZ YAHOO MESSENGER KINH ĐIỂN!
   * Tiếng rung rù rù đinh tai đặc trưng thời 2000s
   */
  public playYahooBuzz() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // 2 nhịp rung cách nhau
      [0, 0.22].forEach((offset) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(95, now + offset);
        osc.frequency.linearRampToValueAtTime(70, now + offset + 0.15);
        gain.gain.setValueAtTime(0.35, now + offset);
        gain.gain.linearRampToValueAtTime(0.01, now + offset + 0.15);
        osc.connect(gain);
        gain.connect(this.output!);
        osc.start(now + offset);
        osc.stop(now + offset + 0.15);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * CÒI HÚ VÀ KÈN ĂN MỪNG "KINH RỒI BÀ CON ƠI!"
   */
  public playVictoryKinh() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Hợp âm kèn tưng bừng: C5, E5, G5, C6
      const freqs = [523.25, 659.25, 783.99, 1046.50];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        const start = now + idx * 0.1;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
        osc.connect(gain);
        gain.connect(this.output!);
        osc.start(start);
        osc.stop(start + 0.8);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * TIẾNG PHÁO HOA & TRÀNG PHÁO ĂN MỪNG NỔ GIÒN GIÃ
   */
  public playFirecrackerCelebration() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      // Chuỗi 12 phát nổ pháo hoa lách tách tưng bừng
      for (let i = 0; i < 12; i++) {
        const delay = i * 0.12 + Math.random() * 0.06;
        
        // Tiếng nổ trầm đục (boom)
        const boomOsc = this.ctx.createOscillator();
        const boomGain = this.ctx.createGain();
        boomOsc.type = 'sine';
        boomOsc.frequency.setValueAtTime(140 + Math.random() * 60, now + delay);
        boomOsc.frequency.exponentialRampToValueAtTime(30, now + delay + 0.15);
        boomGain.gain.setValueAtTime(0.2, now + delay);
        boomGain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);
        boomOsc.connect(boomGain);
        boomGain.connect(this.output!);
        boomOsc.start(now + delay);
        boomOsc.stop(now + delay + 0.15);

        // Tiếng nổ xì tóe hoa lửa (snaps)
        const snapOsc = this.ctx.createOscillator();
        const snapGain = this.ctx.createGain();
        snapOsc.type = 'square';
        snapOsc.frequency.setValueAtTime(600 + Math.random() * 800, now + delay);
        snapGain.gain.setValueAtTime(0.08, now + delay);
        snapGain.gain.linearRampToValueAtTime(0.001, now + delay + 0.05);
        snapOsc.connect(snapGain);
        snapGain.connect(this.output!);
        snapOsc.start(now + delay);
        snapOsc.stop(now + delay + 0.05);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Tiếng PTT Walkie-talkie (Bộ đàm bật tắt)
   */
  public playPttChirp(type: 'start' | 'stop') {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      if (type === 'start') {
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.setValueAtTime(1200, now + 0.05);
      } else {
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.setValueAtTime(800, now + 0.05);
      }
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(this.output!);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Ignore
    }
  }

  /**
   * Tiếng gõ then chốt bánh xe vòng quay may mắn (Tick)
   */
  public playWheelTick() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 + Math.random() * 200, now);
      osc.frequency.exponentialRampToValueAtTime(250, now + 0.035);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc.connect(gain);
      gain.connect(this.output!);
      osc.start(now);
      osc.stop(now + 0.035);
    } catch {
      // Ignore
    }
  }

  /**
   * Tiếng chuông reo nhận thưởng vòng quay
   */
  public playWheelWin() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [587.33, 659.25, 783.99, 880.00, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        const start = now + idx * 0.09;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
        osc.connect(gain);
        gain.connect(this.output!);
        osc.start(start);
        osc.stop(start + 0.4);
      });
    } catch {
      // Ignore
    }
  }
}

export const audioSynthesizer = new AudioSynthesizer();
