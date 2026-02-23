// Default backend — persists events to localStorage.
// Capped at MAX_EVENTS to prevent unbounded storage growth (oldest trimmed first).

import type { StatEvent, StatsBackend } from '../types';

const STORAGE_KEY = 'pressure_stats_v2';
const MAX_EVENTS = 5_000;

export class LocalStorageStatsBackend implements StatsBackend {
  private cache: StatEvent[] | null = null;

  record(event: StatEvent): void {
    const all = this.getAll();
    all.push(event);
    const trimmed = all.length > MAX_EVENTS ? all.slice(-MAX_EVENTS) : all;
    this.cache = trimmed;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {}
  }

  getAll(): StatEvent[] {
    if (this.cache !== null) return this.cache;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.cache = raw ? (JSON.parse(raw) as StatEvent[]) : [];
    } catch {
      this.cache = [];
    }
    return this.cache;
  }

  clear(): void {
    this.cache = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
}
