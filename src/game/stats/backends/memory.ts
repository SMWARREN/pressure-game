// Ephemeral backend — useful for testing or when no persistence is needed.
// Events live only for the lifetime of this object.

import type { StatEvent, StatsBackend } from '../types';

export class InMemoryStatsBackend implements StatsBackend {
  private events: StatEvent[] = [];

  record(event: StatEvent): void {
    this.events.push(event);
  }

  getAll(): StatEvent[] {
    return this.events;
  }

  clear(): void {
    this.events = [];
  }
}
