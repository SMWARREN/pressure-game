// PRESSURE - Audio System
// Handles all sound effects for the game engine.
// Uses Web Audio API for low-latency sound playback.

import type { SoundEffect } from './types';

/**
 * Audio system that manages sound effects using Web Audio API.
 * Single shared AudioContext — browsers cap concurrent instances (~6).
 */
export class AudioSystem {
  private audioCtx: AudioContext | null = null;
  private enabled: boolean = true;

  /**
   * Get or create the AudioContext lazily
   */
  private getAudioContext(): AudioContext | null {
    if (typeof globalThis === 'undefined') return null;
    try {
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new (globalThis.AudioContext || (globalThis as any).webkitAudioContext)();
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  /**
   * Play a tone with the given parameters
   */
  private playTone(
    freq: number,
    type: OscillatorType = 'sine',
    dur: number = 0.08,
    vol: number = 0.18
  ): void {
    if (!this.enabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = type;
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur);
    } catch {
      // Silently fail if audio isn't available
    }
  }

  /**
   * Play a sound effect by name
   */
  play(name: SoundEffect): void {
    if (!this.enabled) return;

    switch (name) {
      case 'rotate':
        this.playTone(440, 'triangle', 0.06, 0.12);
        break;
      case 'win':
        this.playTone(523, 'sine', 0.2, 0.25);
        setTimeout(() => {
          this.playTone(659, 'sine', 0.2, 0.25);
          setTimeout(() => this.playTone(784, 'sine', 0.3, 0.35), 150);
        }, 150);
        break;
      case 'lose':
        this.playTone(220, 'sawtooth', 0.4, 0.35);
        setTimeout(() => this.playTone(180, 'sawtooth', 0.4, 0.4), 200);
        break;
      case 'crush':
        this.playTone(150, 'square', 0.15, 0.3);
        break;
      case 'start':
        this.playTone(392, 'triangle', 0.12, 0.18);
        break;
      case 'undo':
        this.playTone(330, 'triangle', 0.06, 0.1);
        break;
    }
  }

  /**
   * Enable or disable audio
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if audio is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Resume the AudioContext if it's suspended (required by some browsers)
   */
  async resume(): Promise<void> {
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  /**
   * Cleanup - close the AudioContext
   */
  destroy(): void {
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}

/**
 * Create an audio system instance
 */
export function createAudioSystem(enabled: boolean = true): AudioSystem {
  const system = new AudioSystem();
  if (!enabled) {
    system.setEnabled(false);
  }
  return system;
}
