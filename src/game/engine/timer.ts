// PRESSURE - Timer System
// Centralized timer management for the game engine.
// All timeouts are tracked so they can be reliably cancelled.

/**
 * Timer system that tracks all active timeouts and intervals.
 * This allows for clean teardown and prevents memory leaks.
 */
export class TimerSystem {
  private activeTimeouts = new Set<ReturnType<typeof setTimeout>>();
  private gameTimerInterval: ReturnType<typeof setInterval> | null = null;
  private tickCallback: (() => void) | null = null;
  private tickInterval: number;

  constructor(tickInterval: number = 1000) {
    this.tickInterval = tickInterval;
  }

  /**
   * Schedule a timeout that will be automatically tracked
   */
  setTimeout(fn: () => void, delay: number): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => {
      this.activeTimeouts.delete(id);
      fn();
    }, delay);
    this.activeTimeouts.add(id);
    return id;
  }

  /**
   * Clear a specific timeout
   */
  clearTimeout(id: ReturnType<typeof setTimeout>): void {
    clearTimeout(id);
    this.activeTimeouts.delete(id);
  }

  /**
   * Start the game timer that calls tickCallback on each interval
   */
  startTimer(callback: () => void): void {
    this.stopTimer();
    this.tickCallback = callback;
    this.gameTimerInterval = setInterval(() => {
      if (this.tickCallback) {
        this.tickCallback();
      }
    }, this.tickInterval);
  }

  /**
   * Stop the game timer
   */
  stopTimer(): void {
    if (this.gameTimerInterval) {
      clearInterval(this.gameTimerInterval);
      this.gameTimerInterval = null;
    }
    this.tickCallback = null;
  }

  /**
   * Clear all pending timeouts and stop the game timer
   */
  clearAll(): void {
    this.activeTimeouts.forEach((id) => clearTimeout(id));
    this.activeTimeouts.clear();
    this.stopTimer();
  }

  /**
   * Check if the game timer is running
   */
  isTimerRunning(): boolean {
    return this.gameTimerInterval !== null;
  }

  /**
   * Update the tick interval (requires restart of timer)
   */
  setTickInterval(interval: number): void {
    this.tickInterval = interval;
    if (this.tickCallback && this.gameTimerInterval) {
      // Restart with new interval
      this.startTimer(this.tickCallback);
    }
  }

  /**
   * Cleanup - call when destroying the engine
   */
  destroy(): void {
    this.clearAll();
  }
}

/**
 * Create a timer system instance
 */
export function createTimerSystem(tickInterval?: number): TimerSystem {
  return new TimerSystem(tickInterval);
}
